/*
 recreate active_items view
 */

BEGIN;

DROP VIEW active_items;

CREATE VIEW active_items AS
SELECT *
FROM items
WHERE active = TRUE;

COMMIT;