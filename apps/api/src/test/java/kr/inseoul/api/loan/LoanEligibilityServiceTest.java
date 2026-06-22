package kr.inseoul.api.loan;

import kr.inseoul.api.loan.domain.LoanProduct;
import kr.inseoul.api.loan.dto.LoanEligibilityRequest;
import kr.inseoul.api.loan.dto.LoanEligibilityResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.any;

@ExtendWith(MockitoExtension.class)
class LoanEligibilityServiceTest {

    @Mock LoanProductRepository productRepository;
    @Mock LoanEligibilityResultRepository resultRepository;

    private LoanEligibilityService service;

    /** V3 시드 데이터와 동일한 값으로 LoanProduct 생성 */
    private static LoanProduct makeProduct(Long id, String name, long maxHousePrice, long maxIncome, double ltv) {
        LoanProduct p = new LoanProduct() {};   // 익명 서브클래스로 protected 생성자 우회
        ReflectionTestUtils.setField(p, "id", id);
        ReflectionTestUtils.setField(p, "name", name);
        ReflectionTestUtils.setField(p, "maxHousePrice", BigDecimal.valueOf(maxHousePrice));
        ReflectionTestUtils.setField(p, "maxIncome", BigDecimal.valueOf(maxIncome));
        ReflectionTestUtils.setField(p, "ltv", BigDecimal.valueOf(ltv));
        return p;
    }

    private List<LoanProduct> seedProducts() {
        return List.of(
                makeProduct(1L, "보금자리론",    600_000_000L, 70_000_000L, 0.70),
                makeProduct(2L, "디딤돌대출",    500_000_000L, 60_000_000L, 0.70),
                makeProduct(3L, "청년전세자금대출", 300_000_000L, 50_000_000L, 0.80),
                makeProduct(4L, "신혼부부전용대출", 600_000_000L, 80_000_000L, 0.70)
        );
    }

    @BeforeEach
    void setUp() {
        service = new LoanEligibilityService(productRepository, resultRepository);
        given(productRepository.findAll()).willReturn(seedProducts());
        given(resultRepository.save(any())).willReturn(null);
    }

    private Map<String, LoanEligibilityResponse.ProductResult> evaluate(LoanEligibilityRequest req) {
        LoanEligibilityResponse resp = service.evaluate(1L, req);
        Map<String, LoanEligibilityResponse.ProductResult> map = new java.util.HashMap<>();
        for (var r : resp.results()) map.put(r.loanName(), r);
        return map;
    }

    @Test
    void 보금자리론_소득주택가격충족_POSSIBLE() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(500_000_000), BigDecimal.valueOf(60_000_000),
                null, null, null));

        assertThat(results.get("보금자리론").status()).isEqualTo("POSSIBLE");
    }

    @Test
    void 보금자리론_소득초과_IMPOSSIBLE() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(500_000_000), BigDecimal.valueOf(80_000_000),
                null, null, null));

        assertThat(results.get("보금자리론").status()).isEqualTo("IMPOSSIBLE");
        assertThat(results.get("보금자리론").reason()).contains("소득");
    }

    @Test
    void 보금자리론_주택가격초과_IMPOSSIBLE() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(700_000_000), BigDecimal.valueOf(50_000_000),
                null, null, null));

        assertThat(results.get("보금자리론").status()).isEqualTo("IMPOSSIBLE");
        assertThat(results.get("보금자리론").reason()).contains("주택가격");
    }

    @Test
    void 디딤돌_생애최초아님_IMPOSSIBLE() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(400_000_000), BigDecimal.valueOf(50_000_000),
                false, null, null));

        assertThat(results.get("디딤돌대출").status()).isEqualTo("IMPOSSIBLE");
    }

    @Test
    void 디딤돌_생애최초null_NEED_MORE_INFO() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(400_000_000), BigDecimal.valueOf(50_000_000),
                null, null, null));

        assertThat(results.get("디딤돌대출").status()).isEqualTo("NEED_MORE_INFO");
    }

    @Test
    void 디딤돌_생애최초충족_POSSIBLE() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(400_000_000), BigDecimal.valueOf(50_000_000),
                true, null, null));

        assertThat(results.get("디딤돌대출").status()).isEqualTo("POSSIBLE");
    }

    @Test
    void 청년전세_항상_NEED_MORE_INFO() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(200_000_000), BigDecimal.valueOf(30_000_000),
                true, "single", null));

        assertThat(results.get("청년전세자금대출").status()).isEqualTo("NEED_MORE_INFO");
        assertThat(results.get("청년전세자금대출").reason()).contains("나이");
    }

    @Test
    void 신혼부부_미혼_IMPOSSIBLE() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(500_000_000), BigDecimal.valueOf(70_000_000),
                null, "single", null));

        assertThat(results.get("신혼부부전용대출").status()).isEqualTo("IMPOSSIBLE");
    }

    @Test
    void 신혼부부_기혼소득충족_POSSIBLE() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(500_000_000), BigDecimal.valueOf(70_000_000),
                null, "married", null));

        assertThat(results.get("신혼부부전용대출").status()).isEqualTo("POSSIBLE");
    }

    @Test
    void 신혼부부_혼인여부null_NEED_MORE_INFO() {
        var results = evaluate(new LoanEligibilityRequest(
                BigDecimal.valueOf(500_000_000), BigDecimal.valueOf(70_000_000),
                null, null, null));

        assertThat(results.get("신혼부부전용대출").status()).isEqualTo("NEED_MORE_INFO");
    }
}
