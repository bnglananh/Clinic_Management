package vn.clinic.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

/** Kiểm tra quyền sở hữu dữ liệu cho tác nhân Bệnh nhân (chống IDOR). */
public final class AccessChecks {

    private AccessChecks() {
    }

    public static void requirePatientSelfOrStaff(String targetPatientId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            return;
        }
        String role = jwt.getClaimAsString("role");
        if ("PATIENT".equalsIgnoreCase(role)) {
            String uid = jwt.getClaimAsString("uid");
            if (targetPatientId == null || !targetPatientId.equals(uid)) {
                throw new AccessDeniedException("Bạn không có quyền truy cập dữ liệu của bệnh nhân khác.");
            }
        }
    }
}
