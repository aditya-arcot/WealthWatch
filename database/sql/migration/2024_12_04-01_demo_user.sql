/*
    create demo user
*/

INSERT INTO
    users (
        username,
        email,
        first_name,
        last_name,
        password_hash,
        admin
    )
VALUES
    (
        'demo_user',
        'demo@user',
        'Demo',
        'User',
        '$2a$10$Sg24QcAjUDufmcwYzd13jOsCeXrB/BPrnGQTtdNuIOGfFOn4dXBma',
        false
    );