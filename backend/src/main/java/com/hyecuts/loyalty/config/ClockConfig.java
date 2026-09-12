package com.hyecuts.loyalty.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class ClockConfig {

    /** Injected rather than calling Instant.now() directly, so time-dependent
     *  behaviour can be tested without sleeping. */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
