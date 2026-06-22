package kr.inseoul.api.loan;

import kr.inseoul.api.loan.domain.LoanEligibilityResult;
import kr.inseoul.api.loan.domain.LoanProduct;
import kr.inseoul.api.loan.dto.LoanEligibilityRequest;
import kr.inseoul.api.loan.dto.LoanEligibilityResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class LoanEligibilityService {

    private final LoanProductRepository productRepository;
    private final LoanEligibilityResultRepository resultRepository;

    public LoanEligibilityService(LoanProductRepository productRepository,
                                   LoanEligibilityResultRepository resultRepository) {
        this.productRepository = productRepository;
        this.resultRepository = resultRepository;
    }

    public LoanEligibilityResponse evaluate(Long userId, LoanEligibilityRequest req) {
        List<LoanProduct> products = productRepository.findAll();
        List<LoanEligibilityResponse.ProductResult> results = new ArrayList<>();

        for (LoanProduct product : products) {
            EligibilityDecision decision = decide(product, req);
            resultRepository.save(new LoanEligibilityResult(
                    req.simulationId(), product.getId(), decision.status(), decision.reason()
            ));
            results.add(new LoanEligibilityResponse.ProductResult(product.getName(), decision.status(), decision.reason()));
        }
        return new LoanEligibilityResponse(results);
    }

    private EligibilityDecision decide(LoanProduct product, LoanEligibilityRequest req) {
        return switch (product.getName()) {
            case "보금자리론" -> decideBogeumjari(product, req);
            case "디딤돌대출" -> decideDidimdol(product, req);
            case "청년전세자금대출" -> decideYouth(product, req);
            case "신혼부부전용대출" -> decideNewlywed(product, req);
            default -> new EligibilityDecision("NEED_MORE_INFO", "상품 정보를 확인 중입니다.");
        };
    }

    private EligibilityDecision decideBogeumjari(LoanProduct p, LoanEligibilityRequest req) {
        if (req.annualIncome().compareTo(p.getMaxIncome()) > 0) {
            return new EligibilityDecision("IMPOSSIBLE", "연소득이 한도(" + formatWon(p.getMaxIncome()) + ")를 초과합니다.");
        }
        if (req.targetPrice().compareTo(p.getMaxHousePrice()) > 0) {
            return new EligibilityDecision("IMPOSSIBLE", "주택가격이 한도(" + formatWon(p.getMaxHousePrice()) + ")를 초과합니다.");
        }
        return new EligibilityDecision("POSSIBLE", "소득·주택가격 조건을 충족합니다.");
    }

    private EligibilityDecision decideDidimdol(LoanProduct p, LoanEligibilityRequest req) {
        if (req.firstHomeBuyer() == null) {
            return new EligibilityDecision("NEED_MORE_INFO", "생애최초 여부를 입력해주세요.");
        }
        if (!req.firstHomeBuyer()) {
            return new EligibilityDecision("IMPOSSIBLE", "생애최초 구매자 전용 상품입니다.");
        }
        if (req.annualIncome().compareTo(p.getMaxIncome()) > 0) {
            return new EligibilityDecision("IMPOSSIBLE", "연소득이 한도(" + formatWon(p.getMaxIncome()) + ")를 초과합니다.");
        }
        if (req.targetPrice().compareTo(p.getMaxHousePrice()) > 0) {
            return new EligibilityDecision("IMPOSSIBLE", "주택가격이 한도(" + formatWon(p.getMaxHousePrice()) + ")를 초과합니다.");
        }
        return new EligibilityDecision("POSSIBLE", "생애최초 구매자 조건을 충족합니다.");
    }

    private EligibilityDecision decideYouth(LoanProduct p, LoanEligibilityRequest req) {
        return new EligibilityDecision("NEED_MORE_INFO", "나이 확인이 필요합니다. 만 19~34세 무주택 청년 대상입니다.");
    }

    private EligibilityDecision decideNewlywed(LoanProduct p, LoanEligibilityRequest req) {
        if (req.maritalStatus() == null) {
            return new EligibilityDecision("NEED_MORE_INFO", "혼인 여부를 입력해주세요.");
        }
        if (!"married".equalsIgnoreCase(req.maritalStatus())) {
            return new EligibilityDecision("IMPOSSIBLE", "신혼부부(혼인 7년 이내) 전용 상품입니다.");
        }
        if (req.annualIncome().compareTo(p.getMaxIncome()) > 0) {
            return new EligibilityDecision("IMPOSSIBLE", "연소득이 한도(" + formatWon(p.getMaxIncome()) + ")를 초과합니다.");
        }
        if (req.targetPrice().compareTo(p.getMaxHousePrice()) > 0) {
            return new EligibilityDecision("IMPOSSIBLE", "주택가격이 한도(" + formatWon(p.getMaxHousePrice()) + ")를 초과합니다.");
        }
        return new EligibilityDecision("POSSIBLE", "신혼부부 조건을 충족합니다.");
    }

    private String formatWon(BigDecimal amount) {
        return (amount.longValue() / 10000) + "만 원";
    }

    private record EligibilityDecision(String status, String reason) {}
}
