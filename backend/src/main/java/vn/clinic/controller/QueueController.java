package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.QueueSummaryDto;
import vn.clinic.dto.QueueTicketDto;
import vn.clinic.dto.UpdateQueueStatusRequest;
import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;
import vn.clinic.service.QueueService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    // =========================================================================
    // UC011: Lấy danh sách hàng đợi theo buồng khám, trạng thái, mức ưu tiên
    // =========================================================================

    @GetMapping
    public ResponseEntity<ApiResponse<List<QueueTicketDto>>> getQueue(
            @RequestParam(required = false) String roomName,
            @RequestParam(required = false) QueueStatus status,
            @RequestParam(required = false) PriorityLevel priority,
            @RequestParam(required = false) String date) {
        List<QueueTicketDto> list = queueService.getQueue(roomName, status, priority, date);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách hàng đợi thành công (SRS UC011)"));
    }

    // =========================================================================
    // UC011: Thống kê số lượng hàng đợi tổng hợp (Chờ khám, Đang khám, Đã khám)
    // =========================================================================

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<QueueSummaryDto>> getQueueSummary() {
        QueueSummaryDto summary = queueService.getQueueSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy thống kê hàng đợi thành công"));
    }

    // =========================================================================
    // UC011: Điều phối đưa ca ưu tiên / cấp cứu lên vị trí đầu hàng đợi
    // =========================================================================

    @PostMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<QueueTicketDto>> promoteToTop(@PathVariable String id) {
        QueueTicketDto ticket = queueService.promoteToTop(id);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Điều phối ưu tiên ca khám lên đầu hàng đợi thành công (SRS UC011)"));
    }

    // =========================================================================
    // UC011 & UC014: Gọi bệnh nhân kế tiếp vào buồng khám
    // =========================================================================

    @PostMapping("/call-next")
    public ResponseEntity<ApiResponse<QueueTicketDto>> callNextPatient(
            @RequestBody(required = false) Map<String, String> body) {
        String roomName = body != null ? body.get("roomName") : null;
        String doctorId = body != null ? body.get("doctorId") : null;
        QueueTicketDto ticket = queueService.callNextPatient(roomName, doctorId);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Gọi lượt khám kế tiếp thành công (SRS UC011 & UC014)"));
    }

    // =========================================================================
    // UC011: Cập nhật trạng thái vé hàng đợi (WAITING -> IN_PROGRESS -> COMPLETED)
    // =========================================================================

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<QueueTicketDto>> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateQueueStatusRequest request) {
        QueueTicketDto ticket = queueService.updateTicketStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(ticket, "Cập nhật trạng thái vé khám thành công (SRS BR-07)"));
    }

    // =========================================================================
    // UC04: Bệnh nhân theo dõi lượt khám & số thứ tự thời gian thực
    // =========================================================================

    @GetMapping("/patient/{patientId}/active")
    public ResponseEntity<ApiResponse<vn.clinic.dto.PatientQueueTrackingDto>> getPatientActiveQueue(
            @PathVariable String patientId) {
        vn.clinic.dto.PatientQueueTrackingDto tracking = queueService.getPatientActiveQueue(patientId);
        return ResponseEntity.ok(ApiResponse.success(tracking, "Lấy tiến trình số thứ tự khám thành công (SRS UC04)"));
    }

    @GetMapping("/ticket/{ticketNumber}/track")
    public ResponseEntity<ApiResponse<vn.clinic.dto.PatientQueueTrackingDto>> trackTicketByNumber(
            @PathVariable String ticketNumber) {
        vn.clinic.dto.PatientQueueTrackingDto tracking = queueService.trackTicketByNumber(ticketNumber);
        return ResponseEntity.ok(ApiResponse.success(tracking, "Tra cứu tiến trình lượt khám thành công (SRS UC04)"));
    }
}
