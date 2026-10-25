package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.exception.InvalidRequestException;
import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.repository.BarberServiceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BarberServiceService {

    private final BarberServiceRepository repository;

    public BarberServiceService(BarberServiceRepository repository) {
        this.repository = repository;
    }

    public List<BarberService> getAllServices() {
        return repository.findAll();
    }

    public List<BarberService> getActiveServices() {
        return repository.findByIsActiveTrue();
    }

    public Optional<BarberService> getServiceById(Long id) {
        return repository.findById(id);
    }

    // SVC-001: this used to save the request body as-is — a negative price, a
    // zero-minute duration or a missing name went straight in, a duplicate name
    // only failed at the DB unique constraint (as a generic 500), and a body
    // carrying an existing service's id overwrote that service.
    public BarberService saveService(BarberService service) {
        if (service.getName() == null || service.getName().isBlank()) {
            throw new InvalidRequestException("Service name is required.");
        }
        if (service.getPriceMyr() == null || service.getPriceMyr().signum() < 0) {
            throw new InvalidRequestException("Price must be zero or more.");
        }
        if (service.getPriceMyr().stripTrailingZeros().scale() > 2) {
            throw new InvalidRequestException("Price can have at most two decimal places.");
        }
        if (service.getDurationMinutes() == null || service.getDurationMinutes() <= 0) {
            throw new InvalidRequestException("Duration must be at least one minute.");
        }
        if (service.getBasePoints() == null || service.getBasePoints() < 0) {
            throw new InvalidRequestException("Base points must be zero or more.");
        }
        String name = service.getName().trim();
        if (repository.existsByNameIgnoreCase(name)) {
            throw new InvalidRequestException("A service named \"" + name + "\" already exists.");
        }
        service.setId(null);
        service.setName(name);
        if (service.getIsActive() == null) {
            service.setIsActive(true);
        }
        return repository.save(service);
    }

    public void deactivateService(Long id) {
        repository.findById(id).ifPresent(service -> {
            service.setIsActive(false);
            repository.save(service);
        });
    }
}
