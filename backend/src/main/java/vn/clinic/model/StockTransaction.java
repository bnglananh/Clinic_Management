package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransaction {
    private String id;
    private String drugId;
    private String drugName;
    private StockTransactionType type;
    private int quantityChange; // Dương nếu nhập, âm nếu xuất
    private int balanceAfter;
    private String reason;
    private String batchNumber;
    private String performedBy;
    private LocalDateTime timestamp;
}
