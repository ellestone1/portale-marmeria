document.addEventListener('DOMContentLoaded', async () => {
  const API_KEY = "AIzaSyBg_v7mveOrwTc0plNByUZ-BXjJOWv5AIg";

  const params = new URLSearchParams(window.location.search);
  const codiceDv = params.get('codiceDv') || 'DV-0000';
  const folderId = params.get('folderId');

  document.getElementById('codice-dv').textContent = codiceDv;

  const pdfContainer = document.getElementById('pdf-container');
  const imgContainer = document.getElementById('img-container');

  if (!folderId) {
    pdfContainer.innerHTML = "<p style='color:red;'>Errore: folderId mancante nell’URL.</p>";
    return;
  }

  const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&key=${API_KEY}`;
  console.log("[PORTALE] Fetch:", apiUrl);

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error("Errore API:", data.error);
      pdfContainer.innerHTML = `<p style="color:red;">Errore Google API: ${data.error.message}</p>`;
      return;
    }

    data.files.forEach(file => {
      if (file.mimeType === "application/pdf") {
        const pdfCard = document.createElement("div");
        pdfCard.className = "pdf-card";
        pdfCard.innerHTML = `
          <a href="${file.webViewLink}" target="_blank">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" class="pdf-icon">
            <p>${file.name}</p>
          </a>
        `;
        pdfContainer.appendChild(pdfCard);
      } else if (file.mimeType.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = `https://drive.google.com/uc?export=view&id=${file.id}`;
        img.alt = file.name;
        img.className = "preview-img";
        imgContainer.appendChild(img);
      }
    });

  } catch (err) {
    console.error("Errore fetch:", err);
    pdfContainer.innerHTML = "<p style='color:red;'>Errore di connessione al server.</p>";
  }
});
