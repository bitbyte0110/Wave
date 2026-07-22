package com.wave.market.consumer;

import com.wave.common.AuditDonePayload;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationConsumerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationConsumer notificationConsumer;

    @Test
    @DisplayName("Should consume AuditDonePayload and route STOMP notification to /queue/notifications/{userId}")
    void shouldConsumeAuditDoneAndRouteToUserQueue() {
        // Arrange
        AuditDonePayload payload = new AuditDonePayload(100L, 42L, "Low risk USDC to BTC swap");

        // Act
        notificationConsumer.consumeAuditDone(payload);

        // Assert
        verify(messagingTemplate).convertAndSend("/queue/notifications/42", payload);
    }
}
