package kr.inseoul.api.simulation.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record StressTestRequest(
        @NotNull Long simulationId,
        List<String> scenarios
) {}
