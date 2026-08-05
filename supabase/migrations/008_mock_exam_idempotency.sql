-- Handing the same paper in twice must mean the same as handing it in once.
--
-- The browser outbox mints a localId per paper and keeps sending until the
-- database confirms it. Two sends can overlap — the machine reports itself
-- online in the same moment the next student hands in — and 007's plain INSERT
-- would file both. Two rows for one sitting is not a cosmetic problem: 007
-- grants no UPDATE and no DELETE on this table, on purpose, so nobody can
-- correct it from the application. It needs somebody with database access, and
-- until they get there every average and every ranking drawn from these rows is
-- wrong by one paper.
--
-- So the outbox's own key travels with the paper and the index below refuses
-- the second copy. Deliberately not an upsert: an upsert needs the UPDATE
-- privilege 007 withholds, and withholding it is the whole guarantee — a
-- handed-in paper is a record of what somebody wrote at a moment. The database
-- says no, and the client reads that no as "already safely stored".

ALTER TABLE mock_exam_results
    ADD COLUMN IF NOT EXISTS local_id TEXT;

COMMENT ON COLUMN mock_exam_results.local_id IS
    'Idempotency key minted by the browser outbox. NULL for rows written before this column existed and for any write that did not come through the outbox.';

-- Partial, so the rows already in the table are untouched: they all have no
-- local_id, and a plain unique index would read them as copies of each other.
CREATE UNIQUE INDEX IF NOT EXISTS mock_exam_results_local_id_key
    ON mock_exam_results(local_id)
    WHERE local_id IS NOT NULL;
