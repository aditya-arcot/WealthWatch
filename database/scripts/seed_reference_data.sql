START TRANSACTION;

INSERT INTO
    category_groups (name)
VALUES
    ('Earning'),
    ('Spending'),
    ('Ignored');

INSERT INTO
    categories (name, group_id)
VALUES
    ('Uncategorized', 2),
    ('Income', 1),
    ('Transfer', 3),
    ('Cash and Checks', 2),
    ('Investment', 3),
    ('Savings', 3),
    ('Loan Payment', 3),
    ('Credit Card Payment', 3),
    ('Fees', 2),
    ('Entertainment', 2),
    ('Food and Drink', 2),
    ('Groceries', 2),
    ('Merchandise', 2),
    ('Medical', 2),
    ('Personal Care', 2),
    ('Services', 2),
    ('Government', 2),
    ('Donations', 2),
    ('Taxes', 2),
    ('Transportation', 2),
    ('Travel', 2),
    ('Bills', 2),
    ('Ignored', 3);

INSERT INTO
    notification_types (name)
VALUES
    ('Info'),
    ('Link Update'),
    ('Link Update With Accounts');

INSERT INTO
    security_types (name)
VALUES
    ('Cash'),
    ('Cryptocurrency'),
    ('Derivative'),
    ('Equity'),
    ('ETF'),
    ('Fixed Income'),
    ('Loan'),
    ('Mutual Fund'),
    ('Other');

COMMIT;