package com.hyecuts.loyalty.controller;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import com.hyecuts.loyalty.security.JwtUtil;
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

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
                          UserDetailsService userDetailsService,
                          JwtUtil jwtUtil,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public static class AuthRequest {
        public String username;
        public String password;
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
        Optional<User> optUser = userRepository.findByEmail(authRequest.username);
        
        if (optUser.isPresent()) {
            final String jwt = jwtUtil.generateToken(userDetails.getUsername(), optUser.get().getId().toString());
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("userId", optUser.get().getId().toString());
            response.put("role", optUser.get().getRole());
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(404).body("User not found");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest authRequest) {
        if (userRepository.findByEmail(authRequest.username).isPresent()) {
            return ResponseEntity.badRequest().body("Email is already taken");
        }

        User newUser = new User();
        newUser.setEmail(authRequest.username);
        newUser.setPasswordHash(passwordEncoder.encode(authRequest.password));
        newUser.setRole("ROLE_USER");
        User savedUser = userRepository.save(newUser);

        final String jwt = jwtUtil.generateToken(authRequest.username, savedUser.getId().toString());
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("userId", savedUser.getId().toString());
        response.put("role", savedUser.getRole());

        return ResponseEntity.ok(response);
    }
}
