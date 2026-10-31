package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.DoctorSchedule;
import vn.clinic.model.WorkShift;
import vn.clinic.repository.DoctorScheduleRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Repository
@StorageMode.NoSql
public class MongoDoctorScheduleRepository extends MongoSupport<DoctorSchedule> implements DoctorScheduleRepository {

    public static final String COLLECTION = "doctor_schedules";

    /**
     * WorkShift được lưu dạng chuỗi nên không sắp xếp đúng thứ tự ca (SÁNG → CHIỀU → TỐI) phía DB;
     * sắp xếp lại trong bộ nhớ theo thứ tự enum, giống bản in-memory.
     */
    private static final Comparator<DoctorSchedule> DATE_SHIFT_DOCTOR = Comparator
            .comparing(DoctorSchedule::getDate)
            .thenComparing(DoctorSchedule::getShift)
            .thenComparing(DoctorSchedule::getDoctorName, Comparator.nullsLast(Comparator.naturalOrder()));

    public MongoDoctorScheduleRepository(MongoTemplate mongo) {
        super(mongo, DoctorSchedule.class, COLLECTION);
    }

    @Override
    public List<DoctorSchedule> findAll() {
        return sorted(all(Sort.by("date")), DATE_SHIFT_DOCTOR);
    }

    @Override
    public Optional<DoctorSchedule> findById(String id) {
        return byId(id);
    }

    @Override
    public List<DoctorSchedule> findByDate(LocalDate date) {
        return sorted(find(Criteria.where("date").is(date), null), Comparator.comparing(DoctorSchedule::getShift));
    }

    @Override
    public List<DoctorSchedule> findByDoctorId(String doctorId) {
        return sorted(find(Criteria.where("doctorId").is(doctorId), null),
                Comparator.comparing(DoctorSchedule::getDate).thenComparing(DoctorSchedule::getShift));
    }

    @Override
    public List<DoctorSchedule> findByDoctorAndDate(String doctorId, LocalDate date) {
        return sorted(find(Criteria.where("doctorId").is(doctorId).and("date").is(date), null),
                Comparator.comparing(DoctorSchedule::getShift));
    }

    @Override
    public Optional<DoctorSchedule> findByDoctorDateAndShift(String doctorId, LocalDate date, WorkShift shift) {
        return findOne(Criteria.where("doctorId").is(doctorId).and("date").is(date).and("shift").is(shift));
    }

    @Override
    public Optional<DoctorSchedule> findByRoomDateAndShift(String roomName, LocalDate date, WorkShift shift) {
        return findOne(Criteria.where("date").is(date).and("shift").is(shift)
                .andOperator(eqIgnoreCase("roomName", roomName)));
    }

    @Override
    public DoctorSchedule save(DoctorSchedule schedule) {
        if (!hasText(schedule.getId())) {
            schedule.setId(nextFreeId("schedule_id", "SCH-%02d"));
        }
        if (schedule.getCreatedAt() == null) {
            schedule.setCreatedAt(LocalDateTime.now());
        }
        schedule.setUpdatedAt(LocalDateTime.now());
        return upsert(schedule);
    }

    @Override
    public boolean deleteById(String id) {
        return removeById(id);
    }

    @Override
    public List<DoctorSchedule> search(LocalDate date, String doctorId, WorkShift shift) {
        List<Criteria> and = new ArrayList<>();
        if (date != null) and.add(Criteria.where("date").is(date));
        if (hasText(doctorId)) and.add(Criteria.where("doctorId").is(doctorId));
        if (shift != null) and.add(Criteria.where("shift").is(shift));
        return sorted(find(and.isEmpty() ? new Criteria() : new Criteria().andOperator(and), null), DATE_SHIFT_DOCTOR);
    }

    private static List<DoctorSchedule> sorted(List<DoctorSchedule> list, Comparator<DoctorSchedule> comparator) {
        List<DoctorSchedule> copy = new ArrayList<>(list);
        copy.sort(comparator);
        return copy;
    }
}
