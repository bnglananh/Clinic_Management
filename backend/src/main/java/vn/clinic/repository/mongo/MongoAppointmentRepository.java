package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.Appointment;
import vn.clinic.model.AppointmentStatus;
import vn.clinic.repository.AppointmentRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@StorageMode.NoSql
public class MongoAppointmentRepository extends MongoSupport<Appointment> implements AppointmentRepository {

    public static final String COLLECTION = "appointments";
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "appointmentDate");

    public MongoAppointmentRepository(MongoTemplate mongo) {
        super(mongo, Appointment.class, COLLECTION);
    }

    @Override
    public List<Appointment> findAll() {
        return all(NEWEST_FIRST);
    }

    @Override
    public Optional<Appointment> findById(String id) {
        return byId(id);
    }

    @Override
    public Optional<Appointment> findByAppointmentCode(String appointmentCode) {
        if (appointmentCode == null) return Optional.empty();
        return findOne(eqIgnoreCase("appointmentCode", appointmentCode));
    }

    @Override
    public List<Appointment> findByPatientId(String patientId) {
        if (patientId == null) return List.of();
        return find(Criteria.where("patientId").is(patientId), NEWEST_FIRST);
    }

    @Override
    public List<Appointment> findByDoctorId(String doctorId) {
        if (doctorId == null) return List.of();
        return find(Criteria.where("doctorId").is(doctorId), null);
    }

    @Override
    public List<Appointment> search(String date, String doctorId, AppointmentStatus status, String patientId, String query) {
        List<Criteria> and = new ArrayList<>();
        if (hasText(date)) and.add(Criteria.where("appointmentDate").is(date));
        if (hasText(doctorId)) and.add(Criteria.where("doctorId").is(doctorId));
        if (status != null) and.add(Criteria.where("status").is(status));
        if (hasText(patientId)) and.add(Criteria.where("patientId").is(patientId));
        if (hasText(query)) {
            String q = query.trim();
            and.add(new Criteria().orOperator(
                    containsIgnoreCase("patientName", q),
                    containsIgnoreCase("phone", q),
                    containsIgnoreCase("appointmentCode", q),
                    containsIgnoreCase("patientCode", q)));
        }
        Criteria criteria = and.isEmpty() ? new Criteria() : new Criteria().andOperator(and);
        return find(criteria, NEWEST_FIRST);
    }

    @Override
    public boolean existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
            String doctorId, String date, String timeSlot, AppointmentStatus excludedStatus) {
        if (doctorId == null || date == null || timeSlot == null) return false;
        Criteria c = Criteria.where("doctorId").is(doctorId)
                .and("appointmentDate").is(date)
                .andOperator(eqIgnoreCase("timeSlot", timeSlot));
        if (excludedStatus != null) {
            c = c.and("status").ne(excludedStatus);
        }
        return exists(c);
    }

    @Override
    public Appointment save(Appointment appointment) {
        if (!hasText(appointment.getId())) {
            appointment.setId(nextFreeId("appointment_id", "apt-%04d"));
        }
        return upsert(appointment);
    }

    @Override
    public long count() {
        return count(new Criteria());
    }
}
