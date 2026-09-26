-- Cloudflare D1 SQL Schema for Redirector
-- Edge-optimized SQLite database

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK(role IN ('USER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. OAuth Accounts Table (GitHub & Google)
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK(provider IN ('github', 'google')),
    provider_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);

-- 3. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- 4. Redirects Table (Core Data Model)
CREATE TABLE IF NOT EXISTS redirects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'SUSPENDED', 'DELETED')),
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_redirects_slug ON redirects(slug);
CREATE INDEX IF NOT EXISTS idx_redirects_user ON redirects(user_id);
CREATE INDEX IF NOT EXISTS idx_redirects_status ON redirects(status);

-- 5. Redirect Version History (Destination changes audit)
CREATE TABLE IF NOT EXISTS redirect_versions (
    id TEXT PRIMARY KEY,
    redirect_id TEXT NOT NULL REFERENCES redirects(id) ON DELETE CASCADE,
    destination_url TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_versions_redirect ON redirect_versions(redirect_id);

-- 6. Redirect Events Table (Asynchronous click analytics)
CREATE TABLE IF NOT EXISTS redirect_events (
    id TEXT PRIMARY KEY,
    redirect_id TEXT NOT NULL REFERENCES redirects(id) ON DELETE CASCADE,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    country TEXT DEFAULT 'Unknown',
    device TEXT DEFAULT 'Desktop',
    browser TEXT DEFAULT 'Other',
    referrer TEXT DEFAULT 'Direct'
);

CREATE INDEX IF NOT EXISTS idx_events_redirect ON redirect_events(redirect_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON redirect_events(timestamp);

-- 7. Abuse Reports Table (Moderation & Phishing prevention)
CREATE TABLE IF NOT EXISTS abuse_reports (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    reporter_ip_hash TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_abuse_status ON abuse_reports(status);
CREATE INDEX IF NOT EXISTS idx_abuse_slug ON abuse_reports(slug);

-- 8. Audit Logs Table (Admin & System security audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    metadata TEXT,
    ip_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 9. Seed Data (Initial Admin & Demo Link)
INSERT OR IGNORE INTO users (id, email, name, avatar_url, role, status)
VALUES (
    'usr_admin_default',
    'admin@redirector.dev',
    'Administrator',
    'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    'ADMIN',
    'ACTIVE'
);

INSERT OR IGNORE INTO redirects (id, user_id, slug, destination_url, title, status, click_count)
VALUES (
    'rd_demo_github',
    'usr_admin_default',
    'github',
    'https://github.com/SudiptaSanki/Redirector',
    'Redirector GitHub Repository',
    'ACTIVE',
    42
);
