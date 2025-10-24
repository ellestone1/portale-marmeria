document.addEventListener('DOMContentLoaded', async () => {
  // Inserisci qui la tua API Key
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

    if (!data.files || data.files.length === 0) {
      pdfContainer.innerHTML = "<p>Nessun file trovato in questa cartella.</p>";
      return;
    }

    data.files.forEach(file => {
      // Mostra PDF
      if (file.mimeType === "application/pdf") {
        const pdfCard = document.createElement("div");
        pdfCard.className = "pdf-card";
        pdfCard.innerHTML = `
          <a href="${file.webViewLink}" target="_blank">
            <img src="https://upload.wikimedia.org/wikipedia/commons
