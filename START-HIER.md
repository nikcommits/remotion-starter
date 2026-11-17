# Einstieg für die lokale KI

Dieser Einstieg benötigt keinen vorinstallierten Skill. Zielumgebung: ChatGPT Desktop mit lokal ausführendem Codex, der Dateien lesen und Terminalbefehle auf diesem Mac ausführen darf. Ein normaler Chat ohne lokalen Dateizugriff kann das nicht selbst installieren. Kläre das zuerst durch Lesen dieses Ordners und einen harmlosen lokalen Terminalbefehl (`pwd`); falls nicht möglich, sage dies und bitte um Öffnen des Ordners in Codex/Work mit lokaler Ausführung. Behaupte keine Skill-Aktivierung oder Installation, die nicht geprüft wurde.

## Quelle öffnen

- Lokaler Ordner: Diesen Paketordner als Projekt/Arbeitsordner in Codex öffnen. Falls nur der übergeordnete Ordner genannt wurde, darin `handoff/remotion-starter/START-HIER.md` suchen.
- GitHub-Link: Repository in einen neuen lokalen Ordner klonen; anschließend dort dieses START-HIER suchen. Ist der Link das Repository des Pakets selbst, liegt es im Root; ansonsten unter `handoff/remotion-starter`. Danach genau dieselben Schritte ausführen wie beim lokalen Ordner. Keine vorhandenen Ordner überschreiben.
- Bei privatem Repository: Die Person braucht Zugriff und eine bereits eingerichtete GitHub-Anmeldung für Git. Bei Authentifizierungsfehlern die Person bitten, den Zugriff selbst in GitHub bzw. dem vorhandenen Anmeldefenster einzurichten. Keine Passwörter oder Tokens im Chat erfragen oder protokollieren. Nicht an Berechtigungen oder Konten ändern.

## Installation

1. Dieses Dokument und `.agents/skills/video-short/SKILL.md` lesen. Auch ohne automatische Skill-Erkennung gelten diese Anweisungen, sobald sie gelesen wurden. Für automatische Erkennung das Paket als Projekt öffnen; bei Bedarf Codex-Sitzung neu starten. Erkennung nicht behaupten, bevor sie sichtbar bestätigt ist.
2. Prüfen, dass macOS und lokales Terminal verfügbar sind, und die Person auf Downloads und benötigten Speicher hinweisen. Im Paketverzeichnis `scripts/install.sh` ausführen. Es installiert Node 22.14.0, npm-Abhängigkeiten aus dem Lockfile, Whisper.cpp 1.6.0 mit mehrsprachigem base-Modell und den Remotion-Renderbrowser projektlokal. FFmpeg/FFprobe kommen aus dem Remotion-Paket. Internet erforderlich.
3. Die Installation verlangt bei fehlenden Apple Command Line Tools eine macOS-Systeminstallation und ggf. Freigabe durch die Person. Klar erklären und nach deren Abschluss denselben Befehl wiederholen. Keine vorhandene Node-, Python-, FFmpeg- oder Whisper-Installation ändern. Bei Fehlern `.work/logs/install.log` prüfen, Ursache kurz erklären; Log kann lokale Pfade enthalten.
4. `scripts/run.sh doctor` und `scripts/run.sh example` ausführen. Beispiel ist synthetisch, nur für Funktionstest. Erst Erfolg melden, wenn Export und Prüfung tatsächlich gelungen sind. Den fertigen Beispielclip und Logpfade nennen. Bei Abbruch nach Fehlerbehebung denselben Befehl wiederholen; keine Benutzerkorrekturen löschen.
5. Person fragen, welches Video, welcher Anfang und welches Ende verwendet werden sollen. Anschließend den Skill und `docs/ABLAUF.md` befolgen. Inhalte niemals ohne menschliche Prüfung als freigegeben ausgeben.

Unterstützung: macOS Apple Silicon und Intel sind vorgesehen; tatsächlich getestete Systeme stehen in `TESTSTATUS.md`. Kein Support für Windows/Linux. macOS-Freigaben, lokale Ausführung und privater Repository-Zugriff hängen von der Umgebung ab. Mindestens 8 GB frei; längere Videos brauchen mehr. Internet und Schreibzugriff im Paketordner notwendig. Nur eigene oder zur Verarbeitung freigegebene Videos verwenden; Whisper arbeitet lokal.
