package vn.clinic.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Chọn tầng lưu trữ qua thuộc tính {@code clinic.storage}:
 * <ul>
 *   <li>{@code nosql} (mặc định) – MongoDB, Redis, Cassandra, Neo4j.</li>
 *   <li>{@code memory} – lưu trong RAM, chỉ dùng cho unit test / demo không có Docker.</li>
 * </ul>
 */
public final class StorageMode {

    public static final String PROPERTY = "clinic.storage";

    private StorageMode() {
    }

    @Target({ElementType.TYPE, ElementType.METHOD})
    @Retention(RetentionPolicy.RUNTIME)
    @ConditionalOnProperty(name = PROPERTY, havingValue = "nosql", matchIfMissing = true)
    public @interface NoSql {
    }

    @Target({ElementType.TYPE, ElementType.METHOD})
    @Retention(RetentionPolicy.RUNTIME)
    @ConditionalOnProperty(name = PROPERTY, havingValue = "memory")
    public @interface Memory {
    }
}
