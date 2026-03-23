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


