import "./App.css";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ERRORS, CREATE_ERROR, RESOLVE_ERROR } from "./api/errorOperations";
import type { ErrorEntry, GetErrorsData } from "./error";
import ErrorDetails from "./components/ErrorDetails";
import type { SubmitEvent } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { setStatusFilter, setSearch } from "./features/filters/FiltersSlice";
import type { StatusFilter } from "./features/filters/FiltersSlice";
import ErrorCard from "./components/ErrorCard";

const statusOptions: StatusFilter[] = ["All", "Open", "Resolved"];

type CreateErrorData = {
  createError: ErrorEntry;
};

type CreateErrorVariables = {
  input: {
    title: string;
    technology: string;
  };
};

function App() {
  const dispatch = useAppDispatch();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [technology, setTechnology] = useState("");
  const statusFilter = useAppSelector((state) => state.filters.status);
  const search = useAppSelector((state) => state.filters.search);
  const normalizedSearch = search.trim().toLowerCase();

  const [createError, { loading: saving, error: saveError }] = useMutation<
    CreateErrorData,
    CreateErrorVariables
  >(CREATE_ERROR, {
    refetchQueries: [GET_ERRORS],
    awaitRefetchQueries: true,
  });
  const [resolveError, { loading: resolving, error: resolveFailure }] =
    useMutation<{ resolveError: ErrorEntry }, { id: string }>(RESOLVE_ERROR, {
      refetchQueries: [GET_ERRORS],
      awaitRefetchQueries: true,
    });

  const {
    data,
    loading,
    error: loadError,
  } = useQuery<GetErrorsData>(GET_ERRORS);

  const errors = data?.errors ?? [];

  const filteredErrors = errors.filter((error) => {
    const matchesStatus =
      statusFilter === "All" || error.status === statusFilter;

    const matchesSearch =
      error.title.toLowerCase().includes(normalizedSearch) ||
      error.technology.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedTechnology = technology.trim();

    if (!trimmedTitle || !trimmedTechnology || saving) {
      return;
    }

    try {
      await createError({
        variables: {
          input: {
            title: trimmedTitle,
            technology: trimmedTechnology,
          },
        },
      });

      setTitle("");
      setTechnology("");
    } catch {
      // Apollo exposes the failure through saveError below.
    }
  }

  async function handleResolve(id: string) {
    try {
      await resolveError({
        variables: { id },
      });
    } catch {
      // The message is displayed using resolveFailure.
    }
  }

  return (
    <main className="app">
      {selectedId ? (
        <ErrorDetails onOpen={setSelectedId} id={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
      <>
      <h1>BugTrail</h1>
      <p>Your personal debugging journal.</p>

      <form className="error-form" onSubmit={handleSubmit}>
        <h2>Add an error</h2>

        <label htmlFor="error-title">Error title</label>
        <input
          id="error-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={saving}
          placeholder="Example: Failed to fetch"
          required
        />

        <label htmlFor="error-technology">Technology</label>
        <input
          id="error-technology"
          value={technology}
          onChange={(event) => setTechnology(event.target.value)}
          disabled={saving}
          placeholder="Example: React"
          required
        />

        <button
          type="submit"
          disabled={saving || !title.trim() || !technology.trim()}
        >
          {saving ? "Saving..." : "Add error"}
        </button>

        {saveError && (
          <p role="alert">Could not save the error: {saveError.message}</p>
        )}
      </form>

      <div className="search-field">
        <label htmlFor="error-search">Search errors</label>
        <input
          id="error-search"
          type="search"
          placeholder="Search by title or technology"
          value={search}
          onChange={(event) => dispatch(setSearch(event.target.value))}
        />
      </div>

      <div className="filters" role="group" aria-label="Filter by status">
        {statusOptions.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={statusFilter === status}
            onClick={() => dispatch(setStatusFilter(status))}
          >
            {status}
          </button>
        ))}
      </div>

      {resolveFailure && (
        <p role="alert">
          Could not resolve the error: {resolveFailure.message}
        </p>
      )}

      <section className="error-list" aria-label="Saved errors">
        {loading ? (
          <p>Loading errors...</p>
        ) : loadError ? (
          <p role="alert">Could not load errors: {loadError.message}</p>
        ) : filteredErrors.length === 0 ? (
          <p>No errors match your search and filters.</p>
        ) : (
          filteredErrors.map((error) => (
            <ErrorCard
              key={error.id}
              title={error.title}
              technology={error.technology}
              status={error.status}
              resolving={resolving}
              onResolve={() => handleResolve(error.id)}
              onOpen={() => setSelectedId(error.id)}
            />
          ))
        )}
      </section>
      </>
      )}
    </main>
  );
}

export default App;
