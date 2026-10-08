package vn.clinic.service;

import vn.clinic.dto.*;

import java.math.BigDecimal;
import java.util.List;

public interface MedicalServiceService {
    List<MedicalServiceDto> getAllServices(String query, String category, Boolean activeOnly);
    MedicalServiceDto getServiceById(String id);
    MedicalServiceDto getServiceByCode(String code);
    MedicalServiceDto createService(CreateMedicalServiceRequest request);
    MedicalServiceDto updateService(String id, UpdateMedicalServiceRequest request);
    MedicalServiceDto updatePrice(String id, BigDecimal newPrice);
    MedicalServiceDto toggleServiceStatus(String id); // BR-24 & UC022 BR 3.2: Soft toggle, no physical delete
}
