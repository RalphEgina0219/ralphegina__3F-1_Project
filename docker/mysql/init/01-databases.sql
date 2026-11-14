-- Runs once, when the db container starts with an empty data volume (compose.yaml).
-- The image has already created the "laundryflow" database and user (MYSQL_DATABASE, MYSQL_USER).
-- laundryflow_test is for the backend's tests (composer test / npm run backend:test).
CREATE DATABASE IF NOT EXISTS laundryflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS laundryflow_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON laundryflow.* TO 'laundryflow'@'%';
GRANT ALL PRIVILEGES ON laundryflow_test.* TO 'laundryflow'@'%';
FLUSH PRIVILEGES;
