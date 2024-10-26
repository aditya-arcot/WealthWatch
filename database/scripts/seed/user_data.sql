BEGIN;

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
        'aarcot100',
        'arcot.aditya@utexas.edu',
        'Aditya',
        'Arcot',
        '$2a$10$y/oUd5B8qaopFIjiUCdxVuh8Zt0KLDPc5HOsRz.hncUMAL9UKnJfS',
        true
    );

COMMIT;