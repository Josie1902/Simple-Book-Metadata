import { Book, renderBookCard } from "src/components/bookcard";
import { ButtonComponent, ItemView, TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { renderLoader, renderLoader2 } from "svgs/loading";
import { renderWarning } from "svgs/warning";
import { createGoodreadsProvider, createGoogleBooksProvider, createOpenLibraryProvider, BookProvider, BookQuery } from "src/providers";
import { BookMetadataPluginSettings } from "../components/settings";

export const VIEW_TYPE_BOOK_METADATA = "book-metadata-view";

interface BookMetadataViewState { 
    settings: BookMetadataPluginSettings;
    file?: TFile | null; 
    frontmatter?: Record<string, any> | null; 
    [key: string]: unknown; 
}

export class BookMetadataView extends ItemView {
    settings: BookMetadataPluginSettings;
    file: TFile | null = null;
    frontmatter: Record<string, any> | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_BOOK_METADATA;
	}

	getDisplayText() {
		return "Book Metadata";
	}

    getIcon(): string {
        return "search"; 
    }

    async setState(state: BookMetadataViewState, result: ViewStateResult): Promise<void> { 
        this.settings = state.settings;
        if (state.file) { 
            this.file = state.file; 
        } else {
            this.file = null;
        }
        if (state.frontmatter) { 
            this.frontmatter = state.frontmatter; 
        }  else {   
            this.frontmatter = null;
        }
        this.refreshUI();
        return super.setState(state, result); 
    }

    getState(): BookMetadataViewState {
        return {
            settings: this.settings,
            file: this.file ?? null,
            frontmatter: this.frontmatter ?? null,
        };
    }

    async clearState() {
      this.file = null;
      this.frontmatter = null;
        
      await this.setState({ settings: this.settings }, { history: false });
      this.refreshUI();
    }

	refreshUI() {
		const container = this.containerEl.children[1];
        container.empty();

        if (this.file) {
            const banner = container.createDiv({cls: "book-metadata-banner" });
            banner.setText(`⚠️ You are currently modifying the file at: ${this.file.path}`);

            const exitBtn = new ButtonComponent(banner);
              exitBtn.setIcon("x");
              exitBtn.setTooltip("Exit edit mode");
              exitBtn.setClass("book-update-exit-btn");

              exitBtn.onClick(() => {
                this.clearState(); 
              });
        }

		// Header
		container.createEl("h2", { text: "Search Metadata For Books" });

        // Search Section
        const searchSection = container.createDiv({cls: "book-metadata-section"})

        // Select Providers
        const providerDropdown = searchSection.createDiv()

        providerDropdown.createEl("label", {
	    	text: "🌐 Providers", cls: "search-labels"
	    });

	    const providers = ["OpenLibrary", "Goodreads", "Google"];
	    const selectedProviders = new Set<string>(providers);

        const dropdown = providerDropdown.createDiv({ cls: "multi-select-dropdown" });

        const dropdownLabel = dropdown.createDiv({ 
            text: "Select providers", 
            cls: "dropdown-label" 
        });

        dropdownLabel.setText(providers.join(", "));

        const dropdownMenu = dropdown.createDiv({ cls: "dropdown-menu" });

        dropdownLabel.addEventListener("click", (e) => {
            e.stopPropagation();
        	const isOpen = dropdownMenu.style.display === "block";
        	dropdownMenu.style.display = isOpen ? "none" : "block";
        });

        const handleClickOutside = (event: MouseEvent) => {
        	if (!dropdown.contains(event.target as Node)) {
        		dropdownMenu.style.display = "none";
        	}
        };

        document.addEventListener("click", handleClickOutside);

        this.register(() => {
        	document.removeEventListener("click", handleClickOutside);
        });

        providers.forEach((provider) => {
        	const wrapper = dropdownMenu.createDiv({ cls: "dropdown-option" });

        	const checkbox = wrapper.createEl("input", {
        		type: "checkbox",
        	});
            checkbox.checked = selectedProviders.has(provider);
        
	        const label = wrapper.createEl("label");
	        label.setText(provider);

	        label.prepend(checkbox);
        
        	checkbox.addEventListener("change", () => {
        		if (checkbox.checked) {
        			selectedProviders.add(provider);
        		} else {
        			selectedProviders.delete(provider);
        		}
            
        		if (selectedProviders.size === 0) {
        		    dropdownLabel.setText("Select providers");
                    dropdownLabel.addClass("placeholder"); 
        	    } else {
        		    dropdownLabel.setText(Array.from(selectedProviders).join(", "));
                    dropdownLabel.removeClass("placeholder");
        	    }
        	});
        });

        // Search using ISBN
        const isbnTextbox = searchSection.createDiv()

        const labelWrapper = isbnTextbox.createDiv({ cls: "label-wrapper" });

        labelWrapper.createEl("label", {
            text: "🧾 ISBN",
            cls: "search-labels"
        });

        const infoIcon = labelWrapper.createEl("span", {
            text: "i",
            cls: "info-icon"
        });

        infoIcon.setAttr("title", "ISBN takes priority. Without ISBN, search uses Title and Author");

        const isbnInput = isbnTextbox.createEl("input", {
            type: "text",
            placeholder: "ISBN-10 or ISBN-13",
            cls: "textbox",
            value: this.frontmatter?.isbn10 || this.frontmatter?.isbn13 || ""
        });

        // Search using Book Title
        const titleTextbox = searchSection.createDiv()

        titleTextbox.createEl("label", {
	    	text: "📖 Title", cls: "search-labels"
	    });

        const titleInput = titleTextbox.createEl("input", {
	    	type: "text",
	    	placeholder: "Book title",
            cls: "textbox longer-field",
            value: this.frontmatter?.title || ""
	    });

        // Search using Author
        const authorTextbox = searchSection.createDiv()

        authorTextbox.createEl("label", {
	    	text: "✍🏻 Author", cls: "search-labels"
	    });

        const authorInput = authorTextbox.createEl("input", {
	    	type: "text",
	    	placeholder: "Author name",
            cls: "textbox longer-field",
            value: this.frontmatter?.authors ? this.frontmatter.authors.join(", ") : ""
	    });

        const buttonGroup = searchSection.createDiv({cls: "search-row"});

	    const searchButton = buttonGroup.createEl("button", {
	    	text: "Search",
	    	cls: "mod-cta search-button", 
	    });

        searchButton.addClass("disabled");

        function updateSearchButtonState() {
            const hasInput = isbnInput.value.trim() || titleInput.value.trim() || authorInput.value.trim();
            if (hasInput) {
                searchButton.removeClass("disabled");
            } else {
                searchButton.addClass("disabled");
            }
        }

        function triggerSearchOnEnter(input: HTMLInputElement) {
          input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
            
              // Don't run if button is disabled
              if (!searchButton.classList.contains("disabled")) {
                searchButton.click();
              }
            }
          });
        }

        [isbnInput, titleInput, authorInput].forEach(input => {
            input.addEventListener("input", updateSearchButtonState);
            triggerSearchOnEnter(input);
        });

        updateSearchButtonState();

        const searchResults: Record<string, number> = {};
        const providerResults: Record<string, Book[]> = {};
        let total = 0;

        if (!authorInput || !titleInput || !isbnInput) searchButton.disabled = true

	    searchButton.addEventListener("click", async () => {

            resultsSection.empty();
            total = 0

            selectedProviders.forEach(provider => {
                providerLoading[provider] = true;
                searchResults[provider] = 0;
            });

            renderProviderButtons(searchResults)

            const query: BookQuery = {
                isbn: isbnInput.value.trim() || undefined,
                title: titleInput.value.trim() || undefined,
                author: authorInput.value.trim() || undefined
            };

            const providerSearch: BookProvider[] = [];

            if (selectedProviders.has("Goodreads")) {
                providerSearch.push(createGoodreadsProvider(this.app, this.settings, resultsSection, this.file ?? undefined, this.frontmatter ?? undefined));
            }

            if (selectedProviders.has("Google")) {
                providerSearch.push(createGoogleBooksProvider(this.app, this.settings, resultsSection, this.file ?? undefined, this.frontmatter ?? undefined));
            }

            if (selectedProviders.has("OpenLibrary")) {
                providerSearch.push(createOpenLibraryProvider(this.app, this.settings, resultsSection, this.file ?? undefined, this.frontmatter ?? undefined));
            }

            await Promise.all(
                providerSearch.map(async (provider) => {
                    providerLoading[provider.name] = true;
                
                    const results = await provider.search(query);
                
                    searchResults[provider.name] = results.length;
                    providerResults[provider.name] = results;
                    providerLoading[provider.name] = false;
                })
            );


            renderProviderButtons(searchResults);
            
            total = Object.values(searchResults)
                .reduce((a, b) => a + b, 0);

            if (total === 0) {
              emptyState.addClass("visible");
            } else {
              emptyState.removeClass("visible");
            }
	    });

        // Search Result Filter
        const resultsContainer = container.createDiv({ cls: "search-results-section" });

        const headerRow = resultsContainer.createDiv({ cls: "search-results-header" });
        headerRow.createEl("h2", { text: "Search Results" });
        const totalBadge = headerRow.createEl("span", { cls: "total-count-badge", text: "0 books found" });
        const buttonsRow = resultsContainer.createDiv({ cls: "provider-buttons-row" });

        const selectedProviderButtons = new Set<string>(); // tracks which provider buttons are selected
        const providerLoading: Record<string, boolean> = {}; // track provider results are loaded

        const view = this

        function renderBookResults() {
            resultsSection.empty();

            total = 0;

            selectedProviderButtons.forEach((provider) => {
                const books = providerResults[provider] || [];
                total += books.length;
            
                books.forEach((book) => {
                    renderBookCard(view.app, view.settings, resultsSection, book, provider, view.file ?? undefined, view.frontmatter ?? undefined);
                });
            });
        
            totalBadge.setText(`${total} books found`);
        
            // Show empty state if no results
            if (total === 0) {
                emptyState.addClass("visible");
            } else {
                emptyState.removeClass("visible");
            }
        }

        function renderProviderButtons(searchResults: Record<string, number>) {
            buttonsRow.empty();
            total = 0;
        
            selectedProviders.forEach((provider) => {
                const btn = buttonsRow.createEl("button", { cls: "provider-button" });
            
                btn.createEl("span", { text: provider });
                const badge = btn.createDiv({ cls: "provider-badge" });
                if (providerLoading[provider]) {
                    renderLoader2(badge)
                } else {
                    badge.setText((searchResults[provider] || 0).toString());
                }

                // Re-render results for other selected providers
                btn.addEventListener("click", () => {
                    if (selectedProviderButtons.has(provider)) {
                        selectedProviderButtons.delete(provider);
                        btn.classList.remove("selected"); 
                    } else {
                        selectedProviderButtons.add(provider);
                        btn.classList.add("selected"); 
                    }
                    renderBookResults();
                });
            });
        
            // Update total count
            total = Object.values(searchResults)
                .reduce((a, b) => a + b, 0);
            totalBadge.setText(`${total} books found`);
        }

        // Book Cards
        const resultsSection = container.createDiv({ cls: "book-results-section" });

        const emptyState = container.createDiv({ cls: "empty-state" });
        renderWarning(emptyState);
        emptyState.createEl("div", {
          text: "No Results Found",
          cls: "empty-title"
        });
        emptyState.createEl("div", {
          text: "Try adjusting your search criteria or selecting different providers",
          cls: "empty-subtitle"
        });

        emptyState.removeClass("visible");
	}

    async onOpen() {
        this.refreshUI();
    }
    

	async onClose() {
		// TODO: Cleanup on close
	}
}

