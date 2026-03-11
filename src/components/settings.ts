import { App, PluginSettingTab, Setting } from "obsidian";
import BookMetadataPlugin from "main";
import { JsonInputModal } from "src/modals/jsoninput";

export interface BookMetadataPluginSettings {
    folderPath: string;
    bookStatus: string;
    googleApiKey: string;
    additionalServices: {
        importLibraryThing: {
            updateFields: {
                books_id: boolean;
                isbn: boolean;
            }
            logicOperator: "AND" | "OR";
            selectFolders: string[];
        }
    }
}


export const DEFAULT_SETTINGS: BookMetadataPluginSettings = {
    folderPath: "",
    googleApiKey: "",
    bookStatus: "🔴 Not Started",
    additionalServices: {
        importLibraryThing: {
            updateFields: {
                books_id: false,
                isbn: false,
            },
            logicOperator: "AND",
            selectFolders: []
        }
    }
};

export class BookMetadataPluginSettingTab extends PluginSettingTab {
    plugin: BookMetadataPlugin;

    constructor(app: App, plugin: BookMetadataPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // --- General Section ---
        containerEl.createEl("h2", { text: "General Settings" });

        new Setting(containerEl)
            .setName("Default Folder")
            .setDesc("The folder where new book notes will be stored. Use full path relative to your vault root, e.g., 'Books'. Leave empty to create in vault root.")
            .addText(text => text
                .setPlaceholder("Enter folder path")
                .setValue(this.plugin.settings.folderPath)
                .onChange(async (value) => {
                    this.plugin.settings.folderPath = value.trim();
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
        .setName("Default Status")
        .setDesc("The status automatically assigned when a new book note is created. For example: '🔴 Not Started', '🟠 Reading', or '🟢 Finished'.")
        .addText(text => text
            .setPlaceholder("🔴 Not Started")
            .setValue(this.plugin.settings.bookStatus)
            .onChange(async (value) => {
                this.plugin.settings.bookStatus = value.trim() || "🔴 Not Started";
                await this.plugin.saveSettings();
            })
        );

        // --- Google Section ---
        containerEl.createEl("h2", { text: "Google Books API" });

        const desc = containerEl.createDiv({ cls: "setting-item-description" });
        desc.createEl("span", { text: "Include your Google Books API key to increase daily rate limits. " });
        const link = desc.createEl("a", { 
            href: "https://developers.google.com/books/docs/v1/using#APIKey",
            text: "Get a key here",
        });
        link.setAttr("target", "_blank");

        new Setting(containerEl)
            .setName("API Key")
            .addText(text => text
                .setPlaceholder("Enter your API key")
                .setValue(this.plugin.settings.googleApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.googleApiKey = value.trim();
                    await this.plugin.saveSettings();
                })
            );

        containerEl.createEl("hr");

        const libraryThingUpdate = containerEl.createDiv({cls: "settings-section"})

        libraryThingUpdate.createEl("h2", { text: "LibraryThing Import Settings" });
        libraryThingUpdate.createEl("p", { text: "Select which fields to update in frontmatter when importing from LibraryThing. You can also specify logic for how conditions are applied and which folders to target.", cls: "setting-item-description" });
        libraryThingUpdate.createEl("p", { text: "Note: Updating frontmatter will overwrite existing values. Skip this section to disable frontmatter updates.", cls: "settings-item-description-danger" });

        let logicOperator: "AND" | "OR" = "AND";

        // Checkbox for each filter
        type FilterKey = keyof typeof this.plugin.settings.additionalServices.importLibraryThing.updateFields;
        const updateFields = this.plugin.settings.additionalServices.importLibraryThing.updateFields;

        (Object.keys(updateFields) as FilterKey[]).forEach(key => {
          new Setting(libraryThingUpdate)
            .setName(`Update ${key}`)
            .setDesc(`Update frontmatter with ${key} from import results`)
            .addToggle(toggle =>
              toggle.setValue(updateFields[key]).onChange(async value => {
                updateFields[key] = value;
                this.plugin.settings.additionalServices.importLibraryThing.updateFields[key] = value;
                await this.plugin.saveSettings();
              })
            );
        });

        // AND / OR dropdown
        new Setting(libraryThingUpdate)
          .setName("Update Logic")
          .setDesc("Should all selected conditions match (AND) or any (OR)?")
          .addDropdown(dropdown =>
            dropdown
              .addOption("AND", "AND")
              .addOption("OR", "OR")
              .setValue(logicOperator)
              .onChange(async value => {
                logicOperator = value as "AND" | "OR";
                this.plugin.settings.additionalServices.importLibraryThing.logicOperator = logicOperator;
                await this.plugin.saveSettings();
              })
        );

        new Setting(libraryThingUpdate)
        .setName("Enter folders to update frontmatter from import")
        .setDesc("Comma-separated list of folder paths. For example: 'Folder1, Folder2'. Leave empty to disable updating frontmatter.")
        .addText(text => text
          .setPlaceholder("e.g., Folder1, Folder2")
          .setValue(this.plugin.settings.additionalServices.importLibraryThing.selectFolders?.join(", ") || "")
          .onChange(async (value) => {
            this.plugin.settings.additionalServices.importLibraryThing.selectFolders = value.split(",").map(s => s.trim()).filter((s): s is string => !!s);
            await this.plugin.saveSettings();
          })
        );

        new Setting(containerEl)
          .setName("Import LibraryThing metadata")
          .setDesc("Select a JSON file and select rows for import")
          .addButton(button =>
            button
              .setButtonText("Open Import Modal")
              .onClick(() => {
                new JsonInputModal(this.app, this.plugin).open();
              })
        );
    }
}
