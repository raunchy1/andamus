export const locales = ["it", "en", "de"] as const;
export const defaultLocale = "it" as const;

export type Locale = (typeof locales)[number];
