document.addEventListener('DOMContentLoaded', async function () {
    // ==============================================
    // 🔧 CONFIGURAZIONE
    const API_KEY = 'AIzaSyBg_v7mveOrwTc0plNByUZ-BXjJOWv5AIg';
    // ==============================================

    const params = new URLSearchParams(window.location.search);
    const codiceDv = params.get('codiceDv');
    const folderId = params.get('folderId');

    const dvDisplay = document.getElementById('codice-dv-display');
    const fileGrid = document.getElementById('file-grid');

    console.log('[PORTALE] Folder ID ricevuto:', folderId);

    if (codiceDv) {
        dvDisplay.textContent = codiceDv;
    } else {
        dvDisplay.textContent = 'Codice non specificato';
    }

    if (!API_KEY || API_KEY === 'INSERISCI_LA_TUA_CHIAVE_API_QUI') {
        fileGrid.innerHTML = `<p style="color:red;">⚠️ Chiave API mancante. Inserisci la tua chiave Google Drive API.</p>`;
        return;
    }

    if (!folderId) {
        fileGrid.innerHTML = `<p style="color:red;">⚠️ Nessun ID cartella trovato. Controlla il link Make o il QR Code.</p>`;
        return;
    }

    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&key=${API_KEY}`;
    console.log('[PORTALE] API URL:', apiUrl);

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            console.error('[PORTALE] Errore API:', data.error);
            fileGrid.innerHTML = `<p style="color:red;">Errore Google API: ${data.error.message}</p>`;
            return;
        }

        if (!data.files || data.files.length === 0) {
            fileGrid.innerHTML = `<p>Nessun file trovato. La cartella potrebbe essere vuota o non pubblica.</p>`;
            return;
        }

        renderFiles(data.files);
    } catch (error) {
        console.error('[PORTALE] Errore di rete:', error);
        fileGrid.innerHTML = `<p style="color:red;">Errore nel collegamento con Google Drive.</p>`;
    }

    // ==============================================
    // 🔹 FUNZIONE PRINCIPALE: RENDER FILE
    function renderFiles(files) {
        fileGrid.innerHTML = '';
        let pdfs = [];
        let images = [];

        files.forEach(file => {
            if (file.mimeType === 'application/pdf') pdfs.push(file);
            else if (file.mimeType.startsWith('image/')) images.push(file);
        });

        // Mostra prima il PDF principale
        if (pdfs.length > 0) {
            const pdf = pdfs[0];
            const card = document.createElement('div');
            card.className = 'file-card pdf-card';
            card.innerHTML = `
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" alt="PDF">
                <p>${pdf.name}</p>
            `;
            card.addEventListener('click', () => openLightbox(pdf.webViewLink, true));
            fileGrid.appendChild(card);
        }

        // Divider “Galleria fotografica”
        if (images.length > 0) {
            const divider = document.createElement('h3');
            divider.textContent = 'Galleria Fotografica';
            divider.className = 'gallery-title';
            fileGrid.appendChild(divider);
        }

        // Mostra le immagini
        images.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'file-card img-card';
            const thumb = file.thumbnailLink
                ? file.thumbnailLink.replace('=s220', '=s800')
                : `https://drive.google.com/uc?export=view&id=${file.id}`;

            card.innerHTML = `<img src="${thumb}" alt="${file.name}" loading="lazy">`;
            card.addEventListener('click', () => openLightbox(file.id, false));
            fileGrid.appendChild(card);
        });
    }

    // ==============================================
    // 🔹 LIGHTBOX
    const lightbox = document.getElementById('lightbox');
    const iframe = document.getElementById('lightbox-iframe');
    const closeBtn = document.getElementById('close-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const rotateBtn = document.getElementById('rotate-btn');

    let currentIndex = 0;
    let rotation = 0;
    let galleryFiles = [];

    function openLightbox(fileIdOrUrl, isPdf) {
        lightbox.classList.add('visible');
        rotation = 0;

        if (isPdf) {
            iframe.src = fileIdOrUrl.includes('drive.google')
                ? fileIdOrUrl
                : `https://drive.google.com/file/d/${fileIdOrUrl}/preview`;
        } else {
            iframe.src = `https://drive.google.com/uc?export=view&id=${fileIdOrUrl}`;
        }
    }

    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('visible');
        iframe.src = '';
    });

    rotateBtn.addEventListener('click', () => {
        rotation = (rotation + 90) % 360;
        iframe.style.transform = `rotate(${rotation}deg)`;
    });

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    function navigate(dir) {
        if (galleryFiles.length === 0) return;
        currentIndex = (currentIndex + dir + galleryFiles.length) % galleryFiles.length;
        const nextFile = galleryFiles[currentIndex];
        openLightbox(nextFile.id, nextFile.mimeType === 'application/pdf');
    }

    // ==============================================
    // 🔹 EFFETTO HEADER (nascondi in scroll)
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) header.classList.add('hidden');
        else header.classList.remove('hidden');
    });
});
