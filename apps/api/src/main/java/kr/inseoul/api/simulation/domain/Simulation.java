package kr.inseoul.api.simulation.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "simulations")
public class Simulation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "district_id")
    private Long districtId;

    @Column(name = "cash_asset", nullable = false, precision = 15, scale = 0)
    private BigDecimal cashAsset;

    @Column(name = "jeonse_deposit", nullable = false, precision = 15, scale = 0)
    private BigDecimal jeonseDeposit;

    @Column(name = "monthly_saving", nullable = false, precision = 15, scale = 0)
    private BigDecimal monthlySaving;

    @Column(name = "annual_income", precision = 15, scale = 0)
    private BigDecimal annualIncome;

    @Column(name = "target_price", nullable = false, precision = 15, scale = 0)
    private BigDecimal targetPrice;

    @Column(nullable = false, precision = 5, scale = 3)
    private BigDecimal ltv;

    @Column(name = "interest_rate", precision = 5, scale = 3)
    private BigDecimal interestRate;

    @Column(name = "expected_growth_rate", nullable = false, precision = 5, scale = 3)
    private BigDecimal expectedGrowthRate;

    @Column(name = "d_day_months")
    private Integer dDayMonths;

    @Column(name = "required_capital", precision = 15, scale = 0)
    private BigDecimal requiredCapital;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    protected Simulation() {}

    public Simulation(Long userId, Long districtId, BigDecimal cashAsset, BigDecimal jeonseDeposit,
                      BigDecimal monthlySaving, BigDecimal annualIncome, BigDecimal targetPrice,
                      BigDecimal ltv, BigDecimal interestRate, BigDecimal expectedGrowthRate,
                      Integer dDayMonths, BigDecimal requiredCapital) {
        this.userId = userId;
        this.districtId = districtId;
        this.cashAsset = cashAsset;
        this.jeonseDeposit = jeonseDeposit;
        this.monthlySaving = monthlySaving;
        this.annualIncome = annualIncome;
        this.targetPrice = targetPrice;
        this.ltv = ltv;
        this.interestRate = interestRate;
        this.expectedGrowthRate = expectedGrowthRate;
        this.dDayMonths = dDayMonths;
        this.requiredCapital = requiredCapital;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getDistrictId() { return districtId; }
    public BigDecimal getCashAsset() { return cashAsset; }
    public BigDecimal getJeonseDeposit() { return jeonseDeposit; }
    public BigDecimal getMonthlySaving() { return monthlySaving; }
    public BigDecimal getAnnualIncome() { return annualIncome; }
    public BigDecimal getTargetPrice() { return targetPrice; }
    public BigDecimal getLtv() { return ltv; }
    public BigDecimal getInterestRate() { return interestRate; }
    public BigDecimal getExpectedGrowthRate() { return expectedGrowthRate; }
    public Integer getDDayMonths() { return dDayMonths; }
    public BigDecimal getRequiredCapital() { return requiredCapital; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
