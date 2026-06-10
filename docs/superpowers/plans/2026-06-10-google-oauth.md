# Google OAuth Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth as an additional login method alongside existing username/password auth.

**Architecture:** Spring Boot OAuth2 client handles the Google redirect flow and token exchange on the backend. A custom `OAuth2UserService` looks up or creates users by email. On success, the backend generates the same JWT format as existing auth and redirects to the frontend callback page, which stores the token and redirects to the dashboard.

**Tech Stack:** Spring Boot 3.2.5 (`spring-boot-starter-oauth2-client`), React 19, Google Identity Platform

---

### Task 1: Add OAuth2 dependency to backend

**Files:**
- Modify: `backend/build.gradle:32`

- [ ] **Add oauth2-client dependency**

Insert after the `spring-boot-starter-security` line:

```groovy
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
```

### Task 2: Add OAuth2 config to application.yml

**Files:**
- Modify: `backend/src/main/resources/application.yml:43`

- [ ] **Add OAuth2 client registration and frontend base URL**

Append at the end of the file:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: email, profile

frontend:
  base-url: ${FRONTEND_BASE_URL:http://localhost:5173}
```

### Task 3: Create CustomOAuth2UserService

**Files:**
- Create: `backend/src/main/java/com/hyecuts/loyalty/security/CustomOAuth2UserService.java`

- [ ] **Write the service**

```java
package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
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
        String googleId = (String) attributes.get("sub");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email);
            newUser.setFullName(name);
            newUser.setRole("ROLE_USER");
            return userRepository.save(newUser);
        });

        return new DefaultOAuth2User(
                Collections.singleton(() -> user.getRole()),
                attributes,
                "email"
        );
    }
}
```

### Task 4: Create OAuth2LoginSuccessHandler

**Files:**
- Create: `backend/src/main/java/com/hyecuts/loyalty/security/OAuth2LoginSuccessHandler.java`

- [ ] **Write the success handler**

```java
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

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String frontendBaseUrl;

    public OAuth2LoginSuccessHandler(
            JwtUtil jwtUtil,
            UserRepository userRepository,
            @Value("${frontend.base-url}") String frontendBaseUrl) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttributes().get("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth2 login"));

        String jwt = jwtUtil.generateToken(user.getEmail(), user.getId().toString());
        String displayName = user.getUsername() != null ? user.getUsername() : user.getEmail();

        String redirectUrl = String.format("%s/oauth2/callback?token=%s&userId=%s&role=%s&username=%s",
                frontendBaseUrl,
                URLEncoder.encode(jwt, StandardCharsets.UTF_8),
                URLEncoder.encode(user.getId().toString(), StandardCharsets.UTF_8),
                URLEncoder.encode(user.getRole(), StandardCharsets.UTF_8),
                URLEncoder.encode(displayName, StandardCharsets.UTF_8));

        response.sendRedirect(redirectUrl);
    }
}
```

### Task 5: Update SecurityConfig for OAuth2 login

**Files:**
- Modify: `backend/src/main/java/com/hyecuts/loyalty/security/SecurityConfig.java:32-48`

- [ ] **Add OAuth2 login support and inject the new dependencies**

Change the constructor and `securityFilterChain` method:

```java
    private final JwtRequestFilter jwtRequestFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    public SecurityConfig(JwtRequestFilter jwtRequestFilter,
                          CustomOAuth2UserService customOAuth2UserService,
                          OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) {
        this.jwtRequestFilter = jwtRequestFilter;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/login/oauth2/**").permitAll()
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .successHandler(oAuth2LoginSuccessHandler)
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
```

**Note:** The `oauth2Login()` block configures Spring Security to intercept `/login/oauth2/**` and `/oauth2/**` paths. The existing JWT filter and form-based auth remain unchanged. Because `.anyRequest().permitAll()` is set, the OAuth2 endpoints are accessible without pre-authentication — Spring Security's OAuth2 filter chain handles the authorization-code flow internally.

### Task 6: Create OAuth2Callback frontend page

**Files:**
- Create: `src/pages/OAuth2Callback.tsx`

- [ ] **Write the callback component**

```tsx
import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const username = searchParams.get('username');

    if (token && userId && role) {
      login(token, userId, role, username || '');
      navigate(role === 'ROLE_ADMIN' ? '/admin' : '/lounge', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1A1A1A] flex items-center justify-center">
      <div className="text-black dark:text-white font-serif text-xl">Signing in...</div>
    </div>
  );
}
```

### Task 7: Add Google sign-in button to LoginScreen

**Files:**
- Modify: `src/pages/LoginScreen.tsx:1-7` (imports)
- Modify: `src/pages/LoginScreen.tsx:141-148` (add button after the toggle)

- [ ] **Add the `API_URL` import**

Change line 4 from:
```tsx
import { ArrowLeft, ShieldCheck, Globe } from 'lucide-react';
```
to:
```tsx
import { ArrowLeft, ShieldCheck, Globe } from 'lucide-react';
import { API_URL } from '../config';
```

- [ ] **Add Google sign-in button between the form and the toggle**

Insert after the closing `</form>` tag (after line 139) and before the `register_cta` div (line 141):

```tsx
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-[#1A1A1A] px-3 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        <a
          href={`${API_URL}/oauth2/authorization/google`}
          className="flex items-center justify-center gap-3 w-full py-3.5 border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </a>
```

### Task 8: Add OAuth2Callback route to App.tsx

**Files:**
- Modify: `src/App.tsx:11` (add import)
- Modify: `src/App.tsx:43` (add route)

- [ ] **Add lazy import**

Insert after line 11 (`const LoginScreen`):
```tsx
const OAuth2Callback = lazy(() => import('./pages/OAuth2Callback'));
```

- [ ] **Add route**

Insert after line 43 (`<Route path="/login" element={<LoginScreen />} />`):
```tsx
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
```

### Task 9: Update environment variable files

**Files:**
- Modify: `.env.example:1-13`
- Modify: `src/config.ts:1-3`

- [ ] **Add Google OAuth env vars to `.env.example`**

Replace the existing content:
```
# --- Required Secrets (no defaults) ---
JWT_SECRET=
QR_SECRET=
STRIPE_SECRET_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FRONTEND_BASE_URL=http://localhost:5173

# --- PostgreSQL ---
POSTGRES_PASSWORD=
SPRING_DATASOURCE_PASSWORD=

# --- Frontend (Vite) ---
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=
VITE_API_URL=
```

- [ ] **Export `GOOGLE_CLIENT_ID` from frontend config (optional, for feature flag)**

Append to `src/config.ts`:
```ts
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
```

### Task 10: Google Cloud Console setup (manual)

- [ ] **Create OAuth credentials**

1. Go to https://console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth consent screen (External, scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`)
3. Add test emails if in testing mode
4. Create OAuth 2.0 Client ID (Web application)
5. Add Authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
6. Copy Client ID and Client Secret

- [ ] **Add to `.env`**

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_BASE_URL=http://localhost:5173
```

### Task 11: Verify the build

- [ ] **Backend build**

Run: `cd backend && ./gradlew build`
Expected: BUILD SUCCESSFUL

- [ ] **Start backend**

Run: `cd backend && ./gradlew bootRun`
Expected: starts on port 8080

- [ ] **Frontend build**

Run: `npm run build`
Expected: no TypeScript errors
