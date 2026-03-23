// ===============================    if (user) {
      if (navLogin) navLogin.hidden = true;
      if (navSignup) navSignup.hidden = true;
      if (navLogout) navLogout.hidden = false;
    } else {
      if (navLogin) navLogin.hidden = false;
      if (navSignup) navSignup.hidden = false;
      if (navLogout) navLogout.hidden = true;
    }

    // Protéger les pages Mes favoris / Mes gains
    if ((path.endsWith("favoris.html") || path.endsWith("gains.html")) && !user) {
      window.location.href = "login.html";
      return;
    }

    // Page concours (index)
    if (path.endsWith("index.html") || path === "/" || path === "") {
      initConcoursPage(user);
    }

    // Page favoris
    if (user && path.endsWith("favoris.html")) {
      initFavorisPage(user);
    }

    // Page gains
    if (user && path.endsWith("gains.html")) {
      initGainsPage(user);
    }
  });

  // Bouton déconnexion
  if (navLogout) {
    navLogout.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          window.location.href = "index.html";
        })
        .catch((err) => {
          console.error("Erreur lors de la déconnexion:", err);
          alert("Erreur lors de la déconnexion.");
        });
    });
  }
}


// ===============================
// 5. FORMULAIRES AUTH (LOGIN / SIGNUP)
// ===============================

function initAuthForms() {
  // --- INSCRIPTION ---
  const signupForm = document.getElementById("signupForm");
  const signupMessage = document.getElementById("signupMessage");

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (signupMessage) {
        signupMessage.textContent = "";
        signupMessage.className = "auth-message";
      }

      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;

      createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
          if (signupMessage) {
            signupMessage.textContent = "Compte créé avec succès ✅";
            signupMessage.classList.add("success");
          }
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1000);
        })
        .catch((error) => {
          console.error(error);
          let msg = "Erreur lors de l'inscription.";
          if (error.code === "auth/email-already-in-use") msg = "Cet email est déjà utilisé.";
          if (error.code === "auth/weak-password") msg = "Mot de passe trop faible (minimum 6 caractères).";
          if (signupMessage) {
            signupMessage.textContent = msg;
            signupMessage.classList.add("error");
          }
        });
    });
  }

  // --- CONNEXION ---
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (loginMessage) {
        loginMessage.textContent = "";
        loginMessage.className = "auth-message";
      }

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          if (loginMessage) {
            loginMessage.textContent = "Connexion réussie ✅";
            loginMessage.classList.add("success");
          }
          setTimeout(() => {
            window.location.href = "index.html";
          }, 800);
        })
        .catch((error) => {
          console.error(error);
          let msg = "Erreur de connexion.";
          if (error.code === "auth/user-not-found") msg = "Aucun compte trouvé pour cet email.";
          if (error.code === "auth/wrong-password") msg = "Mot de passe incorrect.";
          if (loginMessage) {
            loginMessage.textContent = msg;
            loginMessage.classList.add("error");
          }
        });
    });
  }
}


// ===============================
// 6. FIRESTORE – FAVORIS & GAINS
// ===============================

// --- FAVORIS ---
async function addFavoriteForUser(userUid, concoursId) {
  await addDoc(collection(db, "favorites"), {
    userId: userUid,
    concoursId,
    addedAt: serverTimestamp()
  });
}

async function removeFavoriteForUser(userUid, concoursId) {
  const q = query(
    collection(db, "favorites"),
    where("userId", "==", userUid),
    where("concoursId", "==", concoursId)
  );
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    await deleteDoc(doc(db, "favorites", docSnap.id));
  }
}

async function loadFavoritesForUser(userUid) {
  const q = query(collection(db, "favorites"), where("userId", "==", userUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- GAINS ---
async function addGainForUser(userUid, concoursId, status) {
  await addDoc(collection(db, "gains"), {
    userId: userUid,
    concoursId,
    status, // 'won', 'pending', 'lost'
    detectedAt: serverTimestamp()
  });
}

async function loadGainsForUser(userUid) {
  const q = query(collection(db, "gains"), where("userId", "==", userUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


// ===============================
// 7. PAGE CONCOURS (index.html)
// ===============================

async function initConcoursPage(user) {
  const listEl = document.getElementById("concoursList");
  if (!listEl) return;

  listEl.innerHTML = "Chargement des concours...";

  try {
    const concoursData = await loadConcoursFromFirestore();
    window.concoursData = concoursData; // Pour réutiliser ensuite dans favoris/gains

    if (concoursData.length === 0) {
      listEl.innerHTML = "<p>Aucun concours pour le moment.</p>";
      return;
    }

    listEl.innerHTML = "";

    concoursData.forEach(c => {
      const card = document.createElement("div");
      card.className = "concours-card";

      card.innerHTML = `
        <h3>${c.titre}</h3>
        <p><strong>Gain :</strong> ${c.type_gain || "—"}</p>
        <p><strong>Fin :</strong> ${c.date_fin || "Non précisé"}</p>
        <p><strong>Source :</strong> ${c.source_nom || "—"}</p>
        <div class="actions">
          ${c.url_officielle || "#"}Voir le concours</a>
          <button class="btn-fav" data-id="${c.id}">☆</button>
        </div>
      `;

      listEl.appendChild(card);
    });

    bindFavoriteButtons(user);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = "<p>Erreur lors du chargement des concours.</p>";
  }
}

function bindFavoriteButtons(user) {
  const buttons = document.querySelectorAll(".btn-fav");
  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const concoursId = btn.getAttribute("data-id");

      if (!user) {
        alert("Vous devez être connecté pour ajouter des favoris.");
        window.location.href = "login.html";
        return;
      }

      const isActive = btn.classList.contains("active");

      try {
        if (isActive) {
          await removeFavoriteForUser(user.uid, concoursId);
        } else {
          await addFavoriteForUser(user.uid, concoursId);
        }

        btn.classList.toggle("active");
        btn.textContent = btn.classList.contains("active") ? "★" : "☆";
      } catch (e) {
        console.error(e);
        alert("Erreur lors de la mise à jour du favori.");
      }
    });
  });
}


// ===============================
// 8. PAGE FAVORIS (favoris.html)
// ===============================

async function initFavorisPage(user) {
  const favorisListEl = document.getElementById("favorisList");
  if (!favorisListEl) return;

  favorisListEl.innerHTML = "Chargement de vos favoris...";

  try {
    // S'assurer que les concours sont en mémoire
    if (!window.concoursData) {
      window.concoursData = await loadConcoursFromFirestore();
    }

    const favorites = await loadFavoritesForUser(user.uid);

    if (favorites.length === 0) {
      favorisListEl.innerHTML = "<p>Vous n’avez pas encore de concours en favoris.</p>";
      return;
    }

    favorisListEl.innerHTML = "";

    favorites.forEach(fav => {
      const concours = (window.concoursData || []).find(c => c.id === fav.concoursId);
      const title = concours ? concours.titre : fav.concoursId;
      const type_gain = concours ? concours.type_gain : "—";
      const date_fin = concours ? concours.date_fin : "Non précisé";
      const url = concours ? concours.url_officielle : "#";

      const card = document.createElement("div");
      card.className = "concours-card";
      card.innerHTML = `
        <h3>${title}</h3>
        <p><strong>Gain :</strong> ${type_gain}</p>
        <p><strong>Fin :</strong> ${date_fin}</p>
        ${url}Voir le concours</a>
      `;
      favorisListEl.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    favorisListEl.innerHTML = "<p>Erreur lors du chargement de vos favoris.</p>";
  }
}


// ===============================
// 9. PAGE GAINS (gains.html)
// ===============================

async function initGainsPage(user) {
  const gainsListEl = document.getElementById("gainsList");
  if (!gainsListEl) return;

  let currentStatus = "all";

  async function render(statusFilter = "all") {
    gainsListEl.innerHTML = "Chargement de vos gains...";

    try {
      // S'assurer que les concours sont en mémoire
      if (!window.concoursData) {
        window.concoursData = await loadConcoursFromFirestore();
      }

      const gains = await loadGainsForUser(user.uid);

      const filtered = gains.filter(g =>
        statusFilter === "all" ? true : g.status === statusFilter
      );

      if (filtered.length === 0) {
        gainsListEl.innerHTML = "<p>Aucun résultat pour ce statut.</p>";
        return;
      }

      gainsListEl.innerHTML = "";
      filtered.forEach(g => {
        const concours = (window.concoursData || []).find(c => c.id === g.concoursId);
        const title = concours ? concours.titre : g.concoursId;
        const label =
          g.status === "won" ? "🎉 Gagné" :
          g.status === "pending" ? "⏳ En attente" :
          "❌ Perdu";

        const card = document.createElement("div");
        card.className = "gain-card";
        card.innerHTML = `
          <div>
            <strong>${title}</strong><br>
            <span>${label}</span>
          </div>
        `;
        gainsListEl.appendChild(card);
      });
    } catch (e) {
      console.error(e);
      gainsListEl.innerHTML = "<p>Erreur lors du chargement de vos gains.</p>";
    }
  }

  // Gestion des boutons de filtre
  const filterButtons = document.querySelectorAll(".gains-filters .btn-chip");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentStatus = btn.getAttribute("data-status");
      render(currentStatus);
    });
  });

  // Premier affichage
  render(currentStatus);
}


// ===============================
// 10. INIT GLOBALE
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initAuthForms();
});
``
// 1. IMPORTS FIREBASE VIA CDN
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// ===============================
// 2. CONFIGURATION FIREBASE
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyAMcYRznOujjYqJLSw3RMW7D9a_it4mK7c",
  authDomain: "scanconcours.firebaseapp.com",
  projectId: "scanconcours",
  storageBucket: "scanconcours.firebasestorage.app",
  messagingSenderId: "956215608130",
  appId: "1:956215608130:web:752f5e3b988c02a2ce7edb",
  measurementId: "G-MFCR89YPZX"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase initialisé ✔");


// ===============================
// 3. LECTURE DES CONCOURS (FIRESTORE)
// ===============================

async function loadConcoursFromFirestore() {
  const snap = await getDocs(collection(db, "concours"));
  const data = snap.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
  return data;
}


// ===============================
// 4. HEADER & NAVIGATION
// ===============================

function initHeader() {
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const navLogout = document.getElementById("nav-logout");
  const navLogin = document.getElementById("nav-login");
  const navSignup = document.getElementById("nav-signup");

  // Menu burger
  if (nav && navToggle) {
    navToggle.addEventListener("click", () => {
      const open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
    });
  }

  onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;

    // Gestion des liens de nav selon l'état connecté
