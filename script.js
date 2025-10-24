// ================================================
// Portale La Marmeria Battaglia - versione stabile
// Nessuna chiave API richiesta (Google Drive public)
// ================================================

let filesData = [];
let currentFileIndex = 0;
let currentRotation = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const codiceDv = params.get("codiceDv") || "DV-0000";
  const folderParam = params.get("folderId");

  document.getElementById("codice-dv").textContent = codiceDv;

  // Gestione header (nascondi in scroll)
  const header = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) header.classList.add("hidden");
    else header.classList.remove("hidden");
  });

  if (!folderParam) {
    document.getElementById("pdf-container").innerHTML =
      "<p>Nessuna cartella specificata.</p>";
    return;
  }

  const folderId = extractFolderId(folderParam);
  console.log("[PORTALE] Folder ID:", folderId);

  // 🔹 Usa la pagina pubblica della cartella per estrarre i file
  try {
    const html = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`)
      .then((res) => res.text());

    // 🔍 Estrai i file dalla pagina HTML pubblica di Google Drive
    const regex = /"([a-zA-Z0-9_-]{10,})","(.*?)","(image\/[a-zA-Z0-9.+-]+|application\/pdf)"/g;
    let match;
    const files = [];

    while ((match = regex.exec(html)) !== null) {
      files.push({
        id: match[1],
        name: decodeURIComponent(match[2]),
        mimeType: match[3],
      });
    }

    if (!files.length) throw new Error("Nessun file trovato nella cartella.");

    // Ordina PDF prima, immagini dopo
    files.sort((a, b) => {
      const aPdf = a.mimeType.includes("pdf");
      const bPdf = b.mimeType.includes("pdf");
      return aPdf === bPdf ? 0 : aPdf ? -1 : 1;
    });

    filesData = files;
    renderFiles(files);
  } catch (err) {
    console.error("Errore nel caricamento:", err);
    document.getElementById("pdf-container").innerHTML =
      "<p>Errore nel caricamento della cartella Google Drive.</p>";
  }
});

// ====== Estrai ID da URL completo ======
function extractFolderId(url) {
  const match = url.match(/[-\w]{10,}/);
  return match ? match[0] : url;
}

// ====== Render file in pagina ======
function renderFiles(files) {
  const pdfContainer = document.getElementById("pdf-container");
  const imgContainer = document.getElementById("img-container");
  pdfContainer.innerHTML = "";
  imgContainer.innerHTML = "";

  files.forEach((file, index) => {
    const name = file.name || "file";

    if (file.mimeType.includes("pdf")) {
      const div = document.createElement("div");
      div.className = "pdf-card";
      div.innerHTML = `
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" alt="PDF">
        <p class="file-name">${name}</p>`;
      div.onclick = () => showLightbox(index);
      pdfContainer.appendChild(div);
    }

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
    iframe.src = `https://drive.google.com/file/d/${file.id}/preview`;
    iframe.style.display = "block";
  } else if (file.mimeType.startsWith("image/")) {
    const src = `https://drive.google.com/uc?export=view&id=${file.id}`;
    img.src = src;
    img.style.display = "block";
  }

  lightbox.classList.add("visible");
}

// ====== COMANDI LIGHTBOX ======
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

// ====== Adatta lightbox a orientamento ======
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
