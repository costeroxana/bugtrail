# BugTrail

**Keep the fix. Remember the reasoning.**

A personal debugging journal for the errors you encounter while building software. Save the context, track what you tried, and find the solution when the problem comes back.

Built with **React · TypeScript · Redux Toolkit · Apollo Client · GraphQL · SQLite**.

[Features](#features) · [Quick start](#quick-start) · [How to use](#how-to-use) · [Architecture](#architecture) · [Development](#development)

---

## Features

| Feature | What you can do |
| --- | --- |
| Error journal | Create entries and track Open or Resolved status |
| Search and filters | Find errors by title or technology and combine search with status filters |
| Investigation details | Save the exact message, context, root cause, solution, and reference links |
| Attempts timeline | Record what you tried, the result, and when it happened |
| Project context | Record the project, package name, and installed version |
| Related errors | Link entries in both directions and navigate between them |
| Markdown export | Download a saved entry with its details, attempts, and related errors |
| Local persistence | Keep your journal in SQLite across browser refreshes and backend restarts |

## Quick start

### Prerequisites

- **Node.js 24** — developed using v24.20.0.
- **npm**, included with Node.js.
- **Git**, to clone the repository.

SQLite runs inside Node.js. No separate database installation or environment file is needed for local development.

### 1. Clone and install

```sh
git clone https://github.com/costeroxana/bugtrail.git
cd bugtrail
npm install
npm --prefix server install
```

### 2. Start the API

```sh
npm --prefix server run dev
```

Keep this terminal running. The API listens on **http://localhost:4000**.

### 3. Start the frontend

Open a second terminal in the project root:

```sh
npm run dev
```

Open the URL printed by Vite, normally **http://localhost:5173**.

> The first launch starts with an empty journal. The backend creates the database and tables automatically.

## How to use

1. **Capture an error.** Enter a title and technology, then choose **Add error**.
2. **Document the investigation.** Click the entry title to edit its message, context, cause, solution, and references.
3. **Record the environment.** Add the project, package name, and the version you were using.
4. **Track attempts.** Add what you tried and the result to the timeline.
5. **Connect problems.** Link related entries or unlink them without deleting either error.
6. **Resolve and reuse.** Mark the error resolved and export the saved entry to Markdown.

Reference links accept HTTP or HTTPS URLs, one per line. Save pending changes before exporting. Search and status filters remain available when you return to the journal.

### Data storage

Your local database is created at:

```text
server/data/bugtrail.sqlite
```

The data directory is excluded from Git. Database migrations add new fields and tables while preserving existing entries. To back up your journal, stop the backend and copy the database file.

## Architecture

```text
React interface
├── Component state        Form inputs and drafts
├── Redux Toolkit          Shared search and status filters
└── Apollo Client          GraphQL requests and cached journal data
    └── Vite dev proxy     /graphql → localhost:4000
        └── Express API    Schema, validation, and resolvers
            └── SQLite     Errors, attempts, and related-error links
```

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, CSS |
| Shared interface state | Redux Toolkit, React Redux |
| GraphQL client | Apollo Client |
| Backend | Node.js, Express, GraphQL.js, graphql-http |
| Storage | SQLite through built-in `node:sqlite` |
| Development tooling | tsx, TypeScript, ESLint |

### Project structure

```text
bugtrail/
├── src/
│   ├── api/                  Apollo client and GraphQL operations
│   ├── app/                  Redux store and typed hooks
│   ├── components/           Cards, details editor, and investigation timeline
│   ├── features/filters/     Search and status filter slice
│   ├── App.tsx               Journal page and navigation
│   ├── error.ts              Frontend data types
│   └── exportMarkdown.ts     Markdown generation and download
├── server/
│   ├── src/
│   │   ├── index.ts          Express routes, GraphQL schema, and resolvers
│   │   └── database.ts       SQLite initialization and migrations
│   └── data/                 Generated local database; ignored by Git
└── vite.config.ts            Frontend configuration and development proxy
```

## Development

Run commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend |
| `npm --prefix server run dev` | Start the backend with automatic restarts |
| `npm run build` | Type-check and build the frontend |
| `npm run lint` | Run ESLint |
| `npm --prefix server run typecheck` | Type-check the backend |
| `npm run preview` | Preview the frontend production build locally |

**Manual verification:** create an entry, edit its details, add an attempt, link another error, and export to Markdown. Restart the backend and refresh the page to confirm the saved data remains.

### API reference

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Check that the backend is running |
| `/graphql` | Query and update the journal |

The GraphQL endpoint accepts API requests; it does not include a browser query editor.

<details>
<summary><strong>GraphQL operations and examples</strong></summary>

#### Available operations

| Operation | Purpose |
| --- | --- |
| `errors` | List journal entries |
| `error(id)` | Fetch one entry with its details, attempts, and relationships |
| `createError(input)` | Create an entry with Open status |
| `updateError(id, input)` | Edit details and project/package context |
| `resolveError(id)` | Mark an entry resolved |
| `addAttempt(errorId, description, outcome)` | Append a timestamped attempt |
| `setRelated(errorId, relatedId, linked)` | Add or remove a bidirectional relationship |

#### Read an entry

```graphql
query GetError($id: ID!) {
  error(id: $id) {
    id
    title
    technology
    status
    message
    context
    cause
    solution
    references
    project
    packageName
    packageVersion
    attempts {
      id
      description
      outcome
      createdAt
    }
    relatedErrors {
      id
      title
      status
    }
  }
}
```

#### Create an entry

```graphql
mutation CreateError($input: CreateErrorInput!) {
  createError(input: $input) {
    id
    title
    technology
    status
  }
}
```

Variables:

```json
{
  "input": {
    "title": "Failed to fetch",
    "technology": "React"
  }
}
```

`UpdateErrorInput` requires string values for `title`, `technology`, `message`, `context`, `cause`, `solution`, and `references`. Investigation fields may be empty strings. The `project`, `packageName`, and `packageVersion` fields are optional strings. Updating details does not change the entry's status.

</details>

## Current scope and next steps

BugTrail is a personal learning and portfolio project intended for local use. Projects and package versions are entered manually. Attempts can be added, but editing and deleting attempts are not implemented yet.

- [ ] Add an automated test suite for the main user workflows.
- [ ] Configure production hosting and API routing.

The frontend build does not start or include the backend. Production deployment needs a running API and routing configuration for `/graphql`.
