package vn.clinic.repository.mongo;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;
import vn.clinic.config.StorageMode;
import vn.clinic.model.QueueTicket;
import vn.clinic.repository.*;

import java.lang.reflect.Method;
import java.util.List;
import java.util.function.Function;

/**
 * Nạp dữ liệu mẫu vào MongoDB khi collection còn trống.
 * Nguồn dữ liệu mẫu là các repository in-memory (dùng chung với unit test),
 * nên chỉ có một bộ dữ liệu mẫu duy nhất trong dự án.
 * Khi chạy bằng docker compose, init script đã nạp sẵn file JSON nên bước này sẽ bỏ qua.
 */
@Slf4j
@Component
@Order(0)
@StorageMode.NoSql
public class MongoDataSeeder implements ApplicationRunner {

    private final MongoTemplate mongo;

    public MongoDataSeeder(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed(MongoPatientProfileRepository.COLLECTION, new InMemoryPatientProfileRepository(), InMemoryPatientProfileRepository::findAll);
        seed(MongoStaffAccountRepository.COLLECTION, new InMemoryStaffAccountRepository(), InMemoryStaffAccountRepository::findAll);
        seed(MongoAppointmentRepository.COLLECTION, new InMemoryAppointmentRepository(), InMemoryAppointmentRepository::findAll);
        seed(MongoMedicalRecordRepository.COLLECTION, new InMemoryMedicalRecordRepository(), InMemoryMedicalRecordRepository::findAll);
        seed(MongoBillRepository.COLLECTION, new InMemoryBillRepository(), InMemoryBillRepository::findAll);
        seed(MongoPharmacyDrugRepository.COLLECTION, new InMemoryPharmacyDrugRepository(), InMemoryPharmacyDrugRepository::findAll);
        seed(MongoStockTransactionRepository.COLLECTION, new InMemoryStockTransactionRepository(), InMemoryStockTransactionRepository::findAll);
        seed(MongoMedicalServiceRepository.COLLECTION, new InMemoryMedicalServiceRepository(), InMemoryMedicalServiceRepository::findAll);
        seed(MongoDoctorScheduleRepository.COLLECTION, new InMemoryDoctorScheduleRepository(), InMemoryDoctorScheduleRepository::findAll);
        seed(MongoNotificationRepository.COLLECTION, new InMemoryNotificationRepository(), r -> allNotifications(r));
        seed(MongoQueueTicketRepository.COLLECTION, new InMemoryQueueTicketRepository(), r -> withQueueOrder(r.findAll()));
    }

    private <R> void seed(String collection, R source, Function<R, List<?>> extractor) {
        if (mongo.collectionExists(collection) && mongo.getCollection(collection).countDocuments() > 0) {
            return;
        }
        runPostConstruct(source);
        List<?> docs = extractor.apply(source);
        if (!docs.isEmpty()) {
            mongo.insert(docs, collection);
        }
        log.info("[MongoDB] Đã nạp {} document mẫu vào collection '{}'", docs.size(), collection);
    }

    /** Giữ nguyên thứ tự hàng đợi của dữ liệu mẫu bằng trường sortOrder. */
    private static List<QueueTicket> withQueueOrder(List<QueueTicket> tickets) {
        for (int i = 0; i < tickets.size(); i++) {
            if (tickets.get(i).getSortOrder() == null) {
                tickets.get(i).setSortOrder((double) (i + 1));
            }
        }
        return tickets;
    }

    /** Repository thông báo không có findAll(); lấy toàn bộ qua trường lưu trữ nội bộ. */
    private static List<?> allNotifications(InMemoryNotificationRepository repo) {
        try {
            var field = InMemoryNotificationRepository.class.getDeclaredField("storage");
            field.setAccessible(true);
            return List.copyOf(((java.util.Map<?, ?>) field.get(repo)).values());
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Không đọc được dữ liệu thông báo mẫu", e);
        }
    }

    private static void runPostConstruct(Object target) {
        for (Method m : target.getClass().getDeclaredMethods()) {
            if (m.isAnnotationPresent(PostConstruct.class)) {
                try {
                    m.setAccessible(true);
                    m.invoke(target);
                } catch (ReflectiveOperationException e) {
                    throw new IllegalStateException("Không khởi tạo được dữ liệu mẫu từ " + target.getClass().getSimpleName(), e);
                }
            }
        }
    }
}
