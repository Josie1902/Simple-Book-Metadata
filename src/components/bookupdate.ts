import { Book } from "src/components/bookcard";
import { ButtonComponent, TextComponent } from "obsidian";

export function createProviderPills(
  parent: HTMLElement,
  fetchedProvider: string,
  fetchedUrl: string,
  currentUrl: string,
) {

  // --- Section Wrapper ---
  const section = parent.createDiv({ cls: "book-update-provider" });

  // --- Fetched Provider (Left) ---
  const fetchedDiv = section.createDiv({ cls: "book-update-grid-item" });
  const fetchedLink = fetchedDiv.createEl("a", {
    cls: `provider-pill ${fetchedProvider.toLowerCase()}`,
    text: fetchedProvider,
    href: fetchedUrl || "#",
  });
  fetchedLink.setAttr("title", "Open in " + fetchedProvider);


  // --- Current Provider (Right) ---
  const currentDiv = section.createDiv({ cls: "book-update-grid-item" });
  const providerNames = ["Goodreads", "Google", "OpenLibrary"]; 
  const matchedProvider = providerNames.find(provider => currentUrl.toLowerCase().includes(provider.toLowerCase().replace(/\s+/g, '')) );
  const currentLink = currentDiv.createEl("a", {
    cls: `provider-pill ${matchedProvider ? matchedProvider.toLowerCase() : ""}`,
    text: matchedProvider || "Unknown",
    href: currentUrl || "#",
  });
  currentLink.setAttr("title", "Open current source");

  return currentLink;
}

export function createEditableChipField(
  parent: HTMLElement,
  label: string,
  fetchedValues: string[],
  frontmatterKey: string,
  frontmatter: Record<string, any>,
  originalData: Record<string, any>,
) {

  // --- Section Wrapper ---
  const section = parent.createDiv({ cls: "field-wrapper" });
  section.createEl("label", { text: label, cls: "field-label" });

  const grid = section.createDiv({ cls: "book-update-grid" });

  // --- Fetched Values (Left)
  const fetchedContainer = grid.createDiv({
    cls: "book-update-chip-container"
  });
  fetchedValues.forEach(val => fetchedContainer.createDiv({ cls: "book-update-chip", text: val }));

  // --- Transfer Button
  const transferBtn = new ButtonComponent(grid);
  transferBtn.setIcon("arrow-right");

  // --- Current Values (Right) editable
  frontmatter[frontmatterKey] = frontmatter[frontmatterKey] || [];
  const currentContainer = grid.createDiv({
    cls: "book-update-chip-container"
  });

  const inputEl = currentContainer.createEl("input", {
    type: "text",
    cls: "book-update-chip-input",
    placeholder: `Type ${label.toLowerCase()} and press Enter`
  });

  // ---- Render function ----
  const renderChips = (updatedFrontmatter?: Record<string, any>) => {
    if (updatedFrontmatter) {
      frontmatter = updatedFrontmatter;
    }
    currentContainer.querySelectorAll(".book-update-chip").forEach(el => el.remove());

    frontmatter[frontmatterKey].forEach((val: string, index: number) => {
      const chip = createDiv({ cls: "book-update-chip" });
      chip.createSpan({ text: val });
      const removeBtn = chip.createSpan({ text: "×", cls: "book-update-chip-remove" });
      removeBtn.addEventListener("click", () => {
        frontmatter[frontmatterKey].splice(index, 1);
        renderChips();
      });
      currentContainer.insertBefore(chip, inputEl);
    });
  };

  renderChips();

  // ---- Handle Enter + Backspace ----
  inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = inputEl.value.trim();
      if (!value) return;
      frontmatter[frontmatterKey].push(value);
      inputEl.value = "";
      renderChips();
    }
    if (e.key === "Backspace" && inputEl.value === "") {
      frontmatter[frontmatterKey].pop();
      renderChips();
    }
  });

  // ---- Transfer Button ----
  transferBtn.onClick(() => {
    frontmatter[frontmatterKey] = [...fetchedValues];
    renderChips();
  });

  // ---- Reset Button ----
  const resetBtn = new ButtonComponent(grid);
  resetBtn.setIcon("rotate-ccw");
  resetBtn.setClass("reset-section-btn");
  resetBtn.onClick(() => {
    frontmatter[frontmatterKey] = [...(originalData[frontmatterKey] || [])];
    renderChips();
  });

  return {
    renderChips,
    inputEl,
    currentContainer,
    frontmatter
  };
}


