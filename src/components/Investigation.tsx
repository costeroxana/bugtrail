import { useState } from "react";
import type { SubmitEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { ADD_ATTEMPT, SET_RELATED, GET_ERROR } from "../api/detailOperations";
import { GET_ERRORS } from "../api/errorOperations";
import type { ErrorEntry, GetErrorsData } from "../error";

export default function Investigation({ entry, onOpen, onDirty }: { entry: ErrorEntry; onOpen: (id: string) => void; onDirty: (dirty: boolean) => void }) {
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");
  const [relatedId, setRelatedId] = useState("");
  const [feedback, setFeedback] = useState("");
  const { data, loading: listing, error: listError } = useQuery<GetErrorsData>(GET_ERRORS);
  const options = { refetchQueries: [{ query: GET_ERROR, variables: { id: entry.id } }], awaitRefetchQueries: true };
  const [addAttempt, { loading: adding, error: attemptError }] = useMutation(ADD_ATTEMPT, options);
  const [setRelated, { loading: linking, error: relationError }] = useMutation(SET_RELATED, options);
  const available = (data?.errors ?? []).filter((error) => error.id !== entry.id && !entry.relatedErrors.some((related) => related.id === error.id));
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adding || !description.trim() || !outcome.trim()) return;
    setFeedback("");
    try {
      await addAttempt({ variables: { errorId: entry.id, description: description.trim(), outcome: outcome.trim() } });
      setDescription(""); setOutcome(""); onDirty(false); setFeedback("Attempt saved.");
    } catch { /* Keep inputs for retry. */ }
  }
  async function relate(id: string, linked: boolean) {
    if (linking) return;
    setFeedback("");
    try {
      await setRelated({ variables: { errorId: entry.id, relatedId: id, linked } });
      setRelatedId(""); setFeedback(linked ? "Related error linked." : "Relationship removed.");
    } catch { /* Exposed below. */ }
  }
  return <>
    <section aria-labelledby="attempts-title">
      <h2 id="attempts-title">Attempts timeline</h2>
      {entry.attempts.length ? <ol className="timeline">{entry.attempts.map((attempt) => <li key={attempt.id}>
        <time dateTime={attempt.createdAt}>{new Date(attempt.createdAt).toLocaleString()}</time>
        <h3>What I tried</h3><p className="preserve-text">{attempt.description}</p>
        <h3>Result</h3><p className="preserve-text">{attempt.outcome}</p>
      </li>)}</ol> : <p>No attempts yet. Record what you tried and what happened.</p>}
      <form className="error-form" onSubmit={submit}>
        <label htmlFor="attempt-description">What did you try?</label>
        <textarea id="attempt-description" required rows={4} disabled={adding} value={description} onChange={(e) => { setDescription(e.target.value); onDirty(Boolean(e.target.value || outcome)); }} />
        <label htmlFor="attempt-outcome">What was the result?</label>
        <textarea id="attempt-outcome" required rows={3} disabled={adding} value={outcome} onChange={(e) => { setOutcome(e.target.value); onDirty(Boolean(description || e.target.value)); }} />
        <button disabled={adding || !description.trim() || !outcome.trim()}>{adding ? "Saving..." : "Add attempt"}</button>
        {attemptError && <p role="alert">Could not save attempt: {attemptError.message}</p>}
      </form>
    </section>
    <section aria-labelledby="related-title">
      <h2 id="related-title">Related errors</h2>
      {entry.relatedErrors.length ? <ul>{entry.relatedErrors.map((related) => <li key={related.id} className="related-item">
        <button type="button" className="card-title" onClick={() => {
          onOpen(related.id);
        }}>{related.title} ({related.status})</button>
        <button type="button" disabled={linking} onClick={() => void relate(related.id, false)} aria-label={`Unlink ${related.title}`}>Unlink</button>
      </li>)}</ul> : <p>No related errors linked.</p>}
      <form className="error-form" onSubmit={(event) => { event.preventDefault(); if (relatedId) void relate(relatedId, true); }}>
        <label htmlFor="related-error">Link an existing error (visible from both entries)</label>
        <select id="related-error" value={relatedId} onChange={(e) => setRelatedId(e.target.value)} disabled={linking || listing}>
          <option value="">Choose an error</option>
          {available.map((error) => <option key={error.id} value={error.id}>{error.title}</option>)}
        </select>
        <button disabled={linking || !relatedId}>{linking ? "Updating..." : "Link error"}</button>
        {!listing && !available.length && <p>No other unlinked errors available.</p>}
        {listError && <p role="alert">Could not load available errors: {listError.message}</p>}
        {relationError && <p role="alert">Could not update relationship: {relationError.message}</p>}
      </form>
    </section>
    <p role="status">{feedback}</p>
  </>;
}
