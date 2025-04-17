/*
    add old row data column to audit
    insert audit record for row update only when row data other than update timestamp has changed
*/

BEGIN;

ALTER TABLE audit
ADD COLUMN old_row_data JSON;

CREATE OR REPLACE FUNCTION insert_audit_record()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit (operation, table_name, row_id, row_data, user_id)
        VALUES ('I', TG_TABLE_NAME, NEW.id, row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (hstore(OLD) - 'update_timestamp') IS DISTINCT FROM (hstore(NEW) - 'update_timestamp') THEN
            INSERT INTO audit (operation, table_name, row_id, old_row_data, row_data, user_id)
            VALUES ('U', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW), current_user);
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit (operation, table_name, row_id, row_data, user_id)
        VALUES ('D', TG_TABLE_NAME, OLD.id, row_to_json(OLD), current_user);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMIT;
