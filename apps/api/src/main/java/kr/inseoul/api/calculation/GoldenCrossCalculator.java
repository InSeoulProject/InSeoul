package kr.inseoul.api.calculation;

import org.springframework.stereotype.Component;

/**
 * packages/calculation/src/index.ts 의 goldenCross 공식 Java 재현(NFR-03).
 * 동일 입력 → 동일 출력 보장.
 */
@Component
public class GoldenCrossCalculator {

    public GoldenCrossResult calculate(GoldenCrossParams p) {
        double initial = p.cashAsset() + p.jeonseDeposit();
        int maxMonths = p.maxMonths() > 0 ? p.maxMonths() : 600;

        for (int t = 0; t <= maxMonths; t++) {
            double asset    = assetAt(initial, p.monthlySaving(), t, p.monthlyReturnRate());
            double required = requiredCapitalAt(p.targetPrice(), p.expectedGrowthRate(), p.ltv(), p.acquisitionTaxRate(), t);
            if (asset >= required) {
                return new GoldenCrossResult(
                        t,
                        Math.round(required),
                        Math.round(asset),
                        Math.round(targetPriceAt(p.targetPrice(), p.expectedGrowthRate(), t))
                );
            }
        }
        double required = requiredCapitalAt(p.targetPrice(), p.expectedGrowthRate(), p.ltv(), p.acquisitionTaxRate(), maxMonths);
        return new GoldenCrossResult(
                null,
                Math.round(required),
                Math.round(assetAt(initial, p.monthlySaving(), maxMonths, p.monthlyReturnRate())),
                Math.round(targetPriceAt(p.targetPrice(), p.expectedGrowthRate(), maxMonths))
        );
    }

    double assetAt(double initialAsset, double monthlySaving, int months, double r) {
        if (r <= 0) return initialAsset + monthlySaving * months;
        double growth = Math.pow(1 + r, months);
        return initialAsset * growth + monthlySaving * ((growth - 1) / r);
    }

    double targetPriceAt(double targetPrice, double annualGrowth, int months) {
        return targetPrice * Math.pow(1 + annualGrowth, months / 12.0);
    }

    double requiredCapitalAt(double targetPrice, double annualGrowth, double ltv, double acquisitionTaxRate, int months) {
        double p = targetPriceAt(targetPrice, annualGrowth, months);
        return p * (1 - ltv) + p * acquisitionTaxRate;
    }
}
