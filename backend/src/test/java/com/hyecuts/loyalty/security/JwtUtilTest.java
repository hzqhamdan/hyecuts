package com.hyecuts.loyalty.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class JwtUtilTest {

    private JwtUtil jwtUtil;
    private SecretKey secretKey;
    private String secret;
    private String userId;
    private String username;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        secretKey = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
        secret = Base64.getEncoder().encodeToString(secretKey.getEncoded());
        jwtUtil = new JwtUtil(secret);
        userId = UUID.randomUUID().toString();
        username = "testuser";
        userDetails = User.withUsername(username).password("pass").roles("USER").build();
    }

    @Test
    void generateToken_shouldCreateValidJwt() {
        String token = jwtUtil.generateToken(username, userId);

        assertNotNull(token);
        assertEquals(3, token.split("\\.").length);
    }

    @Test
    void extractUserId_shouldReturnCorrectUserId() {
        String token = jwtUtil.generateToken(username, userId);

        assertEquals(userId, jwtUtil.extractUserId(token));
    }

    @Test
    void extractUsername_shouldReturnCorrectUsername() {
        String token = jwtUtil.generateToken(username, userId);

        assertEquals(username, jwtUtil.extractUsername(token));
    }

    @Test
    void tokenShouldContainExpectedClaims() {
        String token = jwtUtil.generateToken(username, userId);
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        assertEquals(username, claims.getSubject());
        assertEquals(userId, claims.get("userId"));
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
    }

    @Test
    void tokenExpirationShouldBeSetTo24Hours() {
        String token = jwtUtil.generateToken(username, userId);
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        long diffMs = claims.getExpiration().getTime() - claims.getIssuedAt().getTime();
        assertEquals(86400000L, diffMs);
    }

    @Test
    void validateToken_shouldReturnTrueForValidToken() {
        String token = jwtUtil.generateToken(username, userId);

        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void validateToken_shouldReturnFalseForWrongUsername() {
        UserDetails wrongUser = User.withUsername("wronguser").password("pass").roles("USER").build();
        String token = jwtUtil.generateToken(username, userId);

        assertFalse(jwtUtil.validateToken(token, wrongUser));
    }

    @Test
    void tokenWithCurrentTimeShouldBeValid() {
        String token = jwtUtil.generateToken(username, userId);

        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void tokenThatIs23HoursOldShouldStillBeValid() {
        long twentyThreeHoursAgo = System.currentTimeMillis() - 1000L * 60 * 60 * 23;
        String token = Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .setIssuedAt(new Date(twentyThreeHoursAgo))
                .setExpiration(new Date(twentyThreeHoursAgo + 86400000L))
                .signWith(secretKey)
                .compact();

        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void tokenThatIs24HoursAnd1SecondOldShouldBeExpired() {
        long issuedAt = System.currentTimeMillis() - 86400000L - 1000L;
        long expiration = issuedAt + 86400000L;
        String token = Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .setIssuedAt(new Date(issuedAt))
                .setExpiration(new Date(expiration))
                .signWith(secretKey)
                .compact();

        assertThrows(ExpiredJwtException.class, () -> jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void nullToken_shouldThrowException() {
        assertThrows(Exception.class, () -> jwtUtil.extractUserId(null));
    }

    @Test
    void emptyStringToken_shouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> jwtUtil.extractUserId(""));
    }

    @Test
    void whitespaceToken_shouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> jwtUtil.extractUserId("   "));
    }

    @Test
    void malformedToken_shouldThrowException() {
        assertThrows(MalformedJwtException.class, () -> jwtUtil.extractUserId("abc.def.ghi"));
    }

    @Test
    void tamperedToken_shouldFailSignatureVerification() {
        String token = jwtUtil.generateToken(username, userId);
        String[] parts = token.split("\\.");
        String tamperedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("{\"sub\":\"hacker\",\"userId\":\"hacked\"}").getBytes()
        );
        String tamperedToken = parts[0] + "." + tamperedPayload + "." + parts[2];

        assertThrows(SignatureException.class, () -> jwtUtil.extractUserId(tamperedToken));
    }

    @Test
    void tokenSignedWithDifferentSecret_shouldBeRejected() {
        SecretKey otherKey = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
        String token = Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000L))
                .signWith(otherKey)
                .compact();

        assertThrows(SignatureException.class, () -> jwtUtil.extractUserId(token));
    }

    @Test
    void tokenWithNoneAlgorithm_shouldBeRejected() {
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"alg\":\"none\"}".getBytes()
        );
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("{\"sub\":\"" + username + "\",\"userId\":\"" + userId + "\"}").getBytes()
        );
        String token = header + "." + payload + ".";

        assertThrows(Exception.class, () -> jwtUtil.extractUserId(token));
    }

    @Test
    void veryLongUserId_shouldBeHandled() {
        String longUserId = UUID.randomUUID().toString() + "-" + UUID.randomUUID();
        String token = jwtUtil.generateToken(username, longUserId);

        assertEquals(longUserId, jwtUtil.extractUserId(token));
    }
}
