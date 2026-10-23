import { gql } from "@apollo/client";

export const GET_ERROR = gql`
  query GetError($id: ID!) {
    error(id: $id) {
      id title technology status message context cause solution references project packageName packageVersion
      attempts { id description outcome createdAt }
      relatedErrors { id title status }
    }
  }
`;

export const UPDATE_ERROR = gql`
  mutation UpdateError($id: ID!, $input: UpdateErrorInput!) {
    updateError(id: $id, input: $input) {
      id title technology status message context cause solution references project packageName packageVersion
      attempts { id description outcome createdAt }
      relatedErrors { id title status }
    }
  }
`;

export const ADD_ATTEMPT = gql`
 mutation AddAttempt($errorId: ID!, $description: String!, $outcome: String!) {
   addAttempt(errorId: $errorId, description: $description, outcome: $outcome) { id attempts { id description outcome createdAt } }
 }
`;
export const SET_RELATED = gql`
 mutation SetRelated($errorId: ID!, $relatedId: ID!, $linked: Boolean!) {
   setRelated(errorId: $errorId, relatedId: $relatedId, linked: $linked) { id relatedErrors { id title status } }
 }
`;
