#!/usr/bin/env python3
"""Migrate cerca/page.tsx and offri/page.tsx to useTranslations."""

import json
import re
import os

BASE = "/home/cristian/Desktop/Andamusu/andamus"

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

def deep_update(target, source):
    for key, value in source.items():
        if isinstance(value, dict):
            target[key] = target.get(key, {})
            deep_update(target[key], value)
        else:
            target[key] = value

# ═══════════════════════════════════════════════════════════════════════════════
# SEARCH PAGE
# ═══════════════════════════════════════════════════════════════════════════════

def migrate_search():
    content = read("app/[locale]/cerca/page.tsx")

    # Add useTranslations import
    if "useTranslations" not in content:
        content = content.replace(
            'import { toast } from "sonner";',
            'import { toast } from "sonner";\nimport { useTranslations } from "next-intl";',
        )

    # Add t hook in SearchContent (main state container)
    # Find "function SearchContent() {" and add const t = useTranslations('search');
    content = content.replace(
        "function SearchContent() {",
        "function SearchContent() {\n  const t = useTranslations('search');",
    )

    # Add t hook in AlertModal
    content = content.replace(
        "function AlertModal({",
        "function AlertModal({\n  const t = useTranslations('search');",
    )

    # Add t hook in SearchMobile
    content = content.replace(
        "function SearchMobile({",
        "function SearchMobile({\n  const t = useTranslations('search');",
    )

    # Add t hook in SearchDesktop
    content = content.replace(
        "function SearchDesktop({",
        "function SearchDesktop({\n  const t = useTranslations('search');",
    )

    # Replace hardcoded strings (most visible ones first)
    reps = [
        # Filter options
        ('"Tutti"', "{t('all')}"),
        ('"Gratis"', "{t('free')}"),
        ('"Verificati"', "{t('verified')}"),
        ('"Oggi"', "{t('today')}"),
        # Alert modal
        ('"Salva alerta"', "{t('saveAlert')}"),
        ('"Ricevi una notifica quando viene pubblicato un passaggio che corrisponde ai tuoi criteri."', "{t('alertDescription')}"),
        ('"Devi accedere per salvare un alerta"', "{t('loginToSaveAlert')}"),
        ("'Errore nel salvare l'alerta'", "{t('alertSaveError')}"),
        ('"Alerta salvata!"', "{t('alertSaved')}"),
        ('"Da"', "{t('from')}"),
        ('"A"', "{t('to')}"),
        ('"Dal"', "{t('fromDate')}"),
        ('"Al"', "{t('toDate')}"),
        ('"Posti minimi"', "{t('minSeats')}"),
        ('"Prezzo max"', "{t('maxPrice')}"),
        ('"Qualsiasi"', "{t('any')}"),
        ('"Annulla"', "{t('cancel')}"),
        ('"Salvataggio..."', "{t('saving')}"),
        # Mobile search
        ('"Rilascia per aggiornare"', "{t('pullToRefreshRelease')}"),
        ('"Tira per aggiornare"', "{t('pullToRefresh')}"),
        ('"Partenza"', "{t('departure')}"),
        ('"Destinazione"', "{t('destination')}"),
        ('"Alerta"', "{t('alert')}"),
        ('"Filtri avanzati"', "{t('advancedFilters')}"),
        ('"Intervallo date"', "{t('dateRange')}"),
        ('"Fascia oraria"', "{t('timeWindow')}"),
        ('"Mattina (05-12)"', "{t('morning')}"),
        ('"Pomeriggio (12-17)"', "{t('afternoon')}"),
        ('"Sera (17-22)"', "{t('evening')}"),
        ('"Notte (22-05)"', "{t('night')}"),
        ('"1 posto"', "{t('1seat')}"),
        ('"2+ posti"', "{t('2seats')}"),
        ('"3+ posti"', "{t('3seats')}"),
        ('"4+ posti"', "{t('4seats')}"),
        ('"Fumatori"', "{t('smokers')}"),
        ('"Animali"', "{t('pets')}"),
        ('"Bagaglio"', "{t('luggage')}"),
        ('"Solo donne"', "{t('womenOnly')}"),
        ('"Cancella filtri"', "{t('clearFilters')}"),
        ('"Caricamento..."', "{t('loading')}"),
        ('"Aggiorna"', "{t('refresh')}"),
        ('"Disponibile"', "{t('available')}"),
        ('"Posto singolo"', "{t('singleSeat')}"),
        # Desktop search
        ('"Da dove parti?"', "{t('fromPlaceholder')}"),
        ('"Dove vai?"', "{t('toPlaceholder')}"),
        ('"Cerca"', "{t('searchButton')}"),
        ('"Data da"', "{t('dateFrom')}"),
        ('"Data a"', "{t('dateTo')}"),
        ('"Musica"', "{t('music')}"),
        ('"Silenzio"', "{t('silence')}"),
        ('"Chiacchiere"', "{t('chat')}"),
        ('"Solo studenti"', "{t('studentsOnly')}"),
        # Error / empty states
        ('"Errore nella ricerca. Riprova."', "{t('searchError')}"),
    ]

    for old, new in reps:
        content = content.replace(old, new)

    # Fix template string for results count
    content = content.replace(
        "`${rides.length} corse trovate`",
        "t('resultsCount', { count: rides.length })"
    )

    write("app/[locale]/cerca/page.tsx", content)
    print("✅ Search page migrated")


def update_search_messages():
    it = read_json("messages/it.json")
    en = read_json("messages/en.json")
    de = read_json("messages/de.json")

    keys_it = {
        "all": "Tutti",
        "verified": "Verificati",
        "today": "Oggi",
        "saveAlert": "Salva alerta",
        "alertDescription": "Ricevi una notifica quando viene pubblicato un passaggio che corrisponde ai tuoi criteri.",
        "loginToSaveAlert": "Devi accedere per salvare un alerta",
        "alertSaveError": "Errore nel salvare l'alerta",
        "alertSaved": "Alerta salvata!",
        "fromDate": "Dal",
        "toDate": "Al",
        "any": "Qualsiasi",
        "cancel": "Annulla",
        "saving": "Salvataggio...",
        "pullToRefreshRelease": "Rilascia per aggiornare",
        "pullToRefresh": "Tira per aggiornare",
        "departure": "Partenza",
        "destination": "Destinazione",
        "alert": "Alerta",
        "advancedFilters": "Filtri avanzati",
        "dateRange": "Intervallo date",
        "timeWindow": "Fascia oraria",
        "morning": "Mattina (05-12)",
        "afternoon": "Pomeriggio (12-17)",
        "evening": "Sera (17-22)",
        "night": "Notte (22-05)",
        "1seat": "1 posto",
        "2seats": "2+ posti",
        "3seats": "3+ posti",
        "4seats": "4+ posti",
        "smokers": "Fumatori",
        "pets": "Animali",
        "luggage": "Bagaglio",
        "womenOnly": "Solo donne",
        "clearFilters": "Cancella filtri",
        "loading": "Caricamento...",
        "refresh": "Aggiorna",
        "available": "Disponibile",
        "singleSeat": "Posto singolo",
        "fromPlaceholder": "Da dove parti?",
        "toPlaceholder": "Dove vai?",
        "searchButton": "Cerca",
        "dateFrom": "Data da",
        "dateTo": "Data a",
        "music": "Musica",
        "silence": "Silenzio",
        "chat": "Chiacchiere",
        "studentsOnly": "Solo studenti",
        "searchError": "Errore nella ricerca. Riprova.",
        "resultsCount": "{count} corse trovate",
    }

    keys_en = {
        "all": "All",
        "verified": "Verified",
        "today": "Today",
        "saveAlert": "Save alert",
        "alertDescription": "Get notified when a ride matching your criteria is posted.",
        "loginToSaveAlert": "You need to sign in to save an alert",
        "alertSaveError": "Error saving alert",
        "alertSaved": "Alert saved!",
        "fromDate": "From",
        "toDate": "To",
        "any": "Any",
        "cancel": "Cancel",
        "saving": "Saving...",
        "pullToRefreshRelease": "Release to refresh",
        "pullToRefresh": "Pull to refresh",
        "departure": "Departure",
        "destination": "Destination",
        "alert": "Alert",
        "advancedFilters": "Advanced filters",
        "dateRange": "Date range",
        "timeWindow": "Time window",
        "morning": "Morning (05-12)",
        "afternoon": "Afternoon (12-17)",
        "evening": "Evening (17-22)",
        "night": "Night (22-05)",
        "1seat": "1 seat",
        "2seats": "2+ seats",
        "3seats": "3+ seats",
        "4seats": "4+ seats",
        "smokers": "Smokers",
        "pets": "Pets",
        "luggage": "Luggage",
        "womenOnly": "Women only",
        "clearFilters": "Clear filters",
        "loading": "Loading...",
        "refresh": "Refresh",
        "available": "Available",
        "singleSeat": "Single seat",
        "fromPlaceholder": "Where from?",
        "toPlaceholder": "Where to?",
        "searchButton": "Search",
        "dateFrom": "Date from",
        "dateTo": "Date to",
        "music": "Music",
        "silence": "Silence",
        "chat": "Chat",
        "studentsOnly": "Students only",
        "searchError": "Search error. Please try again.",
        "resultsCount": "{count} rides found",
    }

    keys_de = {
        "all": "Alle",
        "verified": "Verifiziert",
        "today": "Heute",
        "saveAlert": "Alarm speichern",
        "alertDescription": "Erhalte eine Benachrichtigung, wenn eine Fahrt zu deinen Kriterien veröffentlicht wird.",
        "loginToSaveAlert": "Du musst angemeldet sein, um einen Alarm zu speichern",
        "alertSaveError": "Fehler beim Speichern des Alarms",
        "alertSaved": "Alarm gespeichert!",
        "fromDate": "Von",
        "toDate": "Bis",
        "any": "Beliebig",
        "cancel": "Abbrechen",
        "saving": "Speichern...",
        "pullToRefreshRelease": "Loslassen zum Aktualisieren",
        "pullToRefresh": "Ziehen zum Aktualisieren",
        "departure": "Abfahrt",
        "destination": "Ziel",
        "alert": "Alarm",
        "advancedFilters": "Erweiterte Filter",
        "dateRange": "Datumsbereich",
        "timeWindow": "Zeitfenster",
        "morning": "Morgen (05-12)",
        "afternoon": "Nachmittag (12-17)",
        "evening": "Abend (17-22)",
        "night": "Nacht (22-05)",
        "1seat": "1 Platz",
        "2seats": "2+ Plätze",
        "3seats": "3+ Plätze",
        "4seats": "4+ Plätze",
        "smokers": "Raucher",
        "pets": "Tiere",
        "luggage": "Gepäck",
        "womenOnly": "Nur Frauen",
        "clearFilters": "Filter zurücksetzen",
        "loading": "Laden...",
        "refresh": "Aktualisieren",
        "available": "Verfügbar",
        "singleSeat": "Einzelplatz",
        "fromPlaceholder": "Wo startest du?",
        "toPlaceholder": "Wohin?",
        "searchButton": "Suchen",
        "dateFrom": "Datum von",
        "dateTo": "Datum bis",
        "music": "Musik",
        "silence": "Stille",
        "chat": "Gespräche",
        "studentsOnly": "Nur Studenten",
        "searchError": "Suchfehler. Bitte versuche es erneut.",
        "resultsCount": "{count} Fahrten gefunden",
    }

    deep_update(it["search"], keys_it)
    deep_update(en["search"], keys_en)
    deep_update(de["search"], keys_de)

    write_json("messages/it.json", it)
    write_json("messages/en.json", en)
    write_json("messages/de.json", de)
    print("✅ Search messages updated")


if __name__ == "__main__":
    migrate_search()
    update_search_messages()
