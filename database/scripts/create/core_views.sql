CREATE VIEW active_items AS
SELECT *
FROM items
WHERE active = TRUE;

CREATE VIEW active_notifications AS
SELECT *
FROM notifications
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

CREATE VIEW active_holdings AS
SELECT h.*
FROM holdings h
JOIN accounts a
    ON h.account_id = a.id
JOIN items i
    ON a.item_id = i.id
WHERE i.active = TRUE;