"""Local-first LilyASI queue prototype. No network or model execution."""
import json
import sqlite3
import time
import uuid
from pathlib import Path

SCHEMA = """CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, lease_until REAL, checkpoint TEXT, result TEXT, created REAL NOT NULL); CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, job_id TEXT, event TEXT, created REAL);"""

class Runtime:
    def __init__(self, path):
        self.db = sqlite3.connect(str(Path(path)))
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        self.db.execute('PRAGMA journal_mode=WAL')

    def enqueue(self, kind, payload, job_id=None):
        job_id = job_id or str(uuid.uuid4())
        with self.db:
            self.db.execute('INSERT OR IGNORE INTO jobs(id,kind,payload,state,created) VALUES(?,?,?,?,?)', (job_id, kind, json.dumps(payload), 'queued', time.time()))
        return job_id

    def claim(self, lease_seconds=60, max_attempts=3):
        now = time.time()
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            row = self.db.execute("SELECT * FROM jobs WHERE (state='queued' OR (state='running' AND lease_until<?)) AND attempts<? ORDER BY created LIMIT 1", (now, max_attempts)).fetchone()
            if not row:
                return None
            self.db.execute("UPDATE jobs SET state='running', attempts=attempts+1, lease_until=? WHERE id=?", (now+lease_seconds, row['id']))
            return dict(self.db.execute('SELECT * FROM jobs WHERE id=?', (row['id'],)).fetchone())

    def checkpoint(self, job_id, data):
        with self.db:
            self.db.execute("UPDATE jobs SET checkpoint=? WHERE id=? AND state='running'", (json.dumps(data), job_id))

    def finish(self, job_id, result):
        with self.db:
            self.db.execute("UPDATE jobs SET state='done', result=?, lease_until=NULL WHERE id=? AND state='running'", (json.dumps(result), job_id))
            self.db.execute('INSERT INTO events(job_id,event,created) VALUES(?,?,?)', (job_id, 'finished', time.time()))

    def fail(self, job_id, error):
        with self.db:
            self.db.execute("UPDATE jobs SET state='failed', result=?, lease_until=NULL WHERE id=?", (json.dumps({'error': str(error)}), job_id))

    def get(self, job_id):
        row = self.db.execute('SELECT * FROM jobs WHERE id=?', (job_id,)).fetchone()
        return dict(row) if row else None

    def close(self):
        self.db.close()

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('database')
    p.add_argument('--status', action='store_true')
    args = p.parse_args()
    r = Runtime(args.database)
    if args.status:
        print(json.dumps([dict(x) for x in r.db.execute('SELECT id,kind,state,attempts FROM jobs ORDER BY created')]))
    r.close()
