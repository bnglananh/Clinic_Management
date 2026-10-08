package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.CheckinReceptionRequest;
import vn.clinic.dto.PrintTicketDto;
import vn.clinic.dto.QueueTicketDto;
import vn.clinic.service.QueueService;

@RestController
@RequestMapping("/api/reception")
@RequiredArgsConstructor
public class ReceptionController {

    private final QueueService queueService;

    // =========================================================================
    // UC09: Tiếp nhận bệnh nhân & cấp số STT vào hàng đợi
    // =========================================================================

    @PostMapping("/checkin")
    public ResponseEntity<ApiResponse<QueueTicketDto>> checkin(
            @Valid @RequestBody CheckinReceptionRequest request) {
        QueueTicketDto ticket = queueService.checkinAndIssueTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ticket, "Tiếp nhận bệnh nhân và cấp số thứ tự thành công (SRS UC09)"));
    }

    // =========================================================================
    // UC09: Lấy dữ liệu in phiếu K80 nhiệt
    // =========================================================================

    @GetMapping("/tickets/{id}/print")
    public ResponseEntity<ApiResponse<PrintTicketDto>> getPrintTicket(@PathVariable String id) {
        PrintTicketDto printData = queueService.getTicketPrintData(id);
        return ResponseEntity.ok(ApiResponse.success(printData, "Lấy thông tin in phiếu K80 thành công"));
    }
}