export function createTextField(parent: HTMLElement, field: { label: string; key: keyof Book }, bookData: Book, frontmatter: Record<string, any>, originalData: Record<string, any>) {
  const wrapper = parent.createEl("div", { cls: "field-wrapper" });
  wrapper.createEl("label", { text: field.label, cls: "field-label" });

  const grid = wrapper.createDiv({ cls: "book-update-grid" });

  const fetchedField = new TextComponent(grid);
  fetchedField.setValue(String(bookData[field.key]));
  fetchedField.setDisabled(true);

  const transferBtn = new ButtonComponent(grid);
  transferBtn.setIcon("arrow-right");

  const currentField = new TextComponent(grid);
  currentField.setValue(String(frontmatter[field.key] || ""));

  const resetBtn = new ButtonComponent(grid);
  resetBtn.setIcon("rotate-ccw");
  resetBtn.setClass("reset-section-btn");
  resetBtn.onClick(() => {
    frontmatter[field.key] = originalData[field.key];
    currentField.setValue(String(originalData[field.key] || ""));
  });

  transferBtn.onClick(() => {
    frontmatter[field.key] = bookData[field.key];
    currentField.setValue(String(bookData[field.key]));
  });

  return currentField;
}

export function createCoverSection(parent: HTMLElement, bookData: Book, frontmatter: Record<string, any>, originalData: Record<string, any>) {
  const section = parent.createDiv({ cls: "book-update-cover" });
  const grid = section.createDiv({ cls: "book-update-grid" });

  const fetchedImgWrapper = grid.createDiv({ cls: "book-update-grid-item" });
  const fetchedImg = fetchedImgWrapper.createEl("img", {
    cls: "book-cover",
    attr: { src: bookData.cover, alt: "Fetched Cover" }
  });

  const transferBtn = new ButtonComponent(grid);
  transferBtn.setIcon("arrow-right");

  const currentImgWrapper = grid.createDiv({ cls: "book-update-grid-item" });
  const currentImg = currentImgWrapper.createEl("img", {
    cls: "book-cover",
    attr: { src: frontmatter.cover || "", alt: "Current Cover" }
  });

  const resetBtn = new ButtonComponent(grid);
  resetBtn.setIcon("rotate-ccw");
  resetBtn.setClass("reset-cover-btn");

  transferBtn.onClick(() => {
    if (bookData.cover) {
      frontmatter.cover = bookData.cover;
      currentImg.src = bookData.cover;
    }
  });

  resetBtn.onClick(() => {
    frontmatter.cover = originalData.cover;
    currentImg.src = originalData.cover;
  });

  return currentImg;
}

export function createDescriptionSection(parent: HTMLElement, bookData: Book, frontmatter: Record<string, any>, originalData: Record<string, any>) {
  const wrapper = parent.createEl("div", { cls: "field-wrapper" });
  wrapper.createEl("label", { text: "Description", cls: "field-label" });

  const grid = wrapper.createDiv({ cls: "book-update-grid" });

  const fetchedDescription = grid.createEl("textarea", {
    cls: "description-textarea",
    attr: { disabled: true }
  }) as HTMLTextAreaElement;
  fetchedDescription.value = bookData.description || "";

  const transferBtn = new ButtonComponent(grid);
  transferBtn.setIcon("arrow-right");

  const currentDescription = grid.createEl("textarea", { cls: "description-textarea" }) as HTMLTextAreaElement;
  currentDescription.value = frontmatter.description || "";

  const resetBtn = new ButtonComponent(grid);
  resetBtn.setIcon("rotate-ccw");
  resetBtn.setClass("reset-section-btn");

  transferBtn.onClick(() => {
    frontmatter.description = bookData.description;
    currentDescription.value = bookData.description || "";
  });

  resetBtn.onClick(() => {
    frontmatter.description = originalData.description;
    currentDescription.value = originalData.description || "";
  });

  return currentDescription;
}
