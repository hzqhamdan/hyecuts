package com.hyecuts.loyalty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LoyaltyApplication {

    public static void main(String[] args) {
        org.springframework.context.ConfigurableApplicationContext context = SpringApplication.run(LoyaltyApplication.class, args);
        String port = context.getEnvironment().getProperty("server.port");
        String address = context.getEnvironment().getProperty("server.address");
        System.out.println(">> HYECUTS Backend is running on " + address + ":" + port);
    }

}
