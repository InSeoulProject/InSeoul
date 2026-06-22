package kr.inseoul.api.user.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "cash_asset", precision = 15, scale = 0)
    private BigDecimal cashAsset;

    @Column(name = "jeonse_deposit", precision = 15, scale = 0)
    private BigDecimal jeonseDeposit;

    @Column(name = "monthly_saving", precision = 15, scale = 0)
    private BigDecimal monthlySaving;

    @Column(name = "annual_income", precision = 15, scale = 0)
    private BigDecimal annualIncome;

    @Column(name = "first_home_buyer")
    private Boolean firstHomeBuyer;

    @Column(name = "marital_status", length = 20)
    private String maritalStatus;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    protected UserProfile() {}

    public UserProfile(Long userId) {
        this.userId = userId;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public BigDecimal getCashAsset() { return cashAsset; }
    public BigDecimal getJeonseDeposit() { return jeonseDeposit; }
    public BigDecimal getMonthlySaving() { return monthlySaving; }
    public BigDecimal getAnnualIncome() { return annualIncome; }
    public Boolean getFirstHomeBuyer() { return firstHomeBuyer; }
    public String getMaritalStatus() { return maritalStatus; }

    public void setCashAsset(BigDecimal v) { this.cashAsset = v; }
    public void setJeonseDeposit(BigDecimal v) { this.jeonseDeposit = v; }
    public void setMonthlySaving(BigDecimal v) { this.monthlySaving = v; }
    public void setAnnualIncome(BigDecimal v) { this.annualIncome = v; }
    public void setFirstHomeBuyer(Boolean v) { this.firstHomeBuyer = v; }
    public void setMaritalStatus(String v) { this.maritalStatus = v; }
}
