import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const dataDirectory = process.env.BUGTRAIL_DATA_DIR ?? resolve(__dirname, "../data");

mkdirSync(dataDirectory, { recursive: true });

export const db = new DatabaseSync(
  resolve(dataDirectory, "bugtrail.sqlite")
);

db.exec(`
  CREATE TABLE IF NOT EXISTS errors (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    technology TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Open', 'Resolved'))
  )
`);

// Add fields to existing databases without replacing saved entries.
const columns = db.prepare('PRAGMA table_info(errors)').all();
for (const column of ['message', 'context', 'cause', 'solution', 'references', 'project', 'packageName', 'packageVersion']) {
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE errors ADD COLUMN "${column}" TEXT NOT NULL DEFAULT ''`);
  }
}

 db.exec(`
 CREATE TABLE IF NOT EXISTS attempts (
   id TEXT PRIMARY KEY, errorId TEXT NOT NULL REFERENCES errors(id),
   description TEXT NOT NULL, outcome TEXT NOT NULL, createdAt TEXT NOT NULL
 );
 CREATE TABLE IF NOT EXISTS related_errors (
   firstId TEXT NOT NULL REFERENCES errors(id), secondId TEXT NOT NULL REFERENCES errors(id),
   PRIMARY KEY (firstId, secondId), CHECK (firstId < secondId)
 );
 `);
