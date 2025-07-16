-- Migration 003: User Management Features
-- Add tables for feedback, enhanced notifications, and user preferences

-- User feedback and ratings table
CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bug_report', 'feature_request', 'general_feedback', 'rating')),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    metadata TEXT, -- JSON field for additional data
    resolved_at TEXT,
    admin_response TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- User notifications table (enhanced)
CREATE TABLE IF NOT EXISTS user_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'push', 'in_app')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON field for additional data
    read INTEGER NOT NULL DEFAULT 0,
    sent INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    scheduled_for TEXT,
    sent_at TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id TEXT PRIMARY KEY,
    email_notifications INTEGER NOT NULL DEFAULT 1,
    push_notifications INTEGER NOT NULL DEFAULT 1,
    marketing_emails INTEGER NOT NULL DEFAULT 0,
    security_alerts INTEGER NOT NULL DEFAULT 1,
    system_updates INTEGER NOT NULL DEFAULT 1,
    newsletter INTEGER NOT NULL DEFAULT 0,
    frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- User onboarding progress table
CREATE TABLE IF NOT EXISTS user_onboarding (
    user_id TEXT PRIMARY KEY,
    completed_steps TEXT, -- JSON array of completed step IDs
    current_step TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    skipped INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback (type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback (status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback (created_at);
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback (rating);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications (type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications (read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_sent ON user_notifications (sent);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_scheduled_for ON user_notifications (scheduled_for);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed_at ON user_onboarding (completed_at);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_current_step ON user_onboarding (current_step);
