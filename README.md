# Simple Book Metadata

An Obsidian plugin to search, fetch, and manage book metadata directly within your vault. It supports Goodreads, Open Library, and Google Books, allowing you to create book notes with frontmatter, covers, ratings, and other details.

![Simple Book Metadata](https://drive.google.com/uc?export=view&id=1xncjecMw9Ixw3QorBkRBIYR_nbB6LNXT)

## Features

* **Search by title, author, or ISBN** across multiple sources:

  * Goodreads
  * Open Library
  * Google Books
  
![Search](https://drive.google.com/uc?export=view&id=1IeWxSRJXKkKu1__aX1KOXbFy8kKW0ZEB)

* **Auto-create book notes** with structured frontmatter:

  * Title, authors, publisher, publication date
  * Number of pages, genres, series
  * Cover image, description, average rating, ISBN-10/13

| **Search and Create** | **Created Page with Frontmatter** |
|----------------------|----------------------------------|
| ![Search&Create](https://drive.google.com/uc?export=view&id=179PKcBy_1-kPT4cT0ZJiWNexkRhcUGnr) | ![Created Page](https://drive.google.com/uc?export=view&id=1AX99LtVnchOq2c9RfKfrkrgYdXalEJ87) |

* **Edit existing notes** for the metadata of a book already in your vault.
![Edit](https://drive.google.com/uc?export=view&id=1IeWxSRJXKkKu1__aX1KOXbFy8kKW0ZEB)

| **Select Note to Update** | **Update View** | **Compare Frontmatter** |
|---------------------------|------------------------|-------------------------|
| ![SelectNote](https://drive.google.com/uc?export=view&id=1W4sBNDj5UKzucT9YIhCUi2My2YT69Oeo) | ![UpdateView](https://drive.google.com/uc?export=view&id=1fab2A6MB1Rk2hK2j296H45BcbtSqnX_s) | ![CompareFrontmatter](https://drive.google.com/uc?export=view&id=1Q79ME707zpCEzWNirZ4piU34p_KlMfoS) |

* **Settings**:
  
  * **Edit existing notes** for the metadata of a book already in your vault.
  * **Default folder configuration** for book notes
  * **Increase daily rate limit** for Google API Book by entering API key

![Settings](https://drive.google.com/uc?export=view&id=1NfBo3Xuaac5f8eEefkC6AfwZc2-MXaJO)
  
* **Throttled requests** to avoid hitting API rate limits
* **Progressive rendering** of book cards in the plugin view
* **Ribbon icon & commands** for quick search or update
  
| **Ribbon** | **Commands** |
|------------|--------------|
| ![Ribbon](https://drive.google.com/uc?export=view&id=1Q7QCpco-lpEGOeasxBq9ShM2um1we77L) | ![Commands](https://drive.google.com/uc?export=view&id=13OZt91XUW1Mcv0hxH0409It4f87iEQB8) |

## Installation

1. Download or clone the plugin into your Obsidian plugins folder:
   `Vault/.obsidian/plugins/simple-book-metadata`
  
    Or, if you prefer, install via [BRAT](https://obsidian.md/plugins?id=obsidian42-brat) (Better Obsidian Plugin Manager) for easier updates and management.
2. Enable the plugin in Obsidian under **Settings → Community plugins**.
3. Open the plugin settings to configure:

   * Default folder for new book notes
   * Default status
   * Optional Google Books API key for higher daily limits (up to 1000 requests per day)

## Usage

1. **Search books**:

   * Use the **ribbon icon** or **command palette** to open the Book Metadata view.
   * Enter title, author, or ISBN to search.
2. **Create a book page**:

   * Select a book from the results.
   * Click **Search Book Metadata** to generate a new Markdown file with frontmatter in your default folder.
3. **Update current note**:

   * Use the **Update Book Metadata in Current Note** command from the editor context menu to fetch the latest details for the active note.

## Settings

* **Default Folder**: The folder where new book notes will be stored. Leave empty to default to the vault root.
* **Default Status**: Initial reading status for new books (default: 🔴 Not Started). You can customize this.
* **Google Books API Key**: Optional. Include your API key to increase daily query limits. [Get a key here](https://developers.google.com/books/docs/v1/using#APIKey).

## Notes

* **API Throttling**: Requests are automatically delayed randomly up to 1200ms to reduce the risk of hitting rate limits on Goodreads or Open Library.
* **Progressive Rendering**: Book cards are rendered as they are fetched, so you can start browsing results immediately.

## Inspired By

This plugin’s design and UI for displaying book metadata is inspired by an amazing open self hosted service [BookLore](https://github.com/booklore-app/BookLore)  
Its interface provides a clean, modern interface for browsing and managing book collections.  

## License

MIT License © 2026

