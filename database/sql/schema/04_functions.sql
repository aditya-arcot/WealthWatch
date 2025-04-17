CREATE FUNCTION core.set_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    new.update_timestamp = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION debug.insert_audit_record()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit (operation, table_name, row_id, row_data, user_id)
        VALUES ('I', TG_TABLE_NAME, NEW.id, row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (jsonb_strip_nulls(row_to_json(OLD)::jsonb) - 'update_timestamp') IS DISTINCT FROM (jsonb_strip_nulls(row_to_json(NEW)::jsonb) - 'update_timestamp') THEN
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