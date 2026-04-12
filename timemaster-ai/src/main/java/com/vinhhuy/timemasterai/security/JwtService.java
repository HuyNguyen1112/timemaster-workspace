package com.vinhhuy.timemasterai.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
@Slf4j
public class JwtService {

    @Value("${security.jwt.secret}")
    private String secretKey;

    /**
     * Verifies the JWT signature and extracts the User ID.
     * Production-grade verification using JJWT.
     */
    public Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        try {
            String token = authHeader.substring(7);
            Key key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // Expiration Check (Point 3)
            if (claims.getExpiration().before(new Date())) {
                log.warn("Attempted access with expired token");
                throw new RuntimeException("Security token has expired");
            }

            // Try 'userId' first, then fallback to 'sub'
            if (claims.get("userId") != null) {
                return Long.parseLong(claims.get("userId").toString());
            }

            String sub = claims.getSubject();
            return sub != null ? Long.parseLong(sub) : null;

        } catch (Exception e) {
            log.error("JWT Verification failed: {}", e.getMessage());
            throw new RuntimeException("Invalid or expired security token");
        }
    }
}
