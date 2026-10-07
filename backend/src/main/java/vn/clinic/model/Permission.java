package vn.clinic.model;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public enum Permission {
    // Admin permissions
    MANAGE_USERS("Quản lý tài khoản & phân quyền (UC019)"),
    MANAGE_DRUGS("Quản lý danh mục & tồn kho thuốc (UC020, UC021)"),
    MANAGE_SERVICES("Quản lý danh mục dịch vụ & viện phí (UC022)"),
    MANAGE_SCHEDULES("Phân công lịch làm việc bác sĩ (UC023)"),
    VIEW_REPORTS("Xem báo cáo thống kê & doanh thu (UC024)"),

    // Doctor permissions
    EXAMINE_PATIENT("Khám bệnh & chẩn đoán (UC013, UC014)"),
    PRESCRIBE_MEDICATION("Kê đơn thuốc điều trị (UC015)"),
    ORDER_TESTS("Chỉ định dịch vụ cận lâm sàng (UC016)"),
    VIEW_MEDICAL_HISTORY("Tra cứu bệnh sử & tiền sử (UC017)"),

    // Receptionist permissions
    RECEPTION_CHECKIN("Tiếp đón & cấp số thứ tự (UC007, UC008)"),
    MANAGE_APPOINTMENTS("Tiếp nhận & xác nhận lịch hẹn (UC009)"),
    BILLING_COLLECTION("Thu phí viện phí & xuất hóa đơn (UC010, UC011)"),
    DISPENSE_MEDICINE("Phát thuốc theo toa bác sĩ (UC012)");

    private final String description;

    Permission(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public static Set<Permission> getDefaultPermissions(UserRole role) {
        if (role == null) return Collections.emptySet();
        switch (role) {
            case ADMIN:
                return new HashSet<>(Arrays.asList(
                    MANAGE_USERS, MANAGE_DRUGS, MANAGE_SERVICES, MANAGE_SCHEDULES, VIEW_REPORTS
                ));
            case DOCTOR:
                return new HashSet<>(Arrays.asList(
                    EXAMINE_PATIENT, PRESCRIBE_MEDICATION, ORDER_TESTS, VIEW_MEDICAL_HISTORY
                ));
            case RECEPTIONIST:
                return new HashSet<>(Arrays.asList(
                    RECEPTION_CHECKIN, MANAGE_APPOINTMENTS, BILLING_COLLECTION, DISPENSE_MEDICINE
                ));
            default:
                return Collections.emptySet();
        }
    }
}
