-- UPDATE TIMESTAMP

CREATE TRIGGER trigger_access_requests_update_timestamp
BEFORE UPDATE ON access_requests
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_items_update_timestamp
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_accounts_update_timestamp
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_transactions_update_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_securities_update_timestamp
BEFORE UPDATE ON securities
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_holdings_update_timestamp
BEFORE UPDATE ON holdings
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_credit_cards_update_timestamp
BEFORE UPDATE ON credit_cards
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_mortgages_update_timestamp
BEFORE UPDATE ON mortgages
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_student_loans_update_timestamp
BEFORE UPDATE ON student_loans
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_notifications_update_timestamp
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

-- AUDIT

CREATE TRIGGER trigger_access_requests_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON access_requests
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_users_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_items_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON items
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_accounts_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON accounts
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_transactions_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_securities_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON securities
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_holdings_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON holdings
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_credit_cards_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON credit_cards
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_mortgages_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON mortgages
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_student_loans_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON student_loans
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();

CREATE TRIGGER trigger_notifications_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW
EXECUTE FUNCTION insert_audit_record();