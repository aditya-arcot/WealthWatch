/*
    add payment channel constraint
    add location column
*/

BEGIN;

UPDATE transactions
SET payment_channel = 'in_store'
WHERE payment_channel = 'in store';

ALTER TABLE transactions
ADD CONSTRAINT transactions_payment_channel_check 
CHECK (payment_channel IN ('online', 'in_store', 'other'));

ALTER TABLE transactions
ADD COLUMN location TEXT;

COMMIT;