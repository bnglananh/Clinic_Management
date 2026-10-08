package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.*;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.Appointment;
import vn.clinic.model.AppointmentStatus;
import vn.clinic.model.NotificationType;
import vn.clinic.repository.AppointmentRepository;
import vn.clinic.repository.PatientProfileRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final NotificationService notificationService;

    @Override
    public List<AppointmentDto> getAppointments(String date, String doctorId, AppointmentStatus status, String patientId, String query) {
        return appointmentRepository.search(date, doctorId, status, patientId, query).stream()
                .map(AppointmentDto::fromEntity)
                .toList();
    }

    @Override
    public AppointmentDto getAppointmentById(String id) {
        Appointment apt = findOrThrow(id);
        return AppointmentDto.fromEntity(apt);
    }

    @Override
    public AppointmentDto getAppointmentByCode(String code) {
        Appointment apt = appointmentRepository.findByAppointmentCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn với mã: " + code));
        return AppointmentDto.fromEntity(apt);
    }

    @Override
    public List<AppointmentDto> getAppointmentsByPatientId(String patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(AppointmentDto::fromEntity)
                .toList();
    }

    @Override
    public AppointmentDto createAppointment(CreateAppointmentRequest request) {
        // BR-05: Kiểm tra xung đột lịch làm việc và chống đặt trùng khung giờ
        boolean slotBusy = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
                request.getDoctorId(),
                request.getAppointmentDate(),
                request.getTimeSlot(),
                AppointmentStatus.CANCELLED
        );
        if (slotBusy) {
            throw new BusinessRuleException(
                    String.format("Bác sĩ đã có lịch hẹn trong khung giờ %s ngày %s. Vui lòng chọn khung giờ khác (SRS UC02 BR-05)",
                            request.getTimeSlot(), request.getAppointmentDate())
            );
        }

        // Tự động liên kết mã bệnh nhân nếu có sẵn
        String patientId = request.getPatientId();
        String patientCode = request.getPatientCode();
        if ((patientId == null || patientId.isBlank()) && request.getPhone() != null) {
            patientProfileRepository.findByPhone(request.getPhone()).ifPresent(p -> {
                // Link profile
            });
        }
        if (patientId != null && !patientId.isBlank()) {
            patientProfileRepository.findById(patientId).ifPresent(p -> {
                if (patientCode == null || patientCode.isBlank()) {
                    // Set patientCode
                }
            });
        }

        long nextIndex = appointmentRepository.count() + 1;
        String appointmentCode = String.format("LH-2026-%04d", nextIndex);
        String nowIso = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);

        Appointment newApt = Appointment.builder()
                .id("apt-" + System.currentTimeMillis())
                .appointmentCode(appointmentCode)
                .patientId(patientId != null ? patientId : "pat-" + System.currentTimeMillis())
                .patientCode(patientCode != null ? patientCode : "BN-2026-" + String.format("%04d", nextIndex + 800))
                .patientName(request.getPatientName().trim())
                .phone(request.getPhone().trim())
                .department(request.getDepartment().trim())
                .doctorId(request.getDoctorId().trim())
                .doctorName(request.getDoctorName() != null ? request.getDoctorName().trim() : "Bác sĩ phụ trách")
                .appointmentDate(request.getAppointmentDate().trim())
                .timeSlot(request.getTimeSlot().trim())
                .reasonForVisit(request.getReasonForVisit().trim())
                .status(AppointmentStatus.CONFIRMED)
                .createdAt(nowIso)
                .notes(request.getNotes())
                .build();

        Appointment saved = appointmentRepository.save(newApt);
        log.info("Created appointment: code={}, patient={}, doctor={}, date={}, slot={}",
                saved.getAppointmentCode(), saved.getPatientName(), saved.getDoctorName(), saved.getAppointmentDate(), saved.getTimeSlot());

        // BR-25: Gửi thông báo xác nhận đặt lịch hẹn cho bệnh nhân
        try {
            notificationService.sendNotification(SendNotificationRequest.builder()
                    .userId(saved.getPatientId())
                    .title("Xác nhận lịch hẹn khám thành công")
                    .content(String.format("Lịch hẹn %s vào lúc %s ngày %s với %s tại %s đã được xác nhận thành công.",
                            saved.getAppointmentCode(), saved.getTimeSlot(), saved.getAppointmentDate(), saved.getDoctorName(), saved.getDepartment()))
                    .type(NotificationType.APPOINTMENT)
                    .referenceId(saved.getId())
                    .build());
        } catch (Exception e) {
            log.warn("Could not dispatch notification for appointment {}: {}", saved.getId(), e.getMessage());
        }

        return AppointmentDto.fromEntity(saved);
    }

    @Override
    public AppointmentDto rescheduleAppointment(String id, RescheduleAppointmentRequest request) {
        Appointment apt = findOrThrow(id);

        // BR-25 & UC03: Chỉ cho phép dời lịch khi chưa check-in và chưa bị hủy
        if (apt.getStatus() == AppointmentStatus.CHECKED_IN) {
            throw new BusinessRuleException("Không thể dời lịch hẹn đã được tiếp nhận khám tại quầy (SRS UC03)");
        }
        if (apt.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessRuleException("Không thể dời lịch hẹn đã bị hủy trước đó (SRS UC03)");
        }

        // BR-05: Kiểm tra xung đột khung giờ mới
        boolean slotBusy = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
                apt.getDoctorId(),
                request.getNewAppointmentDate(),
                request.getNewTimeSlot(),
                AppointmentStatus.CANCELLED
        );
        if (slotBusy) {
            throw new BusinessRuleException(
                    String.format("Khung giờ %s ngày %s của bác sĩ đã có bệnh nhân khác đặt hẹn. Vui lòng chọn giờ khác (SRS UC03 BR-05)",
                            request.getNewTimeSlot(), request.getNewAppointmentDate())
            );
        }

        String oldDate = apt.getAppointmentDate();
        String oldSlot = apt.getTimeSlot();
        apt.setAppointmentDate(request.getNewAppointmentDate().trim());
        apt.setTimeSlot(request.getNewTimeSlot().trim());
        apt.setStatus(AppointmentStatus.CONFIRMED);
        if (request.getReason() != null && !request.getReason().isBlank()) {
            String note = apt.getNotes() != null ? apt.getNotes() + " | Dời lịch: " + request.getReason() : "Dời lịch: " + request.getReason();
            apt.setNotes(note);
        }

        Appointment updated = appointmentRepository.save(apt);
        log.info("Rescheduled appointment {}: from {} {} -> {} {}",
                apt.getAppointmentCode(), oldDate, oldSlot, updated.getAppointmentDate(), updated.getTimeSlot());

        // BR-25: Bắn thông báo cập nhật lịch hẹn
        try {
            notificationService.sendNotification(SendNotificationRequest.builder()
                    .userId(updated.getPatientId())
                    .title("Thông báo dời lịch hẹn khám")
                    .content(String.format("Lịch hẹn %s đã được dời thành công sang %s ngày %s.",
                            updated.getAppointmentCode(), updated.getTimeSlot(), updated.getAppointmentDate()))
                    .type(NotificationType.APPOINTMENT)
                    .referenceId(updated.getId())
                    .build());
        } catch (Exception e) {
            log.warn("Could not dispatch reschedule notification: {}", e.getMessage());
        }

        return AppointmentDto.fromEntity(updated);
    }

    @Override
    public AppointmentDto cancelAppointment(String id, CancelAppointmentRequest request) {
        Appointment apt = findOrThrow(id);

        if (apt.getStatus() == AppointmentStatus.CHECKED_IN) {
            throw new BusinessRuleException("Không thể hủy lịch hẹn đã được tiếp nhận khám tại quầy phòng khám (SRS UC03 & UC010)");
        }
        if (apt.getStatus() == AppointmentStatus.CANCELLED) {
            return AppointmentDto.fromEntity(apt); // Idempotent
        }

        apt.setStatus(AppointmentStatus.CANCELLED);
        if (request != null && request.getReason() != null && !request.getReason().isBlank()) {
            apt.setCancelReason(request.getReason().trim());
        }

        Appointment updated = appointmentRepository.save(apt);
        log.info("Cancelled appointment: code={}, reason={}", updated.getAppointmentCode(), updated.getCancelReason());

        // BR-25: Bắn thông báo hủy lịch hẹn
        try {
            notificationService.sendNotification(SendNotificationRequest.builder()
                    .userId(updated.getPatientId())
                    .title("Xác nhận hủy lịch hẹn khám")
                    .content(String.format("Lịch hẹn %s vào ngày %s đã được hủy thành công theo yêu cầu.",
                            updated.getAppointmentCode(), updated.getAppointmentDate()))
                    .type(NotificationType.APPOINTMENT)
                    .referenceId(updated.getId())
                    .build());
        } catch (Exception e) {
            log.warn("Could not dispatch cancel notification: {}", e.getMessage());
        }

        return AppointmentDto.fromEntity(updated);
    }

    private Appointment findOrThrow(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn với mã ID: " + id));
    }
}
