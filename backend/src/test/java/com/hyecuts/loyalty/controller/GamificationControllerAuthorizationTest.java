package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.security.CustomUserDetails;
import com.hyecuts.loyalty.service.GamificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A member's badges, mission progress and activity log are theirs alone: the
 * per-user endpoints must refuse another member's id (the activity-log leak
 * the QA plan called out) while still serving the caller and admins.
 */
@WebMvcTest(controllers = GamificationController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.hyecuts\\.loyalty\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
class GamificationControllerAuthorizationTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private GamificationService gamificationService;

    private final UUID callerId = UUID.randomUUID();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void signIn(String role) {
        User user = new User();
        user.setId(callerId);
        user.setEmail("caller@example.com");
        user.setRole(role);
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/gamification/activity/{id}", "/api/gamification/badges/{id}", "/api/gamification/missions/{id}"})
    void memberCannotReadAnotherMembersData(String path) throws Exception {
        signIn("ROLE_USER");

        mockMvc.perform(get(path, UUID.randomUUID())).andExpect(status().isForbidden());
        verifyNoInteractions(gamificationService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/gamification/activity/{id}", "/api/gamification/badges/{id}", "/api/gamification/missions/{id}"})
    void memberCanReadTheirOwnData(String path) throws Exception {
        signIn("ROLE_USER");
        when(gamificationService.getUserActivity(callerId)).thenReturn(List.of());
        when(gamificationService.getUserBadges(callerId)).thenReturn(List.of());
        when(gamificationService.getUserMissions(callerId)).thenReturn(List.of());

        mockMvc.perform(get(path, callerId)).andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/gamification/activity/{id}", "/api/gamification/badges/{id}", "/api/gamification/missions/{id}"})
    void adminCanReadAnyMembersData(String path) throws Exception {
        signIn("ROLE_ADMIN");
        when(gamificationService.getUserActivity(any(UUID.class))).thenReturn(List.of());
        when(gamificationService.getUserBadges(any(UUID.class))).thenReturn(List.of());
        when(gamificationService.getUserMissions(any(UUID.class))).thenReturn(List.of());

        mockMvc.perform(get(path, UUID.randomUUID())).andExpect(status().isOk());
    }
}
