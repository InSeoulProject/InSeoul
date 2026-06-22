package kr.inseoul.api.loan.dto;

import java.util.List;

public record LoanEligibilityResponse(List<ProductResult> results) {

    public record ProductResult(
            String loanName,
            String status,
            String reason
    ) {}
}
