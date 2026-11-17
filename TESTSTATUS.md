# Lokaler Prüfstand

Geprüft am 17.11.2026 auf einem vorhandenen Apple-Silicon-Mac mit macOS 27.0.1. Dies ist kein Test auf einem frisch eingerichteten Mac.

- Installation aus dem Paket einschließlich projektspezifischem Node 22.14.0, npm-Lockfile, Whisper.cpp 1.6.0 mit base-Modell und Renderbrowser; Diagnose mit FFmpeg/FFprobe und lokaler Arial Bold.
- Wiederholte Installation; Wiederaufnahme nach simuliertem unvollständigem Whisper-Build; simuliert fehlende Command Line Tools führen zu einer verständlichen Meldung.
- Synthetisches Beispiel: Ausschnitt, Whisper-Transkription, vorgeprüfte Beispielkorrektur, Vorschau und MP4-Render mit gemessenen −16,03 LUFS. Die Vorschau wurde visuell kontrolliert. Automatische Freigabe gilt nur für dieses bekannte Beispiel.
- Erneuter Aufruf von init und transcribe erhielt eine bearbeitete Untertiteldatei; Quellpfad mit Leerzeichen, Umlaut, Anführungszeichen und Shell-Sonderzeichen verarbeitet.
- Skill-Creator-Validator und TypeScript-Prüfung erfolgreich.

Offen: tatsächliche Installation auf einem frischen Mac und auf Intel, andere macOS-Versionen, privates GitHub-Repository, tatsächliche automatische Skill-Erkennung in einer neuen ChatGPT-Desktop-/Codex-Sitzung, menschliche Prüfung eines echten mehrsprachigen Clips und Hörkontrolle des Beispiel-Exports. Die drei offenen Learnings in `docs/ABLAUF.md` bleiben offen; der technische Test belegt sie nicht. Die Pakete sind für Intel vorgesehen, dort aber nicht verifiziert. Die Plattformprüfung prüft macOS und Architektur, garantiert keine Unterstützung jeder macOS-Version.
