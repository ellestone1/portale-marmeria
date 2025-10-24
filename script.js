document.addEventListener('DOMContentLoaded', async function () {
    // === CONFIGURAZIONE ===
    const API_KEY = 'AIzaSyBg_v7mveOrwTc0plNByUZ-BXjJOWv5AIg'; // ← metti qui la tua API key valida
    // =======================

    const params = new URLSearchParams(window.location.search);
    const codiceDv = params.get('codiceDv') || 'DV-0000';
    const folderId = params.get('folderId');

    const codiceEl = document.getElementById('codice-dv');
    const pdfContainer = document.getElementById('pdf-container');
    const imgContainer = document.getElementById('img-container');

    codiceEl.textContent = codiceDv;

    if (!folderId) {
        pdfContainer.innerHTML = `<p style="color:red;">❌ Errore: folderId mancante nell'URL</p>`;
        return;
    }

    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink)&key=${API_KEY}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // === DEBUG LOG COMPLETO ===
        console.group("DEBUG GOOGLE DRIVE");
        console.log("📡 URL chiamato:", apiUrl);
        console.log("📦 Risposta completa:", data);
        console.groupEnd();
        // ===========================

        if (data.error) {
            console.error("❌ Errore API:", data.error.message);
            pdfContainer.innerHTML = `<p style="color:red;">Errore Google API: ${data.error.message}</p>`;
            return;
        }

        if (!data.files || data.files.length === 0) {
            console.warn("⚠️ Nessun file trovato! La cartella è vuota o i permessi non sono pubblici.");
            pdfContainer.innerHTML = `<p style="color:orange;">Nessun file trovato nella cartella.</p>`;
            return;
        }

        // --- SEPARA PDF E IMMAGINI ---
        const pdfFiles = data.files.filter(f => f.mimeType === "application/pdf");
        const imgFiles = data.files.filter(f => f.mimeType.startsWith("image/"));

        // --- MOSTRA PDF ---
        if (pdfFiles.length > 0) {
            pdfFiles.forEach(file => {
                const card = document.createElement('div');
                card.className = 'file-card';
                card.innerHTML = `
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" class="pdf-icon" alt="PDF">
                    <p><a href="${file.webContentLink}" target="_blank">${file.name}</a></p>
                `;
                pdfContainer.appendChild(card);
            });
        } else {
            pdfContainer.innerHTML = `<p style="color:gray;">Nessun PDF trovato</p>`;
        }

        // --- MOSTRA IMMAGINI ---
        if (imgFiles.length > 0) {
            imgFiles.forEach(file => {
                const img = document.createElement('img');
                img.className = 'thumbnail';
                img.src = file.thumbnailLink || file.webContentLink;
                img.alt = file.name;
                img.loading = 'lazy';
                img.onclick = () => openLightbox(file.webContentLink);
                imgContainer.appendChild(img);
            });
        } else {
            imgContainer.innerHTML = `<p style="color:gray;">Nessuna immagine trovata</p>`;
        }

    } catch (error) {
        console.error("❌ Errore di connessione:", error);
        pdfContainer.innerHTML = `<p style="color:red;">Errore di connessione al server Google Drive</p>`;
    }

    // --- LIGHTBOX ---
    const lightbox = document.getElementById('lightbox');
    const iframe = document.getElementById('lightbox-iframe');
    const closeBtn = document.getElementById('close-lightbox');

    function openLightbox(url) {
        iframe.src = url;
        lightbox.classList.remove('hidden');
    }

    closeBtn.addEventListener('click', () => {
    lightbox.classList.add('hidden');
    iframe.src = '';

});

