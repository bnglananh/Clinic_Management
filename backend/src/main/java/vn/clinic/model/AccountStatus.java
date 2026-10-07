package vn.clinic.model;

public enum AccountStatus {
    ACTIVE("Đang hoạt động"),
    LOCKED("Tạm khóa");

    private final String description;

    AccountStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
