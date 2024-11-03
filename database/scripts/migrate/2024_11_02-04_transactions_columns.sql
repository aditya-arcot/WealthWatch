/*
    add payment channel constraint
    add location column
*/

BEGIN;

ALTER TABLE transactions
ADD CONSTRAINT transactions_payment_channel_check 
CHECK (payment_channel IN ('online', 'in_store', 'other'));

ALTER TABLE transactions
ADD COLUMN location TEXT;

COMMIT;