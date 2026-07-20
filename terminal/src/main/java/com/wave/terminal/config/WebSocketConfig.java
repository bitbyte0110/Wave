package com.wave.terminal.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP over WebSocket configuration for Wave Terminal.
 *
 * Endpoint  : /ws  (clients connect here, SockJS fallback enabled)
 * Topics    : /topic/**  (server → all subscribers, e.g. price ticks)
 * User queue: /queue/**  (server → single user, e.g. AI audit notifications)
 * App prefix: /app       (client → server messages, not used in Stage 9)
 *
 * CORS is open (allowedOriginPatterns = *) for the local Next.js dev server.
 * Tighten to the deployed frontend origin before going to production.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory simple broker handles /topic/** and /queue/** destinations
        registry.enableSimpleBroker("/topic", "/queue");
        // Client-to-server messages must be prefixed with /app
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")   // tighten in production
                .withSockJS();                    // SockJS fallback for browsers without native WS
    }
}
