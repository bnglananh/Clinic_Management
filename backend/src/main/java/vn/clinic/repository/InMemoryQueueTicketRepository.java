package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;
import vn.clinic.model.QueueTicket;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

@Repository
public class InMemoryQueueTicketRepository implements QueueTicketRepository {

    // Using ordered list to maintain ticket position in queue accurately
    private final List<QueueTicket> tickets = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void initMockData() {
        // Initial queue tickets matching frontend reception-mock-data.ts
        save(QueueTicket.builder()
                .id("q-001")
                .ticketNumber("A-011")
                .patientId("p-004")
                .patientCode("BN-2026-0885")
                .patientName("Đặng Kim Chi")
                .gender("NU")
                .yearOfBirth(1989)
                .phone("0977445678")
                .roomName("Phòng Khám Nội 101")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .status(QueueStatus.COMPLETED)
                .priority(PriorityLevel.NORMAL)
                .checkinTime("2026-10-05T07:45:00Z")
                .estimatedTime("08:00")
                .notes("Khám xong, đã chuyển hóa đơn sang quầy thu ngân")
                .build());

        save(QueueTicket.builder()
                .id("q-002")
                .ticketNumber("A-012")
                .patientId("p-001")
                .patientCode("BN-2026-0891")
                .patientName("Nguyễn Văn Hùng")
                .gender("NAM")
                .yearOfBirth(1982)
                .phone("0903881234")
                .roomName("Phòng Khám Nội 101")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .status(QueueStatus.IN_PROGRESS)
                .priority(PriorityLevel.PRIORITY)
                .checkinTime("2026-10-05T08:10:00Z")
                .estimatedTime("08:20")
                .notes("Bệnh nhân đang ở trong phòng khám")
                .build());

        save(QueueTicket.builder()
                .id("q-004")
                .ticketNumber("B-005")
                .patientId("p-003")
                .patientCode("BN-2026-0888")
                .patientName("Trần Đại Nghĩa")
                .gender("NAM")
                .yearOfBirth(1960)
                .phone("0988122345")
                .roomName("Phòng Tai Mũi Họng 104")
                .doctorId("usr-doc-02")
                .doctorName("ThS.BS Vũ Hải Đăng")
                .status(QueueStatus.WAITING)
                .priority(PriorityLevel.EMERGENCY)
                .checkinTime("2026-10-05T08:05:00Z")
                .estimatedTime("08:40")
                .notes("Ca cấp cứu chảy máu cam nhiều, ưu tiên đầu hàng")
                .build());

        save(QueueTicket.builder()
                .id("q-003")
                .ticketNumber("A-013")
                .patientId("p-002")
                .patientCode("BN-2026-0892")
                .patientName("Lê Thị Thu Thảo")
                .gender("NU")
                .yearOfBirth(1995)
                .phone("0918334556")
                .roomName("Phòng Khám Nội 101")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .status(QueueStatus.WAITING)
                .priority(PriorityLevel.NORMAL)
                .checkinTime("2026-10-05T08:25:00Z")
                .estimatedTime("08:50")
                .notes("Chờ ngoài cửa phòng 101")
                .build());

        save(QueueTicket.builder()
                .id("q-005")
                .ticketNumber("A-014")
                .patientId("p-005")
                .patientCode("BN-2026-0900")
                .patientName("Vũ Đức Thịnh")
                .gender("NAM")
                .yearOfBirth(1999)
                .phone("0933667889")
                .roomName("Phòng Khám Nội 101")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .status(QueueStatus.WAITING)
                .priority(PriorityLevel.NORMAL)
                .checkinTime("2026-10-05T08:35:00Z")
                .estimatedTime("09:10")
                .build());

        save(QueueTicket.builder()
                .id("q-006")
                .ticketNumber("C-002")
                .patientId("p-006")
                .patientCode("BN-2026-0905")
                .patientName("Phạm Thị Mỹ Linh")
                .gender("NU")
                .yearOfBirth(1975)
                .phone("0909554332")
                .roomName("Phòng Khám Tiêu Hóa 202")
                .doctorId("usr-doc-03")
                .doctorName("BSCKII Nguyễn Hoàng Long")
                .status(QueueStatus.WAITING)
                .priority(PriorityLevel.PRIORITY)
                .checkinTime("2026-10-05T08:40:00Z")
                .estimatedTime("09:20")
                .build());
    }

