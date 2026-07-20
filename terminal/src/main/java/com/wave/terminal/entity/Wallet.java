package com.wave.terminal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "wallets", indexes = @Index(name = "idx_user_wallet", columnList = "user_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "usdc_balance", nullable = false, precision = 18, scale = 4)
    private BigDecimal usdcBalance = new BigDecimal("0.0000");

    @Column(name = "btc_balance", nullable = false, precision = 18, scale = 8)
    private BigDecimal btcBalance = new BigDecimal("0.00000000");
}