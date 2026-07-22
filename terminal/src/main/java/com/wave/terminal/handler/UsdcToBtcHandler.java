package com.wave.terminal.handler;

import com.wave.terminal.entity.Wallet;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Handler for USDC → BTC asset swap logic.
 */
@Component
public class UsdcToBtcHandler implements AssetPairHandler {

    @Override
    public boolean supports(String fromAsset, String toAsset) {
        return "USDC".equalsIgnoreCase(fromAsset) && "BTC".equalsIgnoreCase(toAsset);
    }

    @Override
    public void executeSwap(Wallet wallet, BigDecimal fromAmount, BigDecimal toAmount) {
        if (wallet.getUsdcBalance().compareTo(fromAmount) < 0) {
            throw new RuntimeException("Insufficient core balance parameters to execute immediate asset swap");
        }
        wallet.setUsdcBalance(wallet.getUsdcBalance().subtract(fromAmount));
        wallet.setBtcBalance(wallet.getBtcBalance().add(toAmount));
    }
}
