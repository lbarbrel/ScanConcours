// scraper/scraper.js
// =======================================
// Script de scraping Firestore pour ScanConcours
// A exécuter dans un environnement Node (GitHub Actions, Railway, etc.)
// =======================================

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const admin = require("firebase-admin");
const crypto = require("crypto");
const path = require("path");

const docData = {
  titre,
  url_officielle,
  date_fin: dateFinText || null,
  date_ajout: admin.firestore.FieldValue.serverTimestamp(),
  source_nom: SOURCE_NOM,
  source_url: SOURCE_URL,
  type_gain: null,
  type_concours: null,
  no_purchase: titre.toLowerCase().includes("sans obligation d'achat") ? true : null
  // plus tard : analyse du texte de la page de conditions si tu veux être plus précis
};

// Clé de service Firebase (JSON généré depuis la console Firebase)
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Crée un ID stable pour un concours à partir de son URL.
 * Permet de faire des upserts plutôt que des doublons.
 */
function makeConcoursIdFromUrl(url) {
  return crypto.createHash("md5").update(url).digest("hex");
}

/**
 * Scraper d'un site d'exemple.
 * A adapter : URL + sélecteurs CSS.
 */
async function scrapeExempleSite() {
  const SOURCE_NOM = "exemple-site.com";
  const SOURCE_URL = "https://exemple-site.com/concours"; // TODO: adapter à ton site réel

  console.log(`Scraping ${SOURCE_URL}...`);

  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status} lors du fetch de ${SOURCE_URL}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // TODO: adapter le sélecteur .concours-item à la structure réelle du site
  const items = $(".concours-item");
  console.log(`→ ${items.length} concours trouvés sur ${SOURCE_NOM}`);

  const concoursCol = db.collection("concours");
  const tasks = [];

  items.each((_, el) => {
    // TODO: adapter ces sélecteurs aux classes réelles du site
    const titre = $(el).find(".titre").text().trim();
    const href = $(el).find("a").attr("href");
    const dateFinText = $(el).find(".date-fin").text().trim();

    if (!titre || !href) {
      return;
    }

    const url_officielle = href.startsWith("http")
      ? href
      : `https://exemple-site.com${href}`;

    const docId = makeConcoursIdFromUrl(url_officielle);
    const docRef = concoursCol.doc(docId);

    const docData = {
      titre,
      url_officielle,
      date_fin: dateFinText || null,
      date_ajout: admin.firestore.FieldValue.serverTimestamp(),
      source_nom: SOURCE_NOM,
      source_url: SOURCE_URL,
      type_gain: null,      // à enrichir plus tard (produits, cash, etc.)
      type_concours: null,  // à enrichir plus tard (tirage, instant gagnant, etc.)
      no_purchase: null     // à enrichir : détection "sans obligation d'achat"
    };

    console.log(`→ Mise à jour du concours : ${titre}`);

    // set + merge pour mettre à jour si le doc existe déjà
    const p = docRef.set(docData, { merge: true });
    tasks.push(p);
  });

  await Promise.all(tasks);
  console.log("Scraping terminé pour", SOURCE_NOM);
}


/**
 * Point d'entrée du script
 */
async function main() {
  try {
    await scrapeExempleSite();
    console.log("Tous les scrapers ont terminé.");
    process.exit(0);
  } catch (e) {
    console.error("Erreur globale du scraper:", e);
    process.exit(1);
  }
}

main();


// =======================================
// Script de scraping Firestore pour ScanConcours
// A exécuter dans un environnement Node (GitHub Actions, Railway, etc.)
// =======================================

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const admin = require("firebase-admin");
const crypto = require("crypto");
const path = require("path");

// Clé de service Firebase Admin (JSON généré dans la console Firebase)
// Ce fichier est créé automatiquement par GitHub Actions à partir du secret FIREBASE_SERVICE_ACCOUNT
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Crée un ID stable pour un concours à partir de son URL.
 * Permet d'éviter les doublons : on fait un "upsert" par URL.
 */
function makeConcoursIdFromUrl(url) {
  return crypto.createHash("md5").update(url).digest("hex");
}

/**
 * Scraper d'un site d'exemple.
 * A adapter : URL + sélecteurs CSS selon le site réel.
 */
async function scrapeExempleSite() {
  const SOURCE_NOM = "exemple-site.com";
  const SOURCE_URL = "https://exemple-site.com/concours"; // TODO: remplacer par une vraie URL

  console.log(`Scraping ${SOURCE_URL}...`);

  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status} lors du fetch de ${SOURCE_URL}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // TODO: adapter le sélecteur .concours-item à la structure réelle du site
  const items = $(".concours-item");
  console.log(`→ ${items.length} concours trouvés sur ${SOURCE_NOM}`);

  const concoursCol = db.collection("concours");
  const tasks = [];

  items.each((_, el) => {
    // TODO: adapter ces sélecteurs aux classes réelles du site
    const titre = $(el).find(".titre").text().trim();
    const href = $(el).find("a").attr("href");
    const dateFinText = $(el).find(".date-fin").text().trim();

    if (!titre || !href) {
      return;
    }

    // Construire une URL absolue si besoin
    const url_officielle = href.startsWith("http")
      ? href
      : `https://exemple-site.com${href}`;

    // ID stable basé sur l'URL
    const docId = makeConcoursIdFromUrl(url_officielle);
