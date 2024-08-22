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

COMMIT;