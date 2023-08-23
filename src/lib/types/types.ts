import { Endpoints } from "@octokit/types";

export interface UserType {
  org: "org";
  user: "user";
}

//// Api request definitions
// These are objects that our frontend will send either in the request query or body

export interface WorkflowQuery {
  reposWithOwner: string; // Comma separated list of repos (can be a comma separated list)
  head_branch?: string; // Optional head_branch
  workflowIDs?: string[]; // Optional workflow ID (can be a comma separated list)
}

////

//// Inbound response types from upstream GitHub APIs

// Workflow
export type WorkflowResponse =
  Endpoints["GET /repos/{owner}/{repo}/actions/workflows"]["response"];

export type WorkflowParams =
  Endpoints["GET /repos/{owner}/{repo}/actions/workflows"]["parameters"];

// Workflow Runs
export type WorkflowRunResponse =
  Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"];

export type RunsParams =
  Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["parameters"];

// Environment
export type EnvironmentResponse =
  Endpoints["GET /repos/{owner}/{repo}/environments"]["response"];

export type EnvironmentParams =
  Endpoints["GET /repos/{owner}/{repo}/environments"]["parameters"];

////

//// Outbound response types from our APIs to the frontend

// 0. Common

export interface Owner {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface Environment {
  id: number;
  name: string;
}

// 1. Repos

export interface Repository {
  id: number;
  name: string;
  nameWithOwner: string;
  html_url: string;
  owner: Owner;
  isArchived?: boolean;
  environments?: Environment[];
  ref?: string;
  repoSource?: string;
}

// 2. Workflows

export interface Workflow {
  name: string;
  id: number;
  path: string;
  html_url: string;
  badge_url: string;
  repoWithOwner: string;
}

// 3. Runs

export interface RunItem {
  id: number;
  name: string | null | undefined;
  display_title: string;
  head_branch: string | null;
  workflow_id: number;
  workflow_url: string;
  run_started_at: string;
  created_at: string;
  updated_at: string;
  run_attempt: number;
  run_number: number;
  html_url: string;
  actor: Owner;
  status: string | null;
  conclusion: string | null;
  event: string;
}

export interface Run {
  repository: Repository;
  runs: RunItem[];
}

// Graphql types from repos.ts

export interface GraphQLRepositoryNode {
  repository: {
    name: string;
    url: string;
    id: string;
    environments: {
      nodes: Environment[];
    };
    isArchived: boolean;
    nameWithOwner: string;
    ref: string;
  };
  repoSource: string; // where the repo came from (repoList or repoOwner)
}

export interface GraphQLRepositoriesResponse {
  // this is used when fetching all repositories for a user
  nodes: GraphQLRepositoryNode[];
}

export interface GraphQLReposResponse {
  // this is a hack to get around the fact that the GraphQL API doesn't support filtering on repo name
  user: {
    repositories: GraphQLRepositoriesResponse;
  };
}

export interface GraphQLEnvironmentResponse {
  // this is used when fetching environments for a single repository
  repository: {
    environments: {
      nodes: Environment[];
    };
  };
}

export type GQLRepos = {
  repository: {
    name: string;
    nameWithOwner: string;
    databaseId: number;
    url: string;
    isArchived: boolean;
    owner: {
      login: string;
      avatarUrl: string;
      url: string;
    };
    environments: {
      edges: {
        node: {
          name: string;
          databaseId: number;
        };
      }[];
    };
  };
};
