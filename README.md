# Ideenkarte

Eigene Desktop-App als Übersicht über alle Projekte. Beim Start zeigt sie jedes Projekt als
Karte (aus der `projekt.json` im Projekt-Hauptordner): Name, Typ, Status, Markierung «mehr ich»
oder «mehr KI» und die nächsten Aufgaben. Ein Klick öffnet den Projekt-Bereich mit Ordnerbaum
links und Text rechts.

## Installieren (ohne Node, mit Desktop-Icon)

1. Auf GitHub im Repo unter **Releases** die neueste `Ideenkarte-Setup-x.y.z.exe` herunterladen.
2. Doppelklick. Falls Windows «Der Computer wurde durch Windows geschützt» meldet:
   «Weitere Informationen» → «Trotzdem ausführen» (die App ist nicht signiert).
3. Danach liegt «Ideenkarte» auf dem Desktop und im Startmenü.

## Updates

Die installierte App sucht beim Start auf GitHub nach einer neuen Version und lädt sie im
Hintergrund. Ist sie bereit, erscheint oben «Neue Version … ist bereit» mit «Neu starten».
Sonst wird sie beim nächsten Schliessen installiert. Dafür muss das Repo öffentlich sein.

Neue Version veröffentlichen: auf GitHub unter **Actions › Installer bauen › Run workflow**
klicken. Die Version wird automatisch hochgezählt (z.B. 0.2.7). Für einen grösseren Schritt
einen Tag wie `v0.3.0` pushen.

## Bedienung

- Die App sucht beim Start alle `projekt.json` unter «Dokumente» (bis 4 Ordner tief).
  «Ordner ändern» wählt einen anderen Wurzelordner.
- Filter oben: Markierung (Alle / Mehr ich / Mehr KI / Gemischt) und Status.
  Archivierte Projekte sind standardmässig ausgeblendet.
- Markierung und Status lassen sich auf der Karte ändern und werden direkt in die
  `projekt.json` geschrieben (dazu `aktualisiert` und `aktualisiertVon: "ideenkarte"`).
- «Öffnen» zeigt den Projekt-Bereich, «Im Explorer» öffnet den Ordner.

## Entwickeln

```
npm install
npm start        # bauen und App starten
npm run dist     # Windows-Installer lokal bauen (landet in release/)
```

Aufbau, Regeln und geplante Etappen stehen in `CLAUDE.md`.
