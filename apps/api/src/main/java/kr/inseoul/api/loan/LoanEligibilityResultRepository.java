package kr.inseoul.api.loan;

import kr.inseoul.api.loan.domain.LoanEligibilityResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanEligibilityResultRepository extends JpaRepository<LoanEligibilityResult, Long> {}
