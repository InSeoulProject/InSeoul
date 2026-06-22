package kr.inseoul.api.simulation;

import kr.inseoul.api.simulation.domain.Simulation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SimulationRepository extends JpaRepository<Simulation, Long> {
    List<Simulation> findByUserIdOrderByCreatedAtDesc(Long userId);
}
