/*
    add liabilities tables, triggers
*/

BEGIN;

-- lookup tables
CREATE TABLE student_loan_status_types (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_loan_repayment_plan_types (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- lookup data
INSERT INTO
    student_loan_status_types (name)
VALUES
    ('Cancelled'),
    ('Charged Off'),
    ('Claim'),
    ('Consolidated'),
    ('Deferment'),
    ('Delinquent'),
    ('Discharged'),
    ('Extension'),
    ('Forbearance'),
    ('In Grace'),
    ('In Military'),
    ('In School'),
    ('Not Fully Disbursed'),
    ('Paid In Full'),
    ('Refunded'),
    ('Repayment'),
    ('Transferred'),
    ('Pending IDR'),
    ('Other');

INSERT INTO
    student_loan_repayment_plan_types (name)
VALUES
    ('Graduated'),
    ('Standard'),
    ('Extended Graduated'),
    ('Extended Standard'),
    ('Income Contingent Repayment (ICR)'),
    ('Income Based Repayment (IBR)'),
    ('Income Sensitive Repayment (ISR)'),
    ('Interest Only'),
    ('Pay As You Earn (PAYE)'),
    ('Revised Pay As You Earn (REPAYE)'),
    ('Saving on a Valuable Education (SAVE)'),
    ('Other');

-- liabilities tables
CREATE TABLE credit_card_liabilities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    account_id INTEGER UNIQUE REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    aprs JSON,
    overdue BOOLEAN,
    last_payment_date TIMESTAMPTZ,
    last_payment_amount DOUBLE PRECISION,
    last_statement_date TIMESTAMPTZ,
    last_statement_balance DOUBLE PRECISION,
    next_payment_due_date TIMESTAMPTZ,
    minimum_payment_amount DOUBLE PRECISION,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mortgage_liabilities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    account_id INTEGER UNIQUE REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    type TEXT,
    interest_rate_type TEXT,
    interest_rate_percent DOUBLE PRECISION,
    term TEXT,
    address TEXT,
    origination_date TIMESTAMPTZ,
    origination_principal DOUBLE PRECISION,
    maturity_date TIMESTAMPTZ,
    late_fee DOUBLE PRECISION,
    escrow_balance DOUBLE PRECISION,
    prepayment_penalty BOOLEAN,
    private_insurance BOOLEAN,
    past_due_amount DOUBLE PRECISION,
    last_payment_date TIMESTAMPTZ,
    last_payment_amount DOUBLE PRECISION,
    next_payment_due_date TIMESTAMPTZ,
    next_payment_amount DOUBLE PRECISION,
    ytd_interest_paid DOUBLE PRECISION,
    ytd_principal_paid DOUBLE PRECISION,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_loan_liabilities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    account_id INTEGER UNIQUE REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    name TEXT,
    interest_rate_percent DOUBLE PRECISION NOT NULL,
    status_type_id INTEGER REFERENCES student_loan_status_types(id),
    status_end_date TIMESTAMPTZ,
    overdue BOOLEAN,
    origination_date TIMESTAMPTZ,
    origination_principal DOUBLE PRECISION,
    disbursement_dates TEXT,
    outstanding_interest DOUBLE PRECISION,
    expected_payoff_date TIMESTAMPTZ,
    guarantor TEXT,
    servicer_address TEXT,
    repayment_plan_type_id INTEGER REFERENCES student_loan_repayment_plan_types(id),
    repayment_plan_description TEXT,
    last_payment_date TIMESTAMPTZ,
    last_payment_amount DOUBLE PRECISION,
    last_statement_date TIMESTAMPTZ,
    last_statement_balance DOUBLE PRECISION,
    next_payment_due_date TIMESTAMPTZ,
    minimum_payment_amount DOUBLE PRECISION,
    ytd_interest_paid DOUBLE PRECISION,
    ytd_principal_paid DOUBLE PRECISION,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- update timestamp triggers
CREATE TRIGGER trigger_credit_card_liabilities_update_timestamp
BEFORE UPDATE ON credit_card_liabilities
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_mortgage_liabilities_update_timestamp
BEFORE UPDATE ON mortgage_liabilities
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_student_loan_liabilities_update_timestamp
BEFORE UPDATE ON student_loan_liabilities
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

-- audit triggers
CREATE TRIGGER trigger_credit_card_liabilities_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON credit_card_liabilities
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_mortgage_liabilities_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON mortgage_liabilities
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_student_loan_liabilities_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON student_loan_liabilities
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

COMMIT;