package vn.clinic;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.clinic.controller.DoctorScheduleController;
import vn.clinic.controller.MedicalServiceController;
import vn.clinic.controller.PharmacyController;
import vn.clinic.dto.*;
import vn.clinic.exception.GlobalExceptionHandler;
import vn.clinic.model.StockTransactionType;
import vn.clinic.model.WorkShift;
import vn.clinic.repository.*;
import vn.clinic.service.DoctorScheduleServiceImpl;
import vn.clinic.service.MedicalServiceServiceImpl;
import vn.clinic.service.PharmacyServiceImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("UC020, UC021, UC022, UC023: Admin REST Controllers Endpoints Tests")
class AdminPharmacyAndScheduleControllerTest {

    private MockMvc pharmacyMockMvc;
    private MockMvc serviceMockMvc;
    private MockMvc scheduleMockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = Jackson2ObjectMapperBuilder.json().build();

        // Setup Pharmacy
        InMemoryPharmacyDrugRepository drugRepo = new InMemoryPharmacyDrugRepository();
        drugRepo.init();
        InMemoryStockTransactionRepository txRepo = new InMemoryStockTransactionRepository();
        txRepo.init();
        PharmacyServiceImpl pharmacyService = new PharmacyServiceImpl(drugRepo, txRepo);
        PharmacyController pharmacyController = new PharmacyController(pharmacyService);
        pharmacyMockMvc = MockMvcBuilders.standaloneSetup(pharmacyController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // Setup Medical Service
        InMemoryMedicalServiceRepository serviceRepo = new InMemoryMedicalServiceRepository();
        serviceRepo.init();
        MedicalServiceServiceImpl medicalServiceService = new MedicalServiceServiceImpl(serviceRepo);
        MedicalServiceController serviceController = new MedicalServiceController(medicalServiceService);
        serviceMockMvc = MockMvcBuilders.standaloneSetup(serviceController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // Setup Doctor Schedule
        InMemoryDoctorScheduleRepository scheduleRepo = new InMemoryDoctorScheduleRepository();
        scheduleRepo.init();
        InMemoryStaffAccountRepository staffRepo = new InMemoryStaffAccountRepository();
        staffRepo.initMockData();
        DoctorScheduleServiceImpl scheduleService = new DoctorScheduleServiceImpl(scheduleRepo, staffRepo);
        DoctorScheduleController scheduleController = new DoctorScheduleController(scheduleService);
        scheduleMockMvc = MockMvcBuilders.standaloneSetup(scheduleController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // =========================================================================
    // UC020 & UC021: PharmacyController Endpoints
    // =========================================================================

    @Test
    @DisplayName("GET /api/admin/pharmacy/drugs - Lấy danh sách thuốc")
    void testGetAllDrugsEndpoint() throws Exception {
        pharmacyMockMvc.perform(get("/api/admin/pharmacy/drugs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(8))));
    }

    @Test
    @DisplayName("GET /api/admin/pharmacy/drugs/critical-stock - Lấy danh sách thuốc nguy cấp (<= 10)")
    void testGetCriticalStockEndpoint() throws Exception {
        pharmacyMockMvc.perform(get("/api/admin/pharmacy/drugs/critical-stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("POST /api/admin/pharmacy/drugs - Thêm mới thuốc thành công")
    void testCreateDrugEndpoint() throws Exception {
        CreateDrugRequest req = CreateDrugRequest.builder()
                .code("TEST_DRUG_01")
                .name("Thuốc Kiểm Thử Mock")
                .activeIngredient("Active Ingredient")
                .strength("250mg")
                .unit("Lọ")
                .importPrice(new BigDecimal("50000"))
                .salePrice(new BigDecimal("70000"))
                .stockQuantity(15)
                .minAlertThreshold(10)
                .build();

        pharmacyMockMvc.perform(post("/api/admin/pharmacy/drugs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("TEST_DRUG_01"));
    }

    @Test
    @DisplayName("POST /api/admin/pharmacy/drugs/{id}/stock - Điều chỉnh tồn kho")
    void testAdjustStockEndpoint() throws Exception {
        StockAdjustmentRequest req = StockAdjustmentRequest.builder()
                .type(StockTransactionType.IMPORT)
                .quantity(20)
                .reason("Nhập kho bổ sung kiểm thử")
                .performedBy("admin")
                .build();

        pharmacyMockMvc.perform(post("/api/admin/pharmacy/drugs/DRUG-01/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/admin/pharmacy/drugs/batch-deduct - Trừ kho tự động theo đơn")
    void testBatchDeductStockEndpoint() throws Exception {
        BatchDeductStockRequest req = BatchDeductStockRequest.builder()
                .invoiceId("INV-TEST-001")
                .performedBy("cashier")
                .items(List.of(new StockDeductionItem("DRUG-05", 2)))
                .build();

        pharmacyMockMvc.perform(post("/api/admin/pharmacy/drugs/batch-deduct")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // UC022: MedicalServiceController Endpoints
    // =========================================================================

    @Test
    @DisplayName("GET /api/admin/services - Lấy danh mục dịch vụ")
    void testGetAllServicesEndpoint() throws Exception {
        serviceMockMvc.perform(get("/api/admin/services"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(8))));
    }

    @Test
    @DisplayName("PATCH /api/admin/services/{id}/toggle-status - Ngừng / kích hoạt dịch vụ")
    void testToggleServiceStatusEndpoint() throws Exception {
        serviceMockMvc.perform(patch("/api/admin/services/MS-01/toggle-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // UC023: DoctorScheduleController Endpoints
    // =========================================================================

    @Test
    @DisplayName("GET /api/admin/schedules - Lấy lịch làm việc bác sĩ")
    void testGetAllSchedulesEndpoint() throws Exception {
        scheduleMockMvc.perform(get("/api/admin/schedules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(6))));
    }

    @Test
    @DisplayName("POST /api/admin/schedules - Xếp ca làm việc mới")
    void testCreateScheduleEndpoint() throws Exception {
        LocalDate nextWeek = LocalDate.now().plusDays(10);
        CreateScheduleRequest req = CreateScheduleRequest.builder()
                .doctorId("STAFF-02")
                .doctorName("ThS.BS Nguyễn Thị Mai Lan")
                .specialty("Nội Tổng Quát")
                .roomName("Phòng khám Nội 102")
                .date(nextWeek)
                .shift(WorkShift.AFTERNOON)
                .maxPatients(25)
                .build();

        scheduleMockMvc.perform(post("/api/admin/schedules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.shift").value("AFTERNOON"));
    }
}
