package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.JwtUtil;
import com.hyecuts.loyalty.security.OAuth2CodeExchangeService;
import com.hyecuts.loyalty.security.TokenRevocationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OAuth2CodeExchangeService oauth2CodeExchangeService;
    private final TokenRevocationService tokenRevocationService;

    public AuthController(AuthenticationManager authenticationManager,
                          UserDetailsService userDetailsService,
                          JwtUtil jwtUtil,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          OAuth2CodeExchangeService oauth2CodeExchangeService,
                          TokenRevocationService tokenRevocationService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.oauth2CodeExchangeService = oauth2CodeExchangeService;
        this.tokenRevocationService = tokenRevocationService;
    }

    public static class AuthRequest {
        public String username;
        public String password;
    }

    public static class OAuth2ExchangeRequest {
        public String code;
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.username, authRequest.password)
            );
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username);
        Optional<User> optUser = userRepository.findByEmailOrUsername(authRequest.username, authRequest.username);
        
        if (optUser.isPresent()) {
            User user = optUser.get();
            final String jwt = jwtUtil.generateToken(userDetails.getUsername(), user.getId().toString());
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("userId", user.getId().toString());
            response.put("role", user.getRole());
            response.put("username", user.getUsername() != null ? user.getUsername() : user.getEmail());
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(404).body("User not found");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest authRequest) {
        if (userRepository.findByEmailOrUsername(authRequest.username, authRequest.username).isPresent()) {
            return ResponseEntity.badRequest().body("Email or Username is already taken");
        }

        User newUser = new User();
        // Default both to the identifier provided
        newUser.setEmail(authRequest.username);
        newUser.setUsername(authRequest.username);
        newUser.setPasswordHash(passwordEncoder.encode(authRequest.password));
        newUser.setRole("ROLE_USER");
        User savedUser = userRepository.save(newUser);

        final String jwt = jwtUtil.generateToken(authRequest.username, savedUser.getId().toString());
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("userId", savedUser.getId().toString());
        response.put("role", savedUser.getRole());
        response.put("username", savedUser.getUsername());

        return ResponseEntity.ok(response);
    }

    // Second half of the OAuth2 handoff: OAuth2LoginSuccessHandler redirects the
    // browser here with a short-lived one-time code instead of a JWT (see
    // OAuth2CodeExchangeService for why), and this exchanges it for the real
    // token over a normal POST body instead of a URL.
    @PostMapping("/oauth2/exchange")
    public ResponseEntity<?> exchangeOAuth2Code(@RequestBody OAuth2ExchangeRequest request) {
        Optional<UUID> userId = oauth2CodeExchangeService.consume(request.code);
        if (userId.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid or expired code");
        }

        Optional<User> optUser = userRepository.findById(userId.get());
        if (optUser.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }

        User user = optUser.get();
        final String jwt = jwtUtil.generateToken(user.getEmail(), user.getId().toString());
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("userId", user.getId().toString());
        response.put("role", user.getRole());
        response.put("username", user.getUsername() != null ? user.getUsername() : user.getEmail());
        return ResponseEntity.ok(response);
    }

    // Previously logout only cleared sessionStorage client-side — the JWT
    // itself stayed valid server-side for the rest of its 24h lifetime, so a
    // copied/stolen token kept working after "logout". This revokes it.
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String jwt = authorizationHeader.substring(7);
            try {
                tokenRevocationService.revoke(jwtUtil.extractJti(jwt), jwtUtil.extractExpirationMillis(jwt));
            } catch (Exception e) {
                // Already malformed/expired — nothing meaningful to revoke.
            }
        }
        return ResponseEntity.noContent().build();
    }
}
