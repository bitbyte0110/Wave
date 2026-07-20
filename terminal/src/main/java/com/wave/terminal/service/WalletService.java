package com.wave.terminal.service;

import com.wave.terminal.entity.Transaction;
import com.wave.terminal.entity.TransactionType;
import com.wave.terminal.entity.Wallet;
import com.wave.terminal.repository.TransactionRepository;
import com.wave.terminal.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public Wallet simulateDeposit(Long userId, String asset, BigDecimal amount) {
        // Secure pessimistic lock row-level before performing arithmetic execution
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("Wallet context missing for user ID: " + userId));

        if (asset.equalsIgnoreCase("USDC")) {
            wallet.setUsdcBalance(wallet.getUsdcBalance().add(amount));
        } else if (asset.equalsIgnoreCase("BTC")) {
            wallet.setBtcBalance(wallet.getBtcBalance().add(amount));
        } else {
            throw new IllegalArgumentException("Unsupported blockchain asset format");
        }

        walletRepository.save(wallet);

        // Commit execution history directly to immutable transaction trail
        Transaction tx = new Transaction();
        tx.setUser(wallet.getUser());
        tx.setType(TransactionType.DEPOSIT);
        tx.setAssetTraded(asset.toUpperCase());
        tx.setAmount(amount);
        transactionRepository.save(tx);

        return wallet;
    }

    @Transactional
    public Wallet executeWithdraw(Long userId, String asset, BigDecimal amount) {
        // Enforce strong isolation queue via write-lock mapping query
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("Wallet context missing for user ID: " + userId));

        // Strict post-lock calculation validation checks preventing negative balance
        // exploits
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
            throw new IllegalArgumentException("Unsupported blockchain asset format");
        }

        walletRepository.save(wallet);

        Transaction tx = new Transaction();
        tx.setUser(wallet.getUser());
        tx.setType(TransactionType.WITHDRAW);
        tx.setAssetTraded(asset.toUpperCase());
        tx.setAmount(amount);
        transactionRepository.save(tx);

        return wallet;
    }

    @Transactional
    public Wallet executeSwap(Long userId, String fromAsset, String toAsset, BigDecimal fromAmount,
            BigDecimal toAmount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("Wallet context missing for user ID: " + userId));

        // Enforce dual-asset execution protection calculations
        if (fromAsset.equalsIgnoreCase("USDC") && toAsset.equalsIgnoreCase("BTC")) {
            if (wallet.getUsdcBalance().compareTo(fromAmount) < 0) {
                throw new RuntimeException("Insufficient core balance parameters to execute immediate asset swap");
            }
            wallet.setUsdcBalance(wallet.getUsdcBalance().subtract(fromAmount));
            wallet.setBtcBalance(wallet.getBtcBalance().add(toAmount));
        } else if (fromAsset.equalsIgnoreCase("BTC") && toAsset.equalsIgnoreCase("USDC")) {
            if (wallet.getBtcBalance().compareTo(fromAmount) < 0) {
                throw new RuntimeException("Insufficient core balance parameters to execute immediate asset swap");
            }
            wallet.setBtcBalance(wallet.getBtcBalance().subtract(fromAmount));
            wallet.setUsdcBalance(wallet.getUsdcBalance().add(toAmount));
        } else {
            throw new IllegalArgumentException("Invalid internal conversion pathway context mapping parameters");
        }

        walletRepository.save(wallet);

        Transaction tx = new Transaction();
        tx.setUser(wallet.getUser());
        tx.setType(TransactionType.SWAP);
        tx.setAssetTraded(fromAsset.toUpperCase() + "/" + toAsset.toUpperCase());
        tx.setAmount(fromAmount);
        Transaction savedTx = transactionRepository.save(tx);

        // Async Processing Pipeline Offloading: Publish event payload context straight
        // to RabbitMQ queue
        Map<String, Object> eventPayload = Map.of(
                "transactionId", savedTx.getId(),
                "userId", userId,
                "type", "SWAP",
                "assetTraded", tx.getAssetTraded(),
                "amount", fromAmount.toString());
        rabbitTemplate.convertAndSend("swap.events", "", eventPayload);

        return wallet;
    }
}