package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.GlobalSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GlobalSettingsRepository extends JpaRepository<GlobalSettings, String> {
}
