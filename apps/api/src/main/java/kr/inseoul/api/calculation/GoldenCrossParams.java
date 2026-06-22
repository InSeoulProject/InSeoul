package kr.inseoul.api.calculation;

public record GoldenCrossParams(
        double cashAsset,
        double jeonseDeposit,
        double monthlySaving,
        double targetPrice,
        double ltv,
        double expectedGrowthRate,
        double acquisitionTaxRate,
        double monthlyReturnRate,
        int maxMonths
) {
    public GoldenCrossParams {
        if (maxMonths <= 0) maxMonths = 600;
    }
}
