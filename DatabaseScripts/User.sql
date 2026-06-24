

CREATE TABLE users (
    user_id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username                     VARCHAR(50)     NOT NULL UNIQUE,
    email                        VARCHAR(150)    NOT NULL UNIQUE,
    password_hash                VARCHAR(255)    NOT NULL,
    first_name                   VARCHAR(100)    NOT NULL,
    last_name                    VARCHAR(100)    NOT NULL,
    auth_provider                VARCHAR(20)     NOT NULL DEFAULT 'local',
    profile_photo_url            TEXT,
    profile_photo_locked         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at                   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);