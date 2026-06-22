package kr.inseoul.api.loan.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "loan_products")
public class LoanProduct {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "max_house_price", precision = 15, scale = 0)
    private BigDecimal maxHousePrice;

    @Column(name = "max_income", precision = 15, scale = 0)
    private BigDecimal maxIncome;

    @Column(precision = 5, scale = 3)
    private BigDecimal ltv;

    @Column(columnDefinition = "TEXT")
    private String description;

    protected LoanProduct() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public BigDecimal getMaxHousePrice() { return maxHousePrice; }
    public BigDecimal getMaxIncome() { return maxIncome; }
    public BigDecimal getLtv() { return ltv; }
    public String getDescription() { return description; }
}
