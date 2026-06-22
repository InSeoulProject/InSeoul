package kr.inseoul.api.user;

import kr.inseoul.api.common.exception.NotFoundException;
import kr.inseoul.api.user.domain.User;
import kr.inseoul.api.user.domain.UserProfile;
import kr.inseoul.api.user.dto.ProfileRequest;
import kr.inseoul.api.user.dto.ProfileResponse;
import kr.inseoul.api.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;

    public UserService(UserRepository userRepository, UserProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        return new UserResponse(user.getId(), user.getEmail(), user.getNickname());
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        return profileRepository.findByUserId(userId)
                .map(p -> new ProfileResponse(p.getCashAsset(), p.getJeonseDeposit(), p.getMonthlySaving(),
                        p.getAnnualIncome(), p.getFirstHomeBuyer(), p.getMaritalStatus()))
                .orElse(new ProfileResponse(null, null, null, null, null, null));
    }

    public ProfileResponse saveProfile(Long userId, ProfileRequest req) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElse(new UserProfile(userId));
        if (req.cashAsset() != null)       profile.setCashAsset(req.cashAsset());
        if (req.jeonseDeposit() != null)   profile.setJeonseDeposit(req.jeonseDeposit());
        if (req.monthlySaving() != null)   profile.setMonthlySaving(req.monthlySaving());
        if (req.annualIncome() != null)    profile.setAnnualIncome(req.annualIncome());
        if (req.firstHomeBuyer() != null)  profile.setFirstHomeBuyer(req.firstHomeBuyer());
        if (req.maritalStatus() != null)   profile.setMaritalStatus(req.maritalStatus());
        profileRepository.save(profile);
        return new ProfileResponse(profile.getCashAsset(), profile.getJeonseDeposit(), profile.getMonthlySaving(),
                profile.getAnnualIncome(), profile.getFirstHomeBuyer(), profile.getMaritalStatus());
    }
}
