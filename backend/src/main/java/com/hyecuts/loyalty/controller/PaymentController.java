package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    private final BarberServiceService barberServiceService;

    public PaymentController(BarberServiceService barberServiceService) {
        this.barberServiceService = barberServiceService;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    public static class PaymentRequest {
        public Long serviceId;
        public String userId;
    }

    @PostMapping("/create-intent")
    public ResponseEntity<Map<String, String>> createPaymentIntent(@RequestBody PaymentRequest request) {
        try {
            BarberService service = barberServiceService.getServiceById(request.serviceId)
                    .orElseThrow(() -> new RuntimeException("Service not found"));

            // 50% deposit
            BigDecimal deposit = service.getPriceMyr().multiply(new BigDecimal("0.5"));
            
            // Stripe expects amount in smallest unit (cents/sen)
            long amountInSen = deposit.multiply(new BigDecimal("100")).longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInSen)
                    .setCurrency("myr")
                    .putMetadata("serviceId", String.valueOf(request.serviceId))
                    .putMetadata("userId", request.userId)
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            Map<String, String> response = new HashMap<>();
            response.put("clientSecret", intent.getClientSecret());

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }
}