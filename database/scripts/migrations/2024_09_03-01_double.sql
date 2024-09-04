/*
    change numeric columns to double
*/

BEGIN;

DROP VIEW active_accounts;

ALTER TABLE accounts
ALTER COLUMN current_balance TYPE DOUBLE PRECISION;

ALTER TABLE accounts
ALTER COLUMN available_balance TYPE DOUBLE PRECISION;

ALTER TABLE accounts
ALTER COLUMN credit_limit TYPE DOUBLE PRECISION;

CREATE VIEW active_accounts AS
SELECT a.*
FROM accounts a
JOIN items i
    ON a.item_id = i.id
WHERE i.active = TRUE;

DROP VIEW active_transactions;

ALTER TABLE transactions
ALTER COLUMN amount TYPE DOUBLE PRECISION;

CREATE VIEW active_transactions AS
SELECT t.*
FROM transactions t
JOIN accounts a
    ON t.account_id = a.id
JOIN items i
    ON a.item_id = i.id
WHERE i.active = TRUE;

COMMIT;