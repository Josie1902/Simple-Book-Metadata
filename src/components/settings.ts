import { App, PluginSettingTab, Setting } from "obsidian";
import BookMetadataPlugin from "main";

export interface BookMetadataPluginSettings {
    folderPath: string;
    bookStatus: string;
    googleApiKey: string;
    additionalServices: {}
}

export const DEFAULT_SETTINGS: BookMetadataPluginSettings = {
    folderPath: "",
    googleApiKey: "",
    bookStatus: "🔴 Not Started",
    additionalServices: {}
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

        containerEl.createEl("h2", { text: "Additional Services" });
        containerEl.createEl("p", { text: "Coming soon...", cls: "settings-item-description" });
    }
}
