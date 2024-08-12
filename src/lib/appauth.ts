// Handles Github App authentication and session
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { retry } from "@octokit/plugin-retry";
import config from "./config";
import { log } from "./log";

// https://octokit.github.io/rest.js/
// https://github.com/octokit/auth-app.js/#usage

const MyOctokit: typeof Octokit = Octokit.plugin(throttling).plugin(retry);
// all requests sent with the `octokit` instance are retried up to 3 times for recoverable errors.

interface AppAuthProps {
  appId: number;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  installationId: number;
}

/**
 * Handles Github App authentication and session
 * Returns authenticated Octokit object
 */
export class AppAuth {
  octokit: Octokit;

  constructor() {
    // Instantiate octokit session
    this.octokit = new MyOctokit({
      auth: this.getAppAuthProps(),
      authStrategy: createAppAuth,
      throttle: {
        onRateLimit: (retryAfter: number, options: any) => {
          const message = `Request quota exhausted for request ${options.method} ${options.url}`;
          this.octokit.log.warn(message);
          log.warn(message);

          if (options.request.retryCount < 1) {
            // only retries once
            const message = `Retrying after ${retryAfter} seconds!`;
            this.octokit.log.info(message);
            log.warn(message);
            return true;
          }
        },
        onSecondaryRateLimit: (retryAfter: number, options: any, octokit) => {
          // does not retry, only logs a warning
          const message = `Request quota exhausted for request ${options.method} ${options.url}`;
          octokit.log.warn(message);
          log.warn(message);
        },
      },
    });
  }

  private getAppAuthProps(): AppAuthProps {
    return {
      appId: config.githubAppId,
      privateKey: config.githubAppPrivateKey,
      clientId: config.githubAppClientId,
      clientSecret: config.githubAppClientSecret,
      installationId: config.githubAppInstallationId,
    };
  }
}

export default AppAuth;
