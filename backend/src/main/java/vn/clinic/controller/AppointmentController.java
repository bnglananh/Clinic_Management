package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.*;
import vn.clinic.model.AppointmentStatus;
import vn.clinic.service.AppointmentService;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    // =========================================================================
    // UC010 & UC03: Quản lý lịch hẹn phòng khám & Tra cứu danh sách lịch hẹn
    // =========================================================================

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getAppointments(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String q) {
        List<AppointmentDto> list = appointmentService.getAppointments(date, doctorId, status, patientId, q);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách lịch hẹn thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentDto>> getAppointmentById(@PathVariable String id) {
        AppointmentDto appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success(appointment, "Lấy chi tiết lịch hẹn thành công"));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<AppointmentDto>> getAppointmentByCode(@PathVariable String code) {
        AppointmentDto appointment = appointmentService.getAppointmentByCode(code);
        return ResponseEntity.ok(ApiResponse.success(appointment, "Tra cứu lịch hẹn theo mã thành công"));
    }

    // =========================================================================
    // UC03: Tra cứu lịch hẹn của bệnh nhân
    // =========================================================================

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getPatientAppointments(@PathVariable String patientId) {
        List<AppointmentDto> list = appointmentService.getAppointmentsByPatientId(patientId);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách lịch hẹn của bệnh nhân thành công"));
    }

    // =========================================================================
    // UC02 & UC010: Đặt lịch hẹn mới (Bệnh nhân trực tuyến hoặc Lễ tân tại quầy)
    // =========================================================================

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentDto>> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request) {
        AppointmentDto created = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Đặt lịch hẹn khám thành công (SRS UC02 & UC010)"));
    }

    // =========================================================================
    // UC03 & UC010: Dời lịch hẹn (Reschedule)
    // =========================================================================

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<ApiResponse<AppointmentDto>> rescheduleAppointment(
            @PathVariable String id,
            @Valid @RequestBody RescheduleAppointmentRequest request) {
        AppointmentDto updated = appointmentService.rescheduleAppointment(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Dời lịch hẹn khám thành công (SRS UC03 & UC010)"));
    }

    // =========================================================================
    // UC03 & UC010: Hủy lịch hẹn (Cancel)
    // =========================================================================

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<AppointmentDto>> cancelAppointment(
            @PathVariable String id,
            @RequestBody(required = false) CancelAppointmentRequest request) {
        AppointmentDto updated = appointmentService.cancelAppointment(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Hủy lịch hẹn thành công (SRS UC03 & UC010)"));
    }
}
