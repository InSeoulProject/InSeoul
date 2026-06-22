package kr.inseoul.api.district.dto;

import java.math.BigDecimal;

public record DistrictPriceResponse(
        String district,
        BigDecimal averagePrice,
        BigDecimal jeonsePrice,
        String baseDate
) {}
