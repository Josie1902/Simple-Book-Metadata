import { App, normalizePath, Notice } from "obsidian";
import { BookMetadataPluginSettings } from "./components/settings";

function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "") // remove illegal characters
    .replace(/\s+/g, " ")         // collapse multiple spaces
    .trim()                        // trim edges
    .replace(/\.+$/, "");          // remove trailing dots
}

export async function createBookPage(app: App, settings: BookMetadataPluginSettings, bookData: any) {
  const fileName = `${sanitizeFileName(bookData.title) || "Untitled Book"}.md`;
  const folderPath = normalizePath(settings.folderPath);          // normalize folder path
  const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

  // --- Ensure folder exists ---
  let folderExists = app.vault.getAbstractFileByPath(folderPath);
  if (!folderExists) {
    try {
      await app.vault.createFolder(folderPath);
      console.log(`Created folder: ${folderPath}`);
    } catch (err) {
      new Notice("Failed to create folder.");
      console.error(err);
      return;
    }
  }

  // --- Default status ---
  if (!bookData.status) {
    bookData.status = settings.bookStatus; 
  }

  // --- Build frontmatter ---
  const frontmatter = Object.entries(bookData)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");

  const content = `---\n${frontmatter}\n---\n\n`;

  try {
    await app.vault.create(filePath, content);
    new Notice("Book page created!");
  } catch (err) {
    new Notice("File already exists or failed to create.");
    console.error(err);
  }
}
