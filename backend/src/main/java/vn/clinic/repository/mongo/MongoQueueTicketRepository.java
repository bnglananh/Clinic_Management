package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;
import vn.clinic.model.QueueTicket;
import vn.clinic.repository.QueueTicketRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Hàng đợi khám lưu trong MongoDB. Thứ tự gọi số do trường {@code sortOrder} quyết định:
 * vé thường được thêm vào cuối, vé cấp cứu / được điều phối chen lên trước vé WAITING đầu tiên.
 */
@Repository
@StorageMode.NoSql
public class MongoQueueTicketRepository extends MongoSupport<QueueTicket> implements QueueTicketRepository {

    public static final String COLLECTION = "queue_tickets";
    private static final Sort QUEUE_ORDER = Sort.by(Sort.Direction.ASC, "sortOrder");
    private static final String PROMOTED_NOTE = "Được điều phối ưu tiên đầu hàng";

    public MongoQueueTicketRepository(MongoTemplate mongo) {
        super(mongo, QueueTicket.class, COLLECTION);
    }

    @Override
    public List<QueueTicket> findAll() {
        return all(QUEUE_ORDER);
    }

    @Override
    public Optional<QueueTicket> findById(String id) {
        return byId(id);
    }

    @Override
    public Optional<QueueTicket> findByTicketNumber(String ticketNumber) {
        if (ticketNumber == null) return Optional.empty();
        // Số thứ tự đánh lại mỗi ngày nên có thể trùng giữa các ngày → lấy phiếu mới nhất
        Query q = Query.query(eqIgnoreCase("ticketNumber", ticketNumber))
                .with(Sort.by(Sort.Direction.DESC, "checkinTime")).limit(1);
        return Optional.ofNullable(mongo.findOne(q, QueueTicket.class, COLLECTION));
    }

    @Override
    public List<QueueTicket> findByPatientId(String patientId) {
        if (patientId == null) return List.of();
        return find(Criteria.where("patientId").is(patientId), QUEUE_ORDER);
    }

    @Override
    public List<QueueTicket> search(String roomName, QueueStatus status, PriorityLevel priority, String date) {
        List<Criteria> and = new ArrayList<>();
        if (hasText(roomName)) and.add(eqIgnoreCase("roomName", roomName));
        if (status != null) and.add(Criteria.where("status").is(status));
        if (priority != null) and.add(Criteria.where("priority").is(priority));
        if (hasText(date)) and.add(startsWith("checkinTime", date));
        return find(and.isEmpty() ? new Criteria() : new Criteria().andOperator(and), QUEUE_ORDER);
    }

    @Override
    public Optional<QueueTicket> findNextWaitingTicket(String roomName) {
        Criteria c = Criteria.where("status").is(QueueStatus.WAITING);
        if (hasText(roomName)) c = c.andOperator(eqIgnoreCase("roomName", roomName));
        Query q = Query.query(c).with(QUEUE_ORDER).limit(1);
        return Optional.ofNullable(mongo.findOne(q, QueueTicket.class, COLLECTION));
    }

    @Override
    public synchronized QueueTicket save(QueueTicket ticket) {
        boolean isNew = !hasText(ticket.getId()) || byId(ticket.getId()).isEmpty();
        if (!hasText(ticket.getId())) {
            ticket.setId(nextFreeId("queue_id", "q-%05d"));
        }
        if (ticket.getSortOrder() == null) {
            ticket.setSortOrder(isNew && ticket.getPriority() == PriorityLevel.EMERGENCY
                    ? positionBeforeFirstWaiting(ticket.getId())
                    : positionAtEnd());
        }
        return upsert(ticket);
    }

    @Override
    public synchronized boolean promoteToTop(String ticketId) {
        Optional<QueueTicket> found = byId(ticketId);
        if (found.isEmpty() || found.get().getStatus() != QueueStatus.WAITING) return false;

        QueueTicket target = found.get();
        target.setPriority(PriorityLevel.EMERGENCY);
        target.setNotes(hasText(target.getNotes()) ? target.getNotes() + " • " + PROMOTED_NOTE : PROMOTED_NOTE);
        target.setSortOrder(positionBeforeFirstWaiting(target.getId()));
        upsert(target);
        return true;
    }

    @Override
    public long countByRoomPrefix(String prefix) {
        if (prefix == null) return 0;
        return count(startsWith("ticketNumber", prefix));
    }

    // ---------- Tính vị trí trong hàng đợi ----------

    private double positionAtEnd() {
        Query q = new Query().with(Sort.by(Sort.Direction.DESC, "sortOrder")).limit(1);
        QueueTicket last = mongo.findOne(q, QueueTicket.class, COLLECTION);
        return (last == null || last.getSortOrder() == null) ? 1.0 : Math.floor(last.getSortOrder()) + 1.0;
    }

    /** Vị trí ngay trước vé WAITING đầu tiên (bỏ qua chính vé đang xét); nếu không có vé chờ thì xếp cuối. */
    private double positionBeforeFirstWaiting(String excludeId) {
        Query firstWaitingQ = Query.query(Criteria.where("status").is(QueueStatus.WAITING).and("_id").ne(excludeId))
                .with(QUEUE_ORDER).limit(1);
        QueueTicket firstWaiting = mongo.findOne(firstWaitingQ, QueueTicket.class, COLLECTION);
        if (firstWaiting == null || firstWaiting.getSortOrder() == null) {
            return positionAtEnd();
        }
        double upper = firstWaiting.getSortOrder();

        Query prevQ = Query.query(Criteria.where("sortOrder").lt(upper).and("_id").ne(excludeId))
                .with(Sort.by(Sort.Direction.DESC, "sortOrder")).limit(1);
        QueueTicket prev = mongo.findOne(prevQ, QueueTicket.class, COLLECTION);
        double lower = (prev == null || prev.getSortOrder() == null) ? upper - 1.0 : prev.getSortOrder();
        return (lower + upper) / 2.0;
    }
}
