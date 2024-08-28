/*
    change deposit to cash & checks
    update transactions with detailed category withdrawal to cash & checks
    add spending group
*/

BEGIN;

-- rename deposit to cash & checks
UPDATE categories
SET name = 'Cash and Checks'
WHERE name = 'Deposit';

-- update transactions
UPDATE transactions
SET category_id = (
    SELECT id
    FROM categories
    WHERE name = 'Cash and Checks'
)
WHERE detailed_category = 'TRANSFER_OUT_WITHDRAWAL';

-- category group table
CREATE TABLE category_groups (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- seed category groups
INSERT INTO
    category_groups (name)
VALUES
    ('Earning'),
    ('Spending'),
    ('Ignored');

-- add category group to categories
ALTER TABLE categories
ADD group_id INTEGER REFERENCES category_groups(id);

UPDATE categories
SET group_id = 1
WHERE name = 'Income';

UPDATE categories
SET group_id = 3
WHERE name IN (
    'Transfer',
    'Investment',
    'Savings',
    'Loan Payment',
    'Credit Card Payment'
);

UPDATE categories
SET group_id = 2
WHERE group_id IS NULL;

ALTER TABLE categories
ALTER COLUMN group_id SET NOT NULL;

-- migrate create timestamp
ALTER TABLE categories
RENAME COLUMN create_timestamp TO create_timestamp_old;

ALTER TABLE categories
ADD create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE categories
SET create_timestamp = create_timestamp_old;

ALTER TABLE categories
DROP COLUMN create_timestamp_old;

COMMIT;