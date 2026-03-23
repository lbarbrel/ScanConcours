// script.js (version module ES)

// 1) Import des fonctions Firebase (CDN modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 2) Ta configuration Firebase (copie-colle celle de la console)
const firebaseConfig = {
  apiKey: "API_KEY_ICI",
  authDomain: "scanconcours.firebaseapp.com",
  projectId: "scanconcours",
  storageBucket: "scanconcours.appspot.com",
  messagingSenderId: "XXXXXXXXXX",
  appId: "1:XXXXXXXXXX:web:XXXXXXXXXX"
};

// 3) Initialisation Firebase et Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 4) Gestion de l’état de connexion pour le header
const navLogin = document.getElementById('nav-login');
const navSignup = document.getElementById('nav-signup');
const navLogout = document.getElementById('nav-logout');

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Utilisateur connecté
    if (navLogin) navLogin.hidden = true;
    if (navSignup) navSignup.hidden = true;
    if (navLogout) navLogout.hidden = false;
  } else {
    // Utilisateur déconnecté
    if (navLogin) navLogin.hidden = false;
    if (navSignup) navSignup.hidden = false;
    if (navLogout) navLogout.hidden = true;
  }
});

if (navLogout) {
  navLogout.addEventListener('click', () => {
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  });
}

// 5) Gestion du formulaire d’inscription (signup.html)
const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    signupMessage.textContent = "";
    signupMessage.className = "auth-message";

    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        signupMessage.textContent = "Compte créé avec succès ✅";
        signupMessage.classList.add("success");
        // Redirection (optionnelle) vers la page d’accueil ou mes favoris
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      })
      .catch((error) => {
        let msg = "Erreur lors de l'inscription.";
        if (error.code === "auth/email-already-in-use") msg = "Cet email est déjà utilisé.";
        if (error.code === "auth/weak-password") msg = "Mot de passe trop faible (min 6 caractères).";
        signupMessage.textContent = msg;
        signupMessage.classList.add("error");
      });
  });
}

// 6) Gestion du formulaire de connexion (login.html)
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loginMessage.textContent = "";
    loginMessage.className = "auth-message";

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        loginMessage.textContent = "Connexion réussie ✅";
        loginMessage.classList.add("success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 800);
      })
      .catch((error) => {
        let msg = "Erreur de connexion.";
        if (error.code === "auth/user-not-found") msg = "Aucun compte trouvé avec cet email.";
        if (error.code === "auth/wrong-password") msg = "Mot de passe incorrect.";
        loginMessage.textContent = msg;
        loginMessage.classList.add("error");
      });
  });
}

// 7) (Optionnel) utiliser l’utilisateur sur les autres pages
// Exemple : protéger accès à favoris/gains
if (window.location.pathname.endsWith("favoris.html") ||
    window.location.pathname.endsWith("gains.html")) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Si pas connecté → redirection vers la page de login
      window.location.href = "login.html";
    }
  });
}

// 8) Tu peux garder ici ton ancien code pour la liste des concours, favoris, gains, etc.
// Il continuera de marcher, et tu pourras plus tard lier les données à l’utilisateur Firebase (user.uid).
``


// --- AUTH STATE ---
// Dans une vraie app, ce token viendra d'un backend (JWT stocké en cookie ou localStorage)
let authToken = localStorage.getItem("scanconcours_token");
let currentUser = authToken ? { email: localStorage.getItem("scanconcours_email") } : null;





function updateUserStatusUI() {
  const el = document.getElementById("userStatus");
  if (!el) return;

  if (currentUser && currentUser.email) {
    el.textContent = `Connecté : ${currentUser.email}`;
  } else {
    el.textContent = "Non connecté";
  }
}

// Appel au chargement
updateUserStatusUI();





// ---  API  ---
function apiSignup(email, password) {
  return fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Erreur lors de l'inscription.");
    }
    return res.json(); // { token, user: { email, id, ... } }
  });
}

function apiLogin(email, password) {
  return fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Erreur lors de la connexion.");
    }
    return res.json();
  });
}



// Fake data – remplacée ensuite par votre backend
const concoursData = [
  {
    id: "c1",
    titre: "Gagnez un voyage à New York",
    typeGain: "voyage",
    dateFin: "2026-04-20",
    source: "ExempleSite",
    url: "https://exemple.com"
  },
  {
    id: "c2",
    titre: "100 coffrets beauté gratuits",
    typeGain: "produits",
    dateFin: "2026-03-30",
    source: "BeautyClub",
    url: "https://beautyclub.com"
  }
];

let favoris = JSON.parse(localStorage.getItem("favoris") || "{}");

function saveFavs() {
  localStorage.setItem("favoris", JSON.stringify(favoris));
}

function renderConcours() {
  const list = document.getElementById("concoursList");
  list.innerHTML = "";

  concoursData.forEach(c => {
    const card = document.createElement("div");
    card.className = "concours-card";

    card.innerHTML = `
      <h3>${c.titre}</h3>
      <p><strong>Gain :</strong> ${c.typeGain}</p>
      <p><strong>Fin :</strong> ${c.dateFin}</p>
      <p><strong>Source :</strong> ${c.source}</p>

      <div class="actions">
        <a href="${c.url}" target="_blank">Voir le concours</a>
        <button class="btn-fav ${favoris[c.id] ? 'active' : ''}" data-id="${c.id}">
          ${favoris[c.id] ? '★' : '☆'}
        </button>
      </div>
    `;

    list.appendChild(card);
  });

  document.querySelectorAll(".btn-fav").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      if (favoris[id]) delete favoris[id];
      else favoris[id] = { addedAt: new Date().toISOString() };

      saveFavs();
      renderConcours();
    });
  });
}

renderConcours();






// --- Formulaire d'inscription ---
const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    signupMessage.textContent = "";
    signupMessage.className = "auth-message";

    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!email || !password) {
      signupMessage.textContent = "Veuillez remplir tous les champs.";
      signupMessage.classList.add("error");
      return;
    }

    fakeApiSignup(email, password)
      .then(({ token, email }) => {
        authToken = token;
        currentUser = { email };
        localStorage.setItem("scanconcours_token", token);
        localStorage.setItem("scanconcours_email", email);

        signupMessage.textContent = "Compte créé avec succès. Vous êtes connecté.";
        signupMessage.classList.add("success");
        updateUserStatusUI();
      })
      .catch((err) => {
        signupMessage.textContent = err.message;
        signupMessage.classList.add("error");
      });
  });
}

// --- Formulaire de connexion ---
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loginMessage.textContent = "";
    loginMessage.className = "auth-message";

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      loginMessage.textContent = "Veuillez remplir tous les champs.";
      loginMessage.classList.add("error");
      return;
    }

    fakeApiLogin(email, password)
      .then(({ token, email }) => {
        authToken = token;
        currentUser = { email };
        localStorage.setItem("scanconcours_token", token);
        localStorage.setItem("scanconcours_email", email);

        loginMessage.textContent = "Connexion réussie.";
        loginMessage.classList.add("success");
        updateUserStatusUI();
      })
      .catch((err) => {
        loginMessage.textContent = err.message;
        loginMessage.classList.add("error");
      });
  });
}










const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authToken = null;
    currentUser = null;
    localStorage.removeItem("scanconcours_token");
    localStorage.removeItem("scanconcours_email");
    updateUserStatusUI();
  });
}



// --- HEADER : menu mobile ---
const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');

if (nav && navToggle) {
  navToggle.addEventListener('click', () => {
    const open = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', String(!open));
  });
}

// --- HEADER : affichage connecté / déconnecté ---
const navLogin = document.getElementById('nav-login');
const navSignup = document.getElementById('nav-signup');
const navLogout = document.getElementById('nav-logout');

const token = localStorage.getItem('scanconcours_token');
const email = localStorage.getItem('scanconcours_email');

if (token && email) {
  if (navLogin) navLogin.hidden = true;
  if (navSignup) navSignup.hidden = true;
  if (navLogout) navLogout.hidden = false;

  navLogout.addEventListener('click', () => {
    localStorage.removeItem('scanconcours_token');
    localStorage.removeItem('scanconcours_email');
    // plus tard : appeler /api/auth/logout si tu en fais un
    window.location.href = 'index.html';
  });
}



function renderFavorisPage() {
  const favorisListEl = document.getElementById('favorisList');
  if (!favorisListEl) return;

  // récupère tes favoris depuis localStorage ou backend plus tard
  const favoris = JSON.parse(localStorage.getItem('favoris') || '{}');
  const ids = Object.keys(favoris);

  if (ids.length === 0) {
    favorisListEl.innerHTML = '<p>Vous n’avez pas encore de concours en favoris.</p>';
    return;
  }

  favorisListEl.innerHTML = '';

  // si tu as une liste globale concoursData :
  ids.forEach(id => {
    const concours = (window.concoursData || []).find(c => c.id === id);
    if (!concours) return;

    const card = document.createElement('div');
    card.className = 'concours-card';
    card.innerHTML = `
      <h3>${concours.titre}</h3>
      <p><strong>Gain :</strong> ${concours.typeGain}</p>
      <p><strong>Fin :</strong> ${concours.dateFin}</p>
      ${concours.url}Voir le concours</a>
    `;
    favorisListEl.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderFavorisPage();
});

const demoGains = [
  { id: 1, concoursTitre: 'Voyage à New York', status: 'won' },
  { id: 2, concoursTitre: 'Coffret beauté', status: 'pending' },
  { id: 3, concoursTitre: 'Bons d’achats 50€', status: 'lost' }
];

function renderGains(filterStatus = 'all') {
  const gainsListEl = document.getElementById('gainsList');
  if (!gainsListEl) return;

  const gains = demoGains.filter(g =>
    filterStatus === 'all' ? true : g.status === filterStatus
  );

  if (gains.length === 0) {
    gainsListEl.innerHTML = '<p>Aucun gain pour ce statut.</p>';
    return;
  }

  gainsListEl.innerHTML = '';

  gains.forEach(g => {
    const card = document.createElement('div');
    card.className = 'gain-card';
    card.innerHTML = `
      <div>
        <strong>${g.concoursTitre}</strong><br>
        <span>${g.status === 'won' ? '🎉 Gagné' : g.status === 'pending' ? '⏳ En attente' : '❌ Perdu'}</span>
      </div>
    `;
    gainsListEl.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const gainsListEl = document.getElementById('gainsList');
  if (!gainsListEl) return; // on n’est pas sur la page gains

  renderGains();

  document.querySelectorAll('.gains-filters .btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gains-filters .btn-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const status = btn.getAttribute('data-status');
      renderGains(status);
    });
  });
});
