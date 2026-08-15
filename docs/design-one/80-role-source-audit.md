# Phase 2.9 Role Source Audit

## Scope

Environment: Development only.

Branch: `develop`.

Production, RLS, Auth and Sync architecture were not changed.

## Role Source

The app derives the runtime role from `profiles.roles`.

Flow:

1. Supabase Auth session is loaded.
2. `ensureCloudProfile()` loads or repairs `profiles`.
3. `toAuthUser()` converts cloud roles to local roles.
4. `getPrimaryRole()` decides the active role.

Cloud to local mapping:

| Cloud role | Local role |
|---|---|
| Athlete | athlete |
| Coach | coach |
| TeamAdmin | teamAdmin |
| ClubAdmin | clubAdmin |
| Admin | admin |

## Root Cause

`dev.coach@paddlio.test` was recognized as `Sportler` because the existing Development profile had only the Athlete fallback role. The app initially rendered a fallback profile during cloud refresh, and that fallback also used Athlete only.

## Fix

Development test accounts now have exact email-based role repair:

| Account | Repaired role |
|---|---|
| dev.coach@paddlio.test | Coach |
| dev.clubadmin@paddlio.test | ClubAdmin |
| dev.admin@paddlio.test | Admin |

This is limited to exact `@paddlio.test` Development accounts and does not change normal user role logic.

The fallback profile and cloud truth role conversion now use the same role builder, so the UI does not briefly show the wrong role while cloud data is loading.

## Remaining Data Issue

The Coach role is fixed, but the Development database still lacks a visible Coach-to-Athlete relation for the current test data. The Coach can open Coach Hub, but the planning form does not list the seeded Athlete.
