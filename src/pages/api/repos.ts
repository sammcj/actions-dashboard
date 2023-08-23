import App from "@/lib/app";
import { log } from "@/lib/log";
import { NextApiRequest, NextApiResponse } from "next";
import { cache } from "@/lib/cache";
import { Repository, GraphQLReposResponse } from "@/lib/types/types";

const config = App.getConfig();
const github = App.getGitHub();

// A function that can be passed the owner/repo and returns data for that repo suitable for our Repository interface/Type
export async function getRepositoryData(
  owner: string,
  name: string,
  ref?: string,
  repoSource?: string,
): Promise<Repository> {
  try {
    // const github = new GitHub();
    const cacheKey = `${owner}/${name}/repositoryData`;
    const fetchFn = async () => {
      // Extract the `repository` object from the GitHub graphql repo response

      const [repository, environments] = await Promise.all([
        await github.request("GET /repos/{owner}/{repo}", {
          owner,
          repo: name,
        }),
        await github.request("GET /repos/{owner}/{repo}/environments", {
          owner,
          repo: name,
        }),
      ]);

      // Transform the response to our custom Repository interface
      const result: Repository = {
        name: repository.data.name,
        owner: {
          avatar_url: repository.data.owner.avatar_url,
          html_url: repository.data.owner.url,
          login: repository.data.owner.login,
        },
        html_url: repository.data.url,
        id: repository.data.id,
        // Transform the environments array to our custom Environment interface
        environments: environments.data.environments?.map((e) => {
          return {
            id: e.id,
            name: e.name,
          };
        }),
        isArchived: repository.data.archived,
        nameWithOwner: repository.data.full_name,
        repoSource: repoSource,
        ref,
      };
      return result;
    };

    const cacheTTL = 86400; // 24 hours
    const [data] = await cache.cache<Repository>(cacheKey, fetchFn, cacheTTL);
    return data;
  } catch (error: any) {
    log.error({
      message: `Error fetching repository data for ${owner}/${name}`,
      error: error, // this will log the error message
      stack: error.stack, // this will log the stack trace
    });
    throw error;
  }
}

export async function fetchRepositories(): Promise<Repository[]> {
  let repositories: Repository[] = [];

  if (config.repoSource === "repoList") {
    log.info("Getting repositories from the provided repoList");

    try {
      await Promise.all(
        // Fetch all repositories
        config.repoList.map(async (repo: any) => {
          const [owner, name] = repo.split("/");
          const ref = config.defaultBranch;
          const data = await getRepositoryData(owner, name, ref, "repoList");
          if (data !== null) {
            repositories.push(data);
          }
        }),
      );
    } catch (error: any) {
      log.error({
        message: "Error fetching repositories",
        error: error, // this will log the error message
        stack: error.stack, // this will log the stack trace
      });
      throw new Error("Failed to fetch repositories");
    }
  } else if (config.repoSource === "repoOwner") {
    log.info("Getting repositories from the provided repoOwner");
    try {
      const query = `query GetAllRepositories($owner: String!, $ref: String!, $repoLast: Int, $envLast: Int) {
      user(login: $owner) {
        repositories(last: $repoLast) {
            nodes {
            name
              owner {
              login;
            }
            url;
            id;
            environments(last: $envLast) {
                edges {
                  node {
                  id;
                  name;
                }
              }
            }
            isArchived;
            nameWithOwner;
            ref(qualifiedName: $ref) {
              id;
            }
          }
        }
      }
    }`;
      const variables = {
        owner: config.githubOwner,
        ref: config.defaultBranch,
        repoLast: config.apiLimits.repos,
        envLast: config.apiLimits.environments,
      };
      log.debug({
        message: `query: ${JSON.stringify(query)}, variables: ${JSON.stringify(
          variables,
        )}`,
      });
      const response = await github.app.octokit.graphql<GraphQLReposResponse>(
        query,
        variables,
      );

      const repos = response.user.repositories.nodes;
      repos.forEach((repo: any) => {
        const repository: Repository = {
          name: repo.repository.name,
          owner: {
            avatar_url: repo.repository.owner.avatarUrl,
            html_url: repo.repository.owner.url,
            login: repo.repository.owner.login,
          },
          html_url: repo.repository.url,
          id: repo.repository.id,
          nameWithOwner: repo.repository.nameWithOwner,
          environments: repo.repository.environments.nodes,
          isArchived: repo.repository.isArchived,
          ref: repo.repository.ref,
          repoSource: "repoOwner",
        };
        repositories.push(repository);
      });
    } catch (error: any) {
      log.error({
        message: "Error fetching repositories",
        error: error, // this will log the error message
        stack: error.stack, // this will log the stack trace
      });
      throw new Error("Failed to fetch repositories");
    }
  } else if (config.repoSource === "getFromAppInstallation") {
    log.info("Getting repositories from the app installation");

    const cacheKey = `installedAppRepositories`;
    const fetchFn = async () => {
      try {
        const { data } = await github.request(
          "GET /installation/repositories",
          {
            per_page: 50,
          },
        );

        const repoNameWithOwner = data.repositories.map((r) => {
          return {
            owner: r.owner.login,
            repo: r.name,
          };
        });

        const environmentsWithRepo = await Promise.all(
          repoNameWithOwner.map(async (r) => {
            const e = await github.request(
              "GET /repos/{owner}/{repo}/environments",
              {
                owner: r.owner,
                repo: r.repo,
              },
            );
            return {
              repo: r.repo,
              environment: e,
            };
          }),
        );

        repositories = data.repositories.map((repository) => {
          const result: Repository = {
            name: repository.name,
            owner: {
              avatar_url: repository.owner.avatar_url,
              html_url: repository.owner.url,
              login: repository.owner.login,
            },
            html_url: repository.url,
            id: repository.id,
            // Transform the environments array to our custom Environment interface
            environments: environmentsWithRepo
              .filter((item) => item.repo === repository.name)[0]
              .environment.data.environments?.map((e) => {
                return {
                  id: e.id,
                  name: e.name,
                };
              }),
            isArchived: repository.archived,
            nameWithOwner: repository.full_name,
            repoSource: "getFromAppInstallation",
            ref: "",
          };

          return result;
        });
      } catch (error: any) {
        log.error({
          message: "Error fetching repositories",
          error: error, // this will log the error message
          stack: error.stack, // this will log the stack trace
        });
        throw new Error("Failed to fetch repositories");
      }

      return repositories.filter((repo) => repo !== null) as Repository[];
    };
    const cacheTTL = 86400; // 24 hours
    const [data] = await cache.cache<Repository[]>(cacheKey, fetchFn, cacheTTL);
    return data;
  }

  return repositories.filter((repo) => repo !== null) as Repository[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const repositories = await fetchRepositories();
    res.status(200).json(repositories);
    log.debug("repositories", repositories);
  } catch (error: any) {
    log.error({
      message: "Error fetching repositories:",
      error: error,
      errorStack: error.stack,
    });
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
}

export const repoHandler = handler;
