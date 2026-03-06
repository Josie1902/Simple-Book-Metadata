import { Book } from "src/components/bookcard";
import { searchGoodreadsByISBN, searchGoodreadsbyTitleAuthor } from "src/services/goodreads";
import { searchGooglebyISBN, searchGooglebyTitleAuthor } from "src/services/googlebook";
import { searchOpenLibraryByISBN, searchOpenLibraryByTitleAuthor } from "src/services/openlibrary";
import { App, TFile } from "obsidian";
import { BookMetadataPluginSettings } from "./components/settings";

export type BookQuery = {
    isbn?: string;
    title?: string;
    author?: string;
};

export interface BookProvider {
    name: string;
    search(query: BookQuery): Promise<Book[]>;
}

export function createGoodreadsProvider(
    app: App,
    settings: BookMetadataPluginSettings,
    resultsSection: HTMLDivElement,
    file?: TFile,
    frontmatter?: Record<string, any>
): BookProvider {
    return {
        name: "Goodreads",

        async search(query: BookQuery): Promise<Book[]> {
            if (query.isbn) {
                const result = await searchGoodreadsByISBN(
                    app,
                    settings,
                    resultsSection,
                    query.isbn,
                    file,
                    frontmatter
                );
                return result ? [result] : [];
            }

            return await searchGoodreadsbyTitleAuthor(
                app,
                settings,
                resultsSection,
                query.title ?? "",
                query.author ?? "",
                file,
                frontmatter
            );
        }
    };
}

export function createGoogleBooksProvider(
    app: App,
    settings: BookMetadataPluginSettings,
    resultsSection: HTMLDivElement,
    file?: TFile,
    frontmatter?: Record<string, any>
): BookProvider {
    return {
        name: "Google",
        async search(query: BookQuery): Promise<Book[]> {
            if (query.isbn) {
                return await searchGooglebyISBN(
                    app,
                    settings,
                    resultsSection,
                    query.isbn,
                    file,
                    frontmatter
                );
            }
            return await searchGooglebyTitleAuthor(
                app,
                settings,
                resultsSection,
                query.title ?? "",
                query.author ?? "",
                file,
                frontmatter
            );
        }
    };
}

export function createOpenLibraryProvider(
    app: App,
    settings: BookMetadataPluginSettings,
    resultsSection: HTMLDivElement,
    file?: TFile,
    frontmatter?: Record<string, any>
): BookProvider {
    return {
        name: "OpenLibrary",
        async search(query: BookQuery): Promise<Book[]> {
            if (query.isbn) {
                const result = await searchOpenLibraryByISBN(
                    app,
                    settings,
                    resultsSection,
                    query.isbn,
                    file,
                    frontmatter
                );
                return result ? [result] : [];
            }
            return await searchOpenLibraryByTitleAuthor(
                app,
                settings,
                resultsSection,
                query.title ?? "",
                query.author ?? "",
                file,
                frontmatter
            );
        }
    }
}
        