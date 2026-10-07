package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.StockTransactionType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransactionDto {
    private String id;
    private String drugId;
    private String drugName;
    private StockTransactionType type;
    private int quantityChange;
    private int balanceAfter;
    private String reason;
    private String batchNumber;
    private String performedBy;
    private LocalDateTime timestamp;
}
