import * as cheerio from "cheerio";
import { App, requestUrl, TFile } from "obsidian";
import { Book, renderBookCard } from "../components/bookcard";
import { BookMetadataPluginSettings } from "src/components/settings";
import { safeRequest } from "./safesearch";

// Helper: extract authors
function extractAuthors(bookData: any, apollo: any): string[] {
  const authors: string[] = [];

  if (Array.isArray(bookData.contributorEdges)) {
    for (const edge of bookData.contributorEdges) {
      const ref = edge?.node?.__ref;
      if (ref && apollo[ref]?.name) {
        authors.push(apollo[ref].name);
      }
    }
  }

  if (!authors.length && bookData.primaryContributorEdge) {
    const ref = bookData.primaryContributorEdge?.node?.__ref;
    if (ref && apollo[ref]?.name) {
      authors.push(apollo[ref].name);
    }
  }

  return authors.length ? authors : [""];
}

function extractPublicationTime(details: any): string {
  if (!details) return "";
  return details.publicationTime ?? "";
}

function formatTimestampToDate(timestamp?: number): string {
  if (typeof timestamp !== "number") return "";

  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// Scrape book details from a Goodreads book page
export async function scrapeBookDetails(bookUrl: string) {
  const response = await safeRequest("Goodreads", bookUrl);

  const $ = cheerio.load(response.text);
  const scriptTag = $("#__NEXT_DATA__");
  if (!scriptTag.length) {
    throw new Error("❌ Could not find __NEXT_DATA__ script on the page.");
  }

  const jsonData = JSON.parse(scriptTag.html()!);
  const apollo = jsonData.props.pageProps.apolloState;

  const apolloKeys = Object.keys(apollo);
  const bookKey = apolloKeys.find(k => k.startsWith("Book:"));
  const workKey = apolloKeys.find(k => k.startsWith("Work:"));
  const seriesKey = apolloKeys.find(k => k.startsWith("Series:"));

  if (!bookKey) throw new Error("No Book key found in apolloState");

  const bookData = apollo[bookKey];

  const publisher = bookData.details?.publisher ?? "";
  const pages = Number(bookData.details?.numPages) || 0;
  const cover = bookData.imageUrl ?? "https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png";

  // Clean description
  let description = bookData.description ?? "No description available.";
  description = description
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (description.includes("An alternative cover for this ASIN")) {
    const quoteIndex = description.indexOf('"');
    if (quoteIndex !== -1) {
      description = description.slice(quoteIndex + 1);
    }
  }

  const averageRating =
    workKey && apollo[workKey]?.stats?.averageRating
      ? apollo[workKey].stats.averageRating
      : 0;

  const genres = (bookData.bookGenres || []).map((g: any) => g.genre.name);

  const title = bookData.title ?? "";
  const authors = extractAuthors(bookData, apollo);
  const publicationTime = extractPublicationTime(bookData.details);
  const publicationDate = formatTimestampToDate(Number(publicationTime))
  const isbn10 = bookData.details?.isbn ?? ""
  const isbn13 = bookData.details?.isbn13 ?? ""

  const series = seriesKey ? apollo[seriesKey]?.title ?? "" : ""

  return {
    title,
    authors,
    publisher,
    publicationDate,
    pages,
    cover,
    genres,
    series,
    averageRating,
    description,
    isbn10,
    isbn13
  };
}


// Search Goodreads for a query and render book cards
export async function searchGoodreadsbyTitleAuthor(
  app: App, 
  settings: BookMetadataPluginSettings,
  resultsSection: HTMLDivElement,
  title: string,
  author: string,
  file?: TFile,
  frontmatter?: Record<string, any>,
  maxResults = 10,
): Promise<Book[]> {
  const query = `${title} ${author}`.trim();
  const queryEncoded = encodeURIComponent(query);
  const searchUrl = `https://www.goodreads.com/search?q=${queryEncoded}`;
  const headers = { "User-Agent": "Mozilla/5.0" };

  const response = await requestUrl({ url: searchUrl, method: "GET", headers });
  if (response.status !== 200) {
    throw new Error(`❌ Failed to fetch search results. Status code: ${response.status}`);
  }

  const $ = cheerio.load(response.text);
  const bookRows = $("tr[itemtype='http://schema.org/Book']").slice(0, maxResults).toArray();

  if (!bookRows.length) {
    console.log("❌ No results found on Goodreads.");
    return [];
  }

  console.log(`🔍 Loading Top ${bookRows.length} Results for Goodreads`);

  const results: Book[] = [];

  for (const el of bookRows) {
    try {
      const titleTag = $(el).find("a.bookTitle");
      if (!titleTag.length) continue;

      const bookUrl = "https://www.goodreads.com" + titleTag.attr("href");

      const data = await scrapeBookDetails(bookUrl); 
      const book = { url: bookUrl, ...data };

      renderBookCard(app, settings, resultsSection, book, "Goodreads", file, frontmatter);

      results.push(book);

    } catch (err) {
      console.warn("❌ Failed to scrape a book:", err);
    }
  }

  return results;
}

// Search Goodreads by ISBN and render a book card
export async function searchGoodreadsByISBN(
  app: App, 
  settings: BookMetadataPluginSettings,
  resultsSection: HTMLDivElement,
  isbn: string,
  file?: TFile,
  frontmatter?: Record<string, any>
): Promise<Book | null> {
  const bookUrl = `https://www.goodreads.com/book/isbn/${encodeURIComponent(isbn)}`;
  const headers = { "User-Agent": "Mozilla/5.0" };

  try {
    const response = await requestUrl({ url: bookUrl, method: "GET", headers });
    if (response.status !== 200) {
      console.warn(`❌ Failed to fetch ISBN ${isbn}. Status code: ${response.status}`);
      return null;
    }

    const data = await scrapeBookDetails(bookUrl);

    const book = {
      url: bookUrl,
      ...data,
    } as Book

    renderBookCard(app, settings, resultsSection, book, "Goodreads", file, frontmatter);

    return book                                                             

  } catch (err) {
    console.warn(`❌ Failed to fetch ISBN ${isbn}:`, err);
    return null;
  }
}
