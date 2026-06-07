# Clan Haven Foundation — Test Plan

## Scope
This PR establishes the full-stack project foundation. No database or OAuth credentials are available, so testing focuses on:
1. Frontend UI rendering, routing, and navigation (via browser)
2. Backend unit test and lint/build verification (via shell)

## Test 1: Landing page renders correctly (browser)
**Steps:**
1. Navigate to `http://localhost:5173/`
2. Verify the page content

**Pass criteria:**
- Page has dark background (not white — confirms Tailwind theme is applied)
- Navbar visible at top with "Clan Haven" brand text and "Clans" link and "Login" button
- Navbar does NOT show "Dashboard" link (user is not authenticated)
- h1 heading reads exactly "Clan Haven"
- Subtitle contains "A multi-clan platform for RuneScape communities"
- Two buttons visible: "Login with Discord" (primary/indigo) and "Browse Clans" (bordered)

## Test 2: Navigation — Home → Clans page (browser)
**Steps:**
1. From Home page, click "Browse Clans" button (or "Clans" in navbar)
2. Verify URL changes to `/clans`
3. Verify page content

**Pass criteria:**
- URL is `http://localhost:5173/clans`
- h1 heading reads "Clans"
- Text "← Back to Home" link is visible
- Text "Clan directory coming soon" is visible
- Navbar still shows "Clan Haven" brand, "Clans" link, "Login" button

## Test 3: Navigation — Clans → Home via back link (browser)
**Steps:**
1. From Clans page, click "← Back to Home" link
2. Verify URL changes back to `/`

**Pass criteria:**
- URL is `http://localhost:5173/`
- Landing page content ("Clan Haven" h1) is visible again

## Test 4: Dashboard page — unauthenticated state (browser)
**Steps:**
1. Navigate directly to `http://localhost:5173/dashboard`
2. Verify page content

**Pass criteria:**
- URL is `http://localhost:5173/dashboard`
- h1 heading reads "Dashboard"
- Text "← Back to Home" link is visible
- Text reads "Please log in to view your dashboard." (NOT the welcome/clan message)
- This proves the unauthenticated conditional rendering works correctly

## Test 5: 404 page for unknown routes (browser)
**Steps:**
1. Navigate to `http://localhost:5173/nonexistent-page`
2. Verify 404 page content

**Pass criteria:**
- h1 reads "404"
- Text "Page not found." is visible
- "Go Home" link is visible
- Clicking "Go Home" returns to `/`

## Test 6: Backend unit test passes (shell)
**Steps:**
1. Run `cd backend && poetry run pytest tests/test_health.py -v`

**Pass criteria:**
- `test_healthz` passes
- Exit code 0

## Test 7: Backend lint passes (shell)
**Steps:**
1. Run `cd backend && poetry run ruff check app/`

**Pass criteria:**
- "All checks passed!" or no errors
- Exit code 0

## Test 8: Frontend lint + build passes (shell)
**Steps:**
1. Run `cd frontend && npm run lint`
2. Run `cd frontend && npm run build`

**Pass criteria:**
- Both commands exit with code 0
- Build produces dist/ with index.html
