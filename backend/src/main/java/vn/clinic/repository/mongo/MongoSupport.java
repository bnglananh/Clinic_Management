package vn.clinic.repository.mongo;

import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Lớp cơ sở cho các repository MongoDB: CRUD theo id, truy vấn theo trường
 * và sinh mã định danh tuần tự (collection {@code counters}).
 */
abstract class MongoSupport<T> {

    static final String COUNTERS = "counters";

    protected final MongoTemplate mongo;
    protected final Class<T> type;
    protected final String collection;

    protected MongoSupport(MongoTemplate mongo, Class<T> type, String collection) {
        this.mongo = mongo;
        this.type = type;
        this.collection = collection;
    }

    // ---------- CRUD cơ bản ----------

    protected List<T> all(Sort sort) {
        return mongo.find(new Query().with(sort), type, collection);
    }

    protected Optional<T> byId(String id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(mongo.findById(id, type, collection));
    }

    protected T upsert(T entity) {
        return mongo.save(entity, collection);
    }

    protected boolean removeById(String id) {
        if (id == null) return false;
        return mongo.remove(Query.query(Criteria.where("_id").is(id)), collection).getDeletedCount() > 0;
    }

    protected List<T> find(Criteria criteria, Sort sort) {
        Query q = Query.query(criteria);
        if (sort != null) q.with(sort);
        return mongo.find(q, type, collection);
    }

    protected Optional<T> findOne(Criteria criteria) {
        return Optional.ofNullable(mongo.findOne(Query.query(criteria), type, collection));
    }

    protected boolean exists(Criteria criteria) {
        return mongo.exists(Query.query(criteria), type, collection);
    }

    protected long count(Criteria criteria) {
        return mongo.count(Query.query(criteria), type, collection);
    }

    // ---------- Tiện ích dựng điều kiện ----------

    /** So khớp chính xác, không phân biệt hoa thường. */
    protected static Criteria eqIgnoreCase(String field, String value) {
        return Criteria.where(field).regex("^" + Pattern.quote(value.trim()) + "$", "i");
    }

    /** Chứa chuỗi con, không phân biệt hoa thường. */
    protected static Criteria containsIgnoreCase(String field, String value) {
        return Criteria.where(field).regex(Pattern.quote(value.trim()), "i");
    }

    /** Bắt đầu bằng tiền tố (phân biệt hoa thường). */
    protected static Criteria startsWith(String field, String prefix) {
        return Criteria.where(field).regex("^" + Pattern.quote(prefix));
    }

    /** So khớp số điện thoại bỏ qua khoảng trắng: "0903 123 456" == "0903123456". */
    protected static Criteria phoneEquals(String field, String phone) {
        String digits = phone.replaceAll("\\s+", "");
        StringBuilder regex = new StringBuilder("^\\s*");
        for (char c : digits.toCharArray()) {
            regex.append(Pattern.quote(String.valueOf(c))).append("\\s*");
        }
        return Criteria.where(field).regex(regex.append("$").toString());
    }

    protected static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    // ---------- Sinh mã tuần tự ----------

    /** Tăng nguyên tử bộ đếm {@code name} trong collection counters và trả về giá trị mới. */
    protected long nextSequence(String name) {
        Document doc = mongo.findAndModify(
                Query.query(Criteria.where("_id").is(name)),
                new Update().inc("seq", 1L),
                FindAndModifyOptions.options().returnNew(true).upsert(true),
                Document.class,
                COUNTERS);
        Number seq = doc == null ? null : (Number) doc.get("seq");
        return seq == null ? 1L : seq.longValue();
    }

    /** Sinh id dạng {@code String.format(pattern, seq)} và bỏ qua những id đã tồn tại (ví dụ dữ liệu mẫu). */
    protected String nextFreeId(String sequenceName, String pattern) {
        while (true) {
            String candidate = String.format(pattern, nextSequence(sequenceName));
            if (!mongo.exists(Query.query(Criteria.where("_id").is(candidate)), collection)) {
                return candidate;
            }
        }
    }
}
