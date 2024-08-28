/*
    add persistent column
    update notification types
*/

BEGIN;

ALTER TABLE notifications
DROP CONSTRAINT notifications_type_id_fkey;

DROP VIEW active_notifications;

DROP TRIGGER trigger_notifications_update_timestamp ON notifications;

DROP TRIGGER trigger_notifications_insert_audit ON notifications;

ALTER TABLE notifications
RENAME TO notifications_old;

DROP TABLE notification_types;

CREATE TABLE notification_types (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO
    notification_types (name)
VALUES
    ('Info'),
    ('Link Update'),
    ('Link Update With Accounts');

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    type_id INTEGER REFERENCES notification_types(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    persistent BOOLEAN NOT NULL,
    read BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


INSERT INTO
    notifications (type_id, user_id, item_id, message, persistent, read, active, create_timestamp, update_timestamp)
SELECT
    type_id,
    user_id,
    item_id,
    message,
    false AS persistent,
    read,
    active,
    create_timestamp,
    update_timestamp
FROM
    notifications_old
WHERE
    type_id = 1
UNION
SELECT
    type_id,
    user_id,
    item_id,
    message,
    true AS persistent,
    read,
    active,
    create_timestamp,
    update_timestamp
FROM
    notifications_old
WHERE
    type_id = 2
UNION
SELECT
    2 as type_id,
    user_id,
    item_id,
    message,
    false AS persistent,
    read,
    active,
    create_timestamp,
    update_timestamp
FROM
    notifications_old
WHERE
    type_id = 3
UNION
SELECT
    3 as type_id,
    user_id,
    item_id,
    message,
    false AS persistent,
    read,
    active,
    create_timestamp,
    update_timestamp
FROM
    notifications_old
WHERE
    type_id = 4;

DROP TABLE notifications_old;

CREATE TRIGGER trigger_notifications_update_timestamp
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_notifications_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE VIEW active_notifications AS
SELECT *
FROM notifications
WHERE active = TRUE;

COMMIT;