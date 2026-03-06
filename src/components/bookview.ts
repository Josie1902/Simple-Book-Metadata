import { ButtonComponent } from "obsidian";

export function createEditableChipField(
    parent: HTMLElement,
    label: string,
    frontmatterKey: string,
    frontmatter: Record<string, any>,
    originalData: Record<string, any>,
) {

    const section = parent.createDiv({ cls: "field-wrapper" });

    // Label 
    const labelDiv = section.createEl("label", { text: label, cls: "field-label" });
    // Reset Button
    const resetBtn = new ButtonComponent(labelDiv)
      resetBtn.setIcon("rotate-ccw");
      resetBtn.setClass("reset-section-btn");
      resetBtn.onClick(() => {
        frontmatter[frontmatterKey] = [...(originalData[frontmatterKey] || [])];
        renderChips();
    });


    frontmatter[frontmatterKey] = frontmatter[frontmatterKey] || [];
    const currentContainer = section.createDiv({
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

    return {
      renderChips,
      inputEl,
      currentContainer
    };
}