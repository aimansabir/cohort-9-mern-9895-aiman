-- Creates the users table backing signup, login and the authenticated profile
-- endpoint.
--
-- Design notes:
--   * `email` carries a UNIQUE index, which both enforces one account per
--     address and serves the login lookup. A second plain index on the same
--     column would be redundant, so none is declared.
--   * The utf8mb4_unicode_ci collation is case-insensitive, so addresses that
--     differ only by case collide at the unique index as well as being
--     lower-cased by the application before insertion.
--   * `password_hash` holds a bcrypt digest (60 characters for the `$2b$`
--     format); the column is wider to allow a future algorithm change without
--     data loss. Plaintext passwords are never stored.
--   * `INT UNSIGNED` keeps identifiers inside JavaScript's safe integer range.

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
