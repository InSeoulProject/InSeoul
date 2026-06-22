package kr.inseoul.api.ai.dto;

import java.util.List;

public record StrategyCardResponse(
        Long strategyCardId,
        String summary,
        List<String> actionItems,
        List<String> riskNotes,
        String disclaimer
) {}
