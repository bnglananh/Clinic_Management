package vn.clinic.service;

import vn.clinic.dto.CheckinReceptionRequest;
import vn.clinic.dto.PrintTicketDto;
import vn.clinic.dto.QueueSummaryDto;
import vn.clinic.dto.QueueTicketDto;
import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;

import java.util.List;

public interface QueueService {
    QueueTicketDto checkinAndIssueTicket(CheckinReceptionRequest request);
    List<QueueTicketDto> getQueue(String roomName, QueueStatus status, PriorityLevel priority, String date);
    QueueSummaryDto getQueueSummary();
    QueueTicketDto promoteToTop(String ticketId);
    QueueTicketDto callNextPatient(String roomName, String doctorId);
    QueueTicketDto updateTicketStatus(String ticketId, QueueStatus newStatus);
    PrintTicketDto getTicketPrintData(String ticketId);
    vn.clinic.dto.PatientQueueTrackingDto getPatientActiveQueue(String patientId);
    vn.clinic.dto.PatientQueueTrackingDto trackTicketByNumber(String ticketNumber);
}
