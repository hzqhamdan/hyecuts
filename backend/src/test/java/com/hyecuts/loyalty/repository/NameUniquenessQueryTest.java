package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Badge;
import com.hyecuts.loyalty.model.BarberService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The duplicate-name checks behind service and badge creation (SVC-001,
 * GAM-001), executed against a real schema rather than trusted from their
 * derived-query method names.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
class NameUniquenessQueryTest {

    @Autowired private TestEntityManager entityManager;
    @Autowired private BarberServiceRepository barberServiceRepository;
    @Autowired private BadgeRepository badgeRepository;

    @Test
    void serviceNameCheckIgnoresCase() {
        BarberService cut = new BarberService();
        cut.setName("Adult Hair Cut");
        cut.setPriceMyr(new BigDecimal("25.00"));
        cut.setBasePoints(25);
        cut.setDurationMinutes(30);
        entityManager.persistAndFlush(cut);

        assertTrue(barberServiceRepository.existsByNameIgnoreCase("adult hair cut"));
        assertTrue(barberServiceRepository.existsByNameIgnoreCase("ADULT HAIR CUT"));
        assertFalse(barberServiceRepository.existsByNameIgnoreCase("Adult Hair Colour"));
    }

    @Test
    void badgeNameCheckIgnoresCase() {
        Badge badge = new Badge();
        badge.setName("First Cut");
        entityManager.persistAndFlush(badge);

        assertTrue(badgeRepository.existsByNameIgnoreCase("first cut"));
        assertFalse(badgeRepository.existsByNameIgnoreCase("First Cuts"));
    }
}
