# Tonino Supabase Setup

This folder contains the first database migration for the Tonino supply app.

## What is included

- Real branches, including Qartaba, City Mall, and Kfardebian.
- Stock items with the configured launch prices.
- Branch ownership flags for franchise and free-supply branches.
- Stock batches with production date, expiry date, batch number, and quantity.
- Order, approval, cancellation, delivery, invoice, and payment tracking tables.
- Row-level security policies for admin, warehouse, finance, driver, supplier, and branch manager roles.

## Apply the database migration

In Supabase:

1. Open your project.
2. Go to `SQL Editor`.
3. Open `supabase/migrations/20260622120000_initial_schema.sql`.
4. Paste the full SQL into Supabase.
5. Run it once.

## Connect the app

Create `mobile/.env` using the values from Supabase `Project Settings > API`:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Do not commit `mobile/.env`.

## User accounts

The app will use username and password, but Supabase Auth needs email internally.
The app converts usernames into internal emails like this:

```text
aley -> aley@toninocrepes.com
furn-el-chebbak -> furn-el-chebbak@toninocrepes.com
```

For production, create users in Supabase Auth, then add a matching row in `profiles`
with the same user id, username, role, and branch.

For the initial user accounts, run the setup script from the repo root:

```powershell
$env:SUPABASE_URL='https://your-project-ref.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
node scripts/create-supabase-users.js
```

The script creates admin, warehouse, finance, driver, supplier, and all branch users.
The admin password defaults to `1234`; every other user receives a randomized password
that is printed by the script after setup.
