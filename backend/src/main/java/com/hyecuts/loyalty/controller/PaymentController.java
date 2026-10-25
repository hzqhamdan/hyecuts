package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.exception.InvalidRequestException;
import com.hyecuts.loyalty.exception.ResourceNotFoundException;
import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    // 50% of the price, expressed in sen: price x 0.5 x 100.
    private static final BigDecimal DEPOSIT_SEN_PER_MYR = new BigDecimal("50");

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
    public ResponseEntity<Map<String, String>> createPaymentIntent(@RequestBody PaymentRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        if (request.serviceId == null) {
            throw new InvalidRequestException("serviceId is required.");
        }
        BarberService service = barberServiceService.getServiceById(request.serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        // PAY-002: a deactivated service used to get a deposit intent anyway;
        // only the booking created afterwards rejected it.
        if (!Boolean.TRUE.equals(service.getIsActive())) {
            throw new InvalidRequestException("This service is no longer offered.");
        }

        long amountInSen = depositInSen(service.getPriceMyr());

        // Use the authenticated caller's id, not whatever the client sent
        // (previously the frontend sent the literal string "guest").
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInSen)
                .setCurrency("myr")
                .putMetadata("serviceId", String.valueOf(request.serviceId))
                .putMetadata("userId", principal.getId().toString())
                .build();

        PaymentIntent intent;
        try {
            intent = PaymentIntent.create(params);
        } catch (StripeException e) {
            // PAY-003: Stripe's message (request ids, account details) used to be
            // returned to the browser. Log it; tell the client only what it can act on.
            log.error("Stripe PaymentIntent creation failed for service {}", request.serviceId, e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "The payment provider is unavailable. Please try again.");
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
        }

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());
        // The amount actually charged, so the UI shows it instead of working it
        // out from its own (string) copy of the price list.
        response.put("depositAmount", BigDecimal.valueOf(amountInSen, 2).toPlainString());
        return ResponseEntity.ok(response);
    }

    /**
     * 50% deposit in sen, rounded half-up to the nearest sen. PAY-001: this used
     * to truncate, so RM 25.55 charged 1277 sen instead of 1278.
     */
    static long depositInSen(BigDecimal priceMyr) {
        return priceMyr.multiply(DEPOSIT_SEN_PER_MYR).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}