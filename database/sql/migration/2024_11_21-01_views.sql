/*
    update active transactions view
    create active holdings, liabilities views
*/

BEGIN;

DROP VIEW core.active_transactions;

CREATE VIEW core.active_transactions AS
SELECT a.user_id, t.*
FROM transactions t
JOIN active_accounts a
    ON t.account_id = a.id
ORDER BY t.date DESC, t.account_id, t.id;

CREATE VIEW core.active_holdings_with_security AS
SELECT a.user_id, h.*
FROM holdings_with_security h
JOIN active_accounts a
    ON h.account_id = a.id
ORDER BY h.account_id, h.id;

CREATE VIEW core.active_credit_cards AS
SELECT a.user_id, c.*
FROM credit_cards c
JOIN active_accounts a
    ON c.account_id = a.id
ORDER BY c.account_id, c.id;

CREATE VIEW core.active_mortgages AS
SELECT a.user_id, m.*
FROM mortgages m
JOIN active_accounts a
    ON m.account_id = a.id
ORDER BY m.account_id, m.id;

CREATE VIEW core.active_student_loans AS
SELECT a.user_id, s.*
FROM student_loans s
JOIN active_accounts a
    ON s.account_id = a.id
ORDER BY s.account_id, s.id;

COMMIT;