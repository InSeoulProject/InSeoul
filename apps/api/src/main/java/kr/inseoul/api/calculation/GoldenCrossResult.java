package kr.inseoul.api.calculation;

public record GoldenCrossResult(
        Integer dDayMonths,
        long requiredCapital,
        long availableAsset,
        long targetPriceAtPurchase
) {}
