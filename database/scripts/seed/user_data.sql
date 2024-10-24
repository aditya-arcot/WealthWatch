BEGIN;

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

COMMIT;