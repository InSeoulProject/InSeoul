package kr.inseoul.api.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserInfo user
) {
    public record UserInfo(Long id, String email, String nickname) {}
}
