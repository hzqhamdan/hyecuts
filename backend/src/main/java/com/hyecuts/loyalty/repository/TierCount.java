package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Tier;

/** Number of users in one tier, aggregated in SQL (ADM-010). */
public record TierCount(Tier tier, Long users) {}
