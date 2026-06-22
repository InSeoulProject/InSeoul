package kr.inseoul.api.web;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * API 설계서(05) 외부 API 경계 스켈레톤. 모든 엔드포인트는 미구현(501).
 * 인증·사용자 DB 저장·AI 중계는 후속 단계에서 채운다.
 * FE는 BE만 호출하고, BE만 apps/ai 의 /internal/ai/* 를 호출한다(NFR-12).
 */
final class Stub {
    static ResponseEntity<Map<String, Object>> notImplemented(String name) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of("success", false,
                        "error", Map.of("code", "NOT_IMPLEMENTED", "message", name)));
    }
    private Stub() {}
}

@RestController
@RequestMapping("/api/auth")
class AuthController {
    @PostMapping("/signup")  ResponseEntity<?> signup(@RequestBody(required = false) Object b)  { return Stub.notImplemented("POST /api/auth/signup"); }
    @PostMapping("/login")   ResponseEntity<?> login(@RequestBody(required = false) Object b)   { return Stub.notImplemented("POST /api/auth/login"); }
    @PostMapping("/logout")  ResponseEntity<?> logout()                                          { return Stub.notImplemented("POST /api/auth/logout"); }
    @PostMapping("/refresh") ResponseEntity<?> refresh(@RequestBody(required = false) Object b) { return Stub.notImplemented("POST /api/auth/refresh"); }
}

@RestController
@RequestMapping("/api/users/me")
class UserController {
    @GetMapping                ResponseEntity<?> me()                                            { return Stub.notImplemented("GET /api/users/me"); }
    @GetMapping("/profile")    ResponseEntity<?> getProfile()                                    { return Stub.notImplemented("GET /api/users/me/profile"); }
    @PutMapping("/profile")    ResponseEntity<?> putProfile(@RequestBody(required = false) Object b) { return Stub.notImplemented("PUT /api/users/me/profile"); }
}

@RestController
@RequestMapping("/api")
class SimulationController {
    @GetMapping("/districts/prices")          ResponseEntity<?> prices()                                       { return Stub.notImplemented("GET /api/districts/prices"); }
    @PostMapping("/parse-input")              ResponseEntity<?> parseInput(@RequestBody(required=false) Object b) { return Stub.notImplemented("POST /api/parse-input"); }
    @PostMapping("/simulation/golden-cross")  ResponseEntity<?> goldenCross(@RequestBody(required=false) Object b) { return Stub.notImplemented("POST /api/simulation/golden-cross"); }
    @GetMapping("/simulation/history")        ResponseEntity<?> history()                                      { return Stub.notImplemented("GET /api/simulation/history"); }
    @PostMapping("/simulation/stress-test")   ResponseEntity<?> stress(@RequestBody(required=false) Object b)     { return Stub.notImplemented("POST /api/simulation/stress-test"); }
    @PostMapping("/loans/eligibility")        ResponseEntity<?> loans(@RequestBody(required=false) Object b)      { return Stub.notImplemented("POST /api/loans/eligibility"); }
}

@RestController
@RequestMapping("/api/ai")
class AiProxyController {
    // BE가 /internal/ai/* 로 중계하는 외부 표면. FE는 여기까지만 접근.
    @PostMapping("/strategy-card")  ResponseEntity<?> strategy(@RequestBody(required=false) Object b) { return Stub.notImplemented("POST /api/ai/strategy-card"); }
    @PostMapping("/policy-explain") ResponseEntity<?> policy(@RequestBody(required=false) Object b)   { return Stub.notImplemented("POST /api/ai/policy-explain"); }
}
