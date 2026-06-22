package kr.inseoul.api.web;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 가이드 8-1 외부 API 경계의 스켈레톤.
 * 모든 엔드포인트는 아직 미구현(501)이며, 인증·사용자 DB·AI 중계는 후속 단계에서 채운다.
 * FE는 BE만 호출하고, BE만 apps/ai 의 /internal/ai/* 를 호출한다.
 */
final class Stub {
    static ResponseEntity<Map<String, String>> notImplemented(String name) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of("status", "not_implemented", "endpoint", name));
    }
    private Stub() {}
}

@RestController
@RequestMapping("/api/auth")
class AuthController {
    @PostMapping("/signup") ResponseEntity<?> signup(@RequestBody(required = false) Object body) { return Stub.notImplemented("POST /api/auth/signup"); }
    @PostMapping("/login")  ResponseEntity<?> login(@RequestBody(required = false) Object body)  { return Stub.notImplemented("POST /api/auth/login"); }
    @PostMapping("/logout") ResponseEntity<?> logout()                                            { return Stub.notImplemented("POST /api/auth/logout"); }
}

@RestController
@RequestMapping("/api/users")
class UserController {
    @GetMapping("/me")          ResponseEntity<?> me()                                            { return Stub.notImplemented("GET /api/users/me"); }
    @PutMapping("/me/profile")  ResponseEntity<?> profile(@RequestBody(required = false) Object b) { return Stub.notImplemented("PUT /api/users/me/profile"); }
}

@RestController
@RequestMapping("/api")
class SimulationController {
    @GetMapping("/districts/prices")          ResponseEntity<?> prices()                                  { return Stub.notImplemented("GET /api/districts/prices"); }
    @PostMapping("/simulation/golden-cross")  ResponseEntity<?> goldenCross(@RequestBody(required=false) Object b) { return Stub.notImplemented("POST /api/simulation/golden-cross"); }
    @PostMapping("/simulation/stress-test")   ResponseEntity<?> stress(@RequestBody(required=false) Object b)      { return Stub.notImplemented("POST /api/simulation/stress-test"); }
    @GetMapping("/simulation/history")        ResponseEntity<?> history()                                  { return Stub.notImplemented("GET /api/simulation/history"); }
    @PostMapping("/loans/eligibility")        ResponseEntity<?> loans(@RequestBody(required=false) Object b)       { return Stub.notImplemented("POST /api/loans/eligibility"); }
}

@RestController
@RequestMapping("/api/ai")
class AiProxyController {
    // BE가 /internal/ai/* 로 중계할 외부 표면. FE는 여기까지만 접근.
    @PostMapping("/parse-input")   ResponseEntity<?> parse(@RequestBody(required=false) Object b)    { return Stub.notImplemented("POST /api/ai/parse-input"); }
    @PostMapping("/strategy-card") ResponseEntity<?> strategy(@RequestBody(required=false) Object b) { return Stub.notImplemented("POST /api/ai/strategy-card"); }
}
