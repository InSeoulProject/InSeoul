package kr.inseoul.api.simulation.dto;

public record GoldenCrossResponse(
        Long simulationId,
        Integer dDayMonths,
        long requiredCapital,
        long availableAsset,
        long targetPriceAtPurchase,
        String message
) {}
