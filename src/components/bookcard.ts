import { App, TFile, WorkspaceLeaf } from "obsidian";
import { BookUpdateView } from "src/views/bookupdate";
import { BookView } from "src/views/bookview";
import { BookMetadataPluginSettings } from "./settings";

export interface Book {
  title: string;
  authors: string[];
  publisher: string;
  publicationDate: string;
  pages: number;
  cover: string;
  genres: string[];
  series: string;
  averageRating: string;
  description: string;
  isbn10: string;
  isbn13: string;
  url: string
}


export function renderBookCard(
    app: App,
    settings: BookMetadataPluginSettings,
    resultsSection: HTMLDivElement,
    book: Book,
    provider: string,
    file?: TFile,
    frontmatter?: Record<string, any>,
) {
  const card = resultsSection.createDiv({ cls: "book-card" });
                
  // Cover
  const cover = card.createEl("img", { cls: "book-card-cover" });
  cover.src = book.cover || "";
              
  // Info
  const info = card.createDiv({ cls: "book-info" });
  info.createEl("div", {
      text: book.title,
      cls: "book-title"
  });
                
  const providerEl =info.createEl("div", {
      text: provider,
      cls: "book-provider"
  });

  if (provider) {
    providerEl.addClass(provider.toLowerCase());
  }
                
  info.createEl("div", {
      text: book.authors.join(", "),
      cls: "book-author"
  });
                
  info.createEl("div", {
      text: book.publicationDate.split("-")[0],
      cls: "book-year"
  });

  info.createEl("div", {
      text: book.description.slice(0, 70)+ "...",
      cls: "book-description"
  });
                
  card.addEventListener("click", () => {
    let leaf: WorkspaceLeaf;
    let view: BookView | BookUpdateView | null = null;

    let existingLeaves = app.workspace
    .getLeavesOfType("book-view")
    .filter(leaf => leaf.view instanceof BookView);

    if (file) {
      existingLeaves = app.workspace
      .getLeavesOfType("book-update-view")
      .filter(leaf => leaf.view instanceof BookUpdateView);
    } 
    

    if (existingLeaves.length > 0) {
        // Reuse the first existing leaf
        leaf = existingLeaves[0];
        view = leaf.view as BookView | BookUpdateView;
    } 
    else {
        const newLeaf = app.workspace.getLeaf('split'); 
        if (!newLeaf) {
          console.error("Cannot create a new leaf for BookView");
          return;
        }
        leaf = newLeaf;
    }
    
    if (!view) {
        if (!file || !frontmatter) {
          view = new BookView(leaf, book, provider, settings);
          leaf.open(view);
        } else {
          view = new BookUpdateView(leaf, book, provider, file, frontmatter);
          leaf.open(view);
        }
    } else {
      // Update existing view
      view.bookData = book;
      view.provider = provider;
      if (view instanceof BookUpdateView && file && frontmatter) {
        view.file = file;
        view.frontmatter = frontmatter;
      }
      view.onOpen(); 
    }

    // Make the leaf active so it shows
    if (!file) {
      leaf.setViewState({ type: "book-view", active: true });
    } else {
      leaf.setViewState({ type: "book-update-view", active: true });
    }
  });
}