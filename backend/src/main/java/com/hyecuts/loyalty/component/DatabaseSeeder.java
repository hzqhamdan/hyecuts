package com.hyecuts.loyalty.component;

import com.hyecuts.loyalty.model.*;
import com.hyecuts.loyalty.repository.*;
import com.hyecuts.loyalty.service.LoyaltyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final RewardRepository rewardRepository;
    private final BadgeRepository badgeRepository;
    private final MissionRepository missionRepository;
    private final BarberServiceRepository serviceRepository;
    private final GlobalSettingsRepository globalSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoyaltyService loyaltyService;
    private final Environment environment;

    public DatabaseSeeder(UserRepository userRepository,
                          RewardRepository rewardRepository,
                          BadgeRepository badgeRepository,
                          MissionRepository missionRepository,
                          BarberServiceRepository serviceRepository,
                          GlobalSettingsRepository globalSettingsRepository,
                          PasswordEncoder passwordEncoder,
                          LoyaltyService loyaltyService,
                          Environment environment) {
        this.userRepository = userRepository;
        this.rewardRepository = rewardRepository;
        this.badgeRepository = badgeRepository;
        this.missionRepository = missionRepository;
        this.serviceRepository = serviceRepository;
        this.globalSettingsRepository = globalSettingsRepository;
        this.passwordEncoder = passwordEncoder;
        this.loyaltyService = loyaltyService;
        this.environment = environment;
    }

    @Override
    public void run(String... args) throws Exception {
        // Gated on the service catalog, not on users: the demo accounts below are
        // dev-only, so in every other environment userRepository.count() would stay
        // 0 forever and re-run this whole block (duplicating catalog data) on every restart.
        if (serviceRepository.count() == 0) {
            log.info("Seeding Database...");

            // 0. Global Settings
            globalSettingsRepository.saveAll(List.of(
                    new GlobalSettings("POINTS_PER_MYR", "1", "Points earned per 1 MYR spent"),
                    new GlobalSettings("SEASONAL_MULTIPLIER", "1.0", "Active seasonal points multiplier"),
                    new GlobalSettings("BIRTHDAY_BONUS_POINTS", "100", "Points awarded for birthday bonus (Connoisseur/Patron)"),
                    new GlobalSettings("INSIDER_BONUS_PERCENT", "10", "Bonus percentage applied to point earnings for Insider+ tiers")
            ));

            // 1. Demo accounts — dev profile only. A real deployment must not ship
            // with a well-known admin/password baked into every environment (the
            // previous behaviour let anyone log in as admin@hyecuts.com / admin123
            // on any deployment of this codebase).
            if (environment.acceptsProfiles(Profiles.of("dev")) && userRepository.count() == 0) {
                seedDemoUsers();
            } else {
                log.info("Skipping demo admin/member account seeding (not running under the 'dev' profile).");
            }

            // 2. Create Barber Services
            serviceRepository.saveAll(List.of(
                    createService("Adult Hair Cut", "Precision cut tailored to your style.", "25.00", 30),
                    createService("Cut & Shave", "Signature cut and traditional shave.", "30.00", 30),
                    createService("Keratin Treatment", "Premium hair treatment for smoothing and repair.", "200.00", 120),
                    createService("Teenager Hair Cut", "Stylish haircut for teens.", "20.00", 30),
                    createService("Senior Citizen Hair Cut", "Classic haircut for senior citizens.", "15.00", 30),
                    createService("Senior Cut & Shave", "Haircut and shave for senior citizens.", "20.00", 40),
                    createService("Kids Hair Cut", "Gentle and neat cuts for kids.", "15.00", 30),
                    createService("Beard Trim/Shape", "Quick trim and styling for your beard.", "10.00", 10),
                    createService("Shave/Clean", "Clean shave service.", "10.00", 10),
                    createService("Hair Colour", "Full hair coloring service.", "180.00", 180)
            ));

            // 3. Create Default Rewards
            Reward r1 = new Reward();
            r1.setTitle("Complimentary Hair Cut");
            r1.setDescription("Redeem points for a free Adult Hair Cut.");
            r1.setPointsCost(250);
            r1.setStockCount(100);
            
            Reward r2 = new Reward();
            r2.setTitle("The Executive Refresh");
            r2.setDescription("Redeem for a complimentary Cut & Shave session.");
            r2.setPointsCost(300);
            r2.setStockCount(50);

            Reward r3 = new Reward();
            r3.setTitle("Atelier Elite Session");
            r3.setDescription("A full luxury Keratin treatment session.");
            r3.setPointsCost(2000);
            r3.setStockCount(5);

            Reward r4 = new Reward();
            r4.setTitle("Quarterly Complimentary Service");
            r4.setDescription("Complimentary service (up to RM25) for Patron members — issued quarterly.");
            r4.setPointsCost(0);
            r4.setMinTier("PATRON");
            r4.setStockCount(null);

            rewardRepository.saveAll(List.of(r1, r2, r3, r4));

            // 4. Create Default Badges
            Badge b1 = new Badge();
            b1.setName("First Blood");
            b1.setDescription("Your first precision cut at Hyecuts.");
            b1.setCategory("MILESTONE");

            Badge b2 = new Badge();
            b2.setName("The Regular");
            b2.setDescription("5 visits within 3 months.");
            b2.setCategory("STREAK");
            
            Badge b3 = new Badge();
            b3.setName("Loyal Icon");
            b3.setDescription("Maintained active status for over a year.");
            b3.setCategory("MILESTONE");

            badgeRepository.saveAll(List.of(b1, b2, b3));

            // 5. Create Default Missions
            Mission m1 = new Mission();
            m1.setTitle("Weekly Grooming");
            m1.setDescription("Book any service this week.");
            m1.setType("WEEKLY");
            m1.setRewardPoints(20);
            m1.setTargetAction("BOOKING");
            m1.setRequiredCount(1);

            Mission m2 = new Mission();
            m2.setTitle("Style Master");
            m2.setDescription("Complete 3 'Cut & Shave' sessions.");
            m2.setType("QUEST");
            m2.setRewardPoints(100);
            m2.setTargetAction("BOOKING");
            m2.setRequiredCount(3);

            missionRepository.saveAll(List.of(m1, m2));

            log.info("Seeding Complete!");
        }
    }

    private void seedDemoUsers() {
        User admin = new User();
        admin.setEmail("admin@hyecuts.com");
        admin.setUsername("admin");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setRole("ROLE_ADMIN");
        admin.setFullName("Studio Curator");
        admin.setTier(Tier.PATRON);
        admin.setLifetimePoints(1500);
        admin.setCurrentPoints(1500);
        userRepository.save(admin);

        User user = new User();
        user.setEmail("user@hyecuts.com");
        user.setUsername("user");
        user.setPasswordHash(passwordEncoder.encode("password"));
        user.setRole("ROLE_USER");
        user.setFullName("Hyecuts Member");
        user = userRepository.save(user);

        // Initialize user with 750 points (Connoisseur tier)
        loyaltyService.addPoints(user.getId(), 750);
    }

    private BarberService createService(String name, String description, String price, int durationMinutes) {
        BarberService service = new BarberService();
        service.setName(name);
        service.setDescription(description);
        service.setPriceMyr(new BigDecimal(price));
        service.setDurationMinutes(durationMinutes);
        service.setBasePoints(0);
        return service;
    }
}
