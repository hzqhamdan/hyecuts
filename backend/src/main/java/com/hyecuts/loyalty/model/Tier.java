package com.hyecuts.loyalty.model;

public enum Tier {
    MEMBER(0),
    INSIDER(100),
    ARTISAN(350),
    CONNOISSEUR(750),
    PATRON(1500);

    private final int minPoints;

    Tier(int minPoints) {
        this.minPoints = minPoints;
    }

    public int getMinPoints() {
        return minPoints;
    }

    public static Tier forLifetimePoints(int pts) {
        Tier result = MEMBER;
        for (Tier t : values()) {
            if (pts >= t.minPoints) {
                result = t;
            }
        }
        return result;
    }
}
