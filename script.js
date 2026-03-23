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
