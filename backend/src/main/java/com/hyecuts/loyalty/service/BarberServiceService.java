package com.hyecuts.loyalty.service;

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

    public BarberService saveService(BarberService service) {
        return repository.save(service);
    }

    public void deactivateService(Long id) {
        repository.findById(id).ifPresent(service -> {
            service.setIsActive(false);
            repository.save(service);
        });
    }
}
