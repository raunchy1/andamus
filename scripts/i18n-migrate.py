#!/usr/bin/env python3
"""
Bulk migration script to replace hardcoded Italian strings with next-intl t() calls.
Processes: app/[locale]/page.tsx, app/[locale]/cerca/page.tsx, app/[locale]/offri/page.tsx
"""

import json
import re
import os

BASE = "/home/cristian/Desktop/Andamusu/andamus"

# ── Helper: read / write files ──
def read(path):
    with open(os.path.join(BASE, path), "r", encoding="utf-8") as f:
        return f.read()

def write(path, content):
    with open(os.path.join(BASE, path), "w", encoding="utf-8") as f:
        f.write(content)

def read_json(path):
    with open(os.path.join(BASE, path), "r", encoding="utf-8") as f:
        return json.load(f)

def write_json(path, data):
    with open(os.path.join(BASE, path), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

# ═══════════════════════════════════════════════════════════════════════════════
# 1. HOMEPAGE — app/[locale]/page.tsx
# ═══════════════════════════════════════════════════════════════════════════════

def migrate_homepage():
    content = read("app/[locale]/page.tsx")

    # Add useTranslations import if missing
    if "useTranslations" not in content:
        content = content.replace(
            'import { DatePicker } from "@/components/ui/date-picker";',
            'import { DatePicker } from "@/components/ui/date-picker";\nimport { useTranslations, useLocale } from "next-intl";',
        )

    # We need t() available in HomeMobile, HomeDesktop, and HomePage.
    # Since these are client components inside the same file, we'll add `const t = useTranslations('home');`
    # and `const locale = useLocale();` inside each component that needs them.

    # --- HomeMobile: add t and locale after the function signature ---
    home_mobile_sig = "function HomeMobile({"
    if home_mobile_sig in content and "const t = useTranslations('home')" not in content.split("function HomeDesktop")[0]:
        content = content.replace(
            "function HomeMobile({",
            "function HomeMobile({",
        )
        # Actually we need a more surgical approach. Let's do replacements inline.

    # For safety, let's do direct string replacements for the most visible strings
    # in BOTH mobile and desktop views.

    replacements = [
        # Mobile hero
        ('"Il modo più semplice di spostarsi in Sardegna"', "{t('hero.title')} {t('hero.titleHighlight')} {t('hero.subtitle')}"),
        # Mobile search placeholder
        ('"Dove vuoi andare?"', "{t('hero.fromPlaceholder')}"),
        # Mobile Cerca button
        ('"Cerca"', "{t('hero.searchButton')}"),
        # Mobile "Corse disponibili oggi"
        ('"Corse disponibili oggi"', "{t('todayRides')}"),
        # Mobile "Vedi tutte"
        ('"Vedi tutte"', "{t('seeAll')}"),
        # Mobile "Oggi · "
        ('"Oggi · "', "{t('today')} · "),
        # Mobile "Gratis"
        ('"Gratis"', "{t('free')}"),
        # Mobile " · Auto"
        ('" · Auto"', "{t('car')}"),
        # Mobile "Nessuna corsa disponibile oggi."
        ('"Nessuna corsa disponibile oggi."', "{t('noRidesToday')}"),
        # Mobile "Cerca altre date →"
        ('"Cerca altre date →"', "{t('searchOtherDates')} →"),
        # Mobile "Offri un passaggio"
        ('"Offri un passaggio"', "{t('offerRide')}"),
        # Mobile "I tuoi viaggi"
        ('"I tuoi viaggi"', "{t('yourTrips')}"),
        # Desktop hero (split text with span)
        ('"Il modo più semplice di "', "{t('hero.title')} "),
        ('"spostarsi"', "{t('hero.titleHighlight')}"),
        ('" in Sardegna"', " {t('hero.subtitle')}"),
        # Desktop subtitle
        ('"Connetti con chi viaggia nella tua stessa direzione. Risparmia, riduci le emissioni e scopri nuove storie."', "{t('hero.description')}"),
        # Desktop labels
        ('"Partenza"', "{t('hero.from')}"),
        ('"Destinazione"', "{t('hero.to')}"),
        ('"Data"', "{t('hero.date')}"),
        # Desktop placeholders
        ('"Seleziona città"', "{t('hero.cityPlaceholder')}"),
        # Desktop "Corse disponibili oggi"
        ('"Corse disponibili oggi"', "{t('todayRides')}"),
        # Desktop "Partenze confermate per il "
        ('"Partenze confermate per il "', "{t('departuresConfirmed')} "),
        # Desktop "Vedi tutte →"
        ('"Vedi tutte →"', "{t('seeAll')} →"),
        # Desktop "Nessuna corsa disponibile oggi."
        ('"Nessuna corsa disponibile oggi."', "{t('noRidesToday')}"),
        # Desktop "Cerca altre date"
        ('"Cerca altre date"', "{t('searchOtherDates')}"),
        # Desktop features
        ('"Risparmia sui viaggi"', "{t('feature1.title')}"),
        ('"Condividi le spese con altri passeggeri e riduci i costi del tuo spostamento fino al 70%."', "{t('feature1.description')}"),
        ('"Viaggia sostenibile"', "{t('feature2.title')}"),
        ('"Ogni passaggio condiviso riduce le emissioni di CO₂ e il traffico sulle strade sarde."', "{t('feature2.description')}"),
        ('"Community affidabile"', "{t('feature3.title')}"),
        ('"Profili verificati e recensioni reali per viaggiare sempre con tranquillità."', "{t('feature3.description')}"),
        # Desktop CTA
        ('"Hai un posto libero in macchina?"', "{t('cta.title')}"),
        ('"Offri un passaggio e aiuta qualcuno a raggiungere la sua destinazione."', "{t('cta.description')}"),
        ('"Offri un passaggio"', "{t('offerRide')}"),
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    # Add `const t = useTranslations('home');` inside each component that needs it
    # HomeMobile
    if "const t = useTranslations('home')" not in content.split("function HomeDesktop")[0]:
        content = content.replace(
            "function HomeMobile({\n  user,\n  formData,\n  setOrigin,\n  setDestination,\n  todayRides,\n  loading,\n  userName,\n  userAvatar,\n  handleSearch,\n}: HomeUIProps) {",
            "function HomeMobile({\n  user,\n  formData,\n  setOrigin,\n  setDestination,\n  todayRides,\n  loading,\n  userName,\n  userAvatar,\n  handleSearch,\n}: HomeUIProps) {\n  const t = useTranslations('home');",
        )

    # HomeDesktop
    if "const t = useTranslations('home')" not in content.split("function HomePage")[0].split("function HomeDesktop")[1]:
        content = content.replace(
            "function HomeDesktop({\n  origin,\n  setOrigin,\n  destination,\n  setDestination,\n  todayRides,\n  loading,\n  userName,\n  router,\n}: HomeUIProps) {",
            "function HomeDesktop({\n  origin,\n  setOrigin,\n  destination,\n  setDestination,\n  todayRides,\n  loading,\n  userName,\n  router,\n}: HomeUIProps) {\n  const t = useTranslations('home');",
        )

    write("app/[locale]/page.tsx", content)
    print("✅ Homepage migrated")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. UPDATE MESSAGE FILES
# ═══════════════════════════════════════════════════════════════════════════════

def update_messages():
    it = read_json("messages/it.json")
    en = read_json("messages/en.json")
    de = read_json("messages/de.json")

    # ── Homepage keys ──
    home_keys_it = {
        "hero": {
            "title": "Il modo più semplice di",
            "titleHighlight": "spostarsi",
            "subtitle": "in Sardegna",
            "description": "Connetti con chi viaggia nella tua stessa direzione. Risparmia, riduci le emissioni e scopri nuove storie.",
            "fromPlaceholder": "Dove vuoi andare?",
            "searchButton": "CERCA",
            "cityPlaceholder": "Seleziona città",
        },
        "todayRides": "Corse disponibili oggi",
        "seeAll": "Vedi tutte",
        "today": "Oggi",
        "free": "Gratis",
        "car": " · Auto",
        "noRidesToday": "Nessuna corsa disponibile oggi.",
        "searchOtherDates": "Cerca altre date",
        "offerRide": "Offri un passaggio",
        "yourTrips": "I tuoi viaggi",
        "departuresConfirmed": "Partenze confermate per il",
        "feature1": {
            "title": "Risparmia sui viaggi",
            "description": "Condividi le spese con altri passeggeri e riduci i costi del tuo spostamento fino al 70%.",
        },
        "feature2": {
            "title": "Viaggia sostenibile",
            "description": "Ogni passaggio condiviso riduce le emissioni di CO₂ e il traffico sulle strade sarde.",
        },
        "feature3": {
            "title": "Community affidabile",
            "description": "Profili verificati e recensioni reali per viaggiare sempre con tranquillità.",
        },
        "cta": {
            "title": "Hai un posto libero in macchina?",
            "description": "Offri un passaggio e aiuta qualcuno a raggiungere la sua destinazione.",
        },
    }

    home_keys_en = {
        "hero": {
            "title": "The simplest way to",
            "titleHighlight": "get around",
            "subtitle": "in Sardinia",
            "description": "Connect with people traveling your direction. Save money, reduce emissions and discover new stories.",
            "fromPlaceholder": "Where do you want to go?",
            "searchButton": "SEARCH",
            "cityPlaceholder": "Select city",
        },
        "todayRides": "Today's rides",
        "seeAll": "See all",
        "today": "Today",
        "free": "Free",
        "car": " · Car",
        "noRidesToday": "No rides available today.",
        "searchOtherDates": "Search other dates",
        "offerRide": "Offer a ride",
        "yourTrips": "Your trips",
        "departuresConfirmed": "Confirmed departures for",
        "feature1": {
            "title": "Save on travel",
            "description": "Share expenses with other passengers and reduce your travel costs by up to 70%.",
        },
        "feature2": {
            "title": "Travel sustainably",
            "description": "Every shared ride reduces CO₂ emissions and traffic on Sardinian roads.",
        },
        "feature3": {
            "title": "Trusted community",
            "description": "Verified profiles and real reviews for worry-free travel.",
        },
        "cta": {
            "title": "Have a free seat in your car?",
            "description": "Offer a ride and help someone reach their destination.",
        },
    }

    home_keys_de = {
        "hero": {
            "title": "Der einfachste Weg,",
            "titleHighlight": "sich fortzubewegen",
            "subtitle": "auf Sardinien",
            "description": "Verbinde dich mit Mitreisenden. Spare Geld, reduziere Emissionen und entdecke neue Geschichten.",
            "fromPlaceholder": "Wohin möchtest du?",
            "searchButton": "SUCHEN",
            "cityPlaceholder": "Stadt wählen",
        },
        "todayRides": "Heutige Fahrten",
        "seeAll": "Alle anzeigen",
        "today": "Heute",
        "free": "Kostenlos",
        "car": " · Auto",
        "noRidesToday": "Keine Fahrten heute verfügbar.",
        "searchOtherDates": "Andere Termine suchen",
        "offerRide": "Fahrt anbieten",
        "yourTrips": "Deine Reisen",
        "departuresConfirmed": "Bestätigte Abfahrten für den",
        "feature1": {
            "title": "Spare bei Reisen",
            "description": "Teile Kosten mit anderen Passagieren und reduziere deine Reisekosten um bis zu 70%.",
        },
        "feature2": {
            "title": "Nachhaltig reisen",
            "description": "Jede geteilte Fahrt reduziert CO₂-Emissionen und Verkehr auf Sardiniens Straßen.",
        },
        "feature3": {
            "title": "Vertrauenswürdige Community",
            "description": "Verifizierte Profile und echte Bewertungen für sorgenfreies Reisen.",
        },
        "cta": {
            "title": "Hast du einen freien Platz im Auto?",
            "description": "Biete eine Fahrt an und hilf jemandem, sein Ziel zu erreichen.",
        },
    }

    def deep_update(target, source):
        for key, value in source.items():
            if isinstance(value, dict):
                target[key] = target.get(key, {})
                deep_update(target[key], value)
            else:
                target[key] = value

    deep_update(it["home"], home_keys_it)
    deep_update(en["home"], home_keys_en)
    deep_update(de["home"], home_keys_de)

    write_json("messages/it.json", it)
    write_json("messages/en.json", en)
    write_json("messages/de.json", de)
    print("✅ Message files updated")


if __name__ == "__main__":
    migrate_homepage()
    update_messages()
