package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.service.BarberServiceService;
import com.stripe.exception.ApiConnectionException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Deposit PaymentIntent creation. Stripe's static PaymentIntent.create is
 * mocked, so no request ever leaves the test.
 */
@WebMvcTest(controllers = PaymentController.class,
        properties = "stripe.secret.key=sk_test_unit",
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class PaymentControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private BarberServiceService barberServiceService;

    private MockedStatic<PaymentIntent> stripe;
    private final UUID callerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        stripe = mockStatic(PaymentIntent.class);

        User user = new User();
        user.setId(callerId);
        user.setEmail("member@example.com");
        user.setRole("ROLE_USER");
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        stripe.close();
        SecurityContextHolder.clearContext();
    }

    private void serviceCosts(long id, String priceMyr) {
        BarberService service = new BarberService();
        service.setId(id);
        service.setName("Service " + id);
        service.setPriceMyr(new BigDecimal(priceMyr));
        service.setIsActive(true);
        when(barberServiceService.getServiceById(id)).thenReturn(Optional.of(service));
    }

    private void stripeReturnsSecret(String secret) {
        PaymentIntent intent = mock(PaymentIntent.class);
        when(intent.getClientSecret()).thenReturn(secret);
        stripe.when(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class))).thenReturn(intent);
    }

    private PaymentIntentCreateParams paramsSentToStripe() {
        ArgumentCaptor<PaymentIntentCreateParams> captor = ArgumentCaptor.forClass(PaymentIntentCreateParams.class);
        stripe.verify(() -> PaymentIntent.create(captor.capture()));
        return captor.getValue();
    }

    private static String body(Object serviceId, String userId) {
        return "{\"serviceId\":" + serviceId + ",\"userId\":\"" + userId + "\"}";
    }

    @Test
    void chargesAFiftyPercentDepositInSen() throws Exception {
        serviceCosts(1, "25.00");
        stripeReturnsSecret("pi_123_secret_abc");

        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(1, callerId.toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientSecret").value("pi_123_secret_abc"))
                .andExpect(jsonPath("$.depositAmount").value("12.50"));

        PaymentIntentCreateParams params = paramsSentToStripe();
        assertEquals(1250L, params.getAmount()); // RM 12.50
        assertEquals("myr", params.getCurrency());
    }

    @Test
    void handlesASenPriceThatHalvesExactly() throws Exception {
        serviceCosts(2, "30.50");
        stripeReturnsSecret("pi_secret");

        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(2, callerId.toString())))
                .andExpect(status().isOk());

        assertEquals(1525L, paramsSentToStripe().getAmount()); // RM 15.25
    }

    @Test
    void tagsTheIntentWithTheServiceAndTheAuthenticatedCaller() throws Exception {
        serviceCosts(1, "25.00");
        stripeReturnsSecret("pi_secret");

        // The client-supplied userId is ignored; the frontend used to send "guest".
        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(1, "guest")))
                .andExpect(status().isOk());

        PaymentIntentCreateParams params = paramsSentToStripe();
        assertEquals("1", params.getMetadata().get("serviceId"));
        assertEquals(callerId.toString(), params.getMetadata().get("userId"));
    }

    @Test
    void unknownServiceIs404AndNeverReachesStripe() throws Exception {
        when(barberServiceService.getServiceById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(99, callerId.toString())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Service not found"));

        stripe.verify(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class)), never());
    }

    @Test
    void stripeFailureIs502WithAGenericMessageAndNoClientSecret() throws Exception {
        serviceCosts(1, "25.00");
        stripe.when(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class)))
                .thenThrow(new ApiConnectionException("Request req_8f2k3 to api.stripe.com failed for acct_1Abc"));

        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(1, callerId.toString())))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.clientSecret").doesNotExist())
                .andExpect(jsonPath("$.error").value("The payment provider is unavailable. Please try again."))
                .andExpect(content().string(not(containsString("acct_1Abc"))));
    }

    @Test
    void roundsAFractionalDepositHalfUpToTheNearestSen() throws Exception {
        // PAY-001: RM 25.55 / 2 = RM 12.775, which used to truncate to 1277 sen.
        serviceCosts(3, "25.55");
        stripeReturnsSecret("pi_secret");

        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(3, callerId.toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.depositAmount").value("12.78"));

        assertEquals(1278L, paramsSentToStripe().getAmount());
    }

    @Test
    void deactivatedServiceIs400AndNeverReachesStripe() throws Exception {
        // PAY-002: this used to create a deposit intent anyway.
        BarberService retired = new BarberService();
        retired.setId(4L);
        retired.setName("Retired");
        retired.setPriceMyr(new BigDecimal("20.00"));
        retired.setIsActive(false);
        when(barberServiceService.getServiceById(4L)).thenReturn(Optional.of(retired));

        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(4, callerId.toString())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This service is no longer offered."));

        stripe.verify(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class)), never());
    }

    @Test
    void missingServiceIdIs400() throws Exception {
        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("serviceId is required."));

        verify(barberServiceService, never()).getServiceById(any());
    }

    @Test
    void unexpectedFailureIsAGeneric500WithoutTheRawMessage() throws Exception {
        // PAY-003: this used to come back as a 400 carrying the message verbatim.
        when(barberServiceService.getServiceById(5L))
                .thenThrow(new IllegalStateException("JDBC connection to db.internal:5432 refused"));

        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(5, callerId.toString())))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(not(containsString("db.internal"))));
    }

    @org.junit.jupiter.params.ParameterizedTest(name = "RM {0} -> {1} sen")
    @org.junit.jupiter.params.provider.CsvSource({
            "25.00, 1250", "15.00, 750", "30.50, 1525", "25.55, 1278", "25.53, 1277", "0.01, 1", "120.99, 6050"
    })
    void depositInSen_isHalfThePriceRoundedHalfUp(String priceMyr, long expectedSen) {
        assertEquals(expectedSen, PaymentController.depositInSen(new BigDecimal(priceMyr)));
    }

    @Test
    void eachRequestCreatesExactlyOneIntent() throws Exception {
        serviceCosts(1, "25.00");
        stripeReturnsSecret("pi_secret");

        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON).content(body(1, callerId.toString())))
                .andExpect(status().isOk());

        stripe.verify(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class)));
        stripe.verifyNoMoreInteractions();
    }
}
