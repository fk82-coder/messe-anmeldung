# Tablet-Test Messe-Brücke (v0.6.3 + Brücke)

Branch `bruecke-v063`. Er bringt die Messe-App v0.6.3 mit der Brücke zum Veyond-Server: Jedes gespeicherte Messegespräch und jeder Lieferantenkontakt wird zusätzlich an `https://leads.veyond.info/messe-api/` geschickt. Dein Ablauf bleibt gleich. Ablage auf dem Tablet und CSV-Export laufen weiter wie bisher.

Geändert sind nur: `js/bruecke.js` (neu), je eine Aufrufzeile in `js/gespraech.js` und `js/lieferant.js`, die Zeile `bruecke:` in `js/konfiguration.js`, die CSP in `index.html` (zusätzlich `https://leads.veyond.info`), die Dateiliste und die VERSION in `sw.js` und diese Datei. Deine Englisch-Änderungen aus v0.6.3 sind unverändert enthalten.

---

## Teil 1: Für Fred

1. **Mergen lassen.** Dein Agent macht das nach Teil 2. Er meldet „fertig“ oder „gestoppt“. Bei „gestoppt“ bitte nichts selbst lösen, sondern Mano Bescheid geben.
2. **Warten, bis GitHub Pages live ist.** Das ist so, wenn
   - unter GitHub → Repo → **Actions** der Lauf „pages build and deployment“ einen grünen Haken hat, **und**
   - `https://fk82-coder.github.io/messe-anmeldung/sw.js` in der ersten Zeile `messe-app-0.6.3-bruecke3` zeigt.

   Danach noch **10 Minuten** warten. So lange kann GitHub alte Dateien ausliefern.
3. **Update auf das Tablet holen.** Die App lädt ihre Dateien aus dem eigenen Speicher. Das Update kommt erst beim zweiten Start an:
   - **iPad:** App öffnen und kurz warten. Dann im App-Umschalter (vom unteren Rand nach oben wischen und halten) die App nach oben wegwischen. Wieder öffnen, wieder wegwischen, ein drittes Mal öffnen.
   - **Android:** App öffnen und kurz warten. Dann über „Zuletzt verwendet“ wegwischen. Noch zweimal öffnen und schließen, dann normal öffnen.
   - Die Versionsanzeige unten bleibt `v0.6.3`. Ob das Update angekommen ist, zeigt erst Schritt 5.
4. **Token-Link öffnen.** Mano schickt dir einen Link `https://fk82-coder.github.io/messe-anmeldung/#bruecke-token=…` über einen eigenen Kanal, nicht per Mail. Öffne ihn **auf dem Tablet, auf dem du testest**. Das Tablet merkt sich den Token, und die Adresse verliert den Token-Teil gleich wieder. Den Link nicht weitergeben. Löschen erst, wenn in Schritt 6 der erste blaue Hinweis erschienen ist.
   - **Android (Chrome):** Link in Chrome öffnen. Die installierte App teilt den Speicher mit Chrome und hat den Token danach auch.
   - **iPad:** Eine App auf dem Home-Bildschirm hat **einen eigenen Speicher, getrennt von Safari**. Ein Link aus Nachrichten oder Mail öffnet sich aber immer in Safari, also kommt der Token **nicht** in der Home-Bildschirm-App an. **Für diesen Test die App deshalb im Safari-Tab benutzen**, den der Link geöffnet hat. Nicht über das Symbol auf dem Home-Bildschirm.
5. **Testeinträge machen** (in derselben App bzw. demselben Safari-Tab wie Schritt 4):
   - **Messegespräch Kunde:** ausfüllen und speichern. **Newsletter und Vertriebskontakt nicht ankreuzen**, sonst geht eine echte Bestätigungsmail von CleverReach an die eingetragene Adresse.
   - **Lieferantenkontakt mit Visitenkartenfoto:** Karte fotografieren und speichern.
6. **Erfolg erkennst du so:** Nach jedem Speichern erscheint unten ein **blauer** Hinweis `An Süsse übertragen: MED26-…` (bzw. `MED26-L-…`).
   - **Rot** „Token fehlt“ bedeutet: Schritt 4 ist nicht in dieser App angekommen. Beim iPad heißt das meist: Du bist in der Home-Bildschirm-App statt im Safari-Tab.
   - **Rot** „Nicht an Süsse übertragen (…)“ bedeutet: Der Server hat abgelehnt. Bitte den Text in Klammern notieren.
   - **Gar kein Hinweis** bedeutet: Das Update ist noch nicht da. **Android:** Schritt 3 wiederholen. **iPad (Safari-Tab):** den Token-Link aus Schritt 4 im Safari-Tab neu öffnen und den Eintrag wiederholen.
   - In jedem Fall liegt der Eintrag sicher auf dem Tablet.
7. **An Mano melden:** Gerät (iPad oder Android, App oder Safari-Tab), Uhrzeit, die angezeigten Nummern und je Eintrag die Farbe und den Text des Hinweises. Bei Rot zusätzlich ein Bildschirmfoto.

Die Mails vom Tablet-Test gehen im aktuellen Server-Modus an mano@veyond.info.

---

## Teil 2: Für Freds Coding-Agent

Arbeite genau diese Schritte ab und frage nichts nach. Wenn eine Prüfung nicht wie angegeben ausfällt: **stoppen, nichts reparieren, Ausgabe an Mano melden.**

```text
REPO          github.com/fk82-coder/messe-anmeldung
QUELLE        origin/bruecke-v063
ZIEL          main  (GitHub Pages baut aus main)
ERWARTET      origin/main == cd7012c51917b651b5011e333b93e25719357742  (v0.6.3)
SW_VERSION    messe-app-0.6.3-bruecke3
PAGES_URL     https://fk82-coder.github.io/messe-anmeldung/
```

### Schritt 1: Vorbedingung

```sh
git fetch origin
git status --porcelain                 # muss leer sein, sonst STOPP
git rev-parse origin/main              # muss cd7012c51917b651b5011e333b93e25719357742 sein, sonst STOPP
git merge-base --is-ancestor origin/main origin/bruecke-v063 && echo ok   # muss "ok" ausgeben, sonst STOPP
```

### Schritt 2: Merge (lokal, kein Pull Request)

```sh
git switch main
git pull --ff-only origin main
git rev-parse HEAD                     # muss cd7012c51917b651b5011e333b93e25719357742 sein, sonst STOPP (keine eigenen ungepushten Commits auf main)
git merge --no-ff origin/bruecke-v063 -m "Merge bruecke-v063: Messe-Brücke auf v0.6.3"
```
**Bei einem Konflikt:** `git merge --abort`, STOPP, die Liste der Konfliktdateien an Mano melden. Nicht selbst auflösen.

### Schritt 3: Prüfen **vor** dem Push

```sh
grep -n localhost index.html js/konfiguration.js ; echo "exit=$?"     # keine Trefferzeile, exit=1
grep -n zielLokal index.html sw.js js/*.js ; echo "exit=$?"        # keine Trefferzeile, exit=1
head -1 sw.js                                                       # var VERSION = 'messe-app-0.6.3-bruecke3';
grep -c "js/bruecke.js" sw.js index.html                            # sw.js:1  index.html:1
grep -c "Bruecke.senden" js/gespraech.js js/lieferant.js            # je 1
grep -n "leads.veyond.info" index.html js/konfiguration.js          # je genau 1 Zeile
grep -n "version: '0.6.3'" js/konfiguration.js                      # 1 Zeile (Freds Version unverändert)
git diff --stat cd7012c HEAD                                        # nur: TABLET-TEST.md index.html js/bruecke.js js/gespraech.js js/konfiguration.js js/lieferant.js sw.js
```
Weicht etwas ab: STOPP, nicht pushen.

### Schritt 4: Push

```sh
git push origin main
```

### Schritt 5: Pages live prüfen

```sh
gh run list --repo fk82-coder/messe-anmeldung --workflow pages-build-deployment -L 1   # Status completed, Ergebnis success
# Bis zu 10 Minuten wiederholen, bis beide Befehle stimmen:
curl -s -o /dev/null -w '%{http_code}\n' https://fk82-coder.github.io/messe-anmeldung/js/bruecke.js   # 200
curl -s https://fk82-coder.github.io/messe-anmeldung/sw.js | head -1                                  # ... 'messe-app-0.6.3-bruecke3';
```
Danach Fred melden: „live, Teil 1 ab Schritt 3“.

### Nicht anfassen

- `messe-api/` auf dem Server `leads.veyond.info` (FTP): nicht hochladen, nicht löschen, **nicht spiegeln/synchronisieren**. Das ist die Brücke von Veyond, nicht Teil dieses Repos.
- `js/bruecke.js` und die Zeile `bruecke:` in `js/konfiguration.js`: Protokoll, Ziel-URL, Kopfzeile `X-Messe-Token` und Felder nicht ändern.
- Den Token: Er gehört nicht ins Repo, nicht in einen Commit, Issue, PR-Text, Log oder Chat. Er kommt nur über den Link aus Teil 1 Schritt 4 aufs Tablet.
- Keine weiteren Änderungen in diesem Merge (kein Formatieren, kein Versionssprung in `konfiguration.js`, kein `testmodus`).
- Kein `--force`, kein Rebase oder Squash von `main`.
