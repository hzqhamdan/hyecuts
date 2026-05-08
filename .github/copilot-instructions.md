# Copilot instructions for Hyecuts

## Project shape
- This repo is split into a Vite + React + TypeScript frontend in `src/` and a Spring Boot 3.2 backend in `backend/`.
- The frontend is a view-state SPA, not a route-based app. `App.tsx` switches between `facade`, `login`, `lounge`, and `atelier`, and `AuthProvider` is mounted at the root in `main.tsx`.
- The backend exposes domain APIs under `/api/*` for auth, loyalty, rewards, gamification, bookings, services, admin, and global settings.
- Data is persisted with Spring Data JPA against PostgreSQL. User-facing flows use UUIDs for entities like users, bookings, and vouchers; catalog/look-up entities like tiers, services, badges, and missions use numeric IDs.
- `DatabaseSeeder` bootstraps default users, services, rewards, badges, and missions when the users table is empty.

## Build, test, and lint
- Frontend install/run: `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
- Backend run/test/build: `cd backend && ./gradlew bootRun` (`.\gradlew.bat bootRun` on Windows), `cd backend && ./gradlew test`, `cd backend && ./gradlew build`
- Single backend test: `cd backend && ./gradlew test --tests com.hyecuts.loyalty.service.LoyaltyServiceTest` (`.\gradlew.bat test --tests ...` on Windows)
- Docker stack: `docker compose up --build`

## Architecture notes
- `src/config.ts` centralizes frontend API URLs. Use `API_BASE` for authenticated/domain calls and `API_URL` for auth endpoints.
- `LoginScreen.tsx` posts to `/api/auth/login` or `/api/auth/register`, stores the returned token/user payload, and sends admins to `atelier` while regular users go to `lounge`.
- `MemberLounge.tsx` and `AtelierDashboard.tsx` are thin API-driven shells over the backend controllers; most UI state is local and fetched from the API on mount or refresh.
- Backend security is already wired with JWT, but the current config permits most routes during development and relies on the existing CORS config for localhost/Vercel origins.
- `application.yml` points at PostgreSQL on port 8081, with JPA `ddl-auto: update` and Flyway disabled even though SQL migration files exist under `backend/src/main/resources/db/migration`.

## Key conventions
- Keep the `view` string literals in `App.tsx` aligned with every caller that switches screens. There is no router abstraction here.
- Preserve the existing storage keys: `hc_token`, `hc_user`, and `hyecuts-theme-v2`.
- Follow the existing controller style: small `@RequestMapping("/api/...")` controllers with `ResponseEntity` returns and simple nested request DTOs where needed.
- Keep mutations transactional in services. `LoyaltyService` updates points and tiers together; `BookingService` awards points and writes an activity log when a booking is completed.
- `User.email` is the login identifier, and roles are stored as `ROLE_USER` / `ROLE_ADMIN`.
- If you change booking or loyalty calculations, keep `GlobalSettingsService` and the seeded data in sync with the point ratio assumptions used by the services.
- When adding frontend API calls, reuse `API_BASE` / `API_URL` instead of hardcoding localhost URLs.

## Browser verification
- Use Playwright MCP for browser-level checks when it is available in the Copilot environment, especially for the Vite frontend and auth/view-switch flows.
