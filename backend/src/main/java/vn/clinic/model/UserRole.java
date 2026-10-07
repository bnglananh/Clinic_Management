package vn.clinic.model;

public enum UserRole {
    ADMIN("Quản trị viên"),
    DOCTOR("Bác sĩ khám bệnh"),
    RECEPTIONIST("Tiếp đón & Thu ngân"),
    PATIENT("Bệnh nhân");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
