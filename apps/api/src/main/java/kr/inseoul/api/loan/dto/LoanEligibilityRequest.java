package kr.inseoul.api.loan.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record LoanEligibilityRequest(
        @NotNull BigDecimal targetPrice,
        @NotNull BigDecimal annualIncome,
        Boolean firstHomeBuyer,
        String maritalStatus,
        Long simulationId
) {}
