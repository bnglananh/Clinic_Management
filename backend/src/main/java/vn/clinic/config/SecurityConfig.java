package vn.clinic.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Xác thực bằng JWT (Bearer token) và phân quyền theo vai trò:
 * ADMIN, DOCTOR, RECEPTIONIST, PATIENT (claim "role" trong token → ROLE_xxx).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";
    private static final String DOCTOR = "DOCTOR";
    private static final String RECEPTIONIST = "RECEPTIONIST";

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Công khai: đăng nhập, quên mật khẩu, màn hình sảnh chờ, bảng giá dịch vụ
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/forgot-password",
                                "/api/auth/verify-otp", "/api/auth/reset-password", "/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/queue/**", "/api/admin/services/**",
                                "/api/admin/schedules/**", "/api/appointments/leaderboard/**").permitAll()

                        // Quản trị
                        .requestMatchers(HttpMethod.GET, "/api/admin/pharmacy/drugs/**").hasAnyRole(ADMIN, DOCTOR)
                        .requestMatchers(HttpMethod.POST, "/api/admin/pharmacy/drugs/batch-deduct").hasAnyRole(ADMIN, RECEPTIONIST)
                        .requestMatchers("/api/admin/**", "/api/reports/**").hasRole(ADMIN)

                        // Tiếp đón, hàng đợi, viện phí
                        .requestMatchers("/api/reception/**").hasAnyRole(RECEPTIONIST, ADMIN)
                        .requestMatchers("/api/queue/**").hasAnyRole(RECEPTIONIST, DOCTOR, ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/billing/**").authenticated()
                        // Bệnh nhân được tạo mã VietQR để tự chuyển khoản; xác nhận đã thu vẫn do thu ngân
                        .requestMatchers(HttpMethod.POST, "/api/billing/*/vietqr").authenticated()
                        .requestMatchers("/api/billing/**").hasAnyRole(RECEPTIONIST, ADMIN)

                        // Khám bệnh & kê đơn
                        .requestMatchers("/api/prescriptions/**").hasAnyRole(DOCTOR, ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/records/**").authenticated()
                        .requestMatchers("/api/records/**").hasRole(DOCTOR)

                        // Hồ sơ bệnh nhân
                        .requestMatchers(HttpMethod.GET, "/api/patients/**").hasAnyRole(RECEPTIONIST, DOCTOR, ADMIN)
                        .requestMatchers("/api/patients/**").hasAnyRole(RECEPTIONIST, ADMIN)

                        // Còn lại (lịch hẹn, thông báo, hồ sơ cá nhân, đăng xuất...): chỉ cần đăng nhập
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    /** Claim "role" (ví dụ DOCTOR) → quyền ROLE_DOCTOR; tên người dùng lấy từ "sub". */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("role");
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
