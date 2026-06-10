# Google OAuth Login Integration

**Date:** 2026-06-10
**Status:** Approved Design

## Overview

Add Google OAuth as an additional login method alongside existing username/password auth in the Hyecuts Studio barbershop management app. Stack: Spring Boot 3.2.5 (backend) + React 19 (frontend).

## Flow

1. User clicks "Sign in with Google" on `LoginScreen`
2. Frontend redirects to `{API_BASE}/oauth2/authorization/google`
3. Spring Security OAuth2 client handles Google redirect, token exchange, user info fetch
4. Backend looks up user by Google email via `UserRepository.findByEmail()`
   - Found → log in as that user
   - Not found → create new user with `ROLE_USER`, email, name from Google profile
5. Backend generates JWT (same format as existing auth) and redirects to frontend callback URL with token params
6. Frontend `OAuth2Callback` component reads params, calls `login()` from AuthContext, redirects to dashboard

## Backend Changes

### Dependency (`build.gradle`)
```groovy
implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
```

### Configuration (`application.yml`)
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
            redirect-uri: "{baseUrl}/login/oauth2/code/google"

frontend:
  base-url: ${FRONTEND_BASE_URL:http://localhost:5173}
```

### `SecurityConfig.java`
- Add `.oauth2Login()` with custom `OAuth2UserService` and `OAuth2LoginSuccessHandler`
- Permit `/login/oauth2/**` and `/oauth2/**` (already `/api/auth/**` is permitted)
- Keep existing form-login-based JWT auth unchanged

### `CustomOAuth2UserService.java` (new)
- Implements `OAuth2UserService<OAuth2UserRequest, OAuth2User>`
- Extracts `email`, `name`, `sub` (Google ID) from `OAuth2User` attributes
- Calls `UserRepository.findByEmail(email)`:
  - Found → return that user
  - Not found → create new `User` with `ROLE_USER`, email, full_name=name
- Returns a `DefaultOAuth2User` with authorities

### `OAuth2LoginSuccessHandler.java` (new)
- Implements `AuthenticationSuccessHandler`
- On success: retrieves authenticated user, generates JWT via existing `JwtUtil`
- Redirects to: `{frontendBaseUrl}/oauth2/callback?token={jwt}&userId={id}&role={role}&username={name}`
- URL-encodes parameter values

## Frontend Changes

### `LoginScreen.tsx`
- Add "Sign in with Google" button below existing username/password form
- Wraps `<a href="{API_BASE}/oauth2/authorization/google">` styled as a Google-branded button
- Only shown when `VITE_GOOGLE_CLIENT_ID` is set (env flag check)

### `OAuth2Callback.tsx` (new page)
- Route: `/oauth2/callback`
- On mount: reads `token`, `userId`, `role`, `username` from URL search params
- Calls `login({ id, username, role }, token)` from AuthContext
- Redirects: admin role → `/admin`, user role → `/lounge`
- Handles error state: missing params → redirect to `/login` with error

### `App.tsx`
- Add route: `<Route path="/oauth2/callback" element={<OAuth2Callback />} />`

### `src/config.ts`
- Export `GOOGLE_CLIENT_ID` from `VITE_GOOGLE_CLIENT_ID` env var

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `FRONTEND_BASE_URL` | Yes | e.g. `http://localhost:5173` |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Passed to frontend for feature flag |

## Google Cloud Console Setup (Manual)

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth consent screen (External, scopes: `email`, `profile`)
3. Create OAuth 2.0 Client ID (Web application)
4. Add Authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
5. Copy Client ID and Client Secret to `.env`

## Security

- Existing JWT auth remains unchanged; both paths produce identical JWT format
- OAuth2 state parameter CSRF protection is built into Spring Security
- No new database columns required (match by existing `email` field)
- Session remains stateless (JWT in sessionStorage) — consistent with existing pattern

## What's NOT Changed

- `AuthContext` / `AuthProvider` — same interface, no structural changes
- Route guards (`ProtectedRoute`, `AdminRoute`) — unchanged
- `JwtUtil`, `JwtRequestFilter`, `CustomUserDetailsService` — unchanged
- `User` entity schema — no migration needed
- Production deployment — same env vars added to deployment config
