package kr.inseoul.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        int accessExpirySeconds,
        int refreshExpiryDays
) {}
