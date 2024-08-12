import App from "@/lib/app";
import { log } from "@/lib/log";
import { NextApiRequest, NextApiResponse } from "next";
import { splitRepoWithOwner } from "@/lib/utils";
import { cache } from "@/lib/cache";
import { WorkflowResponse, Workflow, WorkflowQuery } from "@/lib/types/types";

const config = App.getConfig();
const github = App.getGitHub();

// Github's GraphQL doesn't support Actions yet, so we have to use the REST API

/*
 * Get the workflow data for each repo (in parallel)
 * If a workflowID is provided, filter the data to only include that workflow
 * If a branch is provided, filter the data to only include that branch
 * Transform the data into the format we want for the workflow interface
 * Return the data in the response
 */

// Take a repoWithOwner and returns workflow data for that repo
async function getWorkflows(repoWithOwner: string): Promise<Workflow[]> {
  try {
    const [owner, repo] = await splitRepoWithOwner(repoWithOwner);
    // cache the response
    const cacheKey = `${owner}/${repo}/workflows`;
    const fetchFn = async () => {
      // log.debug("I AM A NETWORK REQUEST LOG");
      const response = await github.request(
        "GET /repos/{owner}/{repo}/actions/workflows",
        {
          owner,
          repo,
          limit: config.apiLimits.workflows,
        },
      );

      const workflows: Workflow[] = response.data.workflows.map((workflow) => ({
        name: workflow.name,
        id: workflow.id,
        url: workflow.url,
        path: workflow.path,
        html_url: workflow.html_url,
        badge_url: workflow.badge_url,
        state: workflow.state,
        repoWithOwner: `${owner}/${repo}`,
      }));

      return workflows;
    };
    const [data] = await cache.cache<Workflow[]>(cacheKey, fetchFn);

    log.debug({
      message: `Workflows loaded from API:`,
      data, // if we're running in debug also log the data
    });

    return data || [];
  } catch (error) {
    log.error("Error retrieving workflows:", error);
    return [];
  }
}

// Takes a repoWithOwner and workflow_id and return workflow data for that workflow (only)
export async function getWorkflow(
  repoWithOwner: string,
  workflow_id: number,
  branch?: string,
): Promise<WorkflowResponse["data"]> {
  const [owner, repo] = await splitRepoWithOwner(repoWithOwner);
  // cache the response
  const cacheKey = `${owner}/${repo}/workflows/${workflow_id}`;
  const fetchFn = async () => {
    try {
      const response = await github.request(
        `GET /repos/{owner}/{repo}/actions/workflows/${workflow_id}`,
        {
          owner,
          repo,
          workflow_id,
          limit: config.apiLimits.workflows,
          branch: branch,
        },
      );

      log.debug(response.data);
      return response.data;
    } catch (error) {
      log.error(error);
      return {
        total_count: 0,
        workflows: [],
      };
    }
  };

  const cacheTTL = 86400; // 24 hours
  const [data] = await cache.cache<WorkflowResponse["data"]>(
    cacheKey,
    fetchFn,
    cacheTTL,
  );

  log.debug({
    message: `Workflow loaded from API:`,
    data,
  }); // if we're running in debug also log the data

  return data || [];
}

/*
 * Query parameters:
 * repos: a comma separated list of repos with owner, e.g. MyUser/Myrepo,SomeoneElse/OtherRepo
 * workflowIDs: (optional) a comma separated list of workflowIDs, e.g. 123456789,987654321
 * branch: (optional) a branch name, e.g. feature_branch
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Take a query parameter for the list of repos with owner
  const reposWithOwner = req.query.repos as WorkflowQuery["reposWithOwner"];
  // workflowID can be a comma separated list of workflowIDs, similar to reposWithOwner
  const workflowIDs = req.query.workflowIDs as string;
  const branch = req.query.branch as string;
  // e.g. `/workflows?reposWithOwner=MyUser/Myrepo,SomeoneElse/OtherRepo&workflowIDs=123456789&branch=feature_branch`;

  if (reposWithOwner === undefined) {
    res.status(400).json({
      error:
        "Missing repos query parameter, e.g. ?repos=MyUser/Myrepo,SomeoneElse/OtherRepo",
    });
    return;
  }

  const repos = reposWithOwner.split(",");

  // Get the workflow data for each repo (in parallel)
  // If a workflowID is provided, filter the data to only include that workflow
  // If a branch is provided, filter the data to only include that branch
  // Transform the data into the format we want for the workflow interface

  const data = await Promise.all(
    repos.map(async (repoWithOwner, workflowIds, branch) => {
      if (workflowIDs) {
        // convert workflowIDs from a string of comma separated numbers to an array of numbers
        const workflowIDsArray = workflowIDs.split(",").map(Number);
        // loop through the workflowIDs and get the workflow data for each
        // cache the response
        const cacheKey = `${repoWithOwner}/workflowIds/${branch}`;
        const fetchFn = async () => {
          const workflows = await Promise.all(
            workflowIDsArray.map(async (workflowID: number, branch: any) => {
              const workflow = await getWorkflow(
                repoWithOwner,
                workflowID as number,
                branch,
              );

              // push the workflow data into the workflows array
              return workflow;
            }),
          );
          return {
            repoWithOwner,
            workflows,
          };
        };
        const [data] = await cache.cache(cacheKey, fetchFn);

        log.debug({
          message: `Workflows loaded from API:`,
          data, // if we're running in debug also log the data
        });
        return data;
      } else {
        const workflows = await getWorkflows(repoWithOwner);
        return {
          repoWithOwner,
          workflows,
        };
      }
    }),
  );

  // Return the data in the response
  res.status(200).json(data);
}
