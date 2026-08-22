package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final OAuth2CodeExchangeService codeExchangeService;
    private final String frontendBaseUrl;

    public OAuth2LoginSuccessHandler(
            UserRepository userRepository,
            OAuth2CodeExchangeService codeExchangeService,
            @Value("${frontend.base-url}") String frontendBaseUrl) {
        this.userRepository = userRepository;
        this.codeExchangeService = codeExchangeService;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttributes().get("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth2 login"));

        // Hand the browser a short-lived, single-use code instead of the JWT
        // itself — putting the real token in the redirect URL leaks it into
        // browser history, Referer headers, and access logs. The frontend
        // exchanges this code for the real token via a POST request.
        String code = codeExchangeService.issueCode(user.getId());

        String redirectUrl = String.format("%s/oauth2/callback?code=%s",
                frontendBaseUrl,
                URLEncoder.encode(code, StandardCharsets.UTF_8));

        response.sendRedirect(redirectUrl);
    }
}
