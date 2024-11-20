/*
    drop and create new holdings view
*/

BEGIN;

DROP VIEW active_holdings;

CREATE VIEW core.holdings_with_security AS
SELECT 
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
JOIN securities s 
	ON h.security_id = s.id
ORDER BY h.account_id, h.id;

COMMIT;
