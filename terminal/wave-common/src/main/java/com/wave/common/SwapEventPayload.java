package com.wave.common;

/**
 * RabbitMQ event payload published by Swap-Engine to the {@code swap.events} FanoutExchange
 * whenever a swap transaction completes.
 *
 * This record is the canonical message contract between Swap-Engine (producer)
 * and Risk-Audit-Worker (consumer). Both modules depend on wave-common for this type;
 * neither may redefine it locally.
 *
 * Payload shape (JSON serialised by Jackson):
 * <pre>
 * {
 *   "transactionId": 42,
 *   "userId":        7,
 *   "type":          "SWAP",
 *   "assetTraded":   "USDC/BTC",
 *   "amount":        "250.0000"
 * }
 * </pre>
 */
public record SwapEventPayload(
        Long transactionId,
        Long userId,
        String type,
        String assetTraded,
        String amount
) {}
