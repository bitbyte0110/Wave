package com.wave.terminal.handler;

import com.wave.terminal.entity.Wallet;

import java.math.BigDecimal;

/**
 * Strategy interface for executing asset swap calculations on a Wallet.
 */
public interface AssetPairHandler {

    /**
     * Determines whether this handler supports swapping from `fromAsset` to `toAsset`.
     */
    boolean supports(String fromAsset, String toAsset);

    /**
     * Executes balance deduction and addition logic on the wallet entity.
     */
    void executeSwap(Wallet wallet, BigDecimal fromAmount, BigDecimal toAmount);
}