    @Override
    public List<QueueTicket> findAll() {
        return new ArrayList<>(tickets);
    }

    @Override
    public Optional<QueueTicket> findById(String id) {
        if (id == null) return Optional.empty();
        return tickets.stream().filter(t -> id.equals(t.getId())).findFirst();
    }

    @Override
    public Optional<QueueTicket> findByTicketNumber(String ticketNumber) {
        if (ticketNumber == null) return Optional.empty();
        return tickets.stream()
                .filter(t -> ticketNumber.equalsIgnoreCase(t.getTicketNumber()))
                .findFirst();
    }

    @Override
    public List<QueueTicket> findByPatientId(String patientId) {
        if (patientId == null) return List.of();
        return tickets.stream()
                .filter(t -> patientId.equals(t.getPatientId()))
                .toList();
    }

    @Override
    public List<QueueTicket> search(String roomName, QueueStatus status, PriorityLevel priority, String date) {
        return tickets.stream()
                .filter(t -> roomName == null || roomName.isBlank() || roomName.equalsIgnoreCase(t.getRoomName()))
                .filter(t -> status == null || status == t.getStatus())
                .filter(t -> priority == null || priority == t.getPriority())
                .filter(t -> {
                    if (date == null || date.isBlank()) return true;
                    return t.getCheckinTime() != null && t.getCheckinTime().startsWith(date);
                })
                .toList();
    }

    @Override
    public Optional<QueueTicket> findNextWaitingTicket(String roomName) {
        return tickets.stream()
                .filter(t -> t.getStatus() == QueueStatus.WAITING)
                .filter(t -> roomName == null || roomName.isBlank() || roomName.equalsIgnoreCase(t.getRoomName()))
                .findFirst();
    }

    @Override
    public synchronized QueueTicket save(QueueTicket ticket) {
        if (ticket.getId() == null || ticket.getId().isBlank()) {
            ticket.setId("q-" + System.currentTimeMillis());
        }

        // If ticket already exists in list, update in place
        int existingIndex = -1;
        for (int i = 0; i < tickets.size(); i++) {
            if (tickets.get(i).getId().equals(ticket.getId())) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex != -1) {
            tickets.set(existingIndex, ticket);
        } else {
            // New ticket: if EMERGENCY priority, insert before regular WAITING tickets
            if (ticket.getPriority() == PriorityLevel.EMERGENCY) {
                int firstWaitingIdx = -1;
                for (int i = 0; i < tickets.size(); i++) {
                    if (tickets.get(i).getStatus() == QueueStatus.WAITING) {
                        firstWaitingIdx = i;
                        break;
                    }
                }
                if (firstWaitingIdx != -1) {
                    tickets.add(firstWaitingIdx, ticket);
                } else {
                    tickets.add(ticket);
                }
            } else {
                tickets.add(ticket);
            }
        }
        return ticket;
    }

    @Override
    public synchronized boolean promoteToTop(String ticketId) {
        int targetIdx = -1;
        for (int i = 0; i < tickets.size(); i++) {
            if (tickets.get(i).getId().equals(ticketId)) {
                targetIdx = i;
                break;
            }
        }
        if (targetIdx == -1) return false;

        QueueTicket target = tickets.get(targetIdx);
        if (target.getStatus() != QueueStatus.WAITING) return false;

        tickets.remove(targetIdx);
        target.setPriority(PriorityLevel.EMERGENCY);
        String note = target.getNotes() != null && !target.getNotes().isBlank()
                ? target.getNotes() + " • Được điều phối ưu tiên đầu hàng"
                : "Được điều phối ưu tiên đầu hàng";
        target.setNotes(note);

        // Find first WAITING index
        int firstWaitingIdx = -1;
        for (int i = 0; i < tickets.size(); i++) {
            if (tickets.get(i).getStatus() == QueueStatus.WAITING) {
                firstWaitingIdx = i;
                break;
            }
        }

        if (firstWaitingIdx != -1) {
            tickets.add(firstWaitingIdx, target);
        } else {
            tickets.add(target);
        }
        return true;
    }

    @Override
    public long countByRoomPrefix(String prefix) {
        return tickets.stream()
                .filter(t -> t.getTicketNumber() != null && t.getTicketNumber().startsWith(prefix))
                .count();
    }
}
