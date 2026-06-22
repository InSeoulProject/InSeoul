package kr.inseoul.api.simulation;

import jakarta.validation.Valid;
import kr.inseoul.api.common.ApiResponse;
import kr.inseoul.api.security.UserPrincipal;
import kr.inseoul.api.simulation.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationService simulationService;
    private final StressTestService stressTestService;

    public SimulationController(SimulationService simulationService, StressTestService stressTestService) {
        this.simulationService = simulationService;
        this.stressTestService = stressTestService;
    }

    @PostMapping("/golden-cross")
    public ResponseEntity<ApiResponse<GoldenCrossResponse>> goldenCross(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody GoldenCrossRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(simulationService.calculate(principal.getUserId(), req)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SimulationHistoryItem>>> history(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(simulationService.getHistory(principal.getUserId())));
    }

    @PostMapping("/stress-test")
    public ResponseEntity<ApiResponse<StressTestResponse>> stressTest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StressTestRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(stressTestService.run(principal.getUserId(), req)));
    }
}
