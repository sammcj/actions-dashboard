/**
 * This file contains top-level app configuration and singletons.
 */

import GitHub from "@/lib/github";
import configure from "@/lib/config";

class App {
  // Single instance of the app configuration used throughout the app.
  private static config = configure;

  // Single instance of the GitHub API client used throughout the app.
  private static github = new GitHub();

  // Private constructor to prevent creating multiple instances.
  private constructor() {}

  // Getter for config property.
  public static getConfig(): any {
    return App.config;
  }

  // Getter for github property.
  public static getGitHub(): GitHub {
    return App.github;
  }
}

export default App;
// Usage:
// import App from "@/lib/app";
// const log = App.getLog();
// log.info("Hello world!");
