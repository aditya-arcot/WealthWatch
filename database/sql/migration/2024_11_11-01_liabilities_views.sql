/*
    create liabilities views
*/

BEGIN;

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

COMMIT;