import { App, Modal, Notice, Plugin, Setting, TFile } from 'obsidian';
import { BookMetadataView, VIEW_TYPE_BOOK_METADATA } from 'src/views/metadataview';
import { BookMetadataPluginSettings, BookMetadataPluginSettingTab, DEFAULT_SETTINGS } from 'src/components/settings';

export default class BookMetadataPlugin extends Plugin {
	settings: BookMetadataPluginSettings;

	async onload() {
		await this.loadSettings();
		const settingsTab = new BookMetadataPluginSettingTab(this.app, this);
		this.addSettingTab(settingsTab);

		this.registerView(
			VIEW_TYPE_BOOK_METADATA,
			(leaf) => new BookMetadataView(leaf)
		);

		this.addRibbonIcon("book", "Search Book Metadata", async () => {
			this.openBookMetadataTab();
		});

		this.addCommand({
			id: "open-book-metadata",
			name: "Search Book Metadata",
			callback: () => {
				this.openBookMetadataTab();
			}
		})

		this.addCommand({
			id: "update-book-metadata",
			name: "Update Book Metadata in Current Note",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice("No active file to update metadata for.");
					return;
				}
				this.openBookMetadataTab(activeFile);
			}
		})

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle('Book Metadata')
					item.setIcon('book-open-check')
					const submenu = item.setSubmenu();
					submenu.addItem((item) => {
						item.setTitle('Search Book Metadata');
						item.setIcon('search')
						item.onClick(() => {
							this.openBookMetadataTab();
						});
					});

					submenu.addItem((item) => {
						item.setTitle('Update Book Metadata in Current Note');
						item.setIcon('pencil')
						item.onClick(() => {
							const activeFile = this.app.workspace.getActiveFile();
							if (!activeFile) {
								new Notice("No active file to update metadata for.");
								return;
							}
							this.openBookMetadataTab(activeFile);
						});
					});
				});
			})
		);
	}

	async openBookMetadataTab(file?: TFile) {

	    let frontmatter: Record<string, any> = {};

	    if (file) {
	        const cache = this.app.metadataCache.getFileCache(file);
	        frontmatter = cache?.frontmatter || {};
	    }

	    // Check if a BookMetadata view is already open
	    const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_BOOK_METADATA)[0];

	    if (existingLeaf && file) {
	        // Update its state with new file/frontmatter
	        await existingLeaf.setViewState({
	            type: VIEW_TYPE_BOOK_METADATA,
	            active: true,
	            state: {
					settings: this.settings,
	                file: file ? { path: file.path, name: file.basename } : null,
	                frontmatter
	            }
	        });
	        this.app.workspace.revealLeaf(existingLeaf);
	        return;
	    }

		if (existingLeaf) {
	        // Update its state with new file/frontmatter
	        await existingLeaf.setViewState({
	            type: VIEW_TYPE_BOOK_METADATA,
	            active: true,
				state: {
					settings: this.settings,
				}
	        });
	        this.app.workspace.revealLeaf(existingLeaf);
	        return;
	    }


	    // No existing view: create a new tab in main area
	    const leaf = this.app.workspace.getLeaf("tab");
	    await leaf.setViewState({
	        type: VIEW_TYPE_BOOK_METADATA,
	        active: true,
	        state: {
				settings: this.settings,
	            file: file ? file : null,
	            frontmatter
	        }
	    });

	    this.app.workspace.revealLeaf(leaf);
	}

	onunload() {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_BOOK_METADATA).forEach(leaf => leaf.detach());
	}

	async loadSettings() {
    	this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  	}

  	async saveSettings() {
    	await this.saveData(this.settings);
  	}	
}
