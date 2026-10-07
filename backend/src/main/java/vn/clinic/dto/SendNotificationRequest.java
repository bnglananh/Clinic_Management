package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.NotificationType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {

    @NotBlank(message = "Mã người nhận không được để trống")
    private String userId;

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String content;

    @NotNull(message = "Loại thông báo không được để trống")
    private NotificationType type;

    private String referenceId;

    private String channel;
}
