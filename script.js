document.addEventListener('DOMContentLoaded', async () => {
  const API_KEY = "AIzaSyBg_v7mveOrwTc0plNByUZ-BXjJOWv5AIg"; // tua chiave Drive

  const params = new URLSearchParams(window.location.search);
  const codiceDv = params.get('codiceDv') || 'DV-0000';
  const folderId = params.get('folderId');

  document.getElementById('codice-dv').textContent = codiceDv;

  const pdfContainer = document.getElementById('pdf-container');
  const imgContainer = document.getElementById('img-container');
  const lightbox = document.getElementById('lightbox');
  const lightboxIframe = document.getElementById('lightbox-iframe');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeLightbox = document.getElementById('close-lightbox');

  if (!folderId) {
    pdfContainer.innerHTML = "<p style='color:red;'>Errore: folderId mancante nell’URL.</p>";
    return;
  }

  const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${API_KEY}`;
  console.log("API URL:", apiUrl);

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error("Errore API:", data.error);
      pdfContainer.innerHTML = `<p style='color:red;'>Errore Google API: ${data.error.message}</p>`;
      return;
    }

    if (!data.files || data.files.length === 0) {
      pdfContainer.innerHTML = "<p>Nessun file trovato nella cartella.</p>";
      return;
    }

    const pdfFiles = data.files.filter(f => f.mimeType === "application/pdf");
    const imgFiles = data.files.filter(f => f.mimeType.startsWith("image/"));

    // --- PDF ---
    pdfContainer.innerHTML = "";
    pdfFiles.forEach(file => {
      const pdfCard = document.createElement('div');
      pdfCard.className = "pdf-card";
      pdfCard.innerHTML = `
        <div class="pdf-preview">
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" class="pdf-icon">
          <p>${file.name}</p>
        </div>
      `;
      pdfCard.addEventListener("click", () => {
        openPDF(file.id);
      });
      pdfContainer.appendChild(pdfCard);
    });

    // --- IMMAGINI ---
    imgContainer.innerHTML = "";
    imgFiles.forEach(file => {
      const thumbUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
      const img = document.createElement("img");
      img.src = thumbUrl;
      img.alt = file.name;
      img.className = "preview-img";
      img.addEventListener("click", () => openImage(file.id));
      imgContainer.appendChild(img);
    });

    // --- LIGHTBOX ---
    function openPDF(fileId) {
      lightbox.classList.remove("hidden");
      lightboxImg.style.display = "none";
      lightboxIframe.style.display = "block";
      lightboxIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    }

    function openImage(fileId) {
      lightbox.classList.remove("hidden");
      lightboxIframe.style.display = "none";
      lightboxImg.style.display = "block";
      lightboxImg.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    closeLightbox.addEventListener("click", () => {
      lightbox.classList.add("hidden");
      lightboxIframe.src = "";
      lightboxImg.src = "";
    });

  } catch (err) {
    console.error("Errore di connessione:", err);
    pdfContainer.innerHTML = `<p style="color:red;">Errore di connessione all’API Google Drive.</p>`;
  }
});
