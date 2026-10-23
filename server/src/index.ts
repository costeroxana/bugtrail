import express from "express";
import { buildSchema } from "graphql";
import { createHandler } from "graphql-http/lib/use/express";
import { randomUUID } from "node:crypto";
import { db } from "./database";

const app = express();
const port = 4000;

// Describes the data clients can request.
export const schema = buildSchema(`
  type ErrorEntry {
    id: ID!
    title: String!
    technology: String!
    status: String!
    message: String!
    context: String!
    cause: String!
    solution: String!
    references: String!
    project: String!
    packageName: String!
    packageVersion: String!
  }

  type Attempt { id: ID!, description: String!, outcome: String!, createdAt: String! }
  type RelatedError { id: ID!, title: String!, status: String! }
  extend type ErrorEntry { attempts: [Attempt!]!, relatedErrors: [RelatedError!]! }

  input CreateErrorInput {
    title: String!
    technology: String!
  }

  type Query {
    errors: [ErrorEntry!]!
    error(id: ID!): ErrorEntry
  }

  input UpdateErrorInput {
    title: String!
    technology: String!
    message: String!
    context: String!
    cause: String!
    solution: String!
    references: String!
    project: String
    packageName: String
    packageVersion: String
  }

  type Mutation {
    createError(input: CreateErrorInput!): ErrorEntry!
    resolveError(id: ID!): ErrorEntry!
    addAttempt(errorId: ID!, description: String!, outcome: String!): ErrorEntry!
    setRelated(errorId: ID!, relatedId: ID!, linked: Boolean!): ErrorEntry!
    updateError(id: ID!, input: UpdateErrorInput!): ErrorEntry!
  }
`);

type CreateErrorArgs = {
  input: {
    title: string;
    technology: string;
  };
};

function readEntry(id: string) {
  const entry = db.prepare('SELECT * FROM errors WHERE id = ?').get(id);
  if (!entry) return null;
  return { ...entry,
    attempts: db.prepare('SELECT * FROM attempts WHERE errorId = ? ORDER BY createdAt ASC, rowid ASC').all(id),
    relatedErrors: db.prepare(`SELECT e.id, e.title, e.status FROM errors e JOIN related_errors r
      ON (r.firstId = ? AND r.secondId = e.id) OR (r.secondId = ? AND r.firstId = e.id)
      ORDER BY e.title`).all(id, id),
  };
}
function requireEntry(id: string) {
  const entry = readEntry(id);
  if (!entry) throw new Error('Error entry not found.');
  return entry;
}

// Resolver: supplies the data for the errors query.
export const root = {
  addAttempt: ({ errorId, description, outcome }: { errorId: string; description: string; outcome: string }) => {
    requireEntry(errorId);
    if (!description.trim() || !outcome.trim()) throw new Error('Description and outcome are required.');
    db.prepare('INSERT INTO attempts VALUES (?, ?, ?, ?, ?)').run(randomUUID(), errorId, description.trim(), outcome.trim(), new Date().toISOString());
    return readEntry(errorId);
  },
  setRelated: ({ errorId, relatedId, linked }: { errorId: string; relatedId: string; linked: boolean }) => {
    requireEntry(errorId); requireEntry(relatedId);
    if (errorId === relatedId) throw new Error('An error cannot be related to itself.');
    const [first, second] = [errorId, relatedId].sort();
    if (linked) db.prepare('INSERT OR IGNORE INTO related_errors VALUES (?, ?)').run(first, second);
    else db.prepare('DELETE FROM related_errors WHERE firstId = ? AND secondId = ?').run(first, second);
    return readEntry(errorId);
  },
  errors: () => {
    return db
      .prepare(`
        SELECT *
        FROM errors
        ORDER BY rowid DESC
      `)
      .all().map((entry) => readEntry(String(entry.id)));
  },

  error: ({ id }: { id: string }) =>
    readEntry(id),

  updateError: ({ id, input }: { id: string; input: {
    title: string; technology: string; message: string; context: string;
    cause: string; solution: string; references: string; project?: string; packageName?: string; packageVersion?: string;
  } }) => {
    const title = input.title.trim();
    const technology = input.technology.trim();
    if (!title || !technology) throw new Error('Title and technology must not be empty.');
    for (const link of input.references.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)) {
      let url: URL;
      try { url = new URL(link); } catch { throw new Error('References must be valid HTTP or HTTPS URLs, one per line.'); }
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('References must use HTTP or HTTPS.');
    }
    const result = db.prepare(`UPDATE errors SET title = ?, technology = ?, message = ?,
      context = ?, cause = ?, solution = ?, "references" = ? WHERE id = ?`).run(
      title, technology, input.message.trim(), input.context.trim(),
      input.cause.trim(), input.solution.trim(), input.references.trim(), id
    );
    if (result.changes === 0) throw new Error('Error entry not found.');
    for (const field of ['project', 'packageName', 'packageVersion'] as const) {
      if (input[field] != null) db.prepare(`UPDATE errors SET "${field}" = ? WHERE id = ?`).run(input[field].trim(), id);
    }
    return readEntry(id);
  },

  createError: ({ input }: CreateErrorArgs) => {
    const title = input.title.trim();
    const technology = input.technology.trim();

    if (!title || !technology) {
      throw new Error("Title and technology must not be empty.");
    }

    const newError = {
      id: randomUUID(),
      title,
      technology,
      status: "Open",
    };

    db.prepare(`
      INSERT INTO errors (id, title, technology, status)
      VALUES (?, ?, ?, ?)
    `).run(
      newError.id,
      newError.title,
      newError.technology,
      newError.status
    );

    return readEntry(newError.id);
  },

  resolveError: ({ id }: { id: string }) => {
    const result = db.prepare(`
      UPDATE errors
      SET status = 'Resolved'
      WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      throw new Error("Error entry not found.");
    }

    return readEntry(id);
  },
};

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "BugTrail API is running",
  });
});

app.all(
  "/graphql",
  createHandler({
    schema,
    rootValue: root,
  }),
);

if (require.main === module) app.listen(port, () => {
  console.log(`BugTrail API: http://localhost:${port}`);
});
