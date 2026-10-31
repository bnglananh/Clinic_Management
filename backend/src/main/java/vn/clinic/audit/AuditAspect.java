package vn.clinic.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import vn.clinic.store.AuditLogStore;

import java.lang.reflect.Method;
import java.time.Instant;

/**
 * Sau mỗi thao tác gắn {@link Audited} chạy thành công, ghi một sự kiện vào nhật ký kiểm toán.
 * Lỗi khi ghi nhật ký chỉ được log cảnh báo, không làm hỏng thao tác nghiệp vụ.
 */
@Slf4j
@Aspect
@Component
public class AuditAspect {

    private final AuditLogStore auditLogStore;

    public AuditAspect(AuditLogStore auditLogStore) {
        this.auditLogStore = auditLogStore;
    }

    @AfterReturning(pointcut = "@annotation(audited)", returning = "result")
    public void record(JoinPoint joinPoint, Audited audited, Object result) {
        try {
            String entityId = resolveEntityId(joinPoint, audited, result);
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean loggedIn = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName());

            String summary = audited.summary().isBlank()
                    ? audited.entity() + " " + audited.action()
                    : audited.summary();

            auditLogStore.append(new AuditLogStore.AuditEvent(
                    audited.entity(),
                    entityId,
                    audited.action(),
                    loggedIn ? auth.getName() : "anonymous",
                    loggedIn ? roleOf(auth) : "GUEST",
                    Instant.now(),
                    summary,
                    clientIp()));
        } catch (RuntimeException e) {
            log.warn("Không ghi được nhật ký kiểm toán {}/{}: {}", audited.entity(), audited.action(), e.getMessage());
        }
    }

    private static String resolveEntityId(JoinPoint jp, Audited audited, Object result) {
        if (!audited.id().isBlank()) {
            String[] path = audited.id().split("\\.", 2);
            String[] names = ((MethodSignature) jp.getSignature()).getParameterNames();
            Object[] args = jp.getArgs();
            for (int i = 0; names != null && i < names.length; i++) {
                if (names[i].equals(path[0])) {
                    Object value = path.length == 1 ? args[i] : invokeGetter(args[i], path[1]);
                    return value == null ? "-" : value.toString();
                }
            }
        }
        Object id = invokeGetter(result, "id");
        return id == null ? "-" : id.toString();
    }

    private static Object invokeGetter(Object target, String property) {
        if (target == null) return null;
        try {
            Method getter = target.getClass().getMethod("get" + Character.toUpperCase(property.charAt(0)) + property.substring(1));
            return getter.invoke(target);
        } catch (ReflectiveOperationException e) {
            return null;
        }
    }

    private static String roleOf(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("USER");
    }

    private static String clientIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            HttpServletRequest req = attrs.getRequest();
            String forwarded = req.getHeader("X-Forwarded-For");
            return forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : req.getRemoteAddr();
        }
        return null;
    }
}
