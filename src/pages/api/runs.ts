import { NextApiRequest, NextApiResponse } from "next";
import { splitRepoWithOwner } from "@/lib/utils";
import { WorkflowRunResponse, Run, RunItem } from "@/lib/types/types";
import { cache } from "@/lib/cache";
import App from "@/lib/app";
import { log } from "@/lib/log";

const config = App.getConfig();
const github = App.getGitHub();

// Extract `data` type from GitHub response to make it simpler to use in the functions below
type WorkflowRunData = WorkflowRunResponse["data"];

// Gets a workflow run for single repo, with an optional single workflowId
async function getWorkflowRuns(
  repoWithOwner: string,
  head_branch?: string,
  workflowId?: number,
  actor?: string,
  status?: any,
): Promise<WorkflowRunData> {
  try {
    const [owner, repo] = await splitRepoWithOwner(repoWithOwner);
    // cache the response
    const cacheKey = `${owner}/${repo}/workflowsRuns/${workflowId}/${head_branch}/${actor}/${status}/`;
    const fetchFn = async () => {
      const response = await github.request(
        `GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs`,
        {
          per_page: config.apiLimits.workflowRuns,
          owner,
          repo,
          workflow_id: `${workflowId}`,
          branch: head_branch,
          actor,
          status,
        },
      );
      log.debug(response);
      return response.data;
    };

    const [data] = await cache.cache<WorkflowRunData>(
      `${cacheKey}/${workflowId}`,
      fetchFn,
    );

    log.debug({
      message: `Workflow runs loaded from API:`,
      data,
    });

    return data as WorkflowRunData;
  } catch (error) {
    // If a call errors out, we log to the console for now and return
    // an skeleton object that fulfils the promise return type
    // This will be filtered out later in the `handler` function.
    log.error(`Error loading workflow runs for repo: ${repoWithOwner}`, error);
    log.error(error);
    return {
      total_count: 0,
      workflow_runs: [],
    };
  }
}

// Helper function to process the data and return a single Run object
function processData(data: WorkflowRunData): Run {
  // Because all the runs in `data` will have the same repository information
  // We extract the repository data from the first item in workflow_runs
  const repoInWorkflowRuns = data.workflow_runs[0].repository;

  // Initialise a variable of type `Run` with repository information extracted
  // from above and an empty `runs` array where add `RunItems`
  const runResponse: Run = {
    repository: {
      id: repoInWorkflowRuns.id,
      name: repoInWorkflowRuns.name,
      html_url: repoInWorkflowRuns.html_url,
      nameWithOwner: repoInWorkflowRuns.full_name,
      owner: {
        login: repoInWorkflowRuns.owner.login,
        avatar_url: repoInWorkflowRuns.owner.avatar_url,
        html_url: repoInWorkflowRuns.owner.html_url,
      },
    },
    runs: [],
  };

  // Iterate through each workflow_run to extract information for a run
  runResponse.runs = data.workflow_runs.map((run) => {
    const runItem: RunItem = {
      id: run.id,
      name: run.name,
      display_title: run.display_title,
      head_branch: run.head_branch,
      workflow_id: run.workflow_id,
      workflow_url: run.workflow_url,
      run_started_at: run.created_at,
      created_at: run.created_at,
      updated_at: run.updated_at,
      run_attempt: run.run_attempt || 0,
      run_number: run.run_number,
      html_url: run.html_url,
      actor: {
        avatar_url: run.actor!.avatar_url,
        html_url: run.actor!.html_url,
        login: run.actor!.login,
      },
      status: run.status,
      conclusion: run.conclusion,
      event: run.event,
    };
    return runItem;
  });

  return runResponse;
}

type RepoWithWorkflows = {
  repos: string;
  workflowIds: number[];
};

// Internal API handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const workflows = req.query.workflows as string;
  let repoWithWorkflows: RepoWithWorkflows[];

  log.debug(`req.query:`, req.query.workflows);

  // Check if workflows is defined and not empty
  if (!workflows) {
    res.status(400).json({
      error:
        "Missing workflows query parameter, provide a comma-separated list of repoWithOwner/[workflowID]",
    });
    return;
  }

  // Check if workflows is a string and contains at least one repoWithOwner/[workflowID]
  if (/.+?\[.+?\]/g.test(workflows)) {
    // Split the string into an array of repoWithOwner/[workflowID]
    repoWithWorkflows = workflows.match(/.+?\[.+?\]/g)!.map((d) => {
      // Split the repoWithOwner/[workflowID] into repoWithOwner and [workflowID]
      const parts = /^,?(.*?)\[(.*)\]/g.exec(d);
      return {
        repos: parts![1],
        // Split the [workflowID] into an array of workflowIDs
        workflowIds: parts![2].split(",").map((id) => {
          return parseInt(id, 10);
        }),
      };
    });
  } else {
    res.status(400).json({
      error: "Invalid query format, expecting repoWithOwner/[workflowID]",
    });
    return;
  }

  try {
    // Get the runs for each repoWithOwner/[workflowID]
    const runs = await Promise.all(
      repoWithWorkflows.map((repoWithWorkflow) => {
        return Promise.all(
          // Get the runs for each workflowID
          repoWithWorkflow.workflowIds.map(async (workflowId) => {
            return getWorkflowRuns(
              repoWithWorkflow.repos,
              undefined,
              workflowId,
            );
          }),
        );
      }),
    );

    const combinedRuns: WorkflowRunData[] = [];

    // Combine the runs from each repo into a single array
    runs.forEach((runsArray) => {
      const { total_count } = runsArray[0];
      combinedRuns.push({
        total_count,
        workflow_runs: runsArray.flatMap((item) => item.workflow_runs),
      });
    });

    const result = combinedRuns.map((r) => processData(r));

    res.end(JSON.stringify(result));
  } catch (err) {
    //
    res.status(400).end(JSON.stringify(err));
  }
}
