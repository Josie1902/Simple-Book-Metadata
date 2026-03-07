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
  const currentProvider = createProviderPills(mainDiv, this.provider, this.bookData, this.frontmatter);

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
  function getInputValue(input: TextComponent | HTMLTextAreaElement) {
      return 'getValue' in input ? input.getValue() : input.value;
  }

  textFields.forEach(field => {
      const component = createTextField(textMetaDiv, field, this.bookData, this.frontmatter, originalData);
      inputComponents[field.key] = component;
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
    this.frontmatter.cover = currentCoverImg.src
    Object.entries(inputComponents).forEach(([key, component]) => {
      this.frontmatter[key] = String(getInputValue(component));
    });
    this.frontmatter.description = String(getInputValue(inputComponents["description"]));
    this.frontmatter.authors = authorsField.frontmatter.authors || []
    this.frontmatter.genres = genresField.frontmatter.genres || []

    if (!this.file) return new Notice("No file to update.");

    await this.app.fileManager.processFrontMatter(this.file, (fm) => {
      Object.assign(fm, this.frontmatter);
    });

    new Notice("Metadata updated successsfully!");
  });

  const resetAllFields = () => {
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
  }

  const transferAllFields = () => {
    this.frontmatter = this.bookData;

    currentProvider.updateCurrentPill(currentProvider.currentLink, this.bookData.url);

    textFields.forEach(field => {
      const val = String(this.bookData[field.key] || "");
      const component = inputComponents[field.key];
      if (component instanceof TextComponent) component.setValue(val);
      else (component as HTMLTextAreaElement).value = val;
    });

    this.frontmatter.authors = [...(this.bookData.authors || [])];
    authorsField.renderChips(this.bookData);

    this.frontmatter.genres = [...(this.bookData.genres || [])];
    genresField.renderChips(this.bookData);

    currentCoverImg.src = this.bookData.cover || "";
    new Notice("Metadata transferred from " + this.provider);
  }

  const globalResetBtn = new ButtonComponent(buttonWrapper);
  globalResetBtn.setButtonText("⟳ Reset All");
  globalResetBtn.setClass("reset-btn");
  globalResetBtn.onClick(() => {
     resetAllFields();
  });

  currentProvider.resetBtn.onClick(() => {
    resetAllFields();
  })

  currentProvider.transferBtn.onClick(() => {
    transferAllFields()
  })

}

  async onClose(): Promise<void> {}
}
