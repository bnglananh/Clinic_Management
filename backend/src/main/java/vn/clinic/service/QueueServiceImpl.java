package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.CheckinReceptionRequest;
import vn.clinic.dto.PrintTicketDto;
import vn.clinic.dto.QueueSummaryDto;
import vn.clinic.dto.QueueTicketDto;
import vn.clinic.dto.SendNotificationRequest;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.*;
import vn.clinic.repository.AppointmentRepository;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.QueueTicketRepository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueueServiceImpl implements QueueService {

    private final QueueTicketRepository queueTicketRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final NotificationService notificationService;

    @Override
    public QueueTicketDto checkinAndIssueTicket(CheckinReceptionRequest request) {
        String patientId = request.getPatientId();
        String patientCode = request.getPatientCode();
        String patientName = request.getPatientName().trim();
        String phone = request.getPhone().trim();

        // Xử lý khi có lịch hẹn trước (UC09)
        if (request.getAppointmentId() != null && !request.getAppointmentId().isBlank()) {
            Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn ID: " + request.getAppointmentId()));

            if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
                throw new BusinessRuleException("Lịch hẹn này đã bị hủy, không thể tiếp nhận khám (SRS UC09)");
            }

            appointment.setStatus(AppointmentStatus.CHECKED_IN);
            appointmentRepository.save(appointment);
            log.info("Appointment {} checked-in successfully", appointment.getAppointmentCode());

            if (patientId == null || patientId.isBlank()) patientId = appointment.getPatientId();
            if (patientCode == null || patientCode.isBlank()) patientCode = appointment.getPatientCode();
            if (patientName.isBlank()) patientName = appointment.getPatientName();
            if (phone.isBlank()) phone = appointment.getPhone();
        }

        // Tự động tìm kiếm mã hồ sơ bệnh nhân nếu chưa có
        if ((patientId == null || patientId.isBlank()) && !phone.isBlank()) {
            var existingProfile = patientProfileRepository.findByPhone(phone);
            if (existingProfile.isPresent()) {
                patientId = existingProfile.get().getId();
                patientCode = existingProfile.get().getPatientCode();
            }
        }

        // Sinh mã số thứ tự theo buồng khám (BR-08: A-xxx, B-xxx, C-xxx)
        String room = request.getRoomName().trim();
        String prefix = room.contains("Tai Mũi Họng") ? "B" : room.contains("Tiêu Hóa") ? "C" : "A";
        long roomCount = queueTicketRepository.countByRoomPrefix(prefix);
        String ticketNumber = String.format("%s-%03d", prefix, roomCount + 10);

        String nowIso = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        String estimatedTime = LocalTime.now().plusMinutes(25).format(DateTimeFormatter.ofPattern("HH:mm"));

        QueueTicket ticket = QueueTicket.builder()
                .id("q-" + System.currentTimeMillis())
                .ticketNumber(ticketNumber)
                .patientId(patientId != null ? patientId : "pat-" + System.currentTimeMillis())
                .patientCode(patientCode != null ? patientCode : "BN-2026-" + (roomCount + 890))
                .patientName(patientName)
                .gender(request.getGender() != null ? request.getGender().trim().toUpperCase() : "KHAC")
                .yearOfBirth(request.getYearOfBirth() != null ? request.getYearOfBirth() : 1990)
                .phone(phone)
                .status(QueueStatus.WAITING) // BR-07: Khởi tạo ở trạng thái WAITING
                .priority(request.getPriority() != null ? request.getPriority() : PriorityLevel.NORMAL)
                .roomName(room)
                .doctorId(request.getDoctorId())
                .doctorName(request.getDoctorName())
                .estimatedTime(estimatedTime)
                .checkinTime(nowIso)
                .notes(request.getNotes())
                .appointmentId(request.getAppointmentId())
                .build();

        QueueTicket saved = queueTicketRepository.save(ticket);
        log.info("Issued queue ticket: number={}, room={}, patient={}, priority={}",
                saved.getTicketNumber(), saved.getRoomName(), saved.getPatientName(), saved.getPriority());

        // Bắn thông báo đẩy số thứ tự khám cho bệnh nhân (BR-25, UC08)
        try {
            notificationService.sendNotification(SendNotificationRequest.builder()
                    .userId(saved.getPatientId())
                    .title("Cấp số thứ tự khám thành công")
                    .content(String.format("Bạn đã nhận số thứ tự %s tại %s. Giờ dự kiến vào khám: %s.",
                            saved.getTicketNumber(), saved.getRoomName(), saved.getEstimatedTime()))
                    .type(NotificationType.QUEUE)
                    .referenceId(saved.getId())
                    .build());
        } catch (Exception e) {
            log.warn("Could not dispatch queue notification: {}", e.getMessage());
        }

        return QueueTicketDto.fromEntity(saved);
    }

    @Override
    public List<QueueTicketDto> getQueue(String roomName, QueueStatus status, PriorityLevel priority, String date) {
        return queueTicketRepository.search(roomName, status, priority, date).stream()
                .map(QueueTicketDto::fromEntity)
                .toList();
    }

    @Override
    public QueueSummaryDto getQueueSummary() {
        List<QueueTicket> all = queueTicketRepository.findAll();
        int waiting = (int) all.stream().filter(t -> t.getStatus() == QueueStatus.WAITING).count();
        int inProgress = (int) all.stream().filter(t -> t.getStatus() == QueueStatus.IN_PROGRESS).count();
        int completed = (int) all.stream().filter(t -> t.getStatus() == QueueStatus.COMPLETED).count();

        return QueueSummaryDto.builder()
                .totalTickets(all.size())
                .waitingCount(waiting)
                .inProgressCount(inProgress)
                .completedCount(completed)
                .build();
    }

    @Override
    public QueueTicketDto promoteToTop(String ticketId) {
        QueueTicket ticket = findOrThrow(ticketId);
        if (ticket.getStatus() != QueueStatus.WAITING) {
            throw new BusinessRuleException("Chỉ có thể điều phối ưu tiên cho vé đang ở trạng thái Chờ khám (WAITING) (SRS UC011)");
        }

        boolean success = queueTicketRepository.promoteToTop(ticketId);
        if (!success) {
            throw new BusinessRuleException("Không thể điều phối ưu tiên vé khám ID: " + ticketId);
        }

        QueueTicket updated = findOrThrow(ticketId);
        log.info("Promoted ticket {} to front of queue with EMERGENCY priority", updated.getTicketNumber());
        return QueueTicketDto.fromEntity(updated);
    }

    @Override
    public QueueTicketDto callNextPatient(String roomName, String doctorId) {
        QueueTicket nextTicket = queueTicketRepository.findNextWaitingTicket(roomName)
                .orElseThrow(() -> new ResourceNotFoundException("Không còn bệnh nhân nào đang chờ khám tại " + (roomName != null ? roomName : "phòng khám")));

        // BR-07: WAITING -> IN_PROGRESS
        nextTicket.setStatus(QueueStatus.IN_PROGRESS);
        if (doctorId != null && !doctorId.isBlank()) {
            nextTicket.setDoctorId(doctorId);
        }

        QueueTicket saved = queueTicketRepository.save(nextTicket);
        log.info("Called next patient: ticket={}, room={}, doctor={}", saved.getTicketNumber(), saved.getRoomName(), saved.getDoctorName());

        // Gửi thông báo loa gọi số vào phòng khám
        try {
            notificationService.sendNotification(SendNotificationRequest.builder()
                    .userId(saved.getPatientId())
                    .title("Mời vào phòng khám!")
                    .content(String.format("Mời bệnh nhân có số thứ tự %s vào %s để khám bệnh.",
                            saved.getTicketNumber(), saved.getRoomName()))
                    .type(NotificationType.QUEUE)
                    .referenceId(saved.getId())
                    .build());
        } catch (Exception e) {
            log.warn("Could not dispatch call notification: {}", e.getMessage());
        }

        return QueueTicketDto.fromEntity(saved);
    }

    @Override
    public QueueTicketDto updateTicketStatus(String ticketId, QueueStatus newStatus) {
        QueueTicket ticket = findOrThrow(ticketId);

        // BR-07: Trạng thái lượt khám tuân theo đúng tiến trình WAITING -> IN_PROGRESS -> COMPLETED
        QueueStatus current = ticket.getStatus();
        if (current == QueueStatus.COMPLETED && newStatus != QueueStatus.COMPLETED) {
            throw new BusinessRuleException("Lượt khám đã hoàn tất (COMPLETED), không thể đảo ngược trạng thái (SRS BR-07 & BR-23)");
        }

        ticket.setStatus(newStatus);
        QueueTicket updated = queueTicketRepository.save(ticket);
        log.info("Updated ticket {} status from {} -> {}", updated.getTicketNumber(), current, newStatus);

        // UC08: Thông báo khi hoàn thành lượt khám
        if (newStatus == QueueStatus.COMPLETED) {
            try {
                notificationService.sendNotification(SendNotificationRequest.builder()
                        .userId(updated.getPatientId())
                        .title("Lượt khám đã hoàn tất")
                        .content(String.format("Lượt khám %s tại %s đã hoàn tất. Đơn thuốc & viện phí đã được chuyển tới quầy thu ngân. Vui lòng di chuyển ra quầy để thanh toán.",
                                updated.getTicketNumber(), updated.getRoomName()))
                        .type(NotificationType.QUEUE)
                        .referenceId(updated.getId())
                        .build());
            } catch (Exception e) {
                log.warn("Could not dispatch completed notification: {}", e.getMessage());
            }
        }

        return QueueTicketDto.fromEntity(updated);
    }

    @Override
    public PrintTicketDto getTicketPrintData(String ticketId) {
        QueueTicket ticket = findOrThrow(ticketId);
        return PrintTicketDto.builder()
                .clinicName("PHÒNG KHÁM ĐA KHOA QUỐC TẾ SMART CLINIC")
                .clinicAddress("123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh")
                .clinicHotline("1900 6868 - (028) 3822 5588")
                .ticketNumber(ticket.getTicketNumber())
                .roomName(ticket.getRoomName())
                .doctorName(ticket.getDoctorName() != null ? ticket.getDoctorName() : "Bác sĩ phụ trách")
                .patientName(ticket.getPatientName())
                .patientCode(ticket.getPatientCode())
                .checkinTime(ticket.getCheckinTime())
                .estimatedTime(ticket.getEstimatedTime())
                .priority(ticket.getPriority())
                .notes(ticket.getNotes())
                .build();
    }

    @Override
    public vn.clinic.dto.PatientQueueTrackingDto getPatientActiveQueue(String patientId) {
        List<QueueTicket> all = queueTicketRepository.findAll();

        // Tìm vé khám đang hoạt động (WAITING hoặc IN_PROGRESS), nếu không có lấy vé gần nhất
        QueueTicket targetTicket = all.stream()
                .filter(t -> patientId.equals(t.getPatientId()) || patientId.equalsIgnoreCase(t.getPatientCode()))
                .filter(t -> t.getStatus() == QueueStatus.WAITING || t.getStatus() == QueueStatus.IN_PROGRESS)
                .findFirst()
                .orElseGet(() -> all.stream()
                        .filter(t -> patientId.equals(t.getPatientId()) || patientId.equalsIgnoreCase(t.getPatientCode()))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt khám nào cho bệnh nhân: " + patientId)));

        return buildTrackingDto(targetTicket);
    }

    @Override
    public vn.clinic.dto.PatientQueueTrackingDto trackTicketByNumber(String ticketNumber) {
        QueueTicket ticket = queueTicketRepository.findAll().stream()
                .filter(t -> ticketNumber.equalsIgnoreCase(t.getTicketNumber()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy số thứ tự: " + ticketNumber));

        return buildTrackingDto(ticket);
    }

    private vn.clinic.dto.PatientQueueTrackingDto buildTrackingDto(QueueTicket ticket) {
        List<QueueTicket> all = queueTicketRepository.findAll();

        // 1. Tìm số đang được khám trong cùng phòng khám (IN_PROGRESS)
        String currentCalling = all.stream()
                .filter(t -> t.getRoomName() != null && t.getRoomName().equalsIgnoreCase(ticket.getRoomName()))
                .filter(t -> t.getStatus() == QueueStatus.IN_PROGRESS)
                .map(QueueTicket::getTicketNumber)
                .findFirst()
                .orElse("--");

        // 2. Tính số người còn lại phía trước trong cùng phòng khám
        int ahead = 0;
        if (ticket.getStatus() == QueueStatus.WAITING) {
            ahead = (int) all.stream()
                    .filter(t -> t.getRoomName() != null && t.getRoomName().equalsIgnoreCase(ticket.getRoomName()))
                    .filter(t -> t.getStatus() == QueueStatus.WAITING)
                    .takeWhile(t -> !t.getId().equals(ticket.getId()))
                    .count();
        }

        // 3. Tiến trình bước (1: WAITING, 2: IN_PROGRESS, 3: COMPLETED)
        int step = (ticket.getStatus() == QueueStatus.COMPLETED) ? 3
                : (ticket.getStatus() == QueueStatus.IN_PROGRESS) ? 2 : 1;

        return vn.clinic.dto.PatientQueueTrackingDto.builder()
                .ticketId(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .patientId(ticket.getPatientId())
                .patientCode(ticket.getPatientCode())
                .patientName(ticket.getPatientName())
                .roomName(ticket.getRoomName())
                .doctorName(ticket.getDoctorName() != null ? ticket.getDoctorName() : "Bác sĩ phụ trách")
                .checkinTime(ticket.getCheckinTime())
                .estimatedTime(ticket.getEstimatedTime())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .currentCallingNumber(currentCalling)
                .peopleAhead(ahead)
                .stepperStep(step)
                .build();
    }

    private QueueTicket findOrThrow(String id) {
        return queueTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy số thứ tự/vé khám ID: " + id));
    }
}
