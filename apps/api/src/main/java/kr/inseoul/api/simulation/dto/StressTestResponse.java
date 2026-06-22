package kr.inseoul.api.simulation.dto;

import java.math.BigDecimal;
import java.util.List;

public record StressTestResponse(List<ScenarioResult> results) {

    public record ScenarioResult(
            String scenarioType,
            BigDecimal changedValue,
            Integer delayedMonths,
            Integer resultDDayMonths
    ) {}
}
