package kr.inseoul.api.ai;

import kr.inseoul.api.ai.domain.StrategyCard;
import kr.inseoul.api.ai.dto.*;
import kr.inseoul.api.common.exception.AiUnavailableException;
import kr.inseoul.api.district.DistrictRepository;
import kr.inseoul.api.simulation.SimulationService;
import kr.inseoul.api.simulation.domain.Simulation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class AiRelayService {

    private final SimulationService simulationService;
    private final StrategyCardRepository strategyCardRepository;
    private final AiClient aiClient;
    private final DistrictRepository districtRepository;

    public AiRelayService(SimulationService simulationService,
                          StrategyCardRepository strategyCardRepository,
                          AiClient aiClient,
                          DistrictRepository districtRepository) {
        this.simulationService = simulationService;
        this.strategyCardRepository = strategyCardRepository;
        this.aiClient = aiClient;
        this.districtRepository = districtRepository;
    }

    public StrategyCardResponse createStrategyCard(Long userId, StrategyCardRequest req) {
        Simulation sim = simulationService.getSimulationForUser(req.simulationId(), userId);

        String districtName = sim.getDistrictId() != null
                ? districtRepository.findById(sim.getDistrictId()).map(d -> d.getName()).orElse("해당 지역")
                : "해당 지역";

        String summary;
        List<String> actionItems;
        List<String> riskNotes;
        String disclaimer = "본 서비스는 정보 제공 목적이며 금융·부동산 의사결정을 보장하지 않습니다.";

        try {
            Map<String, Object> payload = buildStrategyCardPayload(sim);
            AiClient.InternalStrategyCardResponse aiResponse = aiClient.callStrategyCard(payload);
            summary = aiResponse.summary();
            actionItems = aiResponse.actionItems() != null ? aiResponse.actionItems().stream().limit(3).toList() : fallbackActionItems();
            riskNotes = aiResponse.riskNotes() != null ? aiResponse.riskNotes() : List.of();
        } catch (AiUnavailableException e) {
            summary = buildFallbackSummary(districtName, sim.getDDayMonths());
            actionItems = fallbackActionItems();
            riskNotes = List.of();
        }

        StrategyCard card = new StrategyCard(sim.getId(), summary, actionItems, riskNotes, disclaimer);
        strategyCardRepository.save(card);

        return new StrategyCardResponse(card.getId(), summary, actionItems, riskNotes, disclaimer);
    }

    public PolicyExplainResponse explainPolicy(Long userId, PolicyExplainRequest req) {
        Map<String, Object> payload = Map.of("loanName", req.loanName(), "status", req.status());
        try {
            AiClient.InternalPolicyExplainResponse aiResponse = aiClient.callPolicyExplain(payload);
            return new PolicyExplainResponse(aiResponse.explanation(), aiResponse.isFallback());
        } catch (AiUnavailableException e) {
            return new PolicyExplainResponse(buildFallbackPolicyExplanation(req.loanName(), req.status()), true);
        }
    }

    private Map<String, Object> buildStrategyCardPayload(Simulation sim) {
        return Map.of(
                "simulationResult", Map.of(
                        "dDayMonths", sim.getDDayMonths() != null ? sim.getDDayMonths() : -1,
                        "targetPrice", sim.getTargetPrice(),
                        "requiredCapital", sim.getRequiredCapital()
                ),
                "stressTestResults", List.of(),
                "loanResults", List.of(),
                "guardrail", Map.of("forbidGuarantee", true, "includeDisclaimer", true)
        );
    }

    private String buildFallbackSummary(String districtName, Integer dDayMonths) {
        if (dDayMonths != null) {
            return "현재 조건에서는 " + districtName + " 매수 가능 시점이 약 " + dDayMonths + "개월 뒤입니다.";
        }
        return districtName + " 매수를 위한 조건 개선이 필요합니다.";
    }

    private List<String> fallbackActionItems() {
        return List.of(
                "월 저축액을 늘리면 D-Day 단축 가능성이 있습니다.",
                "정책대출 주택 가격 한도를 확인하세요.",
                "금리 변동 시 매수 시점이 달라질 수 있습니다."
        );
    }

    private String buildFallbackPolicyExplanation(String loanName, String status) {
        return loanName + " 대출의 현재 판정 결과는 " + status + "입니다. 자세한 내용은 해당 금융기관에 문의하세요.";
    }
}
