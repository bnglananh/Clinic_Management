package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.CreateScheduleRequest;
import vn.clinic.dto.DoctorScheduleDto;
import vn.clinic.dto.UpdateScheduleRequest;
import vn.clinic.model.ScheduleStatus;
import vn.clinic.model.WorkShift;
import vn.clinic.service.DoctorScheduleService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/schedules")
@RequiredArgsConstructor
public class DoctorScheduleController {

    private final DoctorScheduleService doctorScheduleService;

    // =========================================================================
    // UC023: Quản lý lịch làm việc bác sĩ
    // =========================================================================

    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorScheduleDto>>> getAllSchedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) WorkShift shift) {
        List<DoctorScheduleDto> list = doctorScheduleService.getAllSchedules(date, doctorId, shift);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách lịch làm việc bác sĩ thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorScheduleDto>> getScheduleById(@PathVariable String id) {
        DoctorScheduleDto schedule = doctorScheduleService.getScheduleById(id);
        return ResponseEntity.ok(ApiResponse.success(schedule, "Lấy chi tiết ca làm việc thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DoctorScheduleDto>> createSchedule(
            @Valid @RequestBody CreateScheduleRequest request) {
        DoctorScheduleDto created = doctorScheduleService.createSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Phân ca làm việc bác sĩ thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorScheduleDto>> updateSchedule(
            @PathVariable String id,
            @Valid @RequestBody UpdateScheduleRequest request) {
        DoctorScheduleDto updated = doctorScheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật ca làm việc thành công"));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<DoctorScheduleDto>> toggleScheduleStatus(@PathVariable String id) {
        DoctorScheduleDto updated = doctorScheduleService.toggleScheduleStatus(id);
        String msg = (updated.getStatus() == ScheduleStatus.CONFIRMED)
                ? "Xác nhận lịch làm việc bác sĩ thành công"
                : "Chuyển trạng thái nghỉ phép (LEAVE) cho ca trực thành công";
        return ResponseEntity.ok(ApiResponse.success(updated, msg));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable String id) {
        doctorScheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa ca làm việc thành công"));
    }
}
