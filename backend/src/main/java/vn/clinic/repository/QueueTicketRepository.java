package vn.clinic.repository;

import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;
import vn.clinic.model.QueueTicket;

import java.util.List;
import java.util.Optional;

public interface QueueTicketRepository {
    List<QueueTicket> findAll();
    Optional<QueueTicket> findById(String id);
    Optional<QueueTicket> findByTicketNumber(String ticketNumber);
    List<QueueTicket> findByPatientId(String patientId);
    List<QueueTicket> search(String roomName, QueueStatus status, PriorityLevel priority, String date);
    Optional<QueueTicket> findNextWaitingTicket(String roomName);
    QueueTicket save(QueueTicket ticket);
    boolean promoteToTop(String ticketId);
    long countByRoomPrefix(String prefix);
}
