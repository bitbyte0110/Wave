package com.wave.swap.service;

import com.wave.swap.entity.Transaction;
import com.wave.swap.entity.TransactionType;
import com.wave.swap.entity.Wallet;
import com.wave.swap.handler.AssetPairRegistry;
import com.wave.swap.repository.TransactionRepository;
import com.wave.swap.repository.WalletRepository;
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
    private final AssetPairRegistry assetPairRegistry;

    @Transactional(readOnly = true)
    public Wallet getBalance(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No wallet found for user ID: " + userId));
    }

    @Transactional
    public Wallet simulateDeposit(Long userId, String asset, BigDecimal amount) {
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
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("Wallet context missing for user ID: " + userId));

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
    public Wallet executeSwap(Long userId, String fromAsset, String toAsset,
                              BigDecimal fromAmount, BigDecimal toAmount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("Wallet context missing for user ID: " + userId));

        assetPairRegistry.executeSwap(wallet, fromAsset, toAsset, fromAmount, toAmount);
        walletRepository.save(wallet);

        Transaction tx = new Transaction();
        tx.setUser(wallet.getUser());
        tx.setType(TransactionType.SWAP);
        tx.setAssetTraded(fromAsset.toUpperCase() + "/" + toAsset.toUpperCase());
        tx.setAmount(fromAmount);
        Transaction savedTx = transactionRepository.save(tx);

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
