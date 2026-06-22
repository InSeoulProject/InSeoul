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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.jwtProperties = jwtProperties;
    }

    public AuthResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("이미 사용 중인 이메일입니다.");
        }
        User user = new User(req.email(), passwordEncoder.encode(req.password()), req.nickname());
        userRepository.save(user);
        return issueTokenPair(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다."));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return issueTokenPair(user);
    }

    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    public AuthResponse refresh(RefreshRequest req) {
        String hash = sha256(req.refreshToken());
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new UnauthorizedException("유효하지 않은 리프레시 토큰입니다."));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new UnauthorizedException("리프레시 토큰이 만료되었습니다.");
        }
        refreshTokenRepository.delete(token);
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        return issueTokenPair(user);
    }

    private AuthResponse issueTokenPair(User user) {
        String accessToken = tokenProvider.createAccessToken(user.getId(), user.getEmail());
        String rawRefresh = tokenProvider.createRefreshToken();
        String hash = sha256(rawRefresh);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(jwtProperties.refreshExpiryDays());
        refreshTokenRepository.save(new RefreshToken(user.getId(), hash, expiresAt));
        return new AuthResponse(accessToken, rawRefresh,
                new AuthResponse.UserInfo(user.getId(), user.getEmail(), user.getNickname()));
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
