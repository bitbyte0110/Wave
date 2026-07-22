package com.wave.swap.handler;

import com.wave.swap.entity.Wallet;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;

/**
 * Dynamically resolves the matching AssetPairHandler for a given trading pair.
 * Adding a new pair requires only registering a new @Component — no changes here.
 */
@Component
public class AssetPairRegistry {

    private final List<AssetPairHandler> handlers;

    public AssetPairRegistry(List<AssetPairHandler> handlers) {
        this.handlers = handlers;
    }

    public void executeSwap(Wallet wallet, String fromAsset, String toAsset,
                            BigDecimal fromAmount, BigDecimal toAmount) {
        AssetPairHandler handler = handlers.stream()
                .filter(h -> h.supports(fromAsset, toAsset))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid internal conversion pathway context mapping parameters"));

        handler.executeSwap(wallet, fromAmount, toAmount);
    }
}
