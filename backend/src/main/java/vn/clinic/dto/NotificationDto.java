package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.Notification;
import vn.clinic.model.NotificationType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private String id;
    private String userId;
    private String title;
    private String content;
    private NotificationType type;
    private String typeDescription;
    private String referenceId;
    private String channel;
    private boolean isRead;
    private String readAt;
    private String createdAt;

    public static NotificationDto fromEntity(Notification entity) {
        if (entity == null) return null;
        return NotificationDto.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .type(entity.getType())
                .typeDescription(entity.getType() != null ? entity.getType().getDescription() : null)
                .referenceId(entity.getReferenceId())
                .channel(entity.getChannel())
                .isRead(entity.isRead())
                .readAt(entity.getReadAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
