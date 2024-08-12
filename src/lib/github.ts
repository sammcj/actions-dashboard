import { request } from "@octokit/request";
import { AppAuth } from "./appauth";
import { log } from "./log";
import { cache } from "@/lib/cache";

// See TODO.md for more information on the TODOs in this file

/**
 * Wraps Octokit to provide functions for interacting with GitHub
 * Uses the Actions module to get the runs for a repo
 *
 * Provides functions to:
 *  Return a list of workflows for a repo, optionally filtered by a regex on the workflow name
 *
 */
class GitHub {
  app: AppAuth;
  rest;
  actions;
  request;
  repos;

  constructor() {
    this.app = new AppAuth();
    const { actions, rest, request, repos } = this.app.octokit;
    this.rest = rest;
    this.actions = actions;
    this.request = request;
    this.repos = repos;
  }

  // output the current rate limit and requests remaining to the console
  async getRateLimit() {
    const result = await request("GET /rate_limit", {
      headers: {
        authorization: `token ${this.app.octokit.auth}`,
      },
    });
    log.debug(result.data);
    return result.data;
  }

  /**
   * A function that returns all repositories and owners that an application is installed on
   *  @returns string[] // containing the owner and repo name, e.g. "[ owner/repo, owner2/repo2 ]"
   */
  async getAppInstalledRepos(): Promise<string[]> {
    // use the cache to store the list of repos
    const cacheKey = `appInstalledRepos`;
    const fetchFn = async () => {
      try {
        // use the cache to store the list of repos
        const cacheKey = `appInstalledRepos`;
        const fetchFn = async () => {
          const result = await request("GET /installation/repositories", {
            headers: {
              authorization: `token ${this.app.octokit.auth}`,
            },
          });
          const repos = result.data.repositories;
          const repoList: string[] = [];
          for (const repo of repos) {
            repoList.push(repo.full_name);
          }
          return repoList;
        };
        const [data] = await cache.cache<string[]>(cacheKey, fetchFn);
        return data || [];
      } catch (err) {
        log.error(err);
        return [];
      }
    };
    const [data] = await cache.cache<string[]>(cacheKey, fetchFn);
    return data || [];
  }

  /**
   * Uses the environments API to return the environment for a workflow run or an empty string if it doesn't exist
   * @param owner
   * @param repo
   * @param workflowRunId
   * @returns string
   */
  async getEnvironmentForWorkflowRun(
    // Note that repos.ts provides the full list of environments for a repo
    owner: string,
    repo: string,
    workflowRunId: number,
  ): Promise<string> {
    // Use the cache to store the list of environments
    const cacheKey = `${owner}/${repo}/environments`;
    const fetchFn = async () => {
      const getEnvs = await request("GET /repos/{owner}/{repo}/environments/", {
        headers: {
          authorization: `token ${this.app.octokit.auth}`,
        },
        owner,
        repo,
      });
      const envs = getEnvs.data.environments;
      return envs;
    };
    const [envs] = await cache.cache(cacheKey, fetchFn);
    const workFlowRunEnv: string[] = [];

    // Cache the list of deployments for each environment
    const cacheKeyDeploymentsEnvs = `${owner}/${repo}/deployments`;
    const fetchFnDeploymentEnvs = async () => {
      for (const env of envs) {
        const getEnv = await request(
          "GET /repos/{owner}/{repo}/environments/{environment_name}/",
          {
            headers: {
              authorization: `token ${this.app.octokit.auth}`,
            },
            owner,
            repo,
            environment_name: env.name,
          },
        );
        return getEnv.data;
      }
    };
    const [envDeployments] = await cache.cache(
      cacheKeyDeploymentsEnvs,
      fetchFnDeploymentEnvs,
    );

    // Cache getEnvDeployments
    const cacheKeyGetEnvDeployments = `${owner}/${repo}/deployments`;
    const fetchFnGetEnvDeployments = async () => {
      const getEnvDeployments = await request(
        "GET /repos/{owner}/{repo}/deployments",
        {
          headers: {
            authorization: `token ${this.app.octokit.auth}`,
          },
          owner,
          repo,
          environment: envDeployments.id,
        },
      );
      const deployments = getEnvDeployments.data;
      return deployments;
    };
    const [deployments] = await cache.cache(
      cacheKeyGetEnvDeployments,
      fetchFnGetEnvDeployments,
    );

    for (const deployment of deployments) {
      if (deployment.id === workflowRunId) {
        workFlowRunEnv.push(deployment.environment);
      }
    }

    log.info(workFlowRunEnv);
    return workFlowRunEnv[0] || "";
  }
}

export default GitHub;
