package com.wave.swap.service;

import com.wave.swap.entity.Transaction;
import com.wave.swap.entity.TransactionType;
import com.wave.swap.entity.User;
import com.wave.swap.entity.Wallet;
import com.wave.swap.handler.AssetPairRegistry;
import com.wave.swap.repository.TransactionRepository;
import com.wave.swap.repository.UserRepository;
import com.wave.swap.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final RabbitTemplate rabbitTemplate;
    private final AssetPairRegistry assetPairRegistry;

    @Transactional
    public Wallet getBalance(Long userId) {
        return getOrCreateWallet(userId);
    }

    @Transactional
    public Wallet simulateDeposit(Long userId, String asset, BigDecimal amount) {
        Wallet wallet = getOrCreateWalletForUpdate(userId);

        if (asset.equalsIgnoreCase("USDC")) {
            wallet.setUsdcBalance(wallet.getUsdcBalance().add(amount));
        } else if (asset.equalsIgnoreCase("BTC")) {
            wallet.setBtcBalance(wallet.getBtcBalance().add(amount));
        } else {
            throw new IllegalArgumentException("Unsupported blockchain asset format: " + asset);
        }

        walletRepository.save(wallet);

        Transaction tx = new Transaction();
        tx.setUser(wallet.getUser());
        tx.setType(TransactionType.DEPOSIT);
        tx.setAssetTraded(asset.toUpperCase());
        tx.setAmount(amount);
        tx.setAiAuditRemark("Auto-Approved (Deposit)");
        transactionRepository.save(tx);

        log.info("DEPOSIT SUCCESS ▶ userId={} asset={} +{} -> usdcBalance={} btcBalance={}",
                userId, asset, amount, wallet.getUsdcBalance(), wallet.getBtcBalance());

        return wallet;
    }

    @Transactional
    public Wallet executeWithdraw(Long userId, String asset, BigDecimal amount) {
        Wallet wallet = getOrCreateWalletForUpdate(userId);

        if (asset.equalsIgnoreCase("USDC")) {
            if (wallet.getUsdcBalance().compareTo(amount) < 0) {
                throw new RuntimeException("Insufficient USDC balance to fulfill operational withdrawal request");
            }
            wallet.setUsdcBalance(wallet.getUsdcBalance().subtract(amount));
        } else if (asset.equalsIgnoreCase("BTC")) {
            if (wallet.getBtcBalance().compareTo(amount) < 0) {
                throw new RuntimeException("Insufficient BTC balance to fulfill operational withdrawal request");
            }
            wallet.setBtcBalance(wallet.getBtcBalance().subtract(amount));
        } else {
            throw new IllegalArgumentException("Unsupported blockchain asset format: " + asset);
        }

        walletRepository.save(wallet);

        Transaction tx = new Transaction();
        tx.setUser(wallet.getUser());
        tx.setType(TransactionType.WITHDRAW);
        tx.setAssetTraded(asset.toUpperCase());
        tx.setAmount(amount);
        tx.setAiAuditRemark("System Cleared (Withdrawal)");
        transactionRepository.save(tx);

        log.info("WITHDRAW SUCCESS ▶ userId={} asset={} -{} -> usdcBalance={} btcBalance={}",
                userId, asset, amount, wallet.getUsdcBalance(), wallet.getBtcBalance());

        return wallet;
    }

    @Transactional
    public Wallet executeSwap(Long userId, String fromAsset, String toAsset,
                              BigDecimal fromAmount, BigDecimal toAmount) {
        Wallet wallet = getOrCreateWalletForUpdate(userId);

        assetPairRegistry.executeSwap(wallet, fromAsset, toAsset, fromAmount, toAmount);
        walletRepository.save(wallet);

        Transaction tx = new Transaction();
        tx.setUser(wallet.getUser());
        tx.setType(TransactionType.SWAP);
        tx.setAssetTraded(fromAsset.toUpperCase() + "/" + toAsset.toUpperCase());
        tx.setAmount(fromAmount);
        tx.setAiAuditRemark("Low Risk (Verified)");
        Transaction savedTx = transactionRepository.save(tx);

        Map<String, Object> eventPayload = Map.of(
                "transactionId", savedTx.getId(),
                "userId", userId,
                "type", "SWAP",
                "assetTraded", tx.getAssetTraded(),
                "amount", fromAmount.toString());
        rabbitTemplate.convertAndSend("swap.events", "", eventPayload);

        log.info("SWAP SUCCESS ▶ userId={} {}->{} txId={}", userId, fromAsset, toAsset, savedTx.getId());

        return wallet;
    }

    // ── Helper methods ──────────────────────────────────────────────────────

    private Wallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> provisionWallet(userId));
    }

    private Wallet getOrCreateWalletForUpdate(Long userId) {
        return walletRepository.findByUserIdForUpdate(userId).orElseGet(() -> provisionWallet(userId));
    }

    private Wallet provisionWallet(Long userId) {
        log.info("AUTO-PROVISIONING ZERO-BALANCE WALLET ▶ userId={}", userId);

        User user = userRepository.findById(userId).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(userId);
            newUser.setUsername("user_" + userId);
            newUser.setEmail("user_" + userId + "@wave.local");
            newUser.setPasswordHash("AUTO_PROVISIONED_HASH");
            return userRepository.save(newUser);
        });

        Wallet newWallet = new Wallet();
        newWallet.setUser(user);
        // Initialize all users with 0 balance
        newWallet.setUsdcBalance(new BigDecimal("0.0000"));
        newWallet.setBtcBalance(new BigDecimal("0.00000000"));
        return walletRepository.save(newWallet);
    }
}
