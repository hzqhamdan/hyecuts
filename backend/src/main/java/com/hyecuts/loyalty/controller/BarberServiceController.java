package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.service.BarberServiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class BarberServiceController {

    private final BarberServiceService barberServiceService;

    public BarberServiceController(BarberServiceService barberServiceService) {
        this.barberServiceService = barberServiceService;
    }

    // Public endpoint for users booking an appointment
    @GetMapping("/active")
    public ResponseEntity<List<BarberService>> getActiveServices() {
        return ResponseEntity.ok(barberServiceService.getActiveServices());
    }

    // Admin endpoint
    @GetMapping("/all")
    public ResponseEntity<List<BarberService>> getAllServices() {
        return ResponseEntity.ok(barberServiceService.getAllServices());
    }

    // Admin endpoint
    @PostMapping
    public ResponseEntity<BarberService> createService(@RequestBody BarberService service) {
        return ResponseEntity.ok(barberServiceService.saveService(service));
    }

    // Admin endpoint
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateService(@PathVariable Long id) {
        barberServiceService.deactivateService(id);
        return ResponseEntity.ok().build();
    }
}
