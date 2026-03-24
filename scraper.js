// scraper/scraper.js
// =======================================
// Scraper multi-sources pour ScanConcours
// - Utilise firebase-admin (Firestore)
// - Utilise cheerio pour parser le HTML
// - Alimente la collection "concours"
// - Détecte "sans obligation d'achat" via mots-clés
// - Sources réelles : LeDemonDuJeu, Jeu-Concours.biz, AutoKdo, Drimify
// =======================================

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const admin = require("firebase-admin");
const crypto = require("crypto");
const path = require("path");

// -----------------------------
// 1. Initialisation Firebase Admin
// -----------------------------

// Clé de service Firebase (créée par GitHub Actions dans ce fichier
// à partir du secret FIREBASE_SERVICE_ACCOUNT)
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// -----------------------------
// 2. Configuration des sources réelles
// -----------------------------
// ⚠️ Les sélecteurs CSS sont des EXEMPLES à adapter
//    Tu devras inspecter le HTML de chaque site (F12) pour ajuster
//    item / title / url / dateFin / description

const SOURCES = [
  {
    id: "aggregateur_ledemondujeu",
    name: "Le Démon du Jeu",
    baseUrl: "https://www.ledemondujeu.com",
    // Page listant les nouveaux concours [1](https://www.ledemondujeu.com/)[2](https://www.ledemondujeu.com/nouveaux-jeux-concours.html)
    listUrl: "https://www.ledemondujeu.com/nouveaux-jeux-concours.html",
    selectors: {
      item: ".bloc-jeu",          // TODO: à adapter après inspection du site
      title: ".titre-jeu",        // TODO
      url: "a",                   // TODO (souvent <a> global)
      dateFin: ".date-fin",       // TODO
      description: ".texte-jeu"   // TODO (si dispo)
    },
    noPurchaseKeywords: [
      "sans obligation d'achat",
      "sans obligation d achat",
      "sans achat",
      "no purchase necessary",
      "no purchase is necessary",
      "no purchase required"
    ]
  },
  {
    id: "aggregateur_jeuconcoursbiz",
    name: "Jeu-Concours.biz",
    baseUrl: "https://www.jeu-concours.biz",
    // Page listant tous les concours en cours [3](https://www.jeu-concours.biz/)[4](https://www.jeu-concours.biz/tous-les-concours.php)
    listUrl: "https://www.jeu-concours.biz/tous-les-concours.php",
    selectors: {
      item: ".concours",          // TODO: à adapter
      title: ".titreconcours",    // TODO
      url: "a",                   // TODO
      dateFin: ".date",           // TODO
      description: ".texte"       // TODO
    },
    noPurchaseKeywords: [
      "sans obligation d'achat",
      "sans obligation d achat",
      "sans achat",
      "no purchase necessary"
    ]
  },
  {
    id: "aggregateur_autokdo",
    name: "AutoKdo",
    baseUrl: "https://www.autokdo.com",
    // AutoKdo référence chaque jour des centaines de concours [5](https://www.autokdo.com/)[7](https://fr.trustpilot.com/review/autokdo.com)
    // Il faudra identifier la page où la liste des concours apparaît (par ex. /jeux-concours ou /concours)
    listUrl: "https://www.autokdo.com/",
    selectors: {
      item: ".concours-item",        // TODO: à adapter
      title: ".concours-title",      // TODO
      url: "a",                      // TODO
      dateFin: ".concours-date-fin", // TODO
      description: ".concours-desc"  // TODO
    },
    noPurchaseKeywords: [
      "sans obligation d'achat",
      "sans obligation d achat",
      "sans achat",
      "no purchase necessary"
    ]
  },
  {
    id: "plateforme_drimify",
    name: "Drimify (plateforme jeux concours)",
    baseUrl: "https://drimify.com",
    // Drimify est plutôt une solution de création de jeux concours, pas un annuaire [6](https://drimify.com/fr/solutions/jeux-concours/)[8](https://drimify.com/fr/)
    // On peut éventuellement y chercher des exemples ou des démos publiques (si pertinent).
    listUrl: "https://drimify.com/fr/solutions/jeux-concours/",
    selectors: {
      item: ".drimify-card",           // TODO: à adapter
      title: ".drimify-card-title",    // TODO
      url: "a",                        // TODO
      dateFin: null,                   // probablement pas disponible ici
      description: ".drimify-card-text"// TODO
    },
    noPurchaseKeywords: [
      "sans obligation d'achat",
      "sans obligation d achat",
      "no purchase necessary"
    ]
  }
];

// -----------------------------
// 3. Utilitaires
// -----------------------------

/**
 * Crée un ID stable à partir d'une URL de concours.
 * Utilisé comme ID de document Firestore pour éviter les doublons.
 */
function makeConcoursIdFromUrl(url) {
  return crypto.createHash("md5").update(url).digest("hex");
}

/**
 * Détermine si un concours est "sans obligation d'achat"
 * en cherchant des mots-clés dans le titre / description.
 */
function detectNoPurchase(text, keywords) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      return true;
    }
  }
  return false;
}

// -----------------------------
// 4. Scraper générique pour une source
// -----------------------------

async function scrapeSource(sourceConfig) {
  const {
    name,
    baseUrl,
    listUrl,
    selectors,
    noPurchaseKeywords
  } = sourceConfig;

  console.log(`\n=== Scraping source: ${name} (${listUrl}) ===`);

  const res = await fetch(listUrl);
  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status} lors du fetch de ${listUrl}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const items = $(selectors.item);
  console.log(`→ ${items.length} éléments détectés pour la source ${name}`);

  const concoursCol = db.collection("concours");
  const tasks = [];

  items.each((_, el) => {
    const title = selectors.title
      ? $(el).find(selectors.title).text().trim()
      : $(el).text().trim();

    const href = selectors.url
      ? $(el).find(selectors.url).attr("href")
      : $(el).attr("href");

    const dateFinText = selectors.dateFin
      ? $(el).find(selectors.dateFin).text().trim()
      : null;

    const desc = selectors.description
      ? $(el).find(selectors.description).text().trim()
      : "";

    if (!title || !href) {
      return;
    }

    // Construire une URL absolue si nécessaire
    const url_officielle = href.startsWith("http")
      ? href
      : baseUrl.replace(/\/$/, "") + href;

    // Détection "sans obligation d'achat"
    const textToScan = `${title} ${desc}`;
    const no_purchase = detectNoPurchase(textToScan, noPurchaseKeywords);

    const docId = makeConcoursIdFromUrl(url_officielle);
    const docRef = concoursCol.doc(docId);

    const docData = {
      titre: title,
      url_officielle,
      date_fin: dateFinText || null,
      date_ajout: admin.firestore.FieldValue.serverTimestamp(),
      source_nom: name,
      source_url: listUrl,
      type_gain: null,
      type_concours: null,
      description: desc || null,
      no_purchase // true / null
    };

    console.log(`→ [${name}] concours : ${title} | no_purchase=${no_purchase}`);

    const p = docRef.set(docData, { merge: true });
    tasks.push(p);
  });

  await Promise.all(tasks);
  console.log(`✓ Source ${name} traitée`);
}

// -----------------------------
// 5. Main : agrégateur multi-sources
// -----------------------------

async function main() {
  try {
    console.log("Démarrage du scraping multi-sources ScanConcours...");

    for (const source of SOURCES) {
      try {
        await scrapeSource(source);
      } catch (e) {
        console.error(`Erreur lors du scraping de ${source.name}:`, e.message);
      }
    }

    console.log("\nTous les scrapers ont terminé.");
    process.exit(0);
  } catch (e) {
    console.error("Erreur globale du scraper:", e);
    process.exit(1);
  }
}

main();
``
