CREATE VIEW core.active_items AS
SELECT *
FROM items
WHERE active = TRUE
ORDER BY id;

CREATE VIEW core.active_accounts AS
SELECT ai.user_id, a.*
FROM accounts a
JOIN active_items ai
    ON a.item_id = ai.id
WHERE a.active = TRUE
ORDER BY a.id;

CREATE VIEW core.active_transactions AS
SELECT a.user_id, t.*
FROM transactions t
JOIN active_accounts a
    ON t.account_id = a.id
ORDER BY t.date DESC, t.id;

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

CREATE VIEW core.active_credit_card_liabilities AS
SELECT a.user_id, c.*
FROM credit_card_liabilities c
JOIN active_accounts a
    ON c.account_id = a.id
ORDER BY c.id;

CREATE VIEW core.active_mortgage_liabilities AS
SELECT a.user_id, m.*
FROM mortgage_liabilities m
JOIN active_accounts a
    ON m.account_id = a.id
ORDER BY m.id;

CREATE VIEW core.active_student_loan_liabilities AS
SELECT a.user_id, s.*
FROM student_loan_liabilities s
JOIN active_accounts a
    ON s.account_id = a.id
ORDER BY s.id;

CREATE VIEW core.active_notifications AS
SELECT *
FROM notifications
WHERE active = TRUE
ORDER BY id DESC;