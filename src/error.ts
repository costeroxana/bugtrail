export type ErrorEntry = {
  id: string;
  title: string;
  technology: string;
  status: "Open" | "Resolved";
  message: string;
  context: string;
  cause: string;
  solution: string;
  references: string;
  project: string;
  packageName: string;
  packageVersion: string;
  attempts: { id: string; description: string; outcome: string; createdAt: string }[];
  relatedErrors: { id: string; title: string; status: string }[];
};

export type GetErrorsData = {
  errors: ErrorEntry[];
};
