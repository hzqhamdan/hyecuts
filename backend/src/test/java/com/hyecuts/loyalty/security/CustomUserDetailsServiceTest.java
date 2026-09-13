package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pins the resolution order and the fail-closed rule precisely.
 *
 * <p>Unstubbed {@code List}-returning mock methods return an empty list, so each
 * test stubs only the steps that should match. Stubs that exist only to show a
 * later step WOULD have matched are {@code lenient()}, and the test then verifies
 * that step was never reached.
 */
@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService service;

    private User alice;
    private User mallory;

    private static User user(String email, String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash("hash");
        user.setRole("ROLE_USER");
        return user;
    }

    private UUID resolve(String identifier) {
        return ((CustomUserDetails) service.loadUserByUsername(identifier)).getId();
    }

    @BeforeEach
    void setUp() {
        alice = user("alice@x.com", "alice");
        mallory = user("mallory@x.com", "alice@x.com");
    }

    @Test
    void resolvesByExactEmail() {
        when(userRepository.findAllByEmail("alice@x.com")).thenReturn(List.of(alice));

        assertEquals(alice.getId(), resolve("alice@x.com"));
    }

    @Test
    void exactEmailWinsOverAMatchingUsername() {
        // AUTH-027: Mallory's username is Alice's email. Emails must win.
        when(userRepository.findAllByEmail("alice@x.com")).thenReturn(List.of(alice));
        lenient().when(userRepository.findAllByUsername("alice@x.com")).thenReturn(List.of(mallory));

        assertEquals(alice.getId(), resolve("alice@x.com"));
        verify(userRepository, never()).findAllByUsername(any());
    }

    @Test
    void fallsBackToCaseInsensitiveEmail() {
        // AUTH-022.
        User user = user("User@X.com", "User@X.com");
        when(userRepository.findAllByEmailIgnoreCase("user@x.com")).thenReturn(List.of(user));

        assertEquals(user.getId(), resolve("user@x.com"));
    }

    @Test
    void ambiguousCaseInsensitiveEmailFailsClosedWithoutFallingThrough() {
        // Two accounts match. Picking one would hand somebody the wrong account, and
        // falling through to usernames could resolve to a squatter.
        User janeUpper = user("Jane@x.com", "Jane@x.com");
        User janeLower = user("jane@x.com", "jane@x.com");
        when(userRepository.findAllByEmailIgnoreCase("JANE@X.COM")).thenReturn(List.of(janeUpper, janeLower));
        lenient().when(userRepository.findAllByUsername("JANE@X.COM")).thenReturn(List.of(mallory));

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("JANE@X.COM"));
        verify(userRepository, never()).findAllByUsername(any());
        verify(userRepository, never()).findAllByUsernameIgnoreCase(any());
    }

    @Test
    void exactCasingStillResolvesOneHalfOfACaseVariantPair() {
        // No regression for an existing pair: each still signs in with its own casing.
        User janeLower = user("jane@x.com", "jane@x.com");
        when(userRepository.findAllByEmail("jane@x.com")).thenReturn(List.of(janeLower));

        assertEquals(janeLower.getId(), resolve("jane@x.com"));
        verify(userRepository, never()).findAllByEmailIgnoreCase(any());
    }

    @Test
    void fallsBackToExactUsername() {
        when(userRepository.findAllByUsername("alice")).thenReturn(List.of(alice));

        assertEquals(alice.getId(), resolve("alice"));
    }

    @Test
    void fallsBackToCaseInsensitiveUsername() {
        when(userRepository.findAllByUsernameIgnoreCase("ALICE")).thenReturn(List.of(alice));

        assertEquals(alice.getId(), resolve("ALICE"));
    }

    @Test
    void ambiguousUsernameFailsClosed() {
        User bob1 = user("bob1@x.com", "bob");
        User bob2 = user("bob2@x.com", "bob");
        when(userRepository.findAllByUsername("bob")).thenReturn(List.of(bob1, bob2));

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("bob"));
        verify(userRepository, never()).findAllByUsernameIgnoreCase(any());
    }

    @Test
    void ambiguousCaseInsensitiveUsernameFailsClosed() {
        // Step 4: the last step in the chain. Ambiguity here must still throw
        // rather than pick one of the matches.
        User bobLower = user("bob1@x.com", "bob");
        User bobUpper = user("bob2@x.com", "BOB");
        when(userRepository.findAllByUsernameIgnoreCase("bob")).thenReturn(List.of(bobLower, bobUpper));

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("bob"));
    }

    @Test
    void notFoundWhenNothingMatches() {
        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("ghost@x.com"));
    }

    @Test
    void blankIdentifierIsNotFoundWithoutQuerying() {
        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("   "));
        verifyNoInteractions(userRepository);
    }

    @Test
    void notFoundMessageNeverContainsTheIdentifier() {
        UsernameNotFoundException ex = assertThrows(UsernameNotFoundException.class,
                () -> service.loadUserByUsername("secret-person@x.com"));

        assertFalse(ex.getMessage().contains("secret-person"));
    }

    @Test
    void loadUserById_resolvesTheAccount() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));

        assertEquals(alice.getId(), service.loadUserById(alice.getId()).getId());
    }

    @Test
    void loadUserById_throwsWhenTheAccountIsGone() {
        UUID missing = UUID.randomUUID();
        when(userRepository.findById(missing)).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserById(missing));
    }
}
