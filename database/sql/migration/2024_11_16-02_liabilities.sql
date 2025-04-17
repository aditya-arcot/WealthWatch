/*
    drop liabilities views
    rename liabilities tables
*/

BEGIN;

DROP VIEW active_credit_card_liabilities;

DROP VIEW active_mortgage_liabilities;

DROP VIEW active_student_loan_liabilities;

ALTER TABLE credit_card_liabilities RENAME TO credit_cards;

ALTER TABLE mortgage_liabilities RENAME TO mortgages;

ALTER TABLE student_loan_liabilities RENAME TO student_loans;

COMMIT;
