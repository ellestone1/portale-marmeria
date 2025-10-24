// ======== Portale La Marmeria Battaglia ========
// Versione aggiornata - ottobre 2025
// Supporta PDF e immagini da Google Drive (public folder)
// =========================================================

const API_KEY = "INSERISCI_LA_TUA_API_KEY"; // <- metti qui la tua chiave Google Drive API se vuoi usare folderId

let filesData = [];
let currentFileIndex = 0;
let currentRotation = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const codiceDv = params.get("codiceDv") || "DV-0000";
  const folderParam = params.get("folderId");

  document.getElementById("codice-dv").textContent = codiceDv;

  // Mostra/Nascondi header in base allo scroll
  const header = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) header.classList.add("hidden");
    else header.classList.remove("hidden");
  });

  if (!folderParam) {
    document.getElementById("pdf-container").innerHTML = "<p>Nessuna cartella trovata.</p>";
    return;
  }

  // Estrai solo l'ID della cartella (in caso arrivi come URL)
  const folderId = extractFolderId(folderParam);
  console.log("[PORTALE] Folder ID:", folderId);

  if (!API_KEY || API_KEY === "INSERISCI_LA_TUA_API_KEY") {
    console.warn("[PORTALE] Nessuna API Key inserita — impossibile caricare i file automaticamente da Drive.");
    document.getElementById("pdf-container").innerHTML = "<p>⚠️ Inserisci la chiave API in script.js per visualizzare i file automaticamente.</p>";
    return;
  }

  // Carica i file da Google Drive
  try {
    const driveFiles = await fetchDriveFiles(folderId);
    filesData = driveFiles;
    renderFiles(driveFiles);
  } catch (err) {
    console.error("Errore nel caricamento dei file:", err);
    document.getElementById("pdf-container").innerHTML = "<p>Errore nel caricamento dei file da Google Drive.</p>";
  }
});


// ====== FUNZIONI ======

function extractFolderId(url) {
  if (!url) return "";
  const match = url.match(/[-\w]{10,}/);
  return match ? match[0] : url;
}

async function fetchDriveFiles(folderId) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink)&key=${API_KEY}`;
  console.log("[PORTALE] Fetch:", url);

  const res = await fetch(url);
  if (!res.ok) throw new Error("Errore nella richiesta API Drive");
  const data = await res.json();
  if (!data.files || data.files.length === 0) throw new Error("Nessun file trovato nella cartella");

  // Ordina PDF prima, poi immagini
  return data.files.sort((a, b) => {
    const aPdf = a.mimeType.includes("pdf");
    const bPdf = b.mimeType.includes("pdf");
    return aPdf === bPdf ? 0 : aPdf ? -1 : 1;
  });
}

function renderFiles(files) {
  const pdfContainer = document.getElementById("pdf-container");
  const imgContainer = document.getElementById("img-container");
  pdfContainer.innerHTML = "";
  imgContainer.innerHTML = "";

  files.forEach((file, index) => {
    const name = file.name || "file";

    // === PDF ===
    if (file.mimeType.includes("pdf")) {
      const div = document.createElement("div");
      div.className = "pdf-card";
      div.innerHTML = `
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" alt="PDF">
        <p class="file-name">${name}</p>
      `;
      div.onclick = () => showLightbox(index);
      pdfContainer.appendChild(div);
    }

    // === IMMAGINI ===
    if (file.mimeType.startsWith("image/")) {
      const div = document.createElement("div");
      div.className = "img-card";
      const thumb = `https://drive.google.com/uc?export=view&id=${file.id}`;
      div.innerHTML = `<img loading="lazy" src="${thumb}" alt="${name}">`;
      div.onclick = () => showLightbox(index);
      imgContainer.appendChild(div);
    }
  });

  if (!files.some(f => f.mimeType.includes("pdf"))) {
    document.querySelector(".documentazione h2").style.display = "none";
  }
}

// ====== LIGHTBOX ======

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
    // ✅ Usa link diretto per evitare “Refused to frame”
    iframe.src = `https://drive.google.com/uc?export=view&id=${file.id}`;
    iframe.style.display = "block";
  } else if (file.mimeType.startsWith("image/")) {
    const src = `https://drive.google.com/uc?export=view&id=${file.id}`;
    img.src = src;
    img.style.display = "block";
  }

  lightbox.classList.add("visible");
}

document.getElementById("close-lightbox").onclick = () => {
  document.getElementById("lightbox-iframe").src = "";
  document.getElementById("lightbox").classList.remove("visible");
};

document.getElementById("next-btn").onclick = () => navigateLightbox(1);
document.getElementById("prev-btn").onclick = () => navigateLightbox(-1);

document.getElementById("rotate-btn").onclick = () => {
  currentRotation = (currentRotation + 90) % 360;
  const img = document.getElementById("lightbox-img");
  img.style.transform = `rotate(${currentRotation}deg)`;
};

function navigateLightbox(direction) {
  if (!filesData.length) return;
  currentFileIndex = (currentFileIndex + direction + filesData.length) % filesData.length;
  showLightbox(currentFileIndex);
}

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    const lightbox = document.getElementById("lightbox");
    const iframe = document.getElementById("lightbox-iframe");
    if (lightbox.classList.contains("visible")) {
      iframe.style.height = window.innerHeight * 0.9 + "px";
      iframe.style.width = window.innerWidth * 0.95 + "px";
    }
  }, 400);
});
