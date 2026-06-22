package kr.inseoul.api.ai.dto;

public record PolicyExplainResponse(
        String explanation,
        boolean isFallback
) {}
