type ErrorCardProps = {
  title: string;
  technology: string;
  status: "Open" | "Resolved";
  onResolve: () => void;
  resolving?: boolean;
  onOpen: () => void;
};

function ErrorCard({
  title,
  technology,
  status,
  onResolve,
  onOpen,
  resolving = false,
}: ErrorCardProps) {
  return (
    <article className="error-card">
      <h2><button className="card-title" type="button" onClick={onOpen}>{title}</button></h2>
      <p>{technology}</p>

      <span
        className={
          status === "Resolved"
            ? "status status--resolved"
            : "status status--open"
        }
      >
        {status}
      </span>

      {status === "Open" && (
        <button
          className="resolve-button"
          type="button"
          onClick={onResolve}
          disabled={resolving}
        >
          {resolving ? "Updating..." : "Mark resolved"}
        </button>
      )}
    </article>
  );
}

export default ErrorCard;
