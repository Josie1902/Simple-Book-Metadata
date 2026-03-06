import { Notice, requestUrl } from "obsidian";

// Note
// Openlibrary rate limits: https://openlibrary.org/developers/api#rate-limits

const MIN_INTERVAL = 1000; // Minimum wait time for 1 request per second
const MAX_INTERVAL = 1200;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function throttledRequest(url: string) {
    const wait = randomBetween(MIN_INTERVAL, MAX_INTERVAL); 

    if (wait > 0) {
      await sleep(wait);
    }   

    return requestUrl({
      url,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
}

function isRateLimited(response: any): boolean {
    if (response.status === 429 || response.status === 403 || response.status === 503) return true;

    const text = response.text?.toLowerCase() ?? "";
    return text.includes("captcha") || text.includes("rate limit");
}


export async function safeRequest(provider: string, url: string) {
    let response = await throttledRequest(url);

    if (isRateLimited(response)) {
      console.warn(`${provider} rate limit detected. Retrying...`);

      new Notice(`⚠️ ${provider} is throttling requests. Retrying...`);

      await sleep(3000); 

      response = await throttledRequest(url);
    }

    return response;
}
