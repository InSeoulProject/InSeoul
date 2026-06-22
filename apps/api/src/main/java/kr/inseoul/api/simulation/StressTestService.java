package kr.inseoul.api.simulation;

import kr.inseoul.api.calculation.GoldenCrossCalculator;
import kr.inseoul.api.calculation.GoldenCrossParams;
import kr.inseoul.api.calculation.GoldenCrossResult;
import kr.inseoul.api.simulation.domain.Simulation;
import kr.inseoul.api.simulation.domain.StressTestResult;
import kr.inseoul.api.simulation.dto.StressTestRequest;
import kr.inseoul.api.simulation.dto.StressTestResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class StressTestService {

    private final SimulationService simulationService;
    private final StressTestResultRepository stressTestResultRepository;
    private final GoldenCrossCalculator calculator;

    public StressTestService(SimulationService simulationService,
                             StressTestResultRepository stressTestResultRepository,
                             GoldenCrossCalculator calculator) {
        this.simulationService = simulationService;
        this.stressTestResultRepository = stressTestResultRepository;
        this.calculator = calculator;
    }

    public StressTestResponse run(Long userId, StressTestRequest req) {
        Simulation base = simulationService.getSimulationForUser(req.simulationId(), userId);

        List<ScenarioDefinition> scenarios = List.of(
                new ScenarioDefinition("INTEREST_RATE_UP",
                        base.getExpectedGrowthRate().doubleValue() + 0.01,
                        base.getMonthlySaving().doubleValue(),
                        BigDecimal.valueOf(0.01)),
                new ScenarioDefinition("PRICE_UP",
                        base.getExpectedGrowthRate().doubleValue() + 0.02,
                        base.getMonthlySaving().doubleValue(),
                        BigDecimal.valueOf(0.02)),
                new ScenarioDefinition("SAVING_DOWN",
                        base.getExpectedGrowthRate().doubleValue(),
                        base.getMonthlySaving().doubleValue() * 0.9,
                        BigDecimal.valueOf(-0.10))
        );

        List<StressTestResponse.ScenarioResult> results = new ArrayList<>();
        for (ScenarioDefinition scenario : scenarios) {
            GoldenCrossParams params = new GoldenCrossParams(
                    base.getCashAsset().doubleValue(),
                    base.getJeonseDeposit().doubleValue(),
                    scenario.monthlySaving(),
                    base.getTargetPrice().doubleValue(),
                    base.getLtv().doubleValue(),
                    scenario.expectedGrowthRate(),
                    0.011,
                    0.0,
                    600
            );
            GoldenCrossResult scenarioResult = calculator.calculate(params);
            Integer resultDDayMonths = scenarioResult.dDayMonths();
            int delayedMonths = (resultDDayMonths != null && base.getDDayMonths() != null)
                    ? resultDDayMonths - base.getDDayMonths()
                    : 0;

            stressTestResultRepository.save(new StressTestResult(
                    base.getId(), scenario.type(), scenario.changedValue(), delayedMonths, resultDDayMonths
            ));
            results.add(new StressTestResponse.ScenarioResult(
                    scenario.type(), scenario.changedValue(), delayedMonths, resultDDayMonths
            ));
        }
        return new StressTestResponse(results);
    }

    private record ScenarioDefinition(String type, double expectedGrowthRate, double monthlySaving, BigDecimal changedValue) {}
}
