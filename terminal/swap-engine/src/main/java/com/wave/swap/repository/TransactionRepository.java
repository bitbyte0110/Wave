package com.wave.swap.repository;

import com.wave.swap.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Soft update — writes the AI audit remark into the target row only.
     * Called by the internal PATCH endpoint after Risk-Audit-Worker completes.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Transaction t SET t.aiAuditRemark = :remark WHERE t.id = :id")
    int updateAiRemark(@Param("id") Long transactionId, @Param("remark") String remark);
}
