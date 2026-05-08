package com.hyecuts.loyalty.component;

import com.hyecuts.loyalty.model.*;
import com.hyecuts.loyalty.repository.*;
import com.hyecuts.loyalty.service.LoyaltyService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RewardRepository rewardRepository;
    private final BadgeRepository badgeRepository;
    private final MissionRepository missionRepository;
    private final BarberServiceRepository serviceRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoyaltyService loyaltyService;

    public DatabaseSeeder(UserRepository userRepository, 
                          RewardRepository rewardRepository, 
                          BadgeRepository badgeRepository, 
                          MissionRepository missionRepository,
                          BarberServiceRepository serviceRepository,
                          PasswordEncoder passwordEncoder,
                          LoyaltyService loyaltyService) {
        this.userRepository = userRepository;
        this.rewardRepository = rewardRepository;
        this.badgeRepository = badgeRepository;
        this.missionRepository = missionRepository;
        this.serviceRepository = serviceRepository;
        this.passwordEncoder = passwordEncoder;
        this.loyaltyService = loyaltyService;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("Seeding Database...");

            // 1. Create Default Users
            User admin = new User();
            admin.setEmail("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole("ROLE_ADMIN");
            admin.setFullName("Studio Curator");
            userRepository.save(admin);

            User user = new User();
            user.setEmail("user");
            user.setPasswordHash(passwordEncoder.encode("password"));
            user.setRole("ROLE_USER");
            user.setFullName("Hyecuts Member");
            user = userRepository.save(user);

            // Initialize user loyalty profile with 2600 points (Legend Tier)
            loyaltyService.addPoints(user.getId(), 2600);

            // 2. Create Barber Services
            serviceRepository.saveAll(List.of(
                    createService("Adult Hair Cut", "Precision cut tailored to your style.", "25.00", 30, 250),
                    createService("Cut & Shave", "Signature cut and traditional shave.", "30.00", 30, 300),
                    createService("Keratin Treatment", "Premium hair treatment for smoothing and repair.", "200.00", 120, 2000),
                    createService("Teenager Hair Cut", "Stylish haircut for teens.", "20.00", 30, 200),
                    createService("Senior Citizen Hair Cut", "Classic haircut for senior citizens.", "15.00", 30, 150),
                    createService("Senior Cut & Shave", "Haircut and shave for senior citizens.", "20.00", 40, 200),
                    createService("Kids Hair Cut", "Gentle and neat cuts for kids.", "15.00", 30, 150),
                    createService("Beard Trim/Shape", "Quick trim and styling for your beard.", "10.00", 10, 100),
                    createService("Shave/Clean", "Clean shave service.", "10.00", 10, 100),
                    createService("Hair Colour", "Full hair coloring service.", "180.00", 180, 1800)
            ));

            // 3. Create Default Rewards
            Reward r1 = new Reward();
            r1.setTitle("Complimentary Hair Cut");
            r1.setDescription("Redeem points for a free Adult Hair Cut.");
            r1.setPointsCost(2500);
            r1.setStockCount(100);
            
            Reward r2 = new Reward();
            r2.setTitle("The Executive Refresh");
            r2.setDescription("Redeem for a complimentary Cut & Shave session.");
            r2.setPointsCost(3000);
            r2.setStockCount(50);

            Reward r3 = new Reward();
            r3.setTitle("Atelier Elite Session");
            r3.setDescription("A full luxury Keratin treatment session.");
            r3.setPointsCost(20000);
            r3.setStockCount(5);

            rewardRepository.saveAll(List.of(r1, r2, r3));

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
            m1.setRewardPoints(200);
            m1.setTargetAction("BOOKING");
            m1.setRequiredCount(1);

            Mission m2 = new Mission();
            m2.setTitle("Style Master");
            m2.setDescription("Complete 3 'Cut & Shave' sessions.");
            m2.setType("QUEST");
            m2.setRewardPoints(1000);
            m2.setTargetAction("BOOKING");
            m2.setRequiredCount(3);

            missionRepository.saveAll(List.of(m1, m2));

            System.out.println("Seeding Complete!");
        }
    }

    private BarberService createService(String name, String description, String price, int durationMinutes, int basePoints) {
        BarberService service = new BarberService();
        service.setName(name);
        service.setDescription(description);
        service.setPriceMyr(new BigDecimal(price));
        service.setDurationMinutes(durationMinutes);
        service.setBasePoints(basePoints);
        return service;
    }
}
