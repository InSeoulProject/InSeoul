package kr.inseoul.api.user.dto;

import java.math.BigDecimal;

public record ProfileResponse(
        BigDecimal cashAsset,
        BigDecimal jeonseDeposit,
        BigDecimal monthlySaving,
        BigDecimal annualIncome,
        Boolean firstHomeBuyer,
        String maritalStatus
) {}
