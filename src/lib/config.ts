/**Takes configuration parameters, validates them, and returns a configuration object.  */

// Note: we can't use log here because it hasn't been initialized yet

/**
 * Configuration object
 * @param authMethod - "app" or "token"
 * @param apiLimits - object containing pagination limits for various API calls (repos, environments, workflowRuns, workflows)
 * @param defaultBranch - (optional) the default branch to check for workflow runs on
 * @param filterRegex - (optional) string containing a regular expression
 * @param githubAppClientId - the client id of the GitHub App
 * @param githubAppClientSecret - the client secret of the GitHub App
 * @param githubAppId - the id of the GitHub App
 * @param githubAppInstallationId - the installation id of the GitHub App
 * @param githubAppPrivateKey - containing a base64 encoded private key
 * @param githubOwner - the owner of the repositories to get all repos from
 * @param limits - (optional) object containing pagination limits for various API calls
 * @param repoList - containing the names of the repositories to check including the owner, e.g. "owner/repo", if empty will get all repos from the owner
 * @param repoSource - "getFromOwner", "repoList", "getFromAppInstallation"
 * @param logLevel - (optional) the log level to use (default: "warn")
 * @returns AppConfig
 */

// json config passing
interface AppConfig {
  authMethod: string;
  apiLimits: {
    environments: number;
    repos: number;
    workflowRuns: number;
    workflows: number;
  };
  defaultBranch: string;
  githubAppClientId: string;
  githubAppClientSecret: string;
  githubAppId: number;
  githubAppInstallationId: number;
  githubAppPrivateKey: string;
  githubOwner: string;
  repoList: string[];
  repoSource: string;
  logLevel?: string;
}

async function validateConfig(config: AppConfig): Promise<boolean> {
  // check that the repoSource is valid
  const validRepoSources = [
    "getFromOwner",
    "repoList",
    "getFromAppInstallation",
  ];
  if (!validRepoSources.includes(config.repoSource)) {
    console.log(
      `Invalid repoSource: ${config.repoSource}, must be one of ${validRepoSources}`,
    );
    return false;
  }

  // check that the repoList is valid
  if (config.repoSource === "repoList") {
    if (config.repoList.length === 0) {
      console.log(
        `Invalid repoList: ${config.repoList}, must be a list of repositories`,
      );
      return false;
    }
  }

  // check that the defaultBranch is valid
  if (config.defaultBranch.length === 0) {
    console.log(
      `Invalid defaultBranch: ${config.defaultBranch}, must be a branch name`,
    );
    return false;
  }

  // check that the githubOwner is valid
  if (config.repoSource === "getFromOwner") {
    if (config.githubOwner.length === 0) {
      console.log(
        `Invalid githubOwner: ${config.githubOwner}, must be an owner name`,
      );
      return false;
    }
  }

  // check that the githubAppId is valid
  if (config.githubAppId === 0) {
    console.log(`Invalid githubAppId: ${config.githubAppId}`);
    return false;
  }

  // check that the githubAppInstallationId is valid
  if (config.githubAppInstallationId === 0) {
    console.log(
      `Invalid githubAppInstallationId: ${config.githubAppInstallationId}`,
    );
    return false;
  }

  // check that the githubAppPrivateKey is valid
  if (config.githubAppPrivateKey.length === 0) {
    console.log(
      `Invalid githubAppPrivateKey - config.githubAppPrivateKey, must be a base64 encoded private key (this is expected during a build)`,
    );
    return false;
  }

  // check that the githubAppClientId is valid
  if (config.githubAppClientId.length === 0) {
    console.log(
      `Invalid githubAppClientId: ${config.githubAppClientId}, must be a client id`,
    );
    return false;
  }

  // check that the githubAppClientSecret is valid
  if (config.githubAppClientSecret.length === 0) {
    console.log(
      `Invalid githubAppClientSecret: ${config.githubAppClientSecret}, must be a client secret`,
    );
    return false;
  }

  // check that the apiLimits are valid
  for (const [key, value] of Object.entries(config.apiLimits)) {
    if (value <= 0) {
      console.log(`Invalid apiLimit for ${key}: ${value}, must be > 0`);
      return false;
    }
  }

  // if we get here, all validation checks have passed
  return true;
}

export function loadConfig(): AppConfig {
  const config: AppConfig = {
    apiLimits: {
      environments: Number(process.env.API_LIMIT_ENVIRONMENTS || 10),
      repos: Number(process.env.API_LIMIT_REPOS || 10),
      workflowRuns: Number(process.env.API_LIMIT_WORKFLOW_RUNS || 10),
      workflows: Number(process.env.API_LIMIT_WORKFLOWS || 10),
    },
    defaultBranch: process.env.DEFAULT_BRANCH || "main",
    githubAppClientId: process.env.GITHUB_APP_CLIENT_ID || "",
    githubAppClientSecret: process.env.GITHUB_APP_CLIENT_SECRET || "",
    githubAppId: Number(process.env.GITHUB_APP_ID),
    githubAppInstallationId: Number(process.env.GITHUB_APP_INSTALLATION_ID),
    githubAppPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY || "",
    githubOwner: process.env.GITHUB_OWNER || "",
    repoList: (process.env.REPO_LIST || "").split(","),
    repoSource: process.env.REPO_SOURCE || "repoList",
    logLevel: process.env.LOG_LEVEL,
    authMethod: process.env.AUTH_METHOD || "app",
  };

  try {
    // Only run if we're not using a personal access token and are not running during the nextjs build process
    if (config.authMethod !== "token" && !process.env.NEXT_PUBLIC_VERCEL_URL) {
      validateConfig(config);
    }
  } catch (error) {
    console.log("Error validating config!", error);
  }

  try {
    config.githubAppPrivateKey = Buffer.from(
      config.githubAppPrivateKey,
      "base64",
    ).toString("utf-8");
  } catch (error) {
    console.log("Error decoding githubAppPrivateKey!", error);
  }
  return config;
}

const config = loadConfig();

export default config;
