package com.hyecuts.loyalty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.hyecuts.loyalty.security.RateLimitProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(RateLimitProperties.class)
public class LoyaltyApplication {

    public static void main(String[] args) {
        SpringApplication.run(LoyaltyApplication.class, args);
    }

}
