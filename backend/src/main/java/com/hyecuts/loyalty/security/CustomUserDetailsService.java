package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.function.Function;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(CustomUserDetailsService.class);

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** One resolution step. The label names the step in logs; it never holds the identifier. */
    private record Step(String label, Function<String, List<User>> query) {}

    /**
     * Resolves a sign-in identifier — an email or a username — to exactly one account
     * (AUTH-022/027).
     *
     * <p>Steps run in a fixed order: exact email, case-insensitive email, exact
     * username, case-insensitive username. The first step with exactly one match wins.
     *
     * <ul>
     *   <li><b>Exact before case-insensitive</b>, so an existing case-variant pair
     *       ({@code Jane@x.com} and {@code jane@x.com}) can each still sign in with
     *       its own casing, as before.</li>
     *   <li><b>Every email step before any username step</b>, so a username can never
     *       capture somebody's email sign-in — including a squatted username planted
     *       before this change, and one differing only in case.</li>
     *   <li><b>Two or more matches at any step stops resolution.</b> The dangerous
     *       failure here is not a lockout but resolving to the wrong person's
     *       account, so ambiguity never picks one and never falls through to a later
     *       step, where it could land on a squatter.</li>
     * </ul>
     *
     * <p>Not-found and ambiguous both throw {@link UsernameNotFoundException}, which
     * Spring Security reports as bad credentials — so neither discloses which
     * accounts exist.
     */
    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        if (identifier == null || identifier.isBlank()) {
            throw notFound();
        }

        List<Step> steps = List.of(
                new Step("exact email", userRepository::findAllByEmail),
                new Step("case-insensitive email", userRepository::findAllByEmailIgnoreCase),
                new Step("exact username", userRepository::findAllByUsername),
                new Step("case-insensitive username", userRepository::findAllByUsernameIgnoreCase));

        for (Step step : steps) {
            List<User> matches = step.query().apply(identifier);
            if (matches.size() == 1) {
                return new CustomUserDetails(matches.get(0));
            }
            if (matches.size() > 1) {
                // Ids only, never the identifier — it is an email address. Ambiguity
                // means duplicate or squatted rows exist, which an operator needs to
                // see, and the ids are what the clean-up query needs.
                log.warn("Refused ambiguous sign-in: {} matched {} accounts (user ids {})",
                        step.label(), matches.size(),
                        matches.stream().map(User::getId).toList());
                throw notFound();
            }
        }
        throw notFound();
    }

    /**
     * Resolves an already-authenticated principal by primary key. Used on every
     * authenticated request, where ids — unlike emails — can never be ambiguous.
     */
    public CustomUserDetails loadUserById(UUID id) {
        return userRepository.findById(id)
                .map(CustomUserDetails::new)
                .orElseThrow(CustomUserDetailsService::notFound);
    }

    private static UsernameNotFoundException notFound() {
        return new UsernameNotFoundException("User not found");
    }
}
