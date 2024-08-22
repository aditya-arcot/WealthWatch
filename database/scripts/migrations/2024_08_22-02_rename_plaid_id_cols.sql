/*
    rename plaid id columns
*/

BEGIN;

ALTER TABLE items
RENAME COLUMN item_id TO plaid_id;

ALTER TABLE accounts
RENAME COLUMN account_id TO plaid_id;

ALTER TABLE transactions
RENAME COLUMN transaction_id TO plaid_id;

DROP VIEW active_items;

DROP VIEW active_accounts;

DROP VIEW active_transactions;

CREATE VIEW active_items AS
SELECT *
FROM items
WHERE active = TRUE;

CREATE VIEW active_accounts AS
SELECT a.*
FROM accounts a
JOIN items i
    ON a.item_id = i.id
WHERE i.active = TRUE;

CREATE VIEW active_transactions AS
SELECT t.*
FROM transactions t
JOIN accounts a
    ON t.account_id = a.id
JOIN items i
    ON a.item_id = i.id
WHERE i.active = TRUE;

COMMIT;