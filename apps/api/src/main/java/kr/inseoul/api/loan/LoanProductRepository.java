package kr.inseoul.api.loan;

import kr.inseoul.api.loan.domain.LoanProduct;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanProductRepository extends JpaRepository<LoanProduct, Long> {}
