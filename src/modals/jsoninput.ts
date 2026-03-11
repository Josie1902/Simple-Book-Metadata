import BookMetadataPlugin from "main";
import { Modal, App } from "obsidian";
import { importBooksWithFilters } from "src/services/importlibrarything";

export class JsonInputModal extends Modal {
  plugin: BookMetadataPlugin;
  jsonData: any[] = [];
  rowCheckboxes: HTMLInputElement[] = [];
  selectedRows: Set<number> = new Set();
  tableContainer: HTMLElement;

  constructor(app: App, plugin: BookMetadataPlugin) {
    super(app);
    this.plugin = plugin;
  }

  renderTable() {
    this.tableContainer.empty();

    if (!this.jsonData || !this.jsonData.length) return;

    const table = this.tableContainer.createEl("table", { cls: "json-table" });

    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    headerRow.createEl("th", { text: "Select" });
    headerRow.createEl("th", { text: "Title" });
    headerRow.createEl("th", { text: "Author" });
    headerRow.createEl("th", { text: "Book ID" });
    headerRow.createEl("th", { text: "ISBN10" });
    headerRow.createEl("th", { text: "ISBN13" });

    const tbody = table.createEl("tbody");


    const selectAllRow = tbody.createEl("tr");
    const selectAllCell = selectAllRow.createEl("td", { attr: { colspan: "7" } });
    const selectAllCheckbox = selectAllCell.createEl("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.addEventListener("change", () => {
      if (selectAllCheckbox.checked) {
        this.jsonData.forEach((_, i) => this.selectedRows.add(i));
        this.rowCheckboxes.forEach(cb => cb.checked = true);
        } else {
        this.selectedRows.clear();
        this.rowCheckboxes.forEach(cb => cb.checked = false);
        }
    });
    selectAllCell.createEl("span", { text: "Select All" });


    this.rowCheckboxes = [];

    this.jsonData.forEach((book, index) => {
      const tr = tbody.createEl("tr");

      const checkboxCell = tr.createEl("td");
      const checkbox = checkboxCell.createEl("input");
      checkbox.type = "checkbox";

      this.rowCheckboxes.push(checkbox);

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.selectedRows.add(index);
        else this.selectedRows.delete(index);
      });

      tr.createEl("td", { text: book.title ?? "" });
      tr.createEl("td", { text: book.primaryauthor ?? "" });
      tr.createEl("td", { text: book.books_id ?? "" });
      tr.createEl("td", { text: book.isbn?.[0] ?? "" });
      tr.createEl("td", { text: book.isbn?.[2] ?? "" });
    });

    let logContainer = this.contentEl.createDiv({ cls: "import-log", text: "Click 'Save Selected' to import metadata and view logs" });

    const saveButton = this.contentEl.createEl("button", { text: "Save Selected" });
    saveButton.onclick = () => {
      const selectedBooks = Array.from(this.selectedRows).map(i => this.jsonData[i]);
      logContainer.empty();
      importBooksWithFilters(this.app, this.plugin.settings, logContainer, selectedBooks);
    };
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.addClass("json-import-modal");
    contentEl.createEl("h2", { text: "Select rows from JSON" });

    const input = contentEl.createEl("input", { type: "file", attr: { accept: ".json" } });

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // ensure array
        this.jsonData = Object.values(parsed);

        this.renderTable();
      } catch (err) {
        console.error(err);
        alert("Error parsing JSON");
      }
    });

    this.tableContainer = contentEl.createDiv({ cls: "json-table-container" });
  }

  onClose() {
    this.contentEl.empty();
  }
}
