package vn.clinic;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.clinic.controller.StaffAccountController;
import vn.clinic.dto.CreateStaffRequest;
import vn.clinic.exception.GlobalExceptionHandler;
import vn.clinic.model.UserRole;
import vn.clinic.repository.InMemoryStaffAccountRepository;
import vn.clinic.service.StaffAccountServiceImpl;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("UC019: StaffAccountController REST Endpoints Tests")
class StaffAccountControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        InMemoryStaffAccountRepository repository = new InMemoryStaffAccountRepository();
        repository.initMockData();
        StaffAccountServiceImpl service = new StaffAccountServiceImpl(repository);
        StaffAccountController controller = new StaffAccountController(service);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("GET /api/admin/users - Trả về danh sách tài khoản nhân viên")
    void testGetAllUsersEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(7))))
                .andExpect(jsonPath("$.data[0].id").exists());
    }

    @Test
    @DisplayName("GET /api/admin/users?role=DOCTOR - Lọc danh sách bác sĩ")
    void testFilterDoctorsEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .param("role", "DOCTOR")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(3)))
                .andExpect(jsonPath("$.data[0].role").value("DOCTOR"));
    }

    @Test
    @DisplayName("GET /api/admin/users/STAFF-01 - Chi tiết tài khoản nhân viên")
    void testGetUserDetailEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/users/STAFF-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("STAFF-01"))
                .andExpect(jsonPath("$.data.username").value("hoang.tran"));
    }

    @Test
    @DisplayName("POST /api/admin/users - Tạo tài khoản thành công")
    void testCreateUserEndpoint() throws Exception {
        CreateStaffRequest req = CreateStaffRequest.builder()
                .fullName("BS. Nguyễn Văn Hùng")
                .username("hung.nguyen")
                .email("hung.nguyen@smartclinic.vn")
                .phone("0987654321")
                .role(UserRole.DOCTOR)
                .department("Khoa Mắt")
                .title("Bác sĩ Chuyên khoa Mắt")
                .build();

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("BS. Nguyễn Văn Hùng"));
    }

    @Test
    @DisplayName("PATCH /api/admin/users/STAFF-06/toggle-status - Ngăn chặn khóa Admin cuối cùng (BR 3.3)")
    void testCannotLockLastAdminEndpoint() throws Exception {
        mockMvc.perform(patch("/api/admin/users/STAFF-06/toggle-status")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("cuối cùng")));
    }

    @Test
    @DisplayName("GET /api/admin/users/roles-permissions - Trả về danh mục vai trò & quyền hạn RBAC")
    void testGetRolesPermissionsMetadataEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/users/roles-permissions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(3))));
    }
}
