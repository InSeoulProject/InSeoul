package kr.inseoul.api.ai;

import jakarta.validation.Valid;
import kr.inseoul.api.ai.dto.*;
import kr.inseoul.api.common.ApiResponse;
import kr.inseoul.api.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiRelayService aiRelayService;

    public AiController(AiRelayService aiRelayService) {
        this.aiRelayService = aiRelayService;
    }

    @PostMapping("/strategy-card")
    public ResponseEntity<ApiResponse<StrategyCardResponse>> strategyCard(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StrategyCardRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(aiRelayService.createStrategyCard(principal.getUserId(), req)));
    }

    @PostMapping("/policy-explain")
    public ResponseEntity<ApiResponse<PolicyExplainResponse>> policyExplain(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PolicyExplainRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(aiRelayService.explainPolicy(principal.getUserId(), req)));
    }
}
