package com.vinhhuy.timemaster.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // Khóa bí mật (Secret Key) để ký token. Trong thực tế sẽ để trong file properties
    private final String jwtSecret = "DayLaMotKhoaBiMatRatDaiVaKhoDoanChoUngDungTimeMasterCuaVinhHuy2026!";

    // Thời gian sống của Token (Ví dụ: 7 ngày)
    private final int jwtExpirationInMs = 604800000;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Tạo Token từ Email người dùng
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Lấy Email từ Token
    public String getEmailFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    // Kiểm tra Token có hợp lệ không
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            // Token hết hạn, sai chữ ký, v.v.
            System.out.println("Invalid JWT token: " + ex.getMessage());
        }
        return false;
    }
}
