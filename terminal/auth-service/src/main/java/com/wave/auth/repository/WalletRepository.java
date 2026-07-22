package com.wave.auth.repository;

import com.wave.auth.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Temporary: removed in Step 3 when wallet provisioning moves to Swap-Engine
 * via the user.registered RabbitMQ event.
 */
@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {}
