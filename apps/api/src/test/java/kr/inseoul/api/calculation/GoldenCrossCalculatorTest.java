package kr.inseoul.api.calculation;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GoldenCrossCalculatorTest {

    private final GoldenCrossCalculator calculator = new GoldenCrossCalculator();

    @Test
    void goldenCrossWithReachableTarget() {
        // 마포구 9억, 현금 3천 + 전세 2억 = 2.3억, 월저축 150만
        // 필요자기자본 = 9억*0.3 + 9억*0.011 = 2.799억 > 2.3억 → t>0 에서 달성
        GoldenCrossParams params = new GoldenCrossParams(
                30_000_000, 200_000_000, 1_500_000,
                900_000_000, 0.7, 0.03, 0.011, 0.0, 600
        );
        GoldenCrossResult result = calculator.calculate(params);

        assertThat(result.dDayMonths()).isNotNull();
        assertThat(result.dDayMonths()).isGreaterThan(0);
        assertThat(result.requiredCapital()).isGreaterThan(0);
        assertThat(result.availableAsset()).isGreaterThanOrEqualTo(result.requiredCapital());
    }

    @Test
    void goldenCrossWithImpossibleTarget() {
        // 목표가 999억: 600개월 내 불가
        GoldenCrossParams params = new GoldenCrossParams(
                1_000_000, 0, 100_000,
                99_900_000_000L, 0.7, 0.03, 0.011, 0.0, 600
        );
        GoldenCrossResult result = calculator.calculate(params);

        assertThat(result.dDayMonths()).isNull();
    }

    @Test
    void goldenCrossImmediatelyPossible() {
        // 이미 충분한 자산: t=0 에서 달성
        GoldenCrossParams params = new GoldenCrossParams(
                1_000_000_000, 0, 0,
                100_000_000, 0.7, 0.0, 0.011, 0.0, 600
        );
        GoldenCrossResult result = calculator.calculate(params);

        assertThat(result.dDayMonths()).isEqualTo(0);
    }

    @Test
    void assetAtLinearWhenRateZero() {
        // r=0 이면 선형 누적
        double asset = calculator.assetAt(1_000_000, 500_000, 12, 0.0);
        assertThat(asset).isEqualTo(7_000_000.0);
    }

    @Test
    void targetPriceGrowthUsesAnnualRateMonthlyCompounded() {
        // 1년 후: 1억 * (1.03)^1 = 103,000,000
        double price = calculator.targetPriceAt(100_000_000, 0.03, 12);
        assertThat(price).isCloseTo(103_000_000.0, org.assertj.core.data.Offset.offset(1.0));
    }
}
