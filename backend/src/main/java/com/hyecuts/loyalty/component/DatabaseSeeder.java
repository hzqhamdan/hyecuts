package com.hyecuts.loyalty.component;

import com.hyecuts.loyalty.model.*;
import com.hyecuts.loyalty.repository.*;
import com.hyecuts.loyalty.service.LoyaltyService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RewardRepository rewardRepository;
    private final BadgeRepository badgeRepository;
    private final MissionRepository missionRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoyaltyService loyaltyService;

    public DatabaseSeeder(UserRepository userRepository, 
                          RewardRepository rewardRepository, 
                          BadgeRepository badgeRepository, 
                          MissionRepository missionRepository, 
                          PasswordEncoder passwordEncoder,
                          LoyaltyService loyaltyService) {
        this.userRepository = userRepository;
        this.rewardRepository = rewardRepository;
        this.badgeRepository = badgeRepository;
        this.missionRepository = missionRepository;
        this.passwordEncoder = passwordEncoder;
        this.loyaltyService = loyaltyService;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("Seeding Database...");

            // 1. Create Default Users
            User admin = new User("admin", passwordEncoder.encode("admin123"), "ROLE_ADMIN");
            User user = new User("user", passwordEncoder.encode("password"), "ROLE_USER");
            
            userRepository.save(admin);
            user = userRepository.save(user);

            // Initialize user loyalty profile with 2600 points (Legend Tier)
            loyaltyService.getOrCreateProfile(user.getId());
            loyaltyService.addPoints(user.getId(), 2600);

            // 2. Create Default Rewards
            Reward r1 = new Reward();
            r1.setTitle("The Signature Cut");
            r1.setDescription("Redeem for our signature architectural cut service.");
            r1.setType("SERVICE");
            r1.setPointsCost(2000);
            r1.setMinimumTierRequired("Rookie");
            r1.setStockAvailable(100);
            
            Reward r2 = new Reward();
            r2.setTitle("Executive Shave");
            r2.setDescription("A traditional hot towel ritual with straight razor precision.");
            r2.setType("SERVICE");
            r2.setPointsCost(1500);
            r2.setMinimumTierRequired("Regular");
            r2.setStockAvailable(50);

            Reward r3 = new Reward();
            r3.setTitle("Private Studio Booking");
            r3.setDescription("Rent out the entire studio for you and your groomsmen.");
            r3.setType("EXPERIENCE");
            r3.setPointsCost(15000);
            r3.setMinimumTierRequired("Master");
            r3.setStockAvailable(5);

            rewardRepository.saveAll(List.of(r1, r2, r3));

            // 3. Create Default Badges
            Badge b1 = new Badge();
            b1.setName("Initiate");
            b1.setDescription("Completed first visit.");
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

            // 4. Create Default Missions
            Mission m1 = new Mission();
            m1.setTitle("Weekly Grooming");
            m1.setDescription("Book a service this week.");
            m1.setType("WEEKLY");
            m1.setRewardPoints(200);
            m1.setTargetAction("BOOKING");
            m1.setRequiredCount(1);

            Mission m2 = new Mission();
            m2.setTitle("Product Explorer");
            m2.setDescription("Purchase 2 retail products.");
            m2.setType("QUEST");
            m2.setRewardPoints(500);
            m2.setTargetAction("PURCHASE");
            m2.setRequiredCount(2);

            missionRepository.saveAll(List.of(m1, m2));

            System.out.println("Seeding Complete!");
        }
    }
}
