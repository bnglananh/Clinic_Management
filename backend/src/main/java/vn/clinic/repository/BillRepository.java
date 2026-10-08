package vn.clinic.repository;

import vn.clinic.model.Bill;
import vn.clinic.model.PaymentStatus;

import java.util.List;
import java.util.Optional;

public interface BillRepository {

    Optional<Bill> findById(String id);

    Optional<Bill> findByBillCode(String billCode);

    List<Bill> findAll();

    List<Bill> findByPaymentStatus(PaymentStatus status);

    List<Bill> findByPatientId(String patientId);

    List<Bill> findByVisitId(String visitId);

    Bill save(Bill bill);

    void deleteById(String id);

    long countByPaymentStatus(PaymentStatus status);
}
