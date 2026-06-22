package kr.inseoul.api.district;

import kr.inseoul.api.district.dto.DistrictPriceResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class DistrictService {

    private final DistrictPriceRepository priceRepository;

    public DistrictService(DistrictPriceRepository priceRepository) {
        this.priceRepository = priceRepository;
    }

    public List<DistrictPriceResponse> getAllPrices() {
        return priceRepository.findAllByOrderByDistrictNameAsc().stream()
                .map(p -> new DistrictPriceResponse(
                        p.getDistrict().getName(),
                        p.getAveragePrice(),
                        p.getJeonsePrice(),
                        p.getBaseDate().toString()
                ))
                .toList();
    }
}
