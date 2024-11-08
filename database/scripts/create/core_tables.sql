CREATE TABLE core.access_requests (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    status_id INTEGER REFERENCES access_request_statuses(id) NOT NULL,
    access_code TEXT UNIQUE,
    reviewer TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE core.users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    admin BOOLEAN NOT NULL DEFAULT FALSE,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE core.items (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    plaid_id TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL,
    access_token TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    healthy BOOLEAN NOT NULL,
    cursor TEXT,
    last_refreshed TIMESTAMPTZ,
    transactions_last_refreshed TIMESTAMPTZ,
    investments_last_refreshed TIMESTAMPTZ,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE core.accounts (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE NOT NULL,
    plaid_id TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL,
    name TEXT NOT NULL,
    mask TEXT,
    official_name TEXT,
    current_balance DOUBLE PRECISION,
    available_balance DOUBLE PRECISION,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    credit_limit DOUBLE PRECISION,
    type TEXT NOT NULL,
    subtype TEXT NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE core.notifications (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    type_id INTEGER REFERENCES notification_types(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    persistent BOOLEAN NOT NULL,
    read BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE core.transactions (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    plaid_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    custom_name TEXT,
    amount DOUBLE PRECISION NOT NULL,
    primary_category TEXT,
    detailed_category TEXT,
    category_id INTEGER REFERENCES categories(id) NOT NULL,
    custom_category_id INTEGER REFERENCES categories(id),
    payment_channel TEXT NOT NULL,
    merchant_id TEXT,
    merchant TEXT,
    location TEXT,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    date TIMESTAMPTZ NOT NULL,
    pending BOOLEAN NOT NULL,
    note TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT transactions_payment_channel_check CHECK (payment_channel IN ('online', 'in_store', 'other'))
);

CREATE TABLE core.securities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    plaid_id TEXT UNIQUE NOT NULL,
    proxy_plaid_id TEXT,
    institution_id TEXT,
    institution_security_id TEXT,
    name TEXT,
    type_id INTEGER REFERENCES security_types(id) NOT NULL,
    ticker TEXT,
    market_code TEXT,
    cash_equivalent BOOLEAN NOT NULL,
    close_price DOUBLE PRECISION,
    close_price_as_of TIMESTAMPTZ,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE core.holdings (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    security_id INTEGER REFERENCES securities(id) ON DELETE CASCADE NOT NULL,
    cost_basis DOUBLE PRECISION,
    price DOUBLE PRECISION NOT NULL,
    price_as_of TIMESTAMPTZ,
    quantity DOUBLE PRECISION NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    vested_quantity DOUBLE PRECISION,
    vested_value DOUBLE PRECISION,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT holdings_account_security_unique UNIQUE (account_id, security_id)
);

CREATE TABLE core.credit_card_liabilities (
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

CREATE TABLE core.mortgage_liabilities (
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

CREATE TABLE core.student_loan_liabilities (
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