package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.GlobalSettings;
import com.hyecuts.loyalty.service.GlobalSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
public class GlobalSettingsController {

    private final GlobalSettingsService globalSettingsService;

    public GlobalSettingsController(GlobalSettingsService globalSettingsService) {
        this.globalSettingsService = globalSettingsService;
    }

    // Fetch dynamic MYR to Points ratio or other global setting
    @GetMapping("/{key}")
    public ResponseEntity<String> getSetting(@PathVariable String key) {
        // e.g. "POINTS_PER_MYR"
        String value = globalSettingsService.getSettingValue(key, null);
        if (value == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(value);
    }

    @PostMapping
    public ResponseEntity<GlobalSettings> updateSetting(
            @RequestParam String key,
            @RequestParam String value,
            @RequestParam(required = false, defaultValue = "") String description) {
        
        GlobalSettings updated = globalSettingsService.saveSetting(key, value, description);
        return ResponseEntity.ok(updated);
    }
}
