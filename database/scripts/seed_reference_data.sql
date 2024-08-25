START TRANSACTION;

INSERT INTO
    categories (name)
VALUES
    ('Uncategorized'),
    ('Income'),
    ('Transfer'),
    ('Deposit'),
    ('Investment'),
    ('Savings'),
    ('Loan Payment'),
    ('Credit Card Payment'),
    ('Fees'),
    ('Entertainment'),
    ('Food and Drink'),
    ('Groceries'),
    ('Merchandise'),
    ('Medical'),
    ('Personal Care'),
    ('Services'),
    ('Government'),
    ('Donations'),
    ('Taxes'),
    ('Transportation'),
    ('Travel'),
    ('Bills');

INSERT INTO
    notification_types (name)
VALUES
    ('Info'),
    ('Link Update Required'),
    ('Link Update Optional'),
    ('Link Update Optional - New Accounts');

COMMIT;