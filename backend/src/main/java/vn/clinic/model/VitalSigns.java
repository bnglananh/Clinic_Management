package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VitalSigns {
    private String bloodPressure;  // Huyết áp (vd: 120/80 mmHg)
    private int heartRate;          // Mạch / Nhịp tim (ck/phút)
    private double temperature;     // Thân nhiệt (°C)
    private double weight;          // Cân nặng (kg)
    private double height;          // Chiều cao (cm)
    private double bmi;             // Chỉ số khối cơ thể BMI
    private Double spo2;            // Nồng độ oxy trong máu (%)
}
