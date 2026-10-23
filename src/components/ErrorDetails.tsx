import { useState } from "react";
import type { SubmitEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ERROR, UPDATE_ERROR } from "../api/detailOperations";
import Investigation from "./Investigation";
import { exportMarkdown } from "../exportMarkdown";
import { GET_ERRORS } from "../api/errorOperations";
import type { ErrorEntry } from "../error";

type Draft = Omit<ErrorEntry, "id" | "status" | "attempts" | "relatedErrors">;
const fields = [
  ["project", "Project"],
  ["packageName", "Package name"],
  ["packageVersion", "Installed package version"],
  ["message", "Exact error message"],
  ["context", "Context: what were you trying to do?"],
  ["cause", "Root cause"],
  ["solution", "Final solution"],
  ["references", "Reference links (one HTTP or HTTPS URL per line)"],
] as const;

function DetailEditor({ entry, onBack, onOpen }: { entry: ErrorEntry; onBack: () => void; onOpen: (id: string) => void }) {
  const [draft, setDraft] = useState<Draft>({
    title: entry.title, technology: entry.technology, message: entry.message,
    context: entry.context, cause: entry.cause, solution: entry.solution,
    references: entry.references, project: entry.project, packageName: entry.packageName, packageVersion: entry.packageVersion,
  });
  const [attemptDirty, setAttemptDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [updateError, { loading, error }] = useMutation<
    { updateError: ErrorEntry }, { id: string; input: Draft }
  >(UPDATE_ERROR, { refetchQueries: [GET_ERRORS], awaitRefetchQueries: true });
  const dirty = attemptDirty || Object.keys(draft).some((key) => draft[key as keyof Draft] !== entry[key as keyof Draft]);
  function change(field: keyof Draft, value: string) {
    setSaved(false);
    setDraft((current) => ({ ...current, [field]: value }));
  }
  function back() {
    if (!dirty || window.confirm("Discard your unsaved changes?")) onBack();
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !draft.title.trim() || !draft.technology.trim()) return;
    try {
      const result = await updateError({ variables: { id: entry.id, input: draft } });
      if (result.data) {
        const value = result.data.updateError;
        setDraft({ title: value.title, technology: value.technology, message: value.message,
          context: value.context, cause: value.cause, solution: value.solution, references: value.references, project: value.project, packageName: value.packageName, packageVersion: value.packageVersion });
        setSaved(true);
      }
    } catch { /* Apollo exposes the error below; preserve the draft for retry. */ }
  }
  const links = entry.references.split(/\r?\n/).map((line) => line.trim()).filter((line) => {
    try { return ["http:", "https:"].includes(new URL(line).protocol); } catch { return false; }
  });
  return (
    <section aria-labelledby="detail-heading">
      <button type="button" className="resolve-button" onClick={back} disabled={loading}>Back to journal</button>
      <h1 id="detail-heading">Error details</h1>
      <button type="button" className="resolve-button" onClick={() => exportMarkdown(entry)} disabled={loading || dirty}>Export saved entry to Markdown</button>
      <p>Status: {entry.status}</p>
      <form className="error-form" onSubmit={submit}>
        <fieldset disabled={loading}>
          <legend>Document your investigation</legend>
          <label htmlFor="detail-title">Title</label>
          <input id="detail-title" required value={draft.title} onChange={(e) => change("title", e.target.value)} />
          <label htmlFor="detail-technology">Technology</label>
          <input id="detail-technology" required value={draft.technology} onChange={(e) => change("technology", e.target.value)} />
          {fields.map(([key, label]) => (
            <div className="detail-field" key={key}>
              <label htmlFor={`detail-${key}`}>{label}</label>
              <textarea id={`detail-${key}`} rows={key === "solution" ? 7 : 4}
                value={draft[key]} onChange={(e) => change(key, e.target.value)} />
            </div>
          ))}
          <button type="submit" disabled={!draft.title.trim() || !draft.technology.trim()}>
            {loading ? "Saving..." : "Save details"}
          </button>
        </fieldset>
        {error && <p role="alert">Could not save: {error.message}</p>}
        <p role="status">{saved ? "Details saved." : dirty ? "You have unsaved changes." : ""}</p>
      </form>
      <Investigation onDirty={setAttemptDirty} entry={entry} onOpen={(id) => { if (!dirty || window.confirm("Discard your unsaved changes?")) onOpen(id); }} />
      {links.length > 0 && <aside aria-label="Saved references"><h2>Saved references</h2><ul>
        {links.map((link, index) => <li key={`${index}-${link}`}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>)}
      </ul></aside>}
    </section>
  );
}

export default function ErrorDetails({ id, onBack, onOpen }: { id: string; onBack: () => void; onOpen: (id: string) => void }) {
  const { data, loading, error, refetch } = useQuery<{ error: ErrorEntry | null }>(GET_ERROR, { variables: { id }, fetchPolicy: "cache-and-network" });
  if ((!data && loading) || error || !data?.error) return <section>
    <button type="button" className="resolve-button" onClick={onBack}>Back to journal</button>
    {loading ? <p>Loading details...</p> : error ? <><p role="alert">Could not load details: {error.message}</p>
      <button type="button" onClick={() => { void refetch().catch(() => {}); }}>Retry</button></> : <p>Error entry not found.</p>}
  </section>;
  return <DetailEditor key={id} entry={data.error} onBack={onBack} onOpen={onOpen} />;
}
