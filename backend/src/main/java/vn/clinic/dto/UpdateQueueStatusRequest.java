package vn.clinic.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.QueueStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQueueStatusRequest {
    @NotNull(message = "Trạng thái hàng đợi không được để trống (BR-07)")
    private QueueStatus status;
}
