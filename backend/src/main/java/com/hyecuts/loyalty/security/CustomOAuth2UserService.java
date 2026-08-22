package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        Object emailVerifiedAttr = attributes.get("email_verified");
        boolean emailNotVerified = "false".equalsIgnoreCase(String.valueOf(emailVerifiedAttr));
        String provider = userRequest.getClientRegistration().getRegistrationId(); // "google"

        if (email == null || email.isBlank() || emailNotVerified) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("email_not_verified"),
                    "The identity provider did not return a verified email address.");
        }

        User existing = userRepository.findByEmail(email).orElse(null);
        User user;

        if (existing == null) {
            // First time we've seen this email — safe to create, since Google has
            // just verified the requester controls this inbox.
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email);
            newUser.setFullName(name);
            newUser.setRole("ROLE_USER");
            newUser.setPasswordHash(java.util.UUID.randomUUID().toString());
            newUser.setOauthProvider(provider);
            user = userRepository.save(newUser);
        } else if (provider.equals(existing.getOauthProvider())) {
            // Returning OAuth user — this account was itself created via this
            // provider, so linking it to the current OAuth session is safe.
            user = existing;
        } else {
            // An account with this email already exists but was never proven to
            // be owned by this provider's user (e.g. it was created through local
            // password registration, which never verifies email ownership).
            // Auto-linking here would let an attacker who pre-registered a
            // victim's email address silently take over the victim's Google
            // login. Refuse instead of merging.
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("account_email_conflict"),
                    "An account with this email already exists. Please log in with your password instead.");
        }

        return new DefaultOAuth2User(
                Collections.singleton(() -> user.getRole()),
                attributes,
                "email"
        );
    }
}
