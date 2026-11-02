package vn.clinic.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import vn.clinic.dto.LoginRequest;
import vn.clinic.dto.LoginResponse;
import vn.clinic.dto.LoginResponse.AuthUserDto;
import vn.clinic.dto.RegisterPatientRequest;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.model.UserRole;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.model.AccountStatus;
import vn.clinic.model.PatientProfile;
import vn.clinic.model.StaffAccount;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.StaffAccountRepository;
import vn.clinic.store.TokenBlacklist;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;

/** Đăng nhập (nhân viên hoặc bệnh nhân), cấp JWT và thu hồi JWT khi đăng xuất. */
@Slf4j
@Service
public class LoginService {

    private static final String BAD_CREDENTIALS = "Tên đăng nhập hoặc mật khẩu không chính xác";

    private final StaffAccountRepository staffRepository;
    private final PatientProfileRepository patientRepository;
    private final JwtEncoder jwtEncoder;
    private final TokenBlacklist blacklist;
    private final Duration tokenTtl;

    public LoginService(StaffAccountRepository staffRepository,
                        PatientProfileRepository patientRepository,
                        JwtEncoder jwtEncoder,
                        TokenBlacklist blacklist,
                        @Value("${clinic.auth.token-ttl:PT8H}") Duration tokenTtl) {
        this.staffRepository = staffRepository;
        this.patientRepository = patientRepository;
        this.jwtEncoder = jwtEncoder;
        this.blacklist = blacklist;
        this.tokenTtl = tokenTtl;
    }

    public LoginResponse login(LoginRequest request) {
        String identifier = request.getUsername().trim();

        Optional<StaffAccount> staff = staffRepository.findByUsername(identifier)
                .or(() -> staffRepository.findByEmail(identifier));
        if (staff.isPresent()) {
            StaffAccount s = staff.get();
            if (!Passwords.matches(request.getPassword(), s.getPassword())) {
                throw new BusinessRuleException(BAD_CREDENTIALS);
            }
            if (s.getStatus() == AccountStatus.LOCKED) {
                throw new BusinessRuleException("Tài khoản đang bị tạm khóa. Vui lòng liên hệ quản trị viên.");
            }
            s.setLastLoginAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            staffRepository.save(s);
            return issue(AuthUserDto.builder()
                    .id(s.getId()).username(s.getUsername()).fullName(s.getFullName()).role(s.getRole().name())
                    .email(s.getEmail()).phone(s.getPhone()).title(s.getTitle()).department(s.getDepartment())
                    .build());
        }

        Optional<PatientProfile> patient = patientRepository.findByUsername(identifier)
                .or(() -> patientRepository.findByEmail(identifier))
                .or(() -> patientRepository.findByPhone(identifier));
        if (patient.isPresent() && Passwords.matches(request.getPassword(), patient.get().getPassword())) {
            PatientProfile p = patient.get();
            return issue(AuthUserDto.builder()
                    .id(p.getId()).username(p.getUsername()).fullName(p.getFullName()).role("PATIENT")
                    .email(p.getEmail()).phone(p.getPhone())
                    .title(p.getMembershipTier() != null ? "Bệnh nhân – " + p.getMembershipTier() : "Bệnh nhân")
                    .avatarUrl(p.getAvatarUrl())
                    .build());
        }
        throw new BusinessRuleException(BAD_CREDENTIALS);
    }

    /** Bệnh nhân tự đăng ký: tạo hồ sơ (MongoDB, mật khẩu BCrypt) rồi đăng nhập luôn. */
    public LoginResponse registerPatient(RegisterPatientRequest request) {
        String phone = request.getPhone().trim();
        if (patientRepository.existsByPhone(phone) || patientRepository.existsByUsername(phone)) {
            throw new DuplicateResourceException("Số điện thoại " + phone + " đã được đăng ký. Vui lòng đăng nhập.");
        }
        String email = request.getEmail() == null || request.getEmail().isBlank() ? null : request.getEmail().trim();
        if (email != null && patientRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email " + email + " đã được sử dụng.");
        }
        String cccd = request.getIdentityCardNumber();
        if (cccd != null && !cccd.isBlank() && patientRepository.existsByIdentityCardNumber(cccd)) {
            throw new DuplicateResourceException("Số CCCD đã tồn tại trong hệ thống.");
        }
        String today = java.time.LocalDate.now().toString();
        PatientProfile saved = patientRepository.save(PatientProfile.builder()
                .patientCode(String.format("BN-%d-%05d", java.time.Year.now().getValue(),
                        patientRepository.findAll().size() + 1001))
                .username(phone)
                .password(Passwords.hash(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(phone)
                .email(email)
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .identityCardNumber(cccd == null || cccd.isBlank() ? null : cccd.trim())
                .role(UserRole.PATIENT)
                .membershipTier("Tiêu chuẩn")
                .totalVisits(0)
                .createdAt(today)
                .updatedAt(today)
                .build());
        log.info("Bệnh nhân mới đăng ký: {} ({})", saved.getPatientCode(), phone);
        return login(LoginRequest.builder().username(phone).password(request.getPassword()).build());
    }

    /** Thu hồi token hiện tại: jti được đưa vào blacklist cho đến khi token tự hết hạn. */
    public void logout(Jwt jwt) {
        if (jwt == null) return;
        Instant exp = jwt.getExpiresAt() != null ? jwt.getExpiresAt() : Instant.now();
        blacklist.revoke(jwt.getId(), Duration.between(Instant.now(), exp));
        log.info("Đăng xuất: {} (jti={})", jwt.getSubject(), jwt.getId());
    }

    private LoginResponse issue(AuthUserDto user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("smart-clinic")
                .id(UUID.randomUUID().toString())
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(tokenTtl))
                .claim("uid", user.getId())
                .claim("role", user.getRole())
                .claim("name", user.getFullName())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        log.info("Đăng nhập thành công: {} ({})", user.getUsername(), user.getRole());
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresInSeconds(tokenTtl.toSeconds())
                .user(user)
                .build();
    }
}
