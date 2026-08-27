-- A note can be starred and given one colour label. Both are optional, so
-- notes that already exist keep working on the defaults.

ALTER TABLE notes
  ADD COLUMN is_favourite TINYINT(1)  NOT NULL DEFAULT 0,
  ADD COLUMN label        VARCHAR(20) NOT NULL DEFAULT '';
