package kr.inseoul.api.simulation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record GoldenCrossRequest(
        @NotNull @PositiveOrZero BigDecimal cashAsset,
        @NotNull @PositiveOrZero BigDecimal jeonseDeposit,
        @NotNull @PositiveOrZero BigDecimal monthlySaving,
        BigDecimal annualIncome,
        @NotNull @PositiveOrZero BigDecimal targetPrice,
        @NotNull BigDecimal ltv,
        BigDecimal interestRate,
        @NotNull BigDecimal expectedGrowthRate,
        @NotNull BigDecimal acquisitionTaxRate,
        String targetDistrict
) {}
