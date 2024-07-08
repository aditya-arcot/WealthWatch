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

-- INSERT INTO
--     categories (name)
-- VALUES
--     ('Groceries'),
--     ('Utilities'),
--     ('Entertainment'),
--     ('Transportation');

-- INSERT INTO
--     transactions (
--         account_id,
--         category_id,
--         amount,
--         description,
--         timestamp
--     )
-- VALUES
--     (1, 1, 50.25, 'HEB', '2024-06-15 13:24:00'),
--     (
--         1,
--         2,
--         100.00,
--         'Electricity bill',
--         '2024-06-16 09:45:00'
--     ),
--     (
--         2,
--         3,
--         35.00,
--         'Movie tickets',
--         '2024-06-18 20:15:00'
--     ),
--     (3, 4, 45.75, 'Gas', '2024-06-20 11:30:00');

COMMIT;