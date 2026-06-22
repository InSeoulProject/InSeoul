package kr.inseoul.api.simulation;

import kr.inseoul.api.simulation.domain.StressTestResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StressTestResultRepository extends JpaRepository<StressTestResult, Long> {
    List<StressTestResult> findBySimulationId(Long simulationId);
}
