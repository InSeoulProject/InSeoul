package kr.inseoul.api.simulation.dto;

import java.time.LocalDateTime;

public record SimulationHistoryItem(
        Long simulationId,
        String targetDistrict,
        Integer dDayMonths,
        LocalDateTime createdAt
) {}
