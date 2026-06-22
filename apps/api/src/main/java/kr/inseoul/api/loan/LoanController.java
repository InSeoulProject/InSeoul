package kr.inseoul.api.loan;

import jakarta.validation.Valid;
import kr.inseoul.api.common.ApiResponse;
import kr.inseoul.api.loan.dto.LoanEligibilityRequest;
import kr.inseoul.api.loan.dto.LoanEligibilityResponse;
import kr.inseoul.api.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanEligibilityService eligibilityService;

    public LoanController(LoanEligibilityService eligibilityService) {
        this.eligibilityService = eligibilityService;
    }

    @PostMapping("/eligibility")
    public ResponseEntity<ApiResponse<LoanEligibilityResponse>> checkEligibility(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LoanEligibilityRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(eligibilityService.evaluate(principal.getUserId(), req)));
    }
}
