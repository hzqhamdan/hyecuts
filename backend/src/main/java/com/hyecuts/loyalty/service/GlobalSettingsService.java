package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.GlobalSettings;
import com.hyecuts.loyalty.repository.GlobalSettingsRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class GlobalSettingsService {

    private final GlobalSettingsRepository repository;

    public GlobalSettingsService(GlobalSettingsRepository repository) {
        this.repository = repository;
    }

    public String getSettingValue(String key, String defaultValue) {
        Optional<GlobalSettings> setting = repository.findById(key);
        return setting.map(GlobalSettings::getValue).orElse(defaultValue);
    }

    public int getPointsPerMyr() {
        try {
            return Integer.parseInt(getSettingValue("POINTS_PER_MYR", "10"));
        } catch (NumberFormatException e) {
            return 10;
        }
    }

    public GlobalSettings saveSetting(String key, String value, String description) {
        GlobalSettings setting = repository.findById(key).orElse(new GlobalSettings(key, value, description));
        setting.setValue(value);
        setting.setDescription(description);
        return repository.save(setting);
    }
}
