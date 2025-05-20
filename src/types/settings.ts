export interface GeneralSettings {
  siteTitle: string;
  siteDescription: string;
  logoUrl: string;
  homepageListingCount: number; // Number of listings to display on homepage
}

export interface SeoSettings {
  globalSeoTitle: string;
  globalSeoDescription: string;
}

export interface ScriptsSettings {
  headerScripts: string; // For Google Analytics or other header scripts
}

export interface AppearanceSettings {
  primaryFontColor: string; // e.g., hex code '#333333'
  // We can add more appearance settings later, like backgroundColor, fontFamily, etc.
}

export interface SiteSettings {
  general: GeneralSettings;
  seo: SeoSettings;
  scripts: ScriptsSettings;
  appearance: AppearanceSettings;
}
