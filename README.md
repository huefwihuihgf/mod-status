# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## KI-Rezeptvorschläge einrichten

Die Rezeptvorschläge werden von der Supabase Edge Function `generate-recipes` erzeugt. Der Gemini-Schlüssel gehört ausschließlich in die Supabase-Edge-Function-Secrets und darf nicht in `.env.local`, `VITE_*`-Variablen oder React-Code eingetragen werden.

1. Erstelle in Google AI Studio einen Gemini-API-Schlüssel und prüfe dort die aktuell verfügbaren kostenlosen Kontingente. Aktiviere keine Abrechnung, wenn die App keine kostenpflichtigen Aufrufe verwenden soll.
2. Öffne in Supabase das Projekt unter **Project Settings → Edge Functions → Secrets** und speichere den Schlüssel als `GEMINI_API_KEY`.
3. Installiere/öffne die Supabase CLI, melde dich mit `supabase login` an und verknüpfe das Projekt einmalig mit `supabase link --project-ref <Projekt-Referenz>`.
4. Veröffentliche die Funktion aus dem Projektordner mit `supabase functions deploy generate-recipes`.

Die Funktion prüft die Supabase-Anmeldung, validiert die Rezeptantwort und gibt Fehler des kostenlosen Anbieter-Kontingents an die App weiter. Kostenlose Kontingente, Modellnamen und Verfügbarkeit können sich ändern. Passende Rezeptbilder werden kostenlos über die Wikimedia-Commons-Suche gesucht; Bildnachweis und Lizenzlink werden mit dem gespeicherten Rezept abgelegt. Wenn kein passendes lizenziertes Foto gefunden wird, zeigt die App einen ehrlichen Platzhalter statt eines unpassenden Fotos. Dafür wird kein zusätzlicher API-Schlüssel benötigt.

Nach dem Einspielen des bisherigen Einkaufslisten-Schemas muss auch die Migration `supabase/migrations/20261106001000_add_saved_recipe_image_attribution.sql` ausgeführt werden, damit die Bildquelle und Lizenz in gespeicherten Rezepten erhalten bleiben. Produktkataloge bestätigen keine aktuellen Preise oder Bestände. KI-Allergiefilter sind keine Sicherheitsgarantie: Zutaten und Verpackungshinweise müssen immer selbst geprüft werden.
