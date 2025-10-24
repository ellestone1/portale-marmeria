// ==============================================
// CONFIGURAZIONE BASE
// ==============================================
const API_KEY = "AIzaSyBg_v7mveOrwTc0plNByUZ-BXjJOWv5AIg"; // <-- Inserisci qui la tua Google Drive API key
let currentFileIndex = 0;
let currentRotation = 0;
let filesData = [];

// ==============================================
// AVVIO DEL PORTALE
// ==============================================
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const codiceDv = params.get("codiceDv") || "DV-0000";
  const folderId = params.get("folderId");

  document.getElementById("codice-dv").textContent = codiceDv;

  if (folderId) {
    fetchFilesFromFolder(folderId);
  } else {
    console.warn("⚠️ Nessun folderId trovato nell'URL.");
  }

  // Logo che scompare con lo scroll
  const header = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) header.classList.add("hidden");
    else header.classList.remove("hidden");
  });
});

// ==============================================
// FUNZIONE: Recupera i file da Google Drive
// ==============================================
async function fetchFilesFromFolder(folderId) {
  try {
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,thumbnailLink)&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.files || data.files.length === 0) {
      console.warn("📂 Nessun file trovato nella cartella.");
      return;
    }

    // Salva i file in memoria
    filesData = data.files;

    // Popola il portale
    setupLightbox(filesData);
  } catch (error) {
    console.error("Errore nel recupero file:", error);
  }
}

// ==============================================
// FUNZIONE: Costruisce le card PDF e immagini
// ==============================================
function setupLightbox(files) {
  const pdfContainer = document.getElementById("pdf-container");
  const imgContainer = document.getElementById("img-container");

  pdfContainer.innerHTML = "";
  imgContainer.innerHTML = "";

  files.forEach((file, index) => {
    if (file.mimeType.includes("pdf")) {
      const div = document.createElement("div");
      div.className = "pdf-card";
      div.innerHTML = `
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" alt="PDF">
        <p>${file.name}</p>
      `;
      div.onclick = () => showLightbox(index);
      pdfContainer.appendChild(div);
    } else if (file.mimeType.startsWith("image/")) {
      const div = document.createElement("div");
      div.className = "img-card";
      div.innerHTML = `<img src="https://drive.google.com/uc?id=${file.id}" alt="${file.name}">`;
      div.onclick = () => showLightbox(index);
      imgContainer.appendChild(div);
    }
  });
}

// ==============================================
// FUNZIONE: Mostra il lightbox (PDF o immagine)
// ==============================================
function showLightbox(index) {
  const file = filesData[index];
  currentFileIndex = index;
  currentRotation = 0;

  const lightbox = document.getElementById("lightbox");
  const iframe = document.getElementById("lightbox-iframe");
  const img = document.getElementById("lightbox-img");

  iframe.style.display = "none";
  img.style.display = "none";

  if (file.mimeType.includes("pdf")) {
    iframe.src = `https://drive.google.com/file/d/${file.id}/preview`;
    iframe.style.display = "block";
  } else if (file.mimeType.startsWith("image/")) {
    img.src = `https://drive.google.com/uc?id=${file.id}`;
    img.style.display = "block";
  }

  lightbox.classList.add("visible");
}

// ==============================================
// LIGHTBOX: Controlli
// ==============================================
document.getElementById("close-lightbox").onclick = () => {
  document.getElementById("lightbox").classList.remove("visible");
};

document.getElementById("next-btn").onclick = () => navigateLightbox(1);
document.getElementById("prev-btn").onclick = () => navigateLightbox(-1);

function navigateLightbox(direction) {
  currentFileIndex = (currentFileIndex + direction + filesData.length) % filesData.length;
  showLightbox(currentFileIndex);
}

document.getElementById("rotate-btn").onclick = () => {
  currentRotation += 90;
  document.getElementById("lightbox-img").style.transform = `rotate(${currentRotation}deg)`;
};

// ==============================================
// GESTIONE ROTAZIONE SCHERMO
// ==============================================
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    const lightbox = document.getElementById("lightbox");
    const iframe = document.getElementById("lightbox-iframe");
    if (lightbox.classList.contains("visible")) {
      iframe.style.height = window.innerHeight * 0.9 + "px";
      iframe.style.width = window.innerWidth * 0.95 + "px";
      iframe.style.transform = `rotate(${currentRotation}deg)`;
    }
  }, 400);
});
