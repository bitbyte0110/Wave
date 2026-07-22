package com.wave.swap.controller;

import com.wave.swap.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class InternalTransactionControllerTest {

    private TransactionRepository transactionRepository;
    private InternalTransactionController controller;

    @BeforeEach
    void setUp() {
        transactionRepository = Mockito.mock(TransactionRepository.class);
        controller = new InternalTransactionController(transactionRepository);
        ReflectionTestUtils.setField(controller, "internalApiKey", "wave-internal-secret-2026");
    }

    @Test
    void updateRemark_UnauthorizedWhenMissingOrInvalidApiKey() {
        ResponseEntity<?> responseNoHeader = controller.updateRemark(null, 1L, new InternalTransactionController.RemarkRequest("Low Risk"));
        assertEquals(HttpStatus.UNAUTHORIZED, responseNoHeader.getStatusCode());

        ResponseEntity<?> responseInvalidHeader = controller.updateRemark("wrong-key", 1L, new InternalTransactionController.RemarkRequest("Low Risk"));
        assertEquals(HttpStatus.UNAUTHORIZED, responseInvalidHeader.getStatusCode());
    }

    @Test
    void updateRemark_NotFoundWhenTransactionDoesNotExist() {
        when(transactionRepository.updateAiRemark(anyLong(), anyString())).thenReturn(0);

        ResponseEntity<?> response = controller.updateRemark("wave-internal-secret-2026", 99L, new InternalTransactionController.RemarkRequest("Low Risk"));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void updateRemark_SuccessWhenApiKeyValidAndTransactionFound() {
        when(transactionRepository.updateAiRemark(1L, "Low Risk")).thenReturn(1);

        ResponseEntity<?> response = controller.updateRemark("wave-internal-secret-2026", 1L, new InternalTransactionController.RemarkRequest("Low Risk"));
        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Remark updated successfully", body.get("message"));
    }
}
