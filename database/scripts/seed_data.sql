START TRANSACTION;

INSERT INTO
    users (
        username,
        email,
        first_name,
        last_name,
        password_hash
    )
VALUES
    (
        'john_doe',
        'john.doe@example.com',
        'John',
        'Doe',
        -- password: test
        '$2a$10$se487z9CUvLL0fColtXwBuf/JhKO3Of90j.UsCP1bETP9IuygLUZ6'
    ),
    (
        'jane_smith',
        'jane.smith@example.com',
        'Jane',
        'Smith',
        -- password: test2
        '$2a$10$hRfjKvwkD07tS17fxRF12uPiKcmMivtwkzWIxZIOoW5pZyH/VxuDe'
    );

INSERT INTO
    accounts (user_id, name)
VALUES
    (1, 'Savings Account'),
    (1, 'Checking Account'),
    (2, 'Investment Account');

INSERT INTO
    categories (name)
VALUES
    ('Groceries'),
    ('Utilities'),
    ('Entertainment'),
    ('Transportation');

INSERT INTO
    transactions (
        account_id,
        category_id,
        amount,
        description,
        timestamp
    )
VALUES
    (1, 1, 50.25, 'HEB', '2024-06-15 13:24:00'),
    (
        1,
        2,
        100.00,
        'Electricity bill',
        '2024-06-16 09:45:00'
    ),
    (
        2,
        3,
        35.00,
        'Movie tickets',
        '2024-06-18 20:15:00'
    ),
    (3, 4, 45.75, 'Gas', '2024-06-20 11:30:00');

COMMIT;