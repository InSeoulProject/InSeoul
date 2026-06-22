package kr.inseoul.api.simulation.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "stress_test_results")
public class StressTestResult {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "simulation_id", nullable = false)
    private Long simulationId;

    @Column(name = "scenario_type", nullable = false, length = 50)
    private String scenarioType;

    @Column(name = "changed_value", precision = 10, scale = 4)
    private BigDecimal changedValue;

    @Column(name = "delayed_months")
    private Integer delayedMonths;

    @Column(name = "result_d_day_months")
    private Integer resultDDayMonths;

    protected StressTestResult() {}

    public StressTestResult(Long simulationId, String scenarioType, BigDecimal changedValue,
                            Integer delayedMonths, Integer resultDDayMonths) {
        this.simulationId = simulationId;
        this.scenarioType = scenarioType;
        this.changedValue = changedValue;
        this.delayedMonths = delayedMonths;
        this.resultDDayMonths = resultDDayMonths;
    }

    public Long getId() { return id; }
    public Long getSimulationId() { return simulationId; }
    public String getScenarioType() { return scenarioType; }
    public BigDecimal getChangedValue() { return changedValue; }
    public Integer getDelayedMonths() { return delayedMonths; }
    public Integer getResultDDayMonths() { return resultDDayMonths; }
}
