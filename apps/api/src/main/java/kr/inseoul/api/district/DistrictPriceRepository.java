package kr.inseoul.api.district;

import kr.inseoul.api.district.domain.DistrictPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DistrictPriceRepository extends JpaRepository<DistrictPrice, Long> {
    List<DistrictPrice> findAllByOrderByDistrictNameAsc();
}
