package com.wave.swap.consumer;

import com.wave.common.UserRegisteredPayload;
import com.wave.swap.config.RabbitMQConfig;
import com.wave.swap.entity.User;
import com.wave.swap.entity.Wallet;
import com.wave.swap.repository.UserRepository;
import com.wave.swap.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * RabbitMQ consumer in Swap-Engine listening for {@code user.registered} events.
 * Provisions a zero-balance Wallet row in its own transaction upon user registration.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredConsumer {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.USER_REGISTERED_QUEUE)
    @Transactional
    public void handleUserRegistered(UserRegisteredPayload payload) {
        log.info("CONSUME user.registered ▶ userId={} email={}", payload.userId(), payload.email());

        if (walletRepository.findByUserId(payload.userId()).isPresent()) {
            log.warn("Wallet already exists for userId={} — skipping provisioning.", payload.userId());
            return;
        }

        User user = userRepository.findById(payload.userId()).orElseGet(() -> {
            User u = new User();
            u.setId(payload.userId());
            u.setEmail(payload.email());
            u.setUsername(payload.username());
            u.setPasswordHash("");
            return userRepository.save(u);
        });

        Wallet wallet = new Wallet();
        wallet.setUser(user);
        wallet.setUsdcBalance(BigDecimal.ZERO);
        wallet.setBtcBalance(BigDecimal.ZERO);
        walletRepository.save(wallet);

        log.info("PROVISION WALLET ▶ Zero-balance wallet created for userId={}", payload.userId());
    }
}
