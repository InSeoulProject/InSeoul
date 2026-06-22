package kr.inseoul.api.ai.dto;

import jakarta.validation.constraints.NotNull;

public record StrategyCardRequest(@NotNull Long simulationId) {}
