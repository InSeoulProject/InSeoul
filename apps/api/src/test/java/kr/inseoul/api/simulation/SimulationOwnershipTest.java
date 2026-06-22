package kr.inseoul.api.simulation;

import kr.inseoul.api.calculation.GoldenCrossCalculator;
import kr.inseoul.api.common.exception.ForbiddenException;
import kr.inseoul.api.common.exception.NotFoundException;
import kr.inseoul.api.district.DistrictRepository;
import kr.inseoul.api.simulation.domain.Simulation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class SimulationOwnershipTest {

    @Mock SimulationRepository simulationRepository;
    @Mock GoldenCrossCalculator calculator;
    @Mock DistrictRepository districtRepository;

    private SimulationService simulationService;

    @BeforeEach
    void setUp() {
        simulationService = new SimulationService(simulationRepository, calculator, districtRepository);
    }

    private Simulation makeSimulation(Long id, Long userId) {
        Simulation sim = new Simulation(
                userId, null,
                BigDecimal.valueOf(50_000_000), BigDecimal.ZERO,
                BigDecimal.valueOf(1_500_000), BigDecimal.ZERO,
                BigDecimal.valueOf(900_000_000), BigDecimal.valueOf(0.7),
                BigDecimal.valueOf(0.04), BigDecimal.valueOf(0.03),
                36, BigDecimal.valueOf(285_000_000)
        );
        ReflectionTestUtils.setField(sim, "id", id);
        return sim;
    }

    @Test
    void getSimulationForUser_소유자일치_정상반환() {
        Simulation sim = makeSimulation(1L, 100L);
        given(simulationRepository.findById(1L)).willReturn(Optional.of(sim));

        Simulation result = simulationService.getSimulationForUser(1L, 100L);
        org.assertj.core.api.Assertions.assertThat(result.getUserId()).isEqualTo(100L);
    }

    @Test
    void getSimulationForUser_소유자불일치_ForbiddenException() {
        Simulation sim = makeSimulation(1L, 100L);
        given(simulationRepository.findById(1L)).willReturn(Optional.of(sim));

        assertThatThrownBy(() -> simulationService.getSimulationForUser(1L, 999L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getSimulationForUser_없는ID_NotFoundException() {
        given(simulationRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> simulationService.getSimulationForUser(99L, 1L))
                .isInstanceOf(NotFoundException.class);
    }
}
