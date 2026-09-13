package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Decides whether an email or username is free to use (AUTH-022/027).
 *
 * <p>The rule: <strong>a value is taken if it matches any user's email or username,
 * ignoring case.</strong> Both columns, always, because a collision in either
 * direction breaks sign-in. A username equal to someone's email captures their
 * sign-in; an email equal to someone's username captures theirs. The check this
 * replaced compared usernames only against other usernames, which is what let one
 * user lock another out of their account.
 *
 * <p>This lives in a component rather than as {@code default} methods on
 * {@code UserRepository} deliberately: Mockito mocks of an interface do not invoke
 * default methods, so a rule written that way would silently return {@code false}
 * in every test that mocks the repository.
 */
@Service
public class IdentifierAvailability {

    private final UserRepository userRepository;

    public IdentifierAvailability(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** For a new account, where there is no row of the caller's own to exclude. */
    public boolean isTaken(String value) {
        return userRepository.existsByEmailIgnoreCase(value)
                || userRepository.existsByUsernameIgnoreCase(value);
    }

    /** For an existing account changing its email or username; its own row is ignored. */
    public boolean isTakenByAnotherUser(String value, UUID userId) {
        return userRepository.existsByEmailIgnoreCaseAndIdNot(value, userId)
                || userRepository.existsByUsernameIgnoreCaseAndIdNot(value, userId);
    }
}
