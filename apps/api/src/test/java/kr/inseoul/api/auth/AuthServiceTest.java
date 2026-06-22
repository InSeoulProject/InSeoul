package kr.inseoul.api.auth;

import kr.inseoul.api.auth.domain.RefreshToken;
import kr.inseoul.api.auth.dto.AuthResponse;
import kr.inseoul.api.auth.dto.LoginRequest;
import kr.inseoul.api.auth.dto.RefreshRequest;
import kr.inseoul.api.auth.dto.SignupRequest;
import kr.inseoul.api.common.exception.ConflictException;
import kr.inseoul.api.common.exception.UnauthorizedException;
import kr.inseoul.api.config.JwtProperties;
import kr.inseoul.api.security.JwtTokenProvider;
import kr.inseoul.api.user.UserRepository;
import kr.inseoul.api.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider tokenProvider;

    // JwtProperties는 record — 직접 인스턴스 생성
    private final JwtProperties jwtProperties = new JwtProperties(
            "test-secret", 1800, 7
    );

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository, refreshTokenRepository,
                passwordEncoder, tokenProvider, jwtProperties
        );
    }

    @Test
    void signup_성공() {
        given(userRepository.existsByEmail("new@test.com")).willReturn(false);
        given(passwordEncoder.encode("password123")).willReturn("hashed");
        given(tokenProvider.createAccessToken(any(), any())).willReturn("access-token");
        given(tokenProvider.createRefreshToken()).willReturn("refresh-token");

        User saved = new User("new@test.com", "hashed", "테스터");
        given(userRepository.save(any(User.class))).willReturn(saved);
        given(refreshTokenRepository.save(any())).willReturn(null);

        AuthResponse result = authService.signup(new SignupRequest("new@test.com", "password123", "테스터"));

        assertThat(result.accessToken()).isEqualTo("access-token");
        assertThat(result.refreshToken()).isEqualTo("refresh-token");
    }

    @Test
    void signup_이메일중복_ConflictException() {
        given(userRepository.existsByEmail("dup@test.com")).willReturn(true);

        assertThatThrownBy(() -> authService.signup(new SignupRequest("dup@test.com", "pw", "닉네임")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void login_성공() {
        User user = new User("user@test.com", "hashed", "유저");
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("password", "hashed")).willReturn(true);
        given(tokenProvider.createAccessToken(any(), any())).willReturn("access-token");
        given(tokenProvider.createRefreshToken()).willReturn("refresh-token");
        given(refreshTokenRepository.save(any())).willReturn(null);

        AuthResponse result = authService.login(new LoginRequest("user@test.com", "password"));

        assertThat(result.accessToken()).isEqualTo("access-token");
    }

    @Test
    void login_이메일없음_UnauthorizedException() {
        given(userRepository.findByEmail("none@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("none@test.com", "pw")))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void login_비밀번호틀림_UnauthorizedException() {
        User user = new User("user@test.com", "hashed", "유저");
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrong", "hashed")).willReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@test.com", "wrong")))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void refresh_만료된토큰_UnauthorizedException() {
        // SHA-256("expired-token") 직접 계산 대신 findByTokenHash가 만료된 토큰 반환
        RefreshToken expired = new RefreshToken(1L, "some-hash", LocalDateTime.now().minusDays(1));
        given(refreshTokenRepository.findByTokenHash(anyString())).willReturn(Optional.of(expired));

        assertThatThrownBy(() -> authService.refresh(new RefreshRequest("expired-token")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("만료");
    }

    @Test
    void logout_refreshToken삭제() {
        authService.logout(42L);
        verify(refreshTokenRepository).deleteByUserId(42L);
    }
}
