import type { ErrorEntry } from "./error";

// Fence user text so code, Markdown, and HTML remain literal in exported notes.
function literal(text: string) {
  const runs = text.match(/`+/g) ?? [];
  const fence = "`".repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
  return `${fence}text\n${text || "(not recorded)"}\n${fence}`;
}
export function toMarkdown(entry: ErrorEntry) {
  const sections: [string, string][] = [
    ["Title", entry.title], ["Status", entry.status], ["Technology", entry.technology],
    ["Project", entry.project], ["Package", entry.packageName], ["Installed version", entry.packageVersion],
    ["Exact error", entry.message], ["Context", entry.context], ["Root cause", entry.cause],
    ["Solution", entry.solution], ["References", entry.references],
  ];
  return "# BugTrail journal entry\n\n" + sections.map(([title, value]) => `## ${title}\n\n${literal(value)}`).join("\n\n")
    + "\n\n## Attempts\n\n" + (entry.attempts.map((attempt) => `### ${attempt.createdAt}\n\n${literal(attempt.description)}\n\nOutcome:\n\n${literal(attempt.outcome)}`).join("\n\n") || "No attempts recorded.")
    + "\n\n## Related errors\n\n" + (entry.relatedErrors.map((related) => literal(`${related.title} (${related.status}) — ID: ${related.id}`)).join("\n\n") || "None.") + "\n";
}
export function exportMarkdown(entry: ErrorEntry) {
  const url = URL.createObjectURL(new Blob([toMarkdown(entry)], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bugtrail-${entry.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "entry"}.md`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
