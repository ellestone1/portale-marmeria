document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURAZIONE ---
    const API_KEY = 'AIzaSyBg_v7mveOrwTc0plNByUZ-BXjJOWv5AIg';
    // -----------------------

    const params = new URLSearchParams(window.location.search);
    const codiceDv = params.get('codiceDv');
    const folderId = params.get('folderId');

    const codiceElement = document.getElementById('codice-dv');
    const pdfContainer = document.getElementById('pdf-container');
    const imgContainer = document.getElementById('img-container');

    // Mostra il codice progetto
    if (codiceDv) {
        codiceElement.textContent = codiceDv;
    } else {
        codiceElement.textContent = 'Codice non trovato';
    }

    if (!API_KEY || API_KEY === 'INSERISCI_LA_TUA_API_KEY_QUI') {
        pdfContainer.innerHTML = '<p style="color:red;">Errore: API key non configurata.</p>';
        return;
    }

    if (!folderId) {
        pdfContainer.innerHTML = '<p style="color:red;">Errore: Folder ID mancante nell’URL.</p>';
        return;
    }

    console.log('[PORTALE] Folder ID:', folderId);

    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&key=${API_KEY}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            console.error('Errore Google API:', data.error);
            pdfContainer.innerHTML = `<p style="color:red;">Errore Google API: ${data.error.message}</p>`;
            return;
        }

        const files = data.files || [];
        if (files.length === 0) {
            pdfContainer.innerHTML = '<p>Nessun file trovato in questa cartella.</p>';
            return;
        }

        // Separa PDF e immagini
        const pdfFiles = files.filter(f => f.mimeType === 'application/pdf');
        const imgFiles = files.filter(f => f.mimeType.startsWith('image/'));

        // Mostra PDF
        pdfContainer.innerHTML = '';
        pdfFiles.forEach(file => {
            const pdfCard = document.createElement('div');
            pdfCard.classList.add('pdf-card');
            pdfCard.innerHTML = `
                <div class="pdf-preview" data-id="${file.id}">
                    <img src="https://i.postimg.cc/P5z0mcvT/pdf-icon.png" alt="PDF">
                    <p>${file.name}</p>
                </div>
            `;
            pdfContainer.appendChild(pdfCard);

            pdfCard.addEventListener('click', () => {
                apriLightbox(`https://drive.google.com/file/d/${file.id}/preview`);
            });
        });

        // Mostra immagini
        imgContainer.innerHTML = '';
        imgFiles.forEach(file => {
            const imgCard = document.createElement('div');
            imgCard.classList.add('img-card');
            imgCard.innerHTML = `
                <img src="https://drive.google.com/uc?export=view&id=${file.id}" alt="${file.name}">
            `;
            imgContainer.appendChild(imgCard);

            imgCard.addEventListener('click', () => {
                apriLightbox(`https://drive.google.com/uc?export=view&id=${file.id}`);
            });
        });

    } catch (error) {
        console.error('Errore nel caricamento:', error);
        pdfContainer.innerHTML = '<p style="color:red;">Errore di connessione ai server Google Drive.</p>';
    }

    // --- LIGHTBOX ---
    const lightbox = document.getElementById('lightbox');
    const iframe = document.getElementById('lightbox-iframe');
    const closeBtn = document.getElementById('close-lightbox');

    function apriLightbox(url) {
        iframe.src = url;
        lightbox.classList.remove('hidden');
    }

    closeBtn.addEventListener('click', () => {
        lightbox.classList.add('hidden');
        iframe.src = '';
    });
});


