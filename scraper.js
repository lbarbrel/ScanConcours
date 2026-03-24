// scraper/scraper.js
    const title = selectors.title
      ? $(el).find(selectors.title).text().trim()
      : $(el).text().trim();

    // URL
    const href = selectors.url
      ? $(el).find(selectors.url).attr("href")
      : $(el).attr("href");

    // Date de fin
    const dateFinText = selectors.dateFin
      ? $(el).find(selectors.dateFin).text().trim()
      : null;

    // Description
    const desc = selectors.description
      ? $(el).find(selectors.description).text().trim()
      : "";

    if (!title || !href) {
      return;
    }

    // URL absolue
    const url_officielle = href.startsWith("http")
      ? href
      : baseUrl.replace(/\/$/, "") + href;

    // Détection "sans obligation d'achat"
    const textToScan = `${title} ${desc}`;
    const no_purchase = detectNoPurchase(textToScan, noPurchaseKeywords);

    // ID stable
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
      no_purchase // true ou null
    };

    console.log(`→ [${name}] concours : ${title} | no_purchase=${no_purchase}`);

    const p = docRef.set(docData, { merge: true });
    tasks.push(p);
  });

  await Promise.all(tasks);
  console.log(`✓ Source ${name} traitée`);
}

// -----------------------------
// 5. Main
// -----------------------------

async function main() {
  try {
    console.log("Démarrage du scraping Le Démon du Jeu (ScanConcours)...");
    await scrapeLeDemonDuJeu();
    console.log("\nScraping terminé.");
    process.exit(0);
  } catch (e) {
    console.error("Erreur globale du scraper:", e);
    process.exit(1);
  }
}

main();
``
// =======================================
// Scraper pour Le Démon du Jeu (ledemondujeu.com)
// - Utilise firebase-admin (Firestore)
// - Utilise cheerio pour parser le HTML
// - Alimente la collection "concours"
// - Détecte "sans obligation d'achat" via mots-clés
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
// 2. Configuration de la source : Le Démon du Jeu
// -----------------------------
// Référence : portail de jeux concours gratuits ledemondujeu.com [1](https://firebase.google.com/support/guides/service-accounts)[2](https://openai.com/index/chatgpt/)
//
// ⚠ IMPORTANT : les sélecteurs CSS ci-dessous sont des EXEMPLES.
//    Tu dois les adapter en inspectant le HTML réel de la page
//    https://www.ledemondujeu.com/nouveaux-jeux-concours.html

const SOURCE = {
  id: "aggregateur_ledemondujeu",
  name: "Le Démon du Jeu",
  baseUrl: "https://www.ledemondujeu.com",
  listUrl: "https://www.ledemondujeu.com/nouveaux-jeux-concours.html",
  selectors: {
    // Sélecteur d'un bloc concours
    // Exemple : chaque concours est peut-être dans un <div class="bloc-jeu"> ou similaire
    item: ".bloc-jeu",                // TODO: adapter après inspection

    // Titre du concours
    title: ".titre-jeu",              // TODO: adapter

    // Lien cliquable vers le concours (souvent sur <a>)
    url: "a",                         // souvent correct, à vérifier

    // Date de fin (si visible)
    dateFin: ".date-fin",             // TODO: adapter ou mettre null si non dispo

    // Description courte du concours (optionnel)
    description: ".texte-jeu"         // TODO: adapter ou mettre null si non dispo
  },
  // Mots-clés pour détecter "sans obligation d'achat"
  noPurchaseKeywords: [
    "sans obligation d'achat",
    "sans obligation d achat",
    "sans achat",
    "no purchase necessary",
    "no purchase is necessary",
    "no purchase required"
  ]
};

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
// 4. Scraper spécifique pour Le Démon du Jeu
// -----------------------------

async function scrapeLeDemonDuJeu() {
  const { name, baseUrl, listUrl, selectors, noPurchaseKeywords } = SOURCE;

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
