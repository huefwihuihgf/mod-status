
# EssenPlan

Eine React-App zur Planung von Mahlzeiten und Rezepten.

## Technologien
- React
- Vite
- Supabase
- Gemini API über Supabase Edge Functions

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Produktionsversion erstellen

```bash
npm run build
```

## KI-Rezeptvorschläge

Die Rezeptvorschläge werden über die Supabase Edge Function `generate-recipes` erzeugt.

Der Gemini-API-Schlüssel wird ausschließlich serverseitig als `GEMINI_API_KEY` in den Supabase Edge Function Secrets gespeichert.

Veröffentlichen:

```bash
npx supabase functions deploy generate-recipes
```

## Sicherheit

Keine geheimen API-Schlüssel oder privaten Zugangsdaten in GitHub hochladen.
