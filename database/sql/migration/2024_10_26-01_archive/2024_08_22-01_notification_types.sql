/*
    add notification types
*/

BEGIN;

CREATE TABLE notification_types (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO
    notification_types (name)
VALUES
    ('Info'),
    ('Link Update Required'),
    ('Link Update Optional'),
    ('Link Update Optional - New Accounts');

CREATE TABLE notifications_migrate (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    type_id INTEGER REFERENCES notification_types(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO notifications_migrate (type_id, user_id, message, read, active, create_timestamp, update_timestamp)
SELECT 1 AS type_id, user_id, message, read, active, create_timestamp, update_timestamp
FROM notifications;

DROP VIEW active_notifications;

DROP TABLE notifications;

ALTER TABLE notifications_migrate 
RENAME TO notifications;

ALTER SEQUENCE notifications_migrate_id_seq RENAME TO notifications_id_seq;

ALTER TABLE notifications
RENAME CONSTRAINT notifications_migrate_pkey TO notifications_pkey;

ALTER TABLE notifications
RENAME CONSTRAINT notifications_migrate_type_id_fkey TO notifications_type_id_fkey;

ALTER TABLE notifications
RENAME CONSTRAINT notifications_migrate_user_id_fkey TO notifications_user_id_fkey;

ALTER TABLE notifications
RENAME CONSTRAINT notifications_migrate_item_id_fkey TO notifications_item_id_fkey;

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