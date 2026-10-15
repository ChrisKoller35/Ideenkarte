# Ideenkarte

Desktop-App (Windows) zum Durchstöbern von Projekt- und Ideen-Ordnern: links Ordnerbaum, rechts
die gewählte Markdown-Datei. Mehrere Projekte, jedes ein eigener Ordner auf dem PC. Später:
Mindmap-Ansicht, «Was ist neu»-Markierung, «Agent hier starten» (Claude Code im Bereich).

Sprache in Code-Kommentaren und UI: Deutsch (Schweiz, kein ß). Code-Bezeichner: Englisch.

## Stack

- Electron 33 + React 18 + TypeScript (strict) + Vite 6
- Markdown: `marked`
- Qualität: ESLint, Prettier, Vitest

## Befehle

- `npm install` – einmalig
- `npm start` – bauen und App starten
- `npm run build` – nur bauen (Typcheck + Electron + Renderer)
- `npm test` – Tests
- `npm run lint` – Linter
- `npm run format` – Code formatieren

## Aufbau

```
electron/   Hauptprozess (Node). Fenster, IPC, Dateisystem.
  main.ts       Einstieg, IPC-Kanäle registrieren
  preload.ts    Brücke → window.ideenkarte (einzige Verbindung zur Oberfläche)
  projects.ts   Projektliste (JSON in userData)
  files.ts      Ordnerbaum lesen, Dateien lesen (nie ausserhalb des Projekts)
shared/     Typen und reine Hilfsfunktionen, von beiden Seiten genutzt. Keine Node-/DOM-Imports.
src/        Oberfläche (React, Browser-Kontext, kein Node-Zugriff).
  api.ts        Zugriff auf window.ideenkarte
  state/        Hooks: useProjects, useProjectFiles
  projects/     Projektleiste
  tree/         Ordnerbaum
  viewer/       Markdown-Anzeige
  App.tsx       Rahmen
  styles.css    Design (Tokens in :root, hell/dunkel)
```

## Regeln

- Module klein halten (Richtwert: unter 200 Zeilen). Neue Funktion = neuer Ordner/Datei, nicht
  in bestehende Dateien stopfen.
- Oberfläche greift nie direkt auf Dateisystem oder Node zu, nur über `IdeenkarteApi`
  (`shared/types.ts`). Neue Fähigkeit = Methode dort + Handler in `electron/main.ts` +
  Eintrag in `electron/preload.ts`.
- Reine Logik (ohne React, ohne Electron) in `shared/` oder als `.ts` neben der Komponente,
  mit Test (`*.test.ts`).
- Vor dem Abschluss: `npm run typecheck`, `npm run lint`, `npm test`.
- Rohes HTML aus Markdown-Dateien wird nicht gerendert (siehe `src/viewer/markdown.ts`).

## Geplante Etappen

1. Baum + Anzeige + mehrere Projekte ✔
2. Mindmap-Ansicht (React Flow)
3. «Was ist neu»: Änderungen seit letztem Blick markieren
4. «Agent hier starten»: Claude Code im gewählten Bereich öffnen
