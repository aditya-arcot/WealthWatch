/*
    change transaction date to timestamp with timezone

    example:
    plaid transaction date      2024-08-20
    pre-migration db date       2024-08-20
    post-migration db date      2024-08-19 19:00:00.000 -0500
*/

DO $$ 
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date') != 'date' THEN
        RAISE EXCEPTION 'column is already timestamptz';
    END IF;
END $$;

BEGIN;

DROP VIEW IF EXISTS active_transactions;

ALTER TABLE transactions
ALTER COLUMN date TYPE TIMESTAMPTZ
USING (date + time '00:00:00') AT TIME ZONE 'UTC';

CREATE VIEW active_transactions AS
SELECT t.*
FROM transactions t
JOIN accounts a
    ON t.account_id = a.id
JOIN items i
    ON a.item_id = i.id
WHERE i.active = TRUE;

COMMIT;