window.KONFIG = {
  version: '0.3.8',
  testmodus: true,
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
    anrede:      'FEHLT_feldname_anrede',
    vorname:     'FEHLT_feldname_vorname',
    nachname:    'FEHLT_feldname_nachname',
    einrichtung: 'FEHLT_feldname_einrichtung',
    bereich:     'FEHLT_feldname_bereich',
    interessen:  'FEHLT_feldname_interessen',
    land:        'FEHLT_feldname_land',
    quelle:      'FEHLT_feldname_quelle',
    sprache:     'FEHLT_feldname_sprache'
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
    seitenmodus: 3
  },
  festeFelder: {},
  sprachen: {
    de: { formular: 'FEHLT – Formular-Adresse DE', text: 'Text DE v2', doi: 'DOI DE v1', freigegeben: true,
          formularVertrieb: 'FEHLT – Formular Vertriebskontakte DE', textMitVertrieb: 'Text DE v3', doiVertrieb: 'DOI VK DE v1' },
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
    }
  }
};
