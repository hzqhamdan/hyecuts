package com.hyecuts.loyalty.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Sends the caller back to the SPA instead of Spring's default "/login?error"
 * page (which isn't a route this frontend has). Reached whenever
 * {@link CustomOAuth2UserService} rejects the login — e.g. an unverified
 * email, or an email that already belongs to a non-OAuth account.
 */
@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    private final String frontendBaseUrl;

    public OAuth2LoginFailureHandler(@Value("${frontend.base-url}") String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                         AuthenticationException exception) throws IOException {
        String message = exception.getMessage() != null ? exception.getMessage() : "OAuth2 login failed";
        String redirectUrl = frontendBaseUrl + "/oauth2/callback?error="
                + URLEncoder.encode(message, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }
}
