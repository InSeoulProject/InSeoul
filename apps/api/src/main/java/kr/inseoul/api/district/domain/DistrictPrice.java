package kr.inseoul.api.district.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "district_prices")
public class DistrictPrice {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @Column(name = "average_price", nullable = false, precision = 15, scale = 0)
    private BigDecimal averagePrice;

    @Column(name = "jeonse_price", nullable = false, precision = 15, scale = 0)
    private BigDecimal jeonsePrice;

    @Column(name = "housing_type", length = 50)
    private String housingType;

    @Column(name = "base_date", nullable = false)
    private LocalDate baseDate;

    protected DistrictPrice() {}

    public Long getId() { return id; }
    public District getDistrict() { return district; }
    public BigDecimal getAveragePrice() { return averagePrice; }
    public BigDecimal getJeonsePrice() { return jeonsePrice; }
    public String getHousingType() { return housingType; }
    public LocalDate getBaseDate() { return baseDate; }
}
