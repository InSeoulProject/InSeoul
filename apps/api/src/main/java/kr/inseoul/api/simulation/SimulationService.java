package kr.inseoul.api.simulation;

import kr.inseoul.api.calculation.GoldenCrossCalculator;
import kr.inseoul.api.calculation.GoldenCrossParams;
import kr.inseoul.api.calculation.GoldenCrossResult;
import kr.inseoul.api.common.exception.ForbiddenException;
import kr.inseoul.api.common.exception.NotFoundException;
import kr.inseoul.api.district.DistrictRepository;
import kr.inseoul.api.simulation.domain.Simulation;
import kr.inseoul.api.simulation.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class SimulationService {

    private final SimulationRepository simulationRepository;
    private final GoldenCrossCalculator calculator;
    private final DistrictRepository districtRepository;

    public SimulationService(SimulationRepository simulationRepository,
                             GoldenCrossCalculator calculator,
                             DistrictRepository districtRepository) {
        this.simulationRepository = simulationRepository;
        this.calculator = calculator;
        this.districtRepository = districtRepository;
    }

    public GoldenCrossResponse calculate(Long userId, GoldenCrossRequest req) {
        Long districtId = null;
        if (req.targetDistrict() != null) {
            districtId = districtRepository.findByName(req.targetDistrict())
                    .map(d -> d.getId())
                    .orElse(null);
        }

        GoldenCrossParams params = new GoldenCrossParams(
                req.cashAsset().doubleValue(),
                req.jeonseDeposit().doubleValue(),
                req.monthlySaving().doubleValue(),
                req.targetPrice().doubleValue(),
                req.ltv().doubleValue(),
                req.expectedGrowthRate().doubleValue(),
                req.acquisitionTaxRate().doubleValue(),
                0.0,
                600
        );
        GoldenCrossResult result = calculator.calculate(params);

        Simulation simulation = new Simulation(
                userId, districtId,
                req.cashAsset(), req.jeonseDeposit(), req.monthlySaving(), req.annualIncome(),
                req.targetPrice(), req.ltv(), req.interestRate(), req.expectedGrowthRate(),
                result.dDayMonths(), BigDecimal.valueOf(result.requiredCapital())
        );
        simulationRepository.save(simulation);

        String message = result.dDayMonths() != null
                ? "현재 조건 기준 약 " + result.dDayMonths() + "개월 뒤 매수 가능성이 있습니다."
                : "현재 조건에서는 600개월 내 매수 가능 시점이 없습니다.";

        return new GoldenCrossResponse(
                simulation.getId(), result.dDayMonths(),
                result.requiredCapital(), result.availableAsset(),
                result.targetPriceAtPurchase(), message
        );
    }

    @Transactional(readOnly = true)
    public List<SimulationHistoryItem> getHistory(Long userId) {
        return simulationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(s -> {
                    String districtName = s.getDistrictId() != null
                            ? districtRepository.findById(s.getDistrictId())
                                    .map(d -> d.getName()).orElse("알 수 없음")
                            : "알 수 없음";
                    return new SimulationHistoryItem(s.getId(), districtName, s.getDDayMonths(), s.getCreatedAt());
                })
                .toList();
    }

    public Simulation getSimulationForUser(Long simulationId, Long userId) {
        Simulation sim = simulationRepository.findById(simulationId)
                .orElseThrow(() -> new NotFoundException("시뮬레이션을 찾을 수 없습니다."));
        if (!sim.getUserId().equals(userId)) {
            throw new ForbiddenException("접근 권한이 없습니다.");
        }
        return sim;
    }
}
