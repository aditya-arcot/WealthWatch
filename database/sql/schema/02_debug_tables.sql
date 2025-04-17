CREATE TABLE debug.audit (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    operation CHAR(1) NOT NULL CHECK (operation IN ('I', 'U', 'D')),
    table_name TEXT NOT NULL,
    row_id INTEGER NOT NULL,
    old_row_data JSON,
    row_data JSON NOT NULL,
    user_id TEXT NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE debug.app_requests (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    request_id TEXT NOT NULL,
    user_id INTEGER,
    timestamp TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    query_params JSON,
    route_params JSON,
    request_headers JSON,
    request_body JSON,
    remote_address TEXT,
    remote_port INTEGER,
    session JSON,
    response_status INTEGER NOT NULL,
    response_headers JSON,
    response_body TEXT, -- cannot use JSON. swagger responses are not JSON
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE debug.plaid_link_events (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER,
    timestamp TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    request_id TEXT,
    institution_id TEXT,
    institution_name TEXT,
    public_token TEXT,
    status TEXT,
    error_type TEXT,
    error_code TEXT,
    error_message TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE debug.plaid_api_requests (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER,
    item_id INTEGER,
    timestamp TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    method TEXT NOT NULL,
    params JSON NOT NULL,
    response JSON,
    error_code TEXT,
    error_type TEXT,
    error_message TEXT,
    error_response TEXT,
    error_stack TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE debug.jobs (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    queue_name TEXT NOT NULL,
    job_id TEXT,
    job_name TEXT,
    success BOOLEAN NOT NULL,
    data JSON,
    error_name TEXT,
    error_message TEXT,
    error_stack TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);