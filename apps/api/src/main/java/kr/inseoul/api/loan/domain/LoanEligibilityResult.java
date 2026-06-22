package kr.inseoul.api.loan.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "loan_eligibility_results")
public class LoanEligibilityResult {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "simulation_id")
    private Long simulationId;

    @Column(name = "loan_product_id", nullable = false)
    private Long loanProductId;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String reason;

    protected LoanEligibilityResult() {}

    public LoanEligibilityResult(Long simulationId, Long loanProductId, String status, String reason) {
        this.simulationId = simulationId;
        this.loanProductId = loanProductId;
        this.status = status;
        this.reason = reason;
    }

    public Long getId() { return id; }
    public Long getSimulationId() { return simulationId; }
    public Long getLoanProductId() { return loanProductId; }
    public String getStatus() { return status; }
    public String getReason() { return reason; }
}
