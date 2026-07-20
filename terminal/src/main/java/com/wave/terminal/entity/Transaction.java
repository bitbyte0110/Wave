package com.wave.terminal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions", indexes = @Index(name = "idx_user_tx", columnList = "user_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('DEPOSIT', 'WITHDRAW', 'SWAP')")
    private TransactionType type;

    @Column(name = "asset_traded", nullable = false, length = 20)
    private String assetTraded;

    @Column(nullable = false, precision = 18, scale = 8)
    private BigDecimal amount;

    @Column(name = "ai_audit_remark", columnDefinition = "TEXT")
    private String aiAuditRemark;

    @Column(name = "created_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;
}