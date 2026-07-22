package com.wave.terminal.handler;

import com.wave.terminal.entity.Wallet;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Registry component holding all registered `AssetPairHandler` implementations.
 * Dynamically resolves the matching strategy for a given trading pair.
 */
@Component
public class AssetPairRegistry {

    private final List<AssetPairHandler> handlers;

    public AssetPairRegistry(List<AssetPairHandler> handlers) {
        this.handlers = handlers;
    }

    public void executeSwap(Wallet wallet, String fromAsset, String toAsset, BigDecimal fromAmount, BigDecimal toAmount) {
        AssetPairHandler handler = handlers.stream()
                .filter(h -> h.supports(fromAsset, toAsset))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid internal conversion pathway context mapping parameters"));

        handler.executeSwap(wallet, fromAmount, toAmount);
    }
}
