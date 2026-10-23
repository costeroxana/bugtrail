import { gql } from "@apollo/client";

export const GET_ERRORS = gql`
  query GetErrors {
    errors {
      id
      title
      technology
      status
    }
  }
`;

export const CREATE_ERROR = gql`
  mutation CreateError($input: CreateErrorInput!) {
    createError(input: $input) {
      id
      title
      technology
      status
    }
  }
`;

export const RESOLVE_ERROR = gql`
  mutation ResolveError($id: ID!) {
    resolveError(id: $id) {
      id
      title
      technology
      status
    }
  }
`;