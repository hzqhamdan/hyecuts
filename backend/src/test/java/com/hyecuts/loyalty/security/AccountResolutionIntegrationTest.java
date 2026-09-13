package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The spec's scenarios end-to-end, against real rows and real SQL.
 *
 * <p>The unit test pins the algorithm with mocks; this proves the algorithm and the
 * queries together produce the right account for the situations that actually
 * caused the bugs.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
class AccountResolutionIntegrationTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private CustomUserDetailsService service;

    @BeforeEach
    void setUp() {
        service = new CustomUserDetailsService(userRepository);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private User persist(String email, String username) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash("not-a-real-hash");
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }

    private User persistWithPassword(String email, String username, String rawPassword, PasswordEncoder encoder) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(encoder.encode(rawPassword));
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }

    private UUID resolve(String identifier) {
        return ((CustomUserDetails) service.loadUserByUsername(identifier)).getId();
    }

    @Test
    void caseInsensitiveSignIn_resolvesTheRegisteredAccount() {
        // AUTH-022: registered as User@X.com, signs in as user@x.com.
        User user = persist("User@X.com", "User@X.com");

        assertEquals(user.getId(), resolve("user@x.com"));
    }

    @Test
    void squattedUsername_cannotCaptureTheOwnersSignIn() {
        // AUTH-027: Alice renamed her username, then Mallory took Alice's email as hers.
        User alice = persist("alice@x.com", "alice");
        persist("mallory@x.com", "alice@x.com");

        assertEquals(alice.getId(), resolve("alice@x.com"));
    }

    @Test
    void squatDifferingOnlyInCase_stillResolvesTheOwner() {
        User alice = persist("alice@x.com", "alice");
        persist("mallory@x.com", "ALICE@X.COM");

        assertEquals(alice.getId(), resolve("ALICE@X.COM"));
    }

    @Test
    void squattedUsername_cannotBreakResolutionById() {
        User alice = persist("alice@x.com", "alice");
        persist("mallory@x.com", "alice@x.com");

        assertEquals(alice.getId(), service.loadUserById(alice.getId()).getId());
    }

    @Test
    void caseVariantPair_eachResolvesByExactCasing() {
        User upper = persist("Jane@x.com", "Jane@x.com");
        User lower = persist("jane@x.com", "jane@x.com");

        assertEquals(upper.getId(), resolve("Jane@x.com"));
        assertEquals(lower.getId(), resolve("jane@x.com"));
    }

    @Test
    void caseVariantPair_otherCasingFailsClosedAndNeverResolvesToEitherAccount() {
        // The security-critical case: never resolve to the wrong person's account.
        persist("Jane@x.com", "Jane@x.com");
        persist("jane@x.com", "jane@x.com");

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("JANE@X.COM"));
    }

    /**
     * Every seam elsewhere in this suite is mocked. Nothing proves that a real
     * {@link DaoAuthenticationProvider}, wired to the real {@link CustomUserDetailsService}
     * over these real repository rows, actually yields the right account's
     * {@link CustomUserDetails} as its principal — which is exactly what {@code AuthController}
     * assumes when it signs a token off {@code authentication.getPrincipal()}. If this
     * assumption is wrong, every password login is broken (401), yet no other test would
     * catch it because they all stub the authentication step away.
     */
    @Test
    void realDaoAuthenticationProvider_resolvesTheCaseVariantSquatToItsOwnerAndSignsHer() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        User alice = persistWithPassword("alice@x.com", "alice", "alice-secret", encoder);
        // AUTH-027: Mallory's username is a case-variant of Alice's email.
        persistWithPassword("mallory@x.com", "ALICE@X.COM", "mallory-secret", encoder);

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(service);
        provider.setPasswordEncoder(encoder);
        AuthenticationManager authenticationManager = new ProviderManager(provider);

        Authentication result = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken("ALICE@X.COM", "alice-secret"));

        assertTrue(result.getPrincipal() instanceof CustomUserDetails);
        CustomUserDetails principal = (CustomUserDetails) result.getPrincipal();
        assertEquals(alice.getId(), principal.getId());
        assertEquals("alice@x.com", principal.getUsername());

        assertThrows(BadCredentialsException.class, () -> authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken("ALICE@X.COM", "mallory-secret")));
    }

    /**
     * Continues the previous test: the real principal, signed by a real {@link JwtUtil}
     * and run through a real {@link JwtRequestFilter}, must authenticate the request as
     * Alice — not Mallory, and not nobody.
     */
    @Test
    void realSignInChain_tokenFromRealPrincipalAuthenticatesTheRequestAsItsOwner() throws Exception {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        User alice = persistWithPassword("alice@x.com", "alice", "alice-secret", encoder);
        persistWithPassword("mallory@x.com", "ALICE@X.COM", "mallory-secret", encoder);

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(service);
        provider.setPasswordEncoder(encoder);
        AuthenticationManager authenticationManager = new ProviderManager(provider);

        Authentication result = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken("ALICE@X.COM", "alice-secret"));
        CustomUserDetails principal = (CustomUserDetails) result.getPrincipal();

        JwtUtil jwtUtil = new JwtUtil(java.util.Base64.getEncoder().encodeToString(
                io.jsonwebtoken.security.Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256).getEncoded()));
        String token = jwtUtil.generateToken(principal.getUsername(), principal.getId().toString());

        JwtRequestFilter filter = new JwtRequestFilter(service, jwtUtil, new TokenRevocationService());

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertTrue(auth.getPrincipal() instanceof CustomUserDetails);
        assertEquals(alice.getId(), ((CustomUserDetails) auth.getPrincipal()).getId());
    }
}
