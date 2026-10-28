window.KONFIG = {
  version: '0.5.0',
  testmodus: false,
  messe: 'DVG 2026',
  standardSprache: 'de',
  messeSprachen: ['de', 'en'],
  leerlaufSekunden: 90,
  dankeSekunden: 10,
  hoechstdauerStunden: 72,
  nachsendenSekunden: 60,
  zeitlimitSekunden: 12,
  versucheBeiUnklarerAntwort: 3,
  bestaetigung: 'weiterleitung',
  erfolgsseite: 'ok.html',
  felder: {
    email:       'email',
    anrede:      'global.anrede',
    vorname:     'global.vorname',
    nachname:    'global.nachname',
    einrichtung: 'global.einrichtung',
    bereich:     'global.bereich',
    interessen:  'global.interessen',
    land:        'global.land',
    quelle:      'global.quelle',
    sprache:     'global.sprache'
  },
  felderVertrieb: {
    telefon:  'FEHLT_feldname_telefon',
    position: 'FEHLT_feldname_position'
  },
  vertrieb: {
    aktiv: true,
    telefonUndPosition: true
  },
  visitenkarte: {
    aktiv: true,
    zeitlimitSekunden: 30,
    sprachen: 'deu+eng',
    seitenmodus: 3,
    schaerfeSchwelle: 80,
    aufnahmeMs: 1500
  },
  gespraech: {
    aktiv: true,
    kuerzel: 'DVG26',
    standteam: ['Standteam 1', 'Standteam 2', 'Standteam 3', 'Standteam 4'],
    standteamNameHoechstens: 40,
    empfaenger: 'a.fern@suesse.de',
    ziel: 'datei',
    warnenNachStunden: 72,
    pinMindestens: 6,
    leerlaufSekunden: 300,
    notizHoechstens: 2000,
    textHoechstens: 1000,
    webDatenschutzErgaenzt: false,
    texteGeprueft: true
  },
  festeFelder: {},
  sprachen: {
    de: { formular: 'https://flow.cleverreach.com/fl/4aed4e63-2aa9-4385-81f1-3ae894872176/confirm', text: 'Text DE v2', doi: 'DOI DE v1', freigegeben: true,
          formularVertrieb: 'https://flow.cleverreach.com/fl/57dc6291-59af-4c7f-8655-a42df71b9e53/confirm', textMitVertrieb: 'Text DE v3', doiVertrieb: 'DOI VK DE v1' },
    en: { formular: 'FEHLT – Formular-Adresse EN', text: 'Text EN v2', doi: 'DOI EN v1', freigegeben: false,
          formularVertrieb: 'FEHLT – Formular Vertriebskontakte EN', textMitVertrieb: 'Text EN v3', doiVertrieb: 'DOI VK EN v1' },
    es: { formular: 'FEHLT – Formular-Adresse ES', text: 'Text ES v2', doi: 'DOI ES v1', freigegeben: false },
    fr: { formular: 'FEHLT – Formular-Adresse FR', text: 'Text FR v2', doi: 'DOI FR v1', freigegeben: false },
    it: { formular: 'FEHLT – Formular-Adresse IT', text: 'Text IT v2', doi: 'DOI IT v1', freigegeben: false },
    nl: { formular: 'FEHLT – Formular-Adresse NL', text: 'Text NL v2', doi: 'DOI NL v1', freigegeben: false }
  },
  planB: {
    de: 'FEHLT – Link zur CleverReach-Formularseite DE',
    en: 'FEHLT – Link zur CleverReach-Formularseite EN'
  },
  werte: {
    anrede:  { frau: 'Frau', herr: 'Herr', divers: 'Divers', keine: '' },
    bereich: {
      klinik: 'Krankenhaus / Klinik-Labor', medlabor: 'Medizinisches Labor', pathologie: 'Pathologie',
      tiermedizin: 'Tiermedizin', forschung: 'Forschung / Hochschule', industrie: 'Industrie / Pharma',
      behoerde: 'Behörde / öffentliche Einrichtung', handel: 'Handel / Vertrieb', sonstiges: 'Sonstiges'
    },
    interessen: {
      versand: 'Probenversand', gefaesse: 'Probengefäße und Röhrchen', sekundaer: 'Sekundärgefäße und Transportbehälter',
      patho: 'Pathologie- und Histologiebedarf', labor: 'Laborbedarf allgemein'
    },
    produktgruppen: {
      abstrich: 'Abstrichsysteme / Watteträger', bio: 'BIO Transport', chemie: 'Chemikalien', einbett: 'Einbettkassetten',
      entnahme: 'Entnahmehilfe', etiketten: 'Etiketten', faerbe: 'Färbesysteme', formalin: 'Formalin Gefäße', gefaesse: 'Gefäße',
      gestelle: 'Gestelle / Aufbewahrung', objekttraeger: 'Objektträger', pcr: 'PCR', pipetten: 'Pipettenspitzen und Pipetten',
      roehrchen: 'Röhrchen', sicherheit: 'Sicherheitsbehälter', versand: 'Versand / Verpackung'
    },
    chemieGruppen: ['chemie', 'formalin', 'faerbe'],
    naechster: {
      angebot: 'Angebot', muster: 'Muster', rueckruf: 'Rückruf (ausdrücklich gewünscht)', unterlagen: 'Unterlagen schicken',
      besuch: 'Besuch', nichts: 'nichts weiter'
    },
    bewertung: { heiss: 'heiß', warm: 'warm', kalt: 'kalt' }
  }
};
