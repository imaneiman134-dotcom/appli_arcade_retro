package com.arcade.service;

import java.util.Base64;

import org.springframework.stereotype.Service;

@Service
public class JwtSimpleService {
    private static final String SECRET = "RetroArcadeSecretKey2026";
    private static final long EXPIRATION_TIME = 864_000_000; // 10 jrs

    public String generateToken(String pseudo) {
        String payload = pseudo + ":" + (System.currentTimeMillis() + EXPIRATION_TIME);
        return Base64.getEncoder().encodeToString(payload.getBytes());
    }

    public boolean validateToken(String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            long expiration = Long.parseLong(parts[1]);
            return System.currentTimeMillis() < expiration;
        } catch (Exception e) {
            return false;
        }
    }
}
