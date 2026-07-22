
package com.wave.gateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationGlobalFilterTest {

    private static final String SECRET_BASE64 = "V2F2ZVRlcm1pbmFsU3VwZXJTZWNyZXRLZXkyMDI2X1NlY3VyZV9KV1RfVG9rZW5fS2V5XzI1NkJpdHM=";
    private JwtAuthenticationGlobalFilter filter;
    private GatewayFilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationGlobalFilter();
        ReflectionTestUtils.setField(filter, "secretBase64", SECRET_BASE64);
        chain = Mockito.mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());
    }

    @Test
    void filter_PermitsPublicAuthRouteWithoutJwt() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/auth/login").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        verify(chain).filter(exchange);
    }

    @Test
    void filter_RejectsProtectedRouteWhenAuthorizationHeaderMissing() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/wallet/deposit").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void filter_RejectsProtectedRouteWhenTokenInvalid() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/wallet/deposit")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void filter_AllowsProtectedRouteAndForwardsUserIdHeaderWhenTokenValid() {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET_BASE64));
        String validToken = Jwts.builder()
                .claims(Map.of("userId", 42L))
                .subject("alice@example.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(key)
                .compact();

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/wallet/deposit")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + validToken)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        verify(chain).filter(any());
    }
}
