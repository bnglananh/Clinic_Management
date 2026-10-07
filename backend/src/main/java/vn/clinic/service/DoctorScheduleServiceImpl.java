package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.CreateScheduleRequest;
import vn.clinic.dto.DoctorScheduleDto;
import vn.clinic.dto.UpdateScheduleRequest;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.DoctorSchedule;
import vn.clinic.model.ScheduleStatus;
import vn.clinic.model.StaffAccount;
import vn.clinic.model.WorkShift;
import vn.clinic.repository.DoctorScheduleRepository;
import vn.clinic.repository.StaffAccountRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorScheduleServiceImpl implements DoctorScheduleService {

    private final DoctorScheduleRepository doctorScheduleRepository;
    private final StaffAccountRepository staffAccountRepository;

    @Override
    public List<DoctorScheduleDto> getAllSchedules(LocalDate date, String doctorId, WorkShift shift) {
        return doctorScheduleRepository.search(date, doctorId, shift).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public DoctorScheduleDto getScheduleById(String id) {
        DoctorSchedule schedule = findScheduleOrThrow(id);
        return mapToDto(schedule);
    }

    @Override
    public DoctorScheduleDto createSchedule(CreateScheduleRequest request) {
        // BR 4.1: Kiểm tra xung đột lịch - Bác sĩ đã có ca trực trong khung giờ ngày đó
        Optional<DoctorSchedule> conflictDoctor = doctorScheduleRepository.findByDoctorDateAndShift(
                request.getDoctorId(), request.getDate(), request.getShift());
        if (conflictDoctor.isPresent()) {
            throw new BusinessRuleException(
                    String.format("Bác sĩ đã có lịch trực trong ca %s vào ngày %s (SRS UC023 BR 4.1)",
                            request.getShift(), request.getDate()));
        }

        // Kiểm tra xung đột phòng khám
        Optional<DoctorSchedule> conflictRoom = doctorScheduleRepository.findByRoomDateAndShift(
                request.getRoomName(), request.getDate(), request.getShift());
        if (conflictRoom.isPresent()) {
            throw new BusinessRuleException(
                    String.format("Phòng '%s' đã có bác sĩ %s trực trong ca %s vào ngày %s (SRS UC023)",
                            request.getRoomName(), conflictRoom.get().getDoctorName(), request.getShift(), request.getDate()));
        }

        // Lấy tên bác sĩ từ tài khoản nhân sự nếu chưa truyền
        String doctorName = request.getDoctorName();
        if (doctorName == null || doctorName.isBlank()) {
            Optional<StaffAccount> staffOpt = staffAccountRepository.findById(request.getDoctorId());
            doctorName = staffOpt.map(StaffAccount::getFullName).orElse("Bác sĩ " + request.getDoctorId());
        }

        DoctorSchedule schedule = DoctorSchedule.builder()
                .doctorId(request.getDoctorId())
                .doctorName(doctorName)
                .specialty(request.getSpecialty().trim())
                .roomName(request.getRoomName().trim())
                .date(request.getDate())
                .shift(request.getShift())
                .status(request.getStatus() != null ? request.getStatus() : ScheduleStatus.CONFIRMED)
                .maxPatients(request.getMaxPatients() > 0 ? request.getMaxPatients() : 25)
                .bookedPatients(0)
                .build();

        DoctorSchedule saved = doctorScheduleRepository.save(schedule);
        log.info("Created doctor schedule: id={}, doctor={}, date={}, shift={}",
                saved.getId(), saved.getDoctorName(), saved.getDate(), saved.getShift());
        return mapToDto(saved);
    }

    @Override
    public DoctorScheduleDto updateSchedule(String id, UpdateScheduleRequest request) {
        DoctorSchedule schedule = findScheduleOrThrow(id);

        // Kiểm tra số lượng bệnh nhân tối đa không được thấp hơn số lượng đã đặt hẹn
        if (request.getMaxPatients() < schedule.getBookedPatients()) {
            throw new BusinessRuleException(
                    String.format("Số lượng bệnh nhân tối đa (%d) không được nhỏ hơn số lượt đã đặt hẹn trước (%d) (SRS UC023)",
                            request.getMaxPatients(), schedule.getBookedPatients()));
        }

        schedule.setRoomName(request.getRoomName().trim());
        if (request.getSpecialty() != null && !request.getSpecialty().isBlank()) {
            schedule.setSpecialty(request.getSpecialty().trim());
        }
        if (request.getStatus() != null) {
            schedule.setStatus(request.getStatus());
        }
        schedule.setMaxPatients(request.getMaxPatients());

        DoctorSchedule updated = doctorScheduleRepository.save(schedule);
        log.info("Updated doctor schedule: id={}, maxPatients={}, status={}",
                updated.getId(), updated.getMaxPatients(), updated.getStatus());
        return mapToDto(updated);
    }

    @Override
    public DoctorScheduleDto toggleScheduleStatus(String id) {
        DoctorSchedule schedule = findScheduleOrThrow(id);
        ScheduleStatus newStatus = (schedule.getStatus() == ScheduleStatus.CONFIRMED) ? ScheduleStatus.LEAVE : ScheduleStatus.CONFIRMED;
        schedule.setStatus(newStatus);

        DoctorSchedule updated = doctorScheduleRepository.save(schedule);
        log.info("Toggled doctor schedule status: id={}, newStatus={}", id, newStatus);
        return mapToDto(updated);
    }

    @Override
    public void deleteSchedule(String id) {
        DoctorSchedule schedule = findScheduleOrThrow(id);

        // BR 3.1: Nếu đã có bệnh nhân đặt hẹn thì không được xóa lịch
        if (schedule.getBookedPatients() > 0) {
            throw new BusinessRuleException(
                    String.format("Không thể xóa ca làm việc đã có %d bệnh nhân đặt hẹn trước. Vui lòng chuyển trạng thái nghỉ phép hoặc hủy hẹn trước (SRS UC023 BR 3.1)",
                            schedule.getBookedPatients()));
        }

        doctorScheduleRepository.deleteById(id);
        log.info("Deleted doctor schedule: id={}", id);
    }

    private DoctorSchedule findScheduleOrThrow(String id) {
        return doctorScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch làm việc với ID: " + id));
    }

    private DoctorScheduleDto mapToDto(DoctorSchedule s) {
        return DoctorScheduleDto.builder()
                .id(s.getId())
                .doctorId(s.getDoctorId())
                .doctorName(s.getDoctorName())
                .specialty(s.getSpecialty())
                .roomName(s.getRoomName())
                .date(s.getDate())
                .shift(s.getShift())
                .status(s.getStatus())
                .maxPatients(s.getMaxPatients())
                .bookedPatients(s.getBookedPatients())
                .build();
    }
}
