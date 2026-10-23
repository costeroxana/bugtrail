# BugTrail

A personal debugging journal built with React, TypeScript, Redux Toolkit, and GraphQL. Record errors you encounter while building projects, find them by title or technology, and track which ones you have resolved.

This is a learning project developed incrementally. The current version supports creating and resolving entries, plus editing the error message, context, root cause, final solution, and reference links. It also includes an attempts timeline, project and installed-package context, related errors, and Markdown export.

## Features

- Create an error entry with a title and technology.
- Browse entries fetched from the GraphQL API.
- Search by title or technology, ignoring capitalization.
- Filter by All, Open, or Resolved status.
- Mark an open entry as resolved.
- Open an entry by clicking its title and edit its investigation details.
- Save HTTP or HTTPS reference links, one per line.
- Record dated attempts with a description and outcome.
- Save the project, package name, and installed version for each error.
- Link and unlink related errors with relationships visible from both entries.
- Download a saved entry as Markdown, including details, attempts, and related errors.
- Display loading, empty, and request failure states.
- Validate non-empty titles and technologies on the server.

**Storage:** entries are saved in `server/data/bugtrail.sqlite` using Node.js built-in SQLite support. Entries and resolved statuses survive browser refreshes and backend restarts. The server creates the database directory and table automatically on startup. A new database starts empty; no sample entries are seeded. The data directory is ignored by Git.

## Stack and architecture

| Technology | Current role |
| --- | --- |
| React + TypeScript | Components, forms, and typed application code |
| Vite | Frontend development server and production build |
| CSS | Application styling |
| Redux Toolkit + React Redux | Shared search and status filters |
| Apollo Client | GraphQL queries, mutations, and server-data caching |
| Express + graphql-http + GraphQL.js | HTTP server, GraphQL schema, and resolvers |
| SQLite via Node.js `node:sqlite` | Persistent local journal storage |
| tsx | Backend development with automatic restarts |

```text
React interface
  |-- Redux store: search and status filters
  |-- Component state: form inputs
  `-- Apollo Client
        `-- /graphql (Vite development proxy)
              `-- Express API on port 4000
                    `-- SQLite database: server/data/bugtrail.sqlite
```

Apollo owns journal data; Redux owns shared interface filters.

## Getting started

Use Node.js 24 (the development setup uses v24.20.0) and npm. The backend imports `node:sqlite` directly, so no separate SQLite driver or database service is required. Frontend and backend dependencies are installed separately.

From the repository root:

```sh
npm install
npm --prefix server install
```

### Start the backend

In one terminal, from the repository root:

```sh
npm --prefix server run dev
```

The API runs on `http://localhost:4000`.

### Start the frontend

In a second terminal, from the repository root:

```sh
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

Keep both processes running. Vite forwards `/graphql` requests to `http://localhost:4000`, as configured in `vite.config.ts`. No environment file is currently required.

## Using the app

1. Enter an error title and technology, then choose **Add error**.
2. Search for an entry using its title or technology.
3. Combine search with the **Open** or **Resolved** filter.
4. Choose **Mark resolved** to update an open entry.
5. Click an entry title to open its details. Edit the message, context, cause, solution, or reference URLs and choose **Save details**.
6. Choose **Back to journal** to return to your existing search and filters. Leaving with unsaved edits asks for confirmation.
7. Refresh the browser to fetch the current backend data again.

## Project structure

```text
src/
  api/
    apolloClient.ts        Apollo connection and cache
    errorOperations.ts     Journal queries and mutations
    detailOperations.ts    Detail query and update mutation
  app/
    hooks.ts               Typed Redux hooks
    store.ts               Redux store
  components/
    ErrorCard.tsx          Error card and resolve button
    ErrorDetails.tsx       Detail loading, editing, and saved reference links
  features/
    filters/
      FiltersSlice.ts      Search and status filter state
  error.ts                 Frontend error types
  App.tsx                  Form, filtering, and journal list
  App.css                  Application styles
  main.tsx                 React entry point and providers
server/
  src/
    index.ts               Express routes, schema, and SQLite-backed resolvers
    database.ts            Database connection and table creation
  data/
    bugtrail.sqlite        Generated local database (ignored by Git)
  package.json             Backend scripts and dependencies
  tsconfig.json            Backend TypeScript configuration
```

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Backend health check |
| `/graphql` | GraphQL queries and mutations |

