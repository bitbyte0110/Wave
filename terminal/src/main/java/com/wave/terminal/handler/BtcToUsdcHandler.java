package com.wave.terminal.handler;

import com.wave.terminal.entity.Wallet;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Handler for BTC → USDC asset swap logic.
 */
@Component
public class BtcToUsdcHandler implements AssetPairHandler {

    @Override
    public boolean supports(String fromAsset, String toAsset) {
        return "BTC".equalsIgnoreCase(fromAsset) && "USDC".equalsIgnoreCase(toAsset);
    }

    @Override
    public void executeSwap(Wallet wallet, BigDecimal fromAmount, BigDecimal toAmount) {
        if (wallet.getBtcBalance().compareTo(fromAmount) < 0) {
            throw new RuntimeException("Insufficient core balance parameters to execute immediate asset swap");
        }
        wallet.setBtcBalance(wallet.getBtcBalance().subtract(fromAmount));
        wallet.setUsdcBalance(wallet.getUsdcBalance().add(toAmount));
    }
}
