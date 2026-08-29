package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface VoucherRepository extends JpaRepository<Voucher, String> {
    List<Voucher> findByUser_Id(UUID userId);

    @EntityGraph(attributePaths = {"user", "reward"})
    Page<Voucher> findAllByOrderByIssuedAtDesc(Pageable pageable);

    // SCH-005: a single bulk UPDATE instead of loading every voucher row
    // into memory to filter+resave. Returns rows updated.
    @Modifying
    @Query("UPDATE Voucher v SET v.status = 'EXPIRED' WHERE v.status = 'ACTIVE' AND v.expiresAt < :now")
    int expireStaleVouchers(@Param("now") LocalDateTime now);

    // RW-008/009: only flips an ACTIVE, non-expired voucher to REDEEMED —
    // the WHERE clause makes "is this still fulfillable" and "fulfill it"
    // one atomic conditional UPDATE, so a stale read can't double-fulfil a
    // voucher and an already-redeemed/expired voucher can't be re-fulfilled.
    // Returns rows updated (0 = already redeemed or expired).
    //
    // clearAutomatically (RW-024): a bulk UPDATE writes straight to the DB and
    // never touches the persistence context, so the caller's already-loaded
    // Voucher stays ACTIVE in the first-level cache and any read-back in the
    // same transaction returns that stale copy. Clearing after the write forces
    // the re-read to hit the DB. expireStaleVouchers above needs no equivalent:
    // its only caller uses the row count and never reads the rows back.
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Voucher v SET v.status = 'REDEEMED', v.redeemedAt = :now WHERE v.id = :id AND v.status = 'ACTIVE' AND (v.expiresAt IS NULL OR v.expiresAt >= :now)")
    int fulfillIfActive(@Param("id") String id, @Param("now") LocalDateTime now);
}
