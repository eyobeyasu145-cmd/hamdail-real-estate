# PostgreSQL Database Setup Script

You can copy and paste the entire SQL script below directly into your PostgreSQL query tool (such as **pgAdmin**, **DBeaver**, or the `psql` command line).

---

```sql
-- ========================================================
-- 1. DATABASE CREATION (Run separately or in psql)
-- ========================================================
-- CREATE DATABASE realestate_db;
-- \c realestate_db;

-- ========================================================
-- 2. CREATE ENUM TYPES (Custom Statuses & Roles)
-- ========================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Agent', 'Owner', 'Tenant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('Available', 'Rented', 'Under Maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lease_status AS ENUM ('Active', 'Terminated', 'Expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('Bank Transfer', 'Cash', 'Mobile Money', 'Cheque');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('Pending', 'Completed', 'Failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_priority AS ENUM ('Low', 'Medium', 'High', 'Emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_status AS ENUM ('Pending', 'In Progress', 'Resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================================
-- 3. USERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS users (
    user_id        SERIAL PRIMARY KEY,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    role           user_role NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 4. PROPERTIES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS properties (
    property_id    SERIAL PRIMARY KEY,
    owner_id       INT NOT NULL,
    agent_id       INT NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    address        TEXT NOT NULL,
    price          NUMERIC(15, 2) NOT NULL,
    status         property_status NOT NULL DEFAULT 'Available',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_properties_owner
        FOREIGN KEY (owner_id) REFERENCES users(user_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_properties_agent
        FOREIGN KEY (agent_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- ========================================================
-- 5. LEASES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS leases (
    lease_id       SERIAL PRIMARY KEY,
    property_id    INT NOT NULL,
    tenant_id      INT NOT NULL,
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    rent_amount    NUMERIC(15, 2) NOT NULL,
    status         lease_status NOT NULL DEFAULT 'Active',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_leases_property
        FOREIGN KEY (property_id) REFERENCES properties(property_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_leases_tenant
        FOREIGN KEY (tenant_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- ========================================================
-- 6. PAYMENTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id     SERIAL PRIMARY KEY,
    lease_id       INT NOT NULL,
    amount         NUMERIC(15, 2) NOT NULL,
    payment_date   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method payment_method NOT NULL,
    status         payment_status NOT NULL DEFAULT 'Pending',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_lease
        FOREIGN KEY (lease_id) REFERENCES leases(lease_id)
        ON DELETE RESTRICT
);

-- ========================================================
-- 7. MAINTENANCE REQUESTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    request_id     SERIAL PRIMARY KEY,
    property_id    INT NOT NULL,
    tenant_id      INT NOT NULL,
    description    TEXT NOT NULL,
    priority       maintenance_priority NOT NULL DEFAULT 'Medium',
    status         maintenance_status NOT NULL DEFAULT 'Pending',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_maint_property
        FOREIGN KEY (property_id) REFERENCES properties(property_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_maint_tenant
        FOREIGN KEY (tenant_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- ========================================================
-- 8. INDEXES FOR HIGH PERFORMANCE
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_properties_owner   ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent   ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_leases_property    ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant      ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease     ON payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_maint_property     ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maint_tenant       ON maintenance_requests(tenant_id);
```
