package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueSummaryDto {
    private int totalTickets;
    private int waitingCount;
    private int inProgressCount;
    private int completedCount;
}
