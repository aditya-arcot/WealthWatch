INSERT INTO
    users (id, username, email, first_name, last_name)
VALUES
    (0, 'user1', 'user1@domain.com', 'User', '1');

INSERT INTO
    accounts (id, user_id, name)
VALUES
    (0, 0, 'Account 1');

INSERT INTO
    categories (id, name)
VALUES
    (0, 'Category 1');

INSERT INTO
    transactions (id, account_id, category_id, amount, description)
VALUES
    (0, 0, 0, 9.99, 'Transaction 1');