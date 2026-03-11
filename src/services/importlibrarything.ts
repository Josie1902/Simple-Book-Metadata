import { TFile, TFolder, App } from "obsidian";
import { BookMetadataPluginSettings } from "src/components/settings";
import { createBookPage } from "src/createpage";
import { sanitizeFileName } from "src/utils";

interface Filters {
  books_id?: boolean;
  isbn?: boolean;
}

function fileExists(app: App, folderPath: string, filename: string) {
  const filePath = `${folderPath}/${filename}`;
  return app.vault.getAbstractFileByPath(filePath);
}

function sanitizeBookData(book: any) {
    const sanitized = { ...book };
     if (!sanitized.ltWorkUrl && sanitized.workcode && sanitized.books_id) {
        sanitized.ltWorkUrl = `https://www.librarything.com/work/${sanitized.workcode}/details/${sanitized.books_id}`;
    }
    if (!sanitized.isbn10 && sanitized.isbn?.[0]) {
        sanitized.isbn10 = sanitized.isbn[0];
    }
    if (!sanitized.isbn13 && sanitized.isbn?.[2]) {
        sanitized.isbn13 = sanitized.isbn[2];
    }
    delete sanitized.isbn;
    if (sanitized.authors && Array.isArray(sanitized.authors)) {
        sanitized.authors = sanitized.authors.map((a: { lf: any; }) => a.lf);
    }
    if (sanitized.ddc) {
        sanitized.ddc_code = sanitized.ddc.code;
        sanitized.ddc_wording = sanitized.ddc.wording;
        delete sanitized.ddc;
    }
    if (sanitized.lcc) {
        sanitized.lcc_code = sanitized.lcc.code 
        delete sanitized.lcc;
    }
    if (sanitized.rating) {
        sanitized.lcrating = sanitized.rating
        delete sanitized.rating
    }

    delete sanitized.format
    delete sanitized.public
    delete sanitized.primaryauthorrole
    delete sanitized.collections_idA
    delete sanitized.tagidA
    delete sanitized.language_codeA
    delete sanitized.originallanguage_codeA
    delete sanitized.genre_id
    delete sanitized.sortcharacter
    delete sanitized.copies
    return sanitized;
}

export async function importBooksWithFilters(
    app: App,
    settings: BookMetadataPluginSettings,
    containerEl: HTMLElement,
    bookData: any[]
) {
    const updates = settings.additionalServices.importLibraryThing.updateFields;
    const logicOperator = settings.additionalServices.importLibraryThing.logicOperator;
    const folders = settings.additionalServices.importLibraryThing.selectFolders || [];

    // If no folders selected, create pages in default folder found in settings
    // No updates will be made here
    if (folders.length === 0) {
      for (const book of bookData) {
        const sanitizedTitle = sanitizeFileName(book.title || book.books_id || "Untitled Book");
        const existingFile = fileExists(app, settings.folderPath, `${sanitizedTitle}.md`);
        if (existingFile instanceof TFile) {
          containerEl.createDiv({ text: `⏩ Skipped existing file: ${book.title ?? book.books_id}` });  
        } else {
          containerEl.createDiv({ text: `✅ Created page for: ${book.title ?? book.books_id}` });
          const sanitizedBook = sanitizeBookData(book);
          createBookPage(app, settings, sanitizedBook);
        }
      }
      return;
    }

    if (!updates.books_id && !updates.isbn) {
      containerEl.createDiv({ text: "⚠️ No update fields selected, please select either isbn or book id to enable updating frontmatter" });
      return;
    }

    for (const folderPath of folders) {
      const folder = app.vault.getAbstractFileByPath(folderPath);

      if (!folder || !(folder instanceof TFolder)) {
        containerEl.createDiv({ text: `⚠️ Folder not found: ${folderPath}, skipping` });
        continue;
      }

      const files = folder.children.filter(f => f instanceof TFile) as TFile[];
      containerEl.createDiv({ text: `⚙️ Checking folder: ${folderPath} (${files.length} files)` });

      for (const book of bookData) {
        let canUpdate = false;
        let updateFilepath = ""
        const sanitizedBook = sanitizeBookData(book);

        for (const file of files) {
          updateFilepath = file.path;
          const cache = app.metadataCache.getFileCache(file);
          if (!cache?.frontmatter) continue;
        
          const checks: boolean[] = [];
        
          for (const key of Object.keys(updates) as (keyof Filters)[]) {
            if (!updates[key]) continue;

            if (key === "isbn") {
              // Check both isbn10 and isbn13 in frontmatter
              const fmIsbn10 = cache.frontmatter["isbn10"];
              const fmIsbn13 = cache.frontmatter["isbn13"];
              const match = (fmIsbn10 && fmIsbn10 === sanitizedBook.isbn10) || (fmIsbn13 && fmIsbn13 === sanitizedBook.isbn13);
              console.log(`Checking ISBN for file: ${file.path}, fmIsbn10: ${fmIsbn10}, fmIsbn13: ${fmIsbn13}, bookIsbn10: ${sanitizedBook.isbn10}, bookIsbn13: ${sanitizedBook.isbn13}, match: ${match}`);
              checks.push(Boolean(match));
            } else {
              const fmValue = cache.frontmatter[key];
              checks.push(fmValue !== undefined && fmValue === sanitizedBook[key]);
            }
          }
      
          if (checks.length === 0) continue; // no updates for this file
      
          const matched = logicOperator === "AND" ? checks.every(Boolean) : checks.some(Boolean);
          console.log(`Checking file: ${file.path}, checks: ${checks}, matched: ${matched}`);
          if (matched) {
            canUpdate = true;
            break;
          }
        }

        if (!canUpdate) {
          const sanitizedTitle = sanitizeFileName(book.title || book.books_id || "Untitled Book");
          const existingFile = fileExists(app, settings.folderPath, `${sanitizedTitle}.md`);
          if (existingFile instanceof TFile) {
            containerEl.createDiv({ text: `⏩ Skipped existing file: ${book.title ?? book.books_id}` });
          } else {
            containerEl.createDiv({ text: `✅ Created page for: ${book.title ?? book.books_id}` });
            createBookPage(app, settings, book);
          }
        } else {
          containerEl.createDiv({ text: `✅ Updated frontmatter for: ${updateFilepath}` });
          const file = app.vault.getAbstractFileByPath(updateFilepath);
          if (file instanceof TFile) {
              await app.fileManager.processFrontMatter(file, (fm) => {
                Object.assign(fm, sanitizedBook);
              });
          }
        }
      }
    }
}   
