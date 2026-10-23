import { useQuery } from "@apollo/client/react";
import { GET_ERRORS } from "../api/errorOperations";

type ServerError = {
  id: string;
  title: string;
  technology: string;
  status: string;
};

type GetErrorsData = {
  errors: ServerError[];
};


function ServerErrors() {
  const { loading, error, data } =
    useQuery<GetErrorsData>(GET_ERRORS);

  if (loading) {
    return <p>Loading backend errors...</p>;
  }

  if (error) {
    return <p role="alert">Could not load errors: {error.message}</p>;
  }

  if (!data) {
    return <p>No data received.</p>;
  }

  return (
    <section aria-labelledby="server-errors-heading">
      <h2 id="server-errors-heading">Errors from the backend</h2>

      {data.errors.length === 0 ? (
        <p>No errors saved yet.</p>
      ) : (
        <ul>
          {data.errors.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.title}</strong>
              {" — "}
              {entry.technology} · {entry.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ServerErrors;