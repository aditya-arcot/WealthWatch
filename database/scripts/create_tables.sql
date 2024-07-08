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

-- CREATE TABLE IF NOT EXISTS balances (
--     id SERIAL PRIMARY KEY,
--     account_id INTEGER NOT NULL,
--     amount REAL NOT NULL,
--     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
--     FOREIGN KEY (account_id) REFERENCES accounts(id)
-- );

-- CREATE TABLE IF NOT EXISTS categories (
--     id SERIAL PRIMARY KEY,
--     name TEXT NOT NULL
-- );

-- CREATE TABLE IF NOT EXISTS transactions (
--     id SERIAL PRIMARY KEY,
--     account_id INTEGER NOT NULL,
--     category_id INTEGER NOT NULL,
--     amount REAL NOT NULL,
--     description TEXT NOT NULL,
--     nickname TEXT,
--     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
--     FOREIGN KEY (account_id) REFERENCES accounts(id),
--     FOREIGN KEY (category_id) REFERENCES categories(id)
-- );

COMMIT;