import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { log } from "./log";
// import { cache } from "@/lib/cache";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function splitRepoWithOwner(repoWithOwner: string) {
  const [owner, repo] = repoWithOwner.split("/");
  return [owner, repo];
}

export async function splitRepos(repos: string) {
  const reposArray = repos.split(",");
  return reposArray;
}

// a function that gets the latest sha for a given branch (defaults to main) for a given repo
export async function getLatestSha(
  github: any,
  repoWithOwner: string,
  branch: string = "main",
): Promise<string> {
  const [owner, repo] = await splitRepoWithOwner(repoWithOwner);
  try {
    const response = await github.request(
      `GET /repos/{owner}/{repo}/commits/{branch}`,
      {
        owner,
        repo,
        branch,
      },
    );

    log.debug(response.data);
    return response.data.sha;
  } catch (error) {
    log.error(error);
    return "";
  }
}

// // Example usage:
// interface ResponseData {
//   data: string;
// }

// /**
//  * Simulates an API call to fetch data.
//  * @returns A Promise that resolves to the response data.
//  */
// async function fetchData(): Promise<ResponseData> {
//   return new Promise(resolve => {
//     setTimeout(() => {
//       resolve({ data: 'Response data' });
//     }, 1000);
//   });
// }

// // Example usage with ResponseCache class
// const cache = new ResponseCache();
// const cacheKey = 'cache-key';
// const fetchFn = fetchData;
// const cacheDuration = 60; // Cache duration in seconds
// const isCacheDisabled = false;

// cache.cache<ResponseData>(cacheKey, fetchFn, cacheDuration, isCacheDisabled).then(data => {
//   log.debug('Cached data:', data);
// });

// // Example usage with caching disabled
// const disableCache = true;

// cache.cache<ResponseData>(cacheKey, fetchFn, cacheDuration, disableCache).then(data => {
//   log.debug('Non-cached data:', data);
// });
