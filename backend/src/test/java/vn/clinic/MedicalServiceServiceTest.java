package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.CreateMedicalServiceRequest;
import vn.clinic.dto.MedicalServiceDto;
import vn.clinic.dto.UpdateMedicalServiceRequest;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.repository.InMemoryMedicalServiceRepository;
import vn.clinic.service.MedicalServiceService;
import vn.clinic.service.MedicalServiceServiceImpl;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("UC022: Quản lý danh mục dịch vụ kỹ thuật Tests")
class MedicalServiceServiceTest {

    private InMemoryMedicalServiceRepository medicalServiceRepository;
    private MedicalServiceService medicalServiceService;

    @BeforeEach
    void setUp() {
        medicalServiceRepository = new InMemoryMedicalServiceRepository();
        medicalServiceRepository.init();
        medicalServiceService = new MedicalServiceServiceImpl(medicalServiceRepository);
    }

    @Test
    @DisplayName("UC022 - Bước 2: Lấy danh sách dịch vụ kỹ thuật và tìm kiếm thành công")
    void testGetAllServices() {
        List<MedicalServiceDto> all = medicalServiceService.getAllServices(null, null, null);
        assertEquals(8, all.size());

        List<MedicalServiceDto> search = medicalServiceService.getAllServices("Tim", null, null);
        assertEquals(2, search.size()); // Khám tim mạch & ECG điện tim

        List<MedicalServiceDto> xnOnly = medicalServiceService.getAllServices(null, "XÉT NGHIỆM", null);
        assertEquals(3, xnOnly.size());
    }

    @Test
    @DisplayName("UC022: Lấy chi tiết dịch vụ theo ID thành công")
    void testGetServiceById_Success() {
        MedicalServiceDto s = medicalServiceService.getServiceById("MS-01");
        assertNotNull(s);
        assertEquals("KB-TIMMACH", s.getServiceCode());
        assertEquals("Khám Chuyên Khoa Tim Mạch", s.getServiceName());
        assertTrue(s.isActive());
    }

    @Test
    @DisplayName("UC022: Lấy dịch vụ không tồn tại ném lỗi 404")
    void testGetServiceById_NotFound() {
        assertThrows(ResourceNotFoundException.class, () -> medicalServiceService.getServiceById("MS-999"));
    }

    @Test
    @DisplayName("UC022 - BR 4.1: Thêm dịch vụ với mã dịch vụ trùng lặp bị từ chối")
    void testCreateService_DuplicateCode_ThrowsException() {
        CreateMedicalServiceRequest req = CreateMedicalServiceRequest.builder()
                .serviceCode("KB-TIMMACH") // Đã tồn tại
                .serviceName("Khám tim mạch VIP")
                .category("KHÁM BỆNH")
                .price(new BigDecimal("300000"))
                .roomName("Phòng 101")
                .unit("Lượt")
                .estimatedDurationMinutes(30)
                .active(true)
                .build();

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> medicalServiceService.createService(req));
        assertTrue(ex.getMessage().contains("Mã dịch vụ kỹ thuật đã tồn tại"));
    }

    @Test
    @DisplayName("UC022: Thêm mới dịch vụ kỹ thuật thành công")
    void testCreateService_Success() {
        CreateMedicalServiceRequest req = CreateMedicalServiceRequest.builder()
                .serviceCode("NS-DTT")
                .serviceName("Nội soi dạ dày - tá tràng không đau")
                .category("THỦ THUẬT")
                .price(new BigDecimal("1200000"))
                .roomName("Phòng Nội Soi 01")
                .unit("Lần")
                .estimatedDurationMinutes(25)
                .active(true)
                .build();

        MedicalServiceDto created = medicalServiceService.createService(req);
        assertNotNull(created.getId());
        assertEquals("NS-DTT", created.getServiceCode());
        assertEquals(new BigDecimal("1200000"), created.getPrice());
    }

    @Test
    @DisplayName("UC022: Cập nhật thông tin dịch vụ kỹ thuật thành công")
    void testUpdateService_Success() {
        UpdateMedicalServiceRequest req = UpdateMedicalServiceRequest.builder()
                .serviceName("Khám Chuyên Khoa Tim Mạch (VIP)")
                .category("KHÁM BỆNH")
                .price(new BigDecimal("250000"))
                .roomName("Phòng khám Nội 101-VIP")
                .unit("Lượt")
                .estimatedDurationMinutes(30)
                .active(true)
                .build();

        MedicalServiceDto updated = medicalServiceService.updateService("MS-01", req);
        assertEquals("Khám Chuyên Khoa Tim Mạch (VIP)", updated.getServiceName());
        assertEquals(new BigDecimal("250000"), updated.getPrice());
    }

    @Test
    @DisplayName("UC022 - BR-24 & BR 3.2: Ngừng cung cấp dịch vụ kỹ thuật (Không xóa vật lý)")
    void testToggleServiceStatus_Success() {
        // MS-01 đang active -> ngừng cung cấp
        MedicalServiceDto toggled = medicalServiceService.toggleServiceStatus("MS-01");
        assertFalse(toggled.isActive());

        // Kích hoạt lại
        MedicalServiceDto reActivated = medicalServiceService.toggleServiceStatus("MS-01");
        assertTrue(reActivated.isActive());
    }
}
