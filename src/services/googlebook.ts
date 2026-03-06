import { App, requestUrl, TFile } from "obsidian";
import { Book, renderBookCard } from "../components/bookcard";
import { BookMetadataPluginSettings } from "src/components/settings";

function cleanDescription(html: string): string {
  if (!html) return "";
  const withLineBreaks = html.replace(/<\/?(p|br|div)[^>]*>/gi, "\n");
  const plain = withLineBreaks.replace(/<[^>]+>/g, "");
  return plain.replace(/\n\s*\n/g, "\n\n").trim();
}


export async function scrapeBookDetails(item: any): Promise<Book> {
  const volumeInfo = item.volumeInfo || {};
  const title = volumeInfo.title || "";
  const authors = volumeInfo.authors ? volumeInfo.authors : [];
  const publishedDate = volumeInfo.publishedDate || "";
  const description = cleanDescription(volumeInfo.description || "");
  const cover = volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : "https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png";
  const industryIdentifiers = volumeInfo.industryIdentifiers || [];
  const isbn13Obj = industryIdentifiers.find((id: any) => id.type === "ISBN_13");
  const isbn13 = isbn13Obj ? isbn13Obj.identifier : "";
  const isbn10Obj = industryIdentifiers.find((id: any) => id.type === "ISBN_10");
  const isbn10 = isbn10Obj ? isbn10Obj.identifier : "";
  const publisher = volumeInfo.publisher || "";
  const pages = volumeInfo.pageCount || "";
  const genres = volumeInfo.categories || []       
  const averageRating = volumeInfo.averageRating || "";
  const series = ""; // Google API does not provide series info
  const bookUrl = volumeInfo.infoLink || "";
  const book = {
      url: bookUrl,
      title,
      authors,
      publisher,
      publicationDate: publishedDate,
      pages,
      cover,
      genres,
      series,
      averageRating,
      description,
      isbn13,
      isbn10
  }
  return book;
}

export async function searchGooglebyTitleAuthor(
    app: App, 
    settings: BookMetadataPluginSettings,
    resultsSection: HTMLDivElement,
    tile: string,
    author: string,
    file?: TFile,
    frontmatter?: Record<string, any>,
    maxResults: number = 10
): Promise<Book[]> {
    
  let query = `intitle:${tile}`;

  if (author) {
    query += `+inauthor:${author}`;
  }

  const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${settings.googleApiKey}`;
  const headers = { "User-Agent": "Mozilla/5.0" };    
  const response = await requestUrl({ url: searchUrl, method: "GET", headers });
  
  if (response.status === 429) {
    throw new Error("❌ Google Books API rate limit exceeded. Slow down your requests.");
  }

  if (!response.arrayBuffer && response.status !== 200) {
    throw new Error(`❌ Google Books request failed (${response.status})`);
  }

  const bookRows = response.json.items || []  
  if (!bookRows.length) {
    console.log("❌ No results found on Google Books.");
    return [];
  }   
  console.log(`🔍 Loading Top ${bookRows.length} Results for Google Books`);

  const results = await Promise.all(
    bookRows.map(async (item: any) => {
      try {
        const book = await scrapeBookDetails(item);   
        renderBookCard(app, settings, resultsSection, book, "Google", file, frontmatter);
        return book as Book;
        } catch (error) {
            console.warn("❌ Failed to scrape a book:", error);
            return null;
        }
    })
  ) 
    
  return results.filter((r): r is Book => r !== null);
}

export async function searchGooglebyISBN(
  app: App, 
  settings: BookMetadataPluginSettings,
  resultsSection: HTMLDivElement,
  isbn: string,
  file?: TFile,
  frontmatter?: Record<string, any>,
  maxResults: number = 10
): Promise<Book[]> {
  const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${settings.googleApiKey}&maxResults=${maxResults}`;
  const headers = { "User-Agent": "Mozilla/5.0" };
  const response = await requestUrl({ url: searchUrl, method: "GET", headers });
  
  if (response.status === 429) {
    throw new Error("❌ Google Books API rate limit exceeded. Slow down your requests.");
  }

  if (!response.arrayBuffer && response.status !== 200) {
    throw new Error(`❌ Google Books request failed (${response.status})`);
  }

  const bookRows = response.json.items || []  
    if (!bookRows.length) {
      console.log("❌ No results found on Google Books.");
      return [];
    }   
    console.log(`🔍 Loading Top ${bookRows.length} Results for Google Books`);
  
  const results = await Promise.all(
    bookRows.map(async (item: any) => {
      try {
        const book = await scrapeBookDetails(item);   
        renderBookCard(app, settings, resultsSection, book, "Google", file, frontmatter);
        return book as Book;
        } catch (error) {
            console.warn("❌ Failed to scrape a book:", error);
            return null;
        }
    })
  ) 
    
  return results.filter((r): r is Book => r !== null);
}