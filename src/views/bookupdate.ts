import { ItemView, WorkspaceLeaf, TFile, Notice, ButtonComponent, TextComponent } from "obsidian";
import { Book } from "src/components/bookcard";
import { createCoverSection, createDescriptionSection, createEditableChipField, createProviderPills, createTextField } from "../components/bookupdate";

export class BookUpdateView extends ItemView {
  file: TFile;
  frontmatter: Record<string, any>;
  bookData: Book;
  provider: string;

  constructor(leaf: WorkspaceLeaf, bookData: Book, provider: string, file: TFile, frontmatter: Record<string, any>) {
    super(leaf);
    this.bookData = bookData;
    this.provider = provider;
    this.file = file;
    this.frontmatter = frontmatter;
  }

  getViewType(): string {
    return "book-update-view";
  }

  getDisplayText(): string {
    return "Update Book Metadata";
  }

  getIcon(): string {
    return "book";
  }

  

  async onOpen(): Promise<void> {
  const container = this.containerEl.children[1] as HTMLElement;
  container.empty();

  const originalData: Book = JSON.parse(JSON.stringify(this.frontmatter));
  const mainDiv = container.createEl("div", { cls: "book-update-main" });

  // --- Headers Section ---
  const headersDiv = mainDiv.createEl("div", { cls: "book-update-headers" });
  headersDiv.createEl("b", { text: "Fetched Metadata", cls: "book-update-grid-item" });
  headersDiv.createEl("b", { text: "Current Metadata", cls: "book-update-grid-item" });

  // --- Provider Section ---
  createProviderPills(mainDiv, this.provider, this.bookData.url, this.frontmatter.url);

  // --- Covers Section ---
  const currentCoverImg = createCoverSection(mainDiv, this.bookData, this.frontmatter, originalData);

  // --- Text Metadata Section ---
  const textMetaDiv = mainDiv.createEl("div", { cls: "book-update-text-meta" });
  const textFields: { label: string; key: keyof Book }[] = [
    { label: "Title", key: "title" },
    { label: "Publisher", key: "publisher" },
    { label: "Publication Date", key: "publicationDate" },
    { label: "Series", key: "series" },
    { label: "Pages", key: "pages" },
    { label: "Average Rating", key: "averageRating" },
    { label: "ISBN-10", key: "isbn10" },
    { label: "ISBN-13", key: "isbn13" },
    { label: "URL", key: "url" },
  ];
  const inputComponents: Record<string, TextComponent | HTMLTextAreaElement> = {};
  textFields.forEach(field => {
    inputComponents[field.key] = createTextField(textMetaDiv, field, this.bookData, this.frontmatter, originalData);
  });

  // --- Description Section ---
  inputComponents["description"] = createDescriptionSection(mainDiv, this.bookData, this.frontmatter, originalData);

  // --- Authors Section ---
  const authorsField = createEditableChipField(
    mainDiv,
    "Authors",
    this.bookData.authors,
    "authors",
    this.frontmatter,
    originalData
  );

  // --- Genres Section ---
  const genresField = createEditableChipField(
    mainDiv,
    "Genres",
    this.bookData.genres,
    "genres",
    this.frontmatter,
    originalData
  );

  // --- Save + Reset Buttons ---
  const buttonWrapper = mainDiv.createEl("div", { cls: "save-wrapper" });

  const saveBtn = new ButtonComponent(buttonWrapper);
  saveBtn.setButtonText("🗁 Update");
  saveBtn.setClass("save-btn");
  saveBtn.onClick(async () => {
    await this.app.fileManager.processFrontMatter(this.file, (fm) => {
      Object.assign(fm, this.frontmatter);
    });
    new Notice("Metadata updated successsfully!");
  });

  const globalResetBtn = new ButtonComponent(buttonWrapper);
  globalResetBtn.setButtonText("⟳ Reset All");
  globalResetBtn.setClass("reset-btn");
  globalResetBtn.onClick(() => {
    this.frontmatter = JSON.parse(JSON.stringify(originalData));

    textFields.forEach(field => {
      const val = String(originalData[field.key] || "");
      const component = inputComponents[field.key];
      if (component instanceof TextComponent) component.setValue(val);
      else (component as HTMLTextAreaElement).value = val;
    });

    this.frontmatter.authors = [...(originalData.authors || [])];
    authorsField.renderChips(originalData);

    this.frontmatter.genres = [...(originalData.genres || [])];
    genresField.renderChips(originalData);

    currentCoverImg.src = originalData.cover || "";
    new Notice("All fields reset to original!");
  });
}


  async onClose(): Promise<void> {}
}
