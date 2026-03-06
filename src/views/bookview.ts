import { Book } from "src/components/bookcard";
import { ItemView, WorkspaceLeaf, Modal, ButtonComponent, TextComponent, Notice, Setting } from "obsidian";
import { createBookPage } from "src/createpage";
import { createEditableChipField } from "src/components/bookview";
import { BookMetadataPluginSettings } from "src/components/settings";

export class BookView extends ItemView {
  settings: BookMetadataPluginSettings;
  bookData: Book;
  provider: string;

  constructor(leaf: WorkspaceLeaf, bookData: Book, provider: string, settings: BookMetadataPluginSettings) {
    super(leaf);
    this.settings = settings;
    this.bookData = bookData;
    this.provider = provider;
  }

  getViewType(): string {
    return "book-view";
  }

  getDisplayText(): string {
    return this.bookData.title;
  }

  getIcon(): string {
    return "book"; 
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("book-view-container");

    // --- Deep copy original data ---
    const originalData: Book = JSON.parse(JSON.stringify(this.bookData));

    const providerLink =container.createEl("a", {
      cls: "provider-pill" + " " + this.provider.toLowerCase(),
      text: this.provider,
      href: this.bookData.url,   
    });

    providerLink.setAttr("title", "Open in " + this.provider);

    // --- Main layout ---
    const mainDiv = container.createEl("div", { cls: "book-main" });

    // --- Left: Cover + buttons ---
    const leftDiv = mainDiv.createEl("div", { cls: "book-left" });
    const coverImg = leftDiv.createEl("img", { attr: { src: this.bookData.cover, alt: "Book Cover" }, cls: "book-cover" });

    const changeCoverBtn = new ButtonComponent(leftDiv);
    changeCoverBtn.setButtonText("Change Cover");
    changeCoverBtn.onClick(() => new CoverModal(this.app, this.bookData, coverImg).open());

    const resetCoverBtn = new ButtonComponent(leftDiv);
    resetCoverBtn.setButtonText("Reset Cover");
    resetCoverBtn.setClass("reset-cover-btn");
    resetCoverBtn.onClick(() => {
      this.bookData.cover = originalData.cover;
      coverImg.src = originalData.cover;
      new Notice("Cover reset to original");
    });

    // --- Right: Metadata ---
    const rightDiv = mainDiv.createEl("div", { cls: "book-right" });

    // Text fields
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
      const wrapper = rightDiv.createEl("div", { cls: "field-wrapper" });

      // Label 
      const labelDiv = wrapper.createEl("div", { cls: "field-label" });
      labelDiv.createEl("label", { text: field.label });

      // Reset button (Next to Label)
      const resetBtn = new ButtonComponent(labelDiv);
      resetBtn.setIcon("rotate-ccw");
      resetBtn.setClass("reset-section-btn"); 
      resetBtn.onClick(() => {
        const component = inputComponents[field.key];
        const originalVal = originalData[field.key];
        if (component instanceof TextComponent) component.setValue(String(originalVal));
        else (component as HTMLTextAreaElement).value = String(originalVal);
        (this.bookData as any)[field.key] = originalData[field.key] as any;
      });

      // Input field
      const input = new TextComponent(wrapper);
      input.setValue(String(this.bookData[field.key]));
      inputComponents[field.key] = input;
    });

    // Description field
    const descriptionWrapper = rightDiv.createEl("div", { cls: "field-wrapper" });
    const labelDiv = descriptionWrapper.createEl("div", { cls: "field-label" });
    labelDiv.createEl("label", { text: "Description" });

    const resetDescriptionBtn = new ButtonComponent(labelDiv);
    resetDescriptionBtn.setIcon("rotate-ccw");
    resetDescriptionBtn.setClass("reset-section-btn");
    resetDescriptionBtn.onClick(() => {
      textarea.value = originalData.description;
      this.bookData.description = originalData.description;
    });

    const textarea = descriptionWrapper.createEl("textarea", { cls: "description-textarea", text: this.bookData.description });
    textarea.addEventListener("input", () => (this.bookData.description = textarea.value));
    inputComponents["description"] = textarea;

    const authorsField =createEditableChipField(rightDiv, "Authors", "authors", this.bookData, originalData);

    const genresField = createEditableChipField(rightDiv, "Genres", "genres", this.bookData, originalData);

    // --- Save & Global Reset buttons ---
    const buttonWrapper = rightDiv.createEl("div", { cls: "save-wrapper" });

    const saveBtn = new ButtonComponent(buttonWrapper);
    saveBtn.setButtonText("🗁 Save & Create");
    saveBtn.setClass("save-btn");
    saveBtn.onClick(async () => {
      textFields.forEach(field => {
        const component = inputComponents[field.key];
        let val: string;
        if (component instanceof TextComponent) val = component.getValue();
        else val = (component as HTMLTextAreaElement).value;

        if (field.key === "pages") this.bookData.pages = parseInt(val, 10) || 0;
        else this.bookData[field.key] = val as any;
      });
      await createBookPage(this.app, this.settings, this.bookData)
    });

    const globalResetBtn = new ButtonComponent(buttonWrapper);
    globalResetBtn.setButtonText("⟳ Reset All");
    globalResetBtn.setClass("reset-btn");
    globalResetBtn.onClick(() => {
      this.bookData = JSON.parse(JSON.stringify(originalData));

      // Text fields + description
      for (const key in inputComponents) {
        const component = inputComponents[key];
        const val = this.bookData[key as keyof Book];
        if (component instanceof TextComponent) component.setValue(String(val));
        else (component as HTMLTextAreaElement).value = String(val);
      }

    this.bookData.authors = [...(originalData.authors || [])];
    authorsField.renderChips(originalData);

    this.bookData.genres = [...(originalData.genres || [])];
    genresField.renderChips(originalData);

    coverImg.src = this.bookData.cover;

    new Notice("All fields reset to original!");
    });
  }

  async onClose(): Promise<void> {}
}

// --- Cover Modal ---
class CoverModal extends Modal {
  bookData: Book;
  coverImgEl: HTMLImageElement;

  constructor(app: any, bookData: Book, coverImgEl: HTMLImageElement) {
    super(app);
    this.bookData = bookData;
    this.coverImgEl = coverImgEl;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    let input = "";

    new Setting(contentEl)
      .setName("Enter Cover Image URL")
      .addText(text =>
        text
          .setPlaceholder("https://example.com/image.jpg")
          .onChange(value => (input = value))
      );

    new Setting(contentEl)
      .addButton(btn =>
        btn
          .setButtonText("Search")
          .setCta()
          .onClick(() => {
            if (input) {
              this.bookData.cover = input;
              this.coverImgEl.src = input;
              this.close();
            }
          })
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}
