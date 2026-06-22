package kr.inseoul.api.district;

import kr.inseoul.api.common.ApiResponse;
import kr.inseoul.api.district.dto.DistrictPriceResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class DistrictController {

    private final DistrictService districtService;

    public DistrictController(DistrictService districtService) {
        this.districtService = districtService;
    }

    @GetMapping("/api/districts/prices")
    public ResponseEntity<ApiResponse<List<DistrictPriceResponse>>> getPrices() {
        return ResponseEntity.ok(ApiResponse.ok(districtService.getAllPrices()));
    }
}
