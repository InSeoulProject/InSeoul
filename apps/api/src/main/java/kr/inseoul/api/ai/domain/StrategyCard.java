package kr.inseoul.api.ai.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "strategy_cards")
public class StrategyCard {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "simulation_id", nullable = false)
    private Long simulationId;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "action_items", columnDefinition = "TEXT")
    @Convert(converter = StringListJsonConverter.class)
    private java.util.List<String> actionItems;

    @Column(name = "risk_notes", columnDefinition = "TEXT")
    @Convert(converter = StringListJsonConverter.class)
    private java.util.List<String> riskNotes;

    @Column(columnDefinition = "TEXT")
    private String disclaimer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    protected StrategyCard() {}

    public StrategyCard(Long simulationId, String summary, java.util.List<String> actionItems,
                        java.util.List<String> riskNotes, String disclaimer) {
        this.simulationId = simulationId;
        this.summary = summary;
        this.actionItems = actionItems;
        this.riskNotes = riskNotes;
        this.disclaimer = disclaimer;
    }

    public Long getId() { return id; }
    public Long getSimulationId() { return simulationId; }
    public String getSummary() { return summary; }
    public java.util.List<String> getActionItems() { return actionItems; }
    public java.util.List<String> getRiskNotes() { return riskNotes; }
    public String getDisclaimer() { return disclaimer; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