The health check is available directly at `http://localhost:4000/api/health`. The GraphQL endpoint expects a GraphQL request; it does not serve an interactive query editor.

### Fetch entries

```graphql
query GetErrors {
  errors {
    id
    title
    technology
    status
  }
}
```

### Create an entry

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

The server generates a string ID and sets the initial status to `Open`.

### Resolve an entry

```graphql
mutation ResolveError($id: ID!) {
  resolveError(id: $id) {
    id
    title
    technology
    status
  }
}
```

Supply an existing entry's ID as the `id` variable. Creating or resolving an entry triggers a list refetch in the current frontend implementation.

## Development commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite |
| `npm run build` | Type-check and build the frontend into `dist/` |
| `npm run lint` | Run the configured ESLint checks |
| `npm run preview` | Preview the frontend production build locally |
| `npm --prefix server run dev` | Start the backend in watch mode |
| `npm --prefix server run typecheck` | Type-check the backend |

The Vite development proxy is configured for `npm run dev`. Production hosting and API routing still need configuration; the frontend build does not include or start the backend.

There is no automated test suite configured yet. A useful manual check is: create an entry, search for it, resolve it, switch filters, restart the backend, and refresh the page. The entry and its resolved status should remain.

## Roadmap

- [x] Save journal entries permanently using SQLite.
- [x] Add editable error messages, context, root cause, final solution, and reference links.
- [x] Add an attempts timeline.
- [x] Record project/package version context and link related errors.
- [x] Export saved entries to Markdown.
- [ ] Add automated tests for the main journal workflow.
- [ ] Configure deployment for the frontend and backend.




## Editing error details

Click an error title to open its details view. Title and technology are required; investigation fields are optional. Reference links must be HTTP or HTTPS URLs, one per line. Saving updates SQLite and Apollo's cache and refetches the journal list. The details view includes loading, not-found, retry, save failure, and saved states.

The backend adds missing detail columns to existing databases on startup without replacing saved entries. These fields default to empty strings.

Additional GraphQL operations:

```graphql
query GetError($id: ID!) {
  error(id: $id) {
    id title technology status message context cause solution references
  }
}

mutation UpdateError($id: ID!, $input: UpdateErrorInput!) {
  updateError(id: $id, input: $input) {
    id title technology status message context cause solution references
  }
}
```

`UpdateErrorInput` requires string values for `title`, `technology`, `message`, `context`, `cause`, `solution`, and `references`. Optional investigation fields may be empty strings. Editing does not change the entry's status.


## Investigation workflow

In an entry's details, save the project name, package name, and the version actually installed when the error occurred. These are manually entered fields; project names are free text.

Under **Attempts timeline**, record what you tried and the result. The backend timestamps each attempt, and the timeline shows oldest attempts first. Attempts persist in SQLite. This version supports adding attempts, not editing or deleting them.

Under **Related errors**, select another saved entry and choose **Link error**. The relationship appears on both entries. Click its title to navigate there, or choose **Unlink** to remove the relationship without deleting either error. Self-links and duplicate relationships are prevented.

Choose **Export saved entry to Markdown** to download a `.md` file containing saved details, project/package context, attempts, references, and related error titles and IDs. Save pending edits first; export is disabled while detail or attempt drafts are unsaved. Text is fenced to preserve code snippets and render user-provided markup literally.

SQLite startup migration preserves existing entries and adds project/package columns plus `attempts` and `related_errors` tables. Both new features use the existing GraphQL endpoint:

- `addAttempt(errorId: ID!, description: String!, outcome: String!): ErrorEntry!`
- `setRelated(errorId: ID!, relatedId: ID!, linked: Boolean!): ErrorEntry!`
- `UpdateErrorInput` also accepts optional `project`, `packageName`, and `packageVersion` strings.

The new UI is in `src/components/Investigation.tsx`; Markdown formatting and downloading are in `src/exportMarkdown.ts`.
#   b u g t r a i l  
 