package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.Notification;
import vn.clinic.model.NotificationType;
import vn.clinic.repository.NotificationRepository;

import java.util.List;
import java.util.Optional;

@Repository
@StorageMode.NoSql
public class MongoNotificationRepository extends MongoSupport<Notification> implements NotificationRepository {

    public static final String COLLECTION = "notifications";
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "_id");

    public MongoNotificationRepository(MongoTemplate mongo) {
        super(mongo, Notification.class, COLLECTION);
    }

    @Override
    public List<Notification> findByUserId(String userId) {
        if (userId == null) return List.of();
        return find(Criteria.where("userId").is(userId), NEWEST_FIRST);
    }

    @Override
    public List<Notification> findByUserIdAndIsRead(String userId, boolean isRead) {
        if (userId == null) return List.of();
        return find(Criteria.where("userId").is(userId).and("isRead").is(isRead), NEWEST_FIRST);
    }

    @Override
    public List<Notification> findByUserIdAndType(String userId, NotificationType type) {
        if (userId == null) return List.of();
        Criteria c = Criteria.where("userId").is(userId);
        if (type != null) c = c.and("type").is(type);
        return find(c, NEWEST_FIRST);
    }

    @Override
    public long countUnreadByUserId(String userId) {
        if (userId == null) return 0;
        return count(Criteria.where("userId").is(userId).and("isRead").is(false));
    }

    @Override
    public Optional<Notification> findById(String id) {
        return byId(id);
    }

    @Override
    public Notification save(Notification notification) {
        if (!hasText(notification.getId())) {
            notification.setId(nextFreeId("notification_id", "NOTIF-%02d"));
        }
        return upsert(notification);
    }

    @Override
    public void markAsRead(String id, String readAt) {
        mongo.updateFirst(Query.query(Criteria.where("_id").is(id)),
                new Update().set("isRead", true).set("readAt", readAt), Notification.class, COLLECTION);
    }

    @Override
    public void markAllAsRead(String userId, String readAt) {
        if (userId == null) return;
        mongo.updateMulti(Query.query(Criteria.where("userId").is(userId).and("isRead").is(false)),
                new Update().set("isRead", true).set("readAt", readAt), Notification.class, COLLECTION);
    }

    @Override
    public void deleteById(String id) {
        removeById(id);
    }
}
