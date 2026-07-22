package com.wave.swap.handler;

import com.wave.swap.entity.Wallet;
import java.math.BigDecimal;

/**
 * Strategy interface for executing asset swap balance calculations on a Wallet.
 * Adding a new asset pair requires only a new implementation — no changes to WalletService.
 */
public interface AssetPairHandler {
    boolean supports(String fromAsset, String toAsset);
    void executeSwap(Wallet wallet, BigDecimal fromAmount, BigDecimal toAmount);
}
