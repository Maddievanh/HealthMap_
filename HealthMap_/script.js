/* ------------------------------
    SPA ROUTING
--------------------------------*/

const sections = document.querySelectorAll("section");

function showSection(id) {
  sections.forEach(s => s.classList.add("hidden"));
  const sec = document.getElementById(id);
  if (sec) sec.classList.remove("hidden");

  // load map only when search page opens
  if (id === "search") {
    setTimeout(() => {
      if (!window.map) initMap();
      window.map.invalidateSize();
    }, 200);
  }
}

function router() {
  const page = location.hash.replace("#", "") || "home";
  showSection(page);
}

window.addEventListener("hashchange", router);
router();

/* ------------------------------
    RESOURCE CARD ROUTING
--------------------------------*/

document.querySelectorAll(".resource-card .learn").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const name = link.parentElement.querySelector("h3").innerText;

    const pageMap = {
      "Mental Health": "mental",
      "Physical Health": "physical",
      "Medication Assistance": "medication",
      "Community Support": "community"
    };

    const page = pageMap[name];
    if (page) location.hash = page;
  });
});

/* ------------------------------
    HERO SEARCH → SEARCH PAGE
--------------------------------*/

document.querySelector(".search-btn").addEventListener("click", () => {
  const value = document.querySelector(".search-bar input").value.trim();
  if (!value) return;

  location.hash = "search";
  performSearch(value);
});

/* ------------------------------
      SEARCH — MAP + CLINICS
--------------------------------*/

let map;
let markers = [];

function initMap() {
  map = L.map("map").setView([39.8283, -98.5795], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);
}

async function performSearch(city) {
  document.getElementById("search-results-text").innerText =
    "Searching for clinics in " + city + "...";

  const res = await fetch("/api/clinics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city })
  });

  const data = await res.json();

  if (!data.city) {
    document.getElementById("search-results-text").innerText = "City not found.";
    return;
  }

  map.setView([data.city.lat, data.city.lon], 13);
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  let html = "";
  data.clinics.forEach(c => {
    const marker = L.marker([c.lat, c.lon])
      .addTo(map)
      .bindPopup(c.tags.name || "Clinic");

    markers.push(marker);

    html += `
      <div class="clinic-card">
        <h4>${c.tags.name || "Clinic"}</h4>
        <p>Type: ${c.tags.amenity}</p>
      </div>
    `;
  });

  document.getElementById("clinic-results").innerHTML = html;
}

/* ------------------------------
      FLOATING AI CHAT WIDGET
--------------------------------*/

const chatBox = document.getElementById("chat-widget");
const chatToggle = document.getElementById("chat-toggle");
const chatBody = document.getElementById("chat-body");

chatToggle.addEventListener("click", () => {
  chatBox.style.display = chatBox.style.display === "flex" ? "none" : "flex";
});

document.getElementById("chat-send").addEventListener("click", sendChat);

async function sendChat() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  chatBody.innerHTML += `<p><strong>You:</strong> ${text}</p>`;
  input.value = "";

  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: text })
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, I didn’t understand.";

  chatBody.innerHTML += `<p><strong>AI:</strong> ${reply}</p>`;
  chatBody.scrollTop = chatBody.scrollHeight;
}
