/*
 add transactions_last_refreshed column, clear refreshed data
 */

BEGIN;

ALTER TABLE items
RENAME COLUMN last_synced TO transactions_last_refreshed;

UPDATE items
SET transactions_last_refreshed = null;

ALTER TABLE items
SET last_refreshed = null;

COMMIT;