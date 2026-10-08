package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.CreateMedicalServiceRequest;
import vn.clinic.dto.MedicalServiceDto;
import vn.clinic.dto.UpdateMedicalServiceRequest;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.MedicalService;
import vn.clinic.repository.MedicalServiceRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalServiceServiceImpl implements MedicalServiceService {

    private final MedicalServiceRepository medicalServiceRepository;

    @Override
    public List<MedicalServiceDto> getAllServices(String query, String category, Boolean activeOnly) {
        return medicalServiceRepository.search(query, category, activeOnly).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public MedicalServiceDto getServiceById(String id) {
        MedicalService service = findServiceOrThrow(id);
        return mapToDto(service);
    }

    @Override
    public MedicalServiceDto getServiceByCode(String code) {
        MedicalService service = medicalServiceRepository.findByServiceCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ y tế với mã: " + code));
        return mapToDto(service);
    }

    @Override
    public MedicalServiceDto createService(CreateMedicalServiceRequest request) {
        // BR 4.1: Kiểm tra tính duy nhất của mã dịch vụ
        if (medicalServiceRepository.existsByServiceCode(request.getServiceCode())) {
            throw new DuplicateResourceException("Mã dịch vụ kỹ thuật đã tồn tại trong hệ thống: " + request.getServiceCode() + " (SRS UC022 BR 4.1)");
        }

        MedicalService service = MedicalService.builder()
                .serviceCode(request.getServiceCode().trim().toUpperCase())
                .serviceName(request.getServiceName().trim())
                .category(request.getCategory().trim().toUpperCase())
                .price(request.getPrice())
                .roomName(request.getRoomName().trim())
                .unit(request.getUnit().trim())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .active(request.isActive())
                .build();

        MedicalService saved = medicalServiceRepository.save(service);
        log.info("Created medical service: id={}, code={}, name={}", saved.getId(), saved.getServiceCode(), saved.getServiceName());
        return mapToDto(saved);
    }

    @Override
    public MedicalServiceDto updateService(String id, UpdateMedicalServiceRequest request) {
        MedicalService service = findServiceOrThrow(id);

        service.setServiceName(request.getServiceName().trim());
        service.setCategory(request.getCategory().trim().toUpperCase());
        service.setPrice(request.getPrice());
        service.setRoomName(request.getRoomName().trim());
        service.setUnit(request.getUnit().trim());
        if (request.getEstimatedDurationMinutes() > 0) {
            service.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        }
        if (request.getActive() != null) {
            service.setActive(request.getActive());
        }

        MedicalService updated = medicalServiceRepository.save(service);
        log.info("Updated medical service: id={}, name={}", updated.getId(), updated.getServiceName());
        return mapToDto(updated);
    }

    @Override
    public MedicalServiceDto updatePrice(String id, BigDecimal newPrice) {
        MedicalService service = findServiceOrThrow(id);
        service.setPrice(newPrice);
        MedicalService updated = medicalServiceRepository.save(service);
        log.info("Updated price for service id={}: newPrice={}", id, newPrice);
        return mapToDto(updated);
    }

    @Override
    public MedicalServiceDto toggleServiceStatus(String id) {
        MedicalService service = findServiceOrThrow(id);

        // BR-24 & SRS UC022 BR 3.2: Không xóa vật lý dữ liệu đã phát sinh, chỉ chuyển trạng thái hoạt động
        service.setActive(!service.isActive());

        MedicalService updated = medicalServiceRepository.save(service);
        log.info("Toggled service status: id={}, newStatus={} (SRS BR-24)", id, updated.isActive());
        return mapToDto(updated);
    }

    private MedicalService findServiceOrThrow(String id) {
        return medicalServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ y tế với ID: " + id));
    }

    private MedicalServiceDto mapToDto(MedicalService s) {
        return MedicalServiceDto.builder()
                .id(s.getId())
                .serviceCode(s.getServiceCode())
                .serviceName(s.getServiceName())
                .category(s.getCategory())
                .price(s.getPrice())
                .roomName(s.getRoomName())
                .unit(s.getUnit())
                .estimatedDurationMinutes(s.getEstimatedDurationMinutes())
                .active(s.isActive())
                .build();
    }
}
