/*
    add investments last refreshed column to items table
*/

ALTER TABLE items
ADD COLUMN investments_last_refreshed TIMESTAMPTZ;

DROP VIEW active_items;

CREATE VIEW active_items AS
SELECT *
FROM items
WHERE active = TRUE;