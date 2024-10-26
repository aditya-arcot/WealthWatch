/*
 investment tables
 */

BEGIN;

CREATE TABLE security_types (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO
    security_types (name)
VALUES
    ('Cash'),
    ('Cryptocurrency'),
    ('Derivative'),
    ('Equity'),
    ('ETF'),
    ('Fixed Income'),
    ('Loan'),
    ('Mutual Fund'),
    ('Other');

CREATE TABLE securities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    plaid_id TEXT UNIQUE NOT NULL,
    proxy_plaid_id TEXT,
    institution_id TEXT,
    institution_security_id TEXT,
    name TEXT,
    type_id INTEGER REFERENCES security_types(id) NOT NULL,
    ticker TEXT,
    market_code TEXT,
    cash_equivalent BOOLEAN NOT NULL,
    close_price DOUBLE PRECISION,
    close_price_as_of TIMESTAMPTZ,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_securities_update_timestamp
BEFORE UPDATE ON securities
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_securities_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON securities
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TABLE holdings (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    security_id INTEGER REFERENCES securities(id) ON DELETE CASCADE NOT NULL,
    cost_basis DOUBLE PRECISION,
    price DOUBLE PRECISION NOT NULL,
    price_as_of TIMESTAMPTZ,
    quantity DOUBLE PRECISION NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    vested_quantity DOUBLE PRECISION,
    vested_value DOUBLE PRECISION,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT holdings_account_security_unique UNIQUE (account_id, security_id)
);

CREATE TRIGGER trigger_holdings_update_timestamp
BEFORE UPDATE ON holdings
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_holdings_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON holdings
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE VIEW active_holdings AS
SELECT h.*
FROM holdings h
JOIN accounts a
    ON h.account_id = a.id
JOIN items i
    ON a.item_id = i.id
WHERE i.active = TRUE;

COMMIT;