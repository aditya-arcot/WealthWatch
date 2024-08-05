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
        -- password: testing1
        '$2a$10$AazhJB7WNHF/VkWStyn6XO70pmLJuXzX0FDhzPZN/JJacPdWcnENK'
    ),
    (
        'jane_smith',
        'jane.smith@example.com',
        'Jane',
        'Smith',
        -- password: testing2
        '$2a$10$F16gzv/XcgRJ/vuoRb0FauvGl9Semq2QtoccWYj/6EcxiUEfeiTbG'
    );

INSERT INTO
    categories (id, name)
VALUES
    (0, 'Income'),
    (1, 'Transfer In'),
    (2, 'Transfer Out'),
    (3, 'Loan Payment'),
    (4, 'Fees'),
    (5, 'Entertainment'),
    (6, 'Food and Drink'),
    (7, 'Merchandise'),
    (8, 'Medical'),
    (9, 'Personal Care'),
    (10, 'Services'),
    (11, 'Government and Charity'),
    (12, 'Transportation'),
    (13, 'Travel'),
    (14, 'Bills and Utilities'),
    (15, 'Other'),
    (16, 'Ignored');

COMMIT;