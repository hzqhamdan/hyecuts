package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface VoucherRepository extends JpaRepository<Voucher, String> {
    List<Voucher> findByUser_Id(UUID userId);
}
