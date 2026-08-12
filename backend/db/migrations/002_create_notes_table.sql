-- Creates the notes table for user-owned note storage. Every note belongs to
-- exactly one user; ownership is enforced in every query, not only at the
-- application layer.
--
-- Design notes:
--   * `MEDIUMTEXT` stores up to 16 MB, which accommodates the rich-text HTML
--     that the future editor will produce. The application validates a smaller
--     ceiling (~5 MB) to catch abuse before it reaches the database.
--   * The composite index on `(user_id, updated_at)` covers the list query
--     that filters by user and sorts by recency, so MySQL can satisfy it with
--     an index scan rather than a filesort.
--   * `ON DELETE CASCADE` removes orphaned notes when a user account is deleted.
--   * `INT UNSIGNED` keeps identifiers inside JavaScript's safe integer range,
--     consistent with the users table.

CREATE TABLE IF NOT EXISTS notes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(255) NOT NULL,
  content    MEDIUMTEXT   NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX      idx_notes_user_id_updated (user_id, updated_at DESC),
  CONSTRAINT fk_notes_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
