import { App, requestUrl, TFile } from "obsidian";
import { Book, renderBookCard } from "../components/bookcard";
import { BookMetadataPluginSettings } from "src/components/settings";
import { safeRequest } from "./safesearch";

function parseDescription(desc: any): string {
  if (!desc) return "";
  if (typeof desc === "string") return desc;
  if (typeof desc === "object" && desc.value) return desc.value;
  return "";
}

async function getEditionFromWork(workKey: string) {
  const editionsUrl = `https://openlibrary.org${workKey}/editions.json?limit=10`;
  const headers = { "User-Agent": "Mozilla/5.0" };  

  const response = await requestUrl({ url: editionsUrl, method: "GET", headers });    

  if (response.status !== 200) return null;   
  const editions = response.json.entries || [];
  if (!editions.length) return null;  

  const best =
    editions.find((e: any) => e.isbn_13?.length && e.number_of_pages) ||
    editions[0];  
  return best;
}

async function getRatings(workKey: string): Promise<number | null> {
  try {
    const ratingsUrl = `https://openlibrary.org${workKey}/ratings.json`;
    const headers = { "User-Agent": "Mozilla/5.0" };  
    const response = await requestUrl({ url: ratingsUrl, method: "GET", headers });   
    if (response.status !== 200) return null; 
    return response.json.summary?.average ?? null;
  } catch {
    return null;
  }
}

async function getOpenLibraryCover(
  isbn13?: string,
  coverId?: number
): Promise<string> {
  if (isbn13) {
    const isbnUrl = `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg?default=false`;
    try {
      const res = await requestUrl({ url: isbnUrl, method: "GET" });
      if (res.status === 200) return isbnUrl;
    } catch {
    }
  }   

  if (coverId) {
    const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`;
    try {
      const res = await requestUrl({ url: coverUrl, method: "GET" });
      if (res.status === 200) return coverUrl;
    } catch {
    }
  }   

  return "https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png";
}

export async function scrapeBookDetails(
  workItem: any
): Promise<Book | null> {

  const workKey = workItem.key;   
  const workUrl = `https://openlibrary.org${workKey}.json`;
  const workRes = await safeRequest("OpenLibrary", workUrl); 

  if (workRes.status !== 200) return null;    

  const workData = workRes.json;  
  const edition = await getEditionFromWork(workKey);  
  const isbn13 = edition?.isbn_13?.[0] || "";
  const isbn10 = edition?.isbn_10?.[0] || ""; 
  const cover = await getOpenLibraryCover(isbn13, workItem.cover_i);  
  const averageRating = await getRatings(workKey);    
  const book: Book = {
    url: `https://openlibrary.org${workKey}`,
    title: workItem.title || "",
    authors: workItem.author_name || [],
    publisher: edition?.publishers?.[0] || "",
    publicationDate:
      edition?.publish_date || workItem.first_publish_year || "",
    pages: edition?.number_of_pages || "",
    cover,
    genres: workData.subjects || workItem.subject || [],
    series: edition?.series?.[0] || "",
    averageRating: averageRating?.toString() || "",
    description: parseDescription(workData.description),
    isbn13,
    isbn10
  };  
  return book;
}

export async function searchOpenLibraryByTitleAuthor(
  app: App,
  settings: BookMetadataPluginSettings,
  resultsSection: HTMLDivElement,
  title: string,
  author: string,
  file?: TFile,
  frontmatter?: Record<string, any>,
  maxResults: number = 10
): Promise<Book[]> {
  let query = `title=${encodeURIComponent(title)}`;
  if (author) {
    query += `&author=${encodeURIComponent(author)}`;
  }
  
  const searchUrl = `https://openlibrary.org/search.json?${query}&limit=${maxResults}`;
  const headers = { "User-Agent": "Mozilla/5.0" };
  const response = await requestUrl({ url: searchUrl, method: "GET", headers });
  
  if (response.status !== 200) {
    throw new Error(`❌ Failed to fetch Open Library results`);
  }
  
  const works = response.json.docs || [];
  
  if (!works.length) {
    console.log("❌ No results found on Open Library.");
    return [];
  }
  
  console.log(`🔍 Loading Top ${works.length} Results for Open Library`);

  const results: Book[] = [];

  for (const work of works) {
    try {
      const book = await scrapeBookDetails(work);
      if (!book) continue;
    
      renderBookCard(app, settings, resultsSection, book, "OpenLibrary", file, frontmatter);
      results.push(book);
    
    } catch (err) {
      console.warn("❌ Failed to fetch work:", err);
    }
  }
  
  return results;

}

export async function searchOpenLibraryByISBN(
  app: App,
  settings: BookMetadataPluginSettings,
  resultsSection: HTMLDivElement,
  isbn: string,
  file?: TFile,
  frontmatter?: Record<string, any>
): Promise<Book | null> {
    const searchUrl = `https://openlibrary.org/search.json?isbn=${isbn}`;
    const headers = { "User-Agent": "Mozilla/5.0" };    
    const response = await requestUrl({ url: searchUrl, method: "GET", headers });
    
    if (response.status !== 200) {
      throw new Error(`❌ Failed to fetch ISBN from Open Library`);
    }
    
    const work = response.json.docs?.[0];
    
    if (!work) {
      console.log("❌ No results found for ISBN.");
      return null;
    }
    
    const book = await scrapeBookDetails(work);
    
    if (book) {
      renderBookCard(app, settings, resultsSection, book, "OpenLibrary", file, frontmatter);
    }
    
    return book;
}
