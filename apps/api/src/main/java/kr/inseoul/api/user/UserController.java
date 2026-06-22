package kr.inseoul.api.user;

import kr.inseoul.api.common.ApiResponse;
import kr.inseoul.api.security.UserPrincipal;
import kr.inseoul.api.user.dto.ProfileRequest;
import kr.inseoul.api.user.dto.ProfileResponse;
import kr.inseoul.api.user.dto.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getMe(principal.getUserId())));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(principal.getUserId())));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> putProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ProfileRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(userService.saveProfile(principal.getUserId(), req)));
    }
}
