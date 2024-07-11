START TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    item_id TEXT NOT NULL,
    mask TEXT,
    type TEXT NOT NULL,
    subtype TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

COMMIT;