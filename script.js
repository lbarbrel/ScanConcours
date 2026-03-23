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





// --- FAKE API (pour tests sans backend) ---

function fakeApiSignup(email, password) {
  return new Promise((resolve, reject) => {
    // Simu : on stocke un user dans localStorage (PEUT ÊTRE PROVISOIRE)
    const usersRaw = localStorage.getItem("scanconcours_users") || "{}";
    const users = JSON.parse(usersRaw);

    if (users[email]) {
      return reject(new Error("Cet email est déjà utilisé."));
    }

    // /!\\ Dans la vraie vie : mot de passe HASHÉ côté backend
    users[email] = {
      email,
      password // uniquement pour la démo front, à NE PAS faire en prod
    };

    localStorage.setItem("scanconcours_users", JSON.stringify(users));

    // génère un faux token
    const fakeToken = "fake-token-" + Date.now();
    resolve({ token: fakeToken, email });
  });
}

function fakeApiLogin(email, password) {
  return new Promise((resolve, reject) => {
    const usersRaw = localStorage.getItem("scanconcours_users") || "{}";
    const users = JSON.parse(usersRaw);

    if (!users[email]) {
      return reject(new Error("Compte introuvable."));
    }

    if (users[email].password !== password) {
      return reject(new Error("Mot de passe incorrect."));
    }

    const fakeToken = "fake-token-" + Date.now();
    resolve({ token: fakeToken, email });
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
