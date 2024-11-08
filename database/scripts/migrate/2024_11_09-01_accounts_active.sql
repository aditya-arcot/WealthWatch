/*
    add active column to accounts
*/

BEGIN;

ALTER TABLE accounts
ADD COLUMN active BOOLEAN DEFAULT TRUE;

ALTER TABLE accounts
ALTER COLUMN active SET NOT NULL;

DROP VIEW active_accounts CASCADE;

CREATE VIEW core.active_accounts AS
SELECT ai.user_id, a.*
FROM accounts a
JOIN active_items ai
    ON a.item_id = ai.id
WHERE a.active = TRUE
ORDER BY a.id;

CREATE VIEW core.active_transactions AS
SELECT aa.user_id, t.*
FROM transactions t
JOIN active_accounts aa
    ON t.account_id = aa.id
ORDER BY t.date DESC, t.id;

CREATE VIEW core.active_holdings AS
SELECT 
	aa.user_id,
    h.id,
    h.account_id,
    s.name,
    s.type_id,
    s.cash_equivalent,
    s.ticker,
    s.market_code,
    h.price,
    h.price_as_of,
    s.close_price,
    s.close_price_as_of,
    h.quantity,
    h.value,
    h.cost_basis,
    h.iso_currency_code,
    h.unofficial_currency_code,
    h.create_timestamp,
    h.update_timestamp
FROM holdings h
JOIN active_accounts aa
    ON h.account_id = aa.id
JOIN securities s 
	ON h.security_id = s.id
ORDER BY h.account_id, h.id;

COMMIT;