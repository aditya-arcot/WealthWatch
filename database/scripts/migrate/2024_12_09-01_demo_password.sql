/*
    update demo user password
*/

UPDATE users
SET password_hash = ''
WHERE username = 'demo_user';