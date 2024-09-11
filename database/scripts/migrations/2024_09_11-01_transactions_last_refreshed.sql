/*
 add transactions_last_refreshed column, clear refreshed data
 */

BEGIN;

ALTER TABLE items
RENAME COLUMN last_synced TO transactions_last_refreshed;

UPDATE items
SET transactions_last_refreshed = null;

UPDATE items
SET last_refreshed = null;

COMMIT;