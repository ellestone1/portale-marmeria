document.addEventListener('DOMContentLoaded', async function () {
    // ==============================================
    // 🔧 CONFIGURAZIONE
    const API_KEY = 'AIzaSyBg_v7mveOrwTc0plNByUZ-BXjJOWv5AIg'; // Chiave API inserita
    // ==============================================

    // Elementi del DOM (basati sul tuo ultimo HTML)
    const codiceDvDisplay = document.getElementById('codice-dv');
    const pdfContainer = document.getElementById('pdf-container');
    const imgContainer = document.getElementById('img-container');
    const imgGalleryTitle = document.querySelector('.galleria h2');
    const pdfSectionTitle = document.querySelector('.documentazione h2');
    const header = document.querySelector('header'); // Seleziona l'header per l'effetto scroll

    // Elementi Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxIframe = document.getElementById('lightbox-iframe');
    const closeLightboxBtn = document.getElementById('close-lightbox');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const rotateBtn = document.getElementById('rotate-btn'); // Pulsante rotazione singolo
    const lightboxCounter = document.getElementById('lightbox-counter'); // Contatore se esiste

    let allFiles = []; // Array per tutti i file
    let currentGalleryFiles = []; // Array solo per le immagini (per navigazione)
    let currentIndex = -1; // Indice navigazione
    let currentRotation = 0; // Rotazione

    // Leggi i parametri dall'URL
    const params = new URLSearchParams(window.location.search);
    const projectCode = params.get('codiceDv');
    const folderId = params.get('folderId');

    console.log('[PORTALE] Folder ID:', folderId);

    // Mostra Codice DV
    if (codiceDvDisplay && projectCode) {
        codiceDvDisplay.textContent = decodeURIComponent(projectCode);
    } else if (codiceDvDisplay) {
        codiceDvDisplay.textContent = 'N/D';
    }

    // Controlli API Key e Folder ID
    const errorContainer = pdfContainer || imgContainer || document.body;
    // Correzione controllo API KEY
    if (!API_KEY || API_KEY === 'INCOLLA_LA_TUA_CHIAVE_API_QUI' || API_KEY.length < 10) { // Aggiunto controllo lunghezza minima
        errorContainer.innerHTML = `<p style="color:red;">⚠️ Chiave API mancante o non valida.</p>`;
        return;
    }
    if (!folderId) {
        errorContainer.innerHTML = `<p style="color:red;">⚠️ ID cartella mancante.</p>`;
        return;
    }

    // Chiamata API Google Drive
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink)&key=${API_KEY}`;
    console.log('[PORTALE] API URL:', apiUrl);

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            console.error('[PORTALE] Errore API:', data.error);
            errorContainer.innerHTML = `<p style="color:red;">Errore Google API: ${data.error.message}</p>`;
            return;
        }

        if (!data.files || data.files.length === 0) {
            errorContainer.innerHTML = `<p>Nessun file trovato.</p>`;
            if(pdfSectionTitle) pdfSectionTitle.style.display = 'none';
            if(imgGalleryTitle) imgGalleryTitle.style.display = 'none';
            return;
        }

        allFiles = data.files;
        renderFiles(allFiles); // Mostra i file

    } catch (error) {
        console.error('[PORTALE] Errore di rete:', error);
        errorContainer.innerHTML = `<p style="color:red;">Errore collegamento Google Drive.</p>`;
    }

    // ==============================================
    // 🔹 RENDER FILE
    function renderFiles(files) {
        pdfContainer.innerHTML = '';
        imgContainer.innerHTML = '';
        currentGalleryFiles = [];

        let pdfFound = false;
        let imagesFound = false;

        // Ordina: PDF prima
         files.sort((a, b) => {
             const isAPdf = a.mimeType === 'application/pdf';
             const isBPdf = b.mimeType === 'application/pdf';
             if (isAPdf && !isBPdf) return -1;
             if (!isAPdf && isBPdf) return 1;
             return a.name.localeCompare(b.name); // Ordina gli altri per nome
         });


        files.forEach((file) => {
            const isPdf = file.mimeType === 'application/pdf';

            const card = document.createElement('div');
            card.className = 'file-card';
            
            const thumbnail = document.createElement('img');
            thumbnail.className = 'thumbnail';
            thumbnail.alt = file.name;
            thumbnail.loading = 'lazy';

            if (isPdf) {
                card.classList.add('pdf-card');
                thumbnail.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/1200px-PDF_file_icon.svg.png';
                // Aggiunge nome file sotto icona PDF
                const pdfName = document.createElement('p');
                pdfName.textContent = file.name;
                card.appendChild(thumbnail);
                card.appendChild(pdfName);
                pdfContainer.appendChild(card);
                pdfFound = true;
                 // Aggiunge evento click per PDF (passa ID e flag isPdf)
                 card.addEventListener('click', () => openLightbox(file.id, true));
            } else if (file.mimeType && file.mimeType.startsWith('image/')) {
                card.classList.add('img-card');
                thumbnail.src = file.thumbnailLink ? file.thumbnailLink.replace('=s220', '=s400') : ''; 
                thumbnail.onerror = () => { thumbnail.src = ''; thumbnail.alt = 'Anteprima non disponibile'; }; 
                card.appendChild(thumbnail); // Solo immagine per card immagine
                imgContainer.appendChild(card);
                imagesFound = true;
                currentGalleryFiles.push(file); // Aggiunge a galleria navigabile
                 const imageIndex = currentGalleryFiles.length - 1; 
                 // Aggiunge evento click per Immagine (passa ID, flag isPdf=false, indice galleria)
                 card.addEventListener('click', () => openLightbox(file.id, false, imageIndex));
            }
        });

        // Nasconde sezioni vuote
        if (!pdfFound && pdfSectionTitle) pdfSectionTitle.style.display = 'none';
        if (!imagesFound && imgGalleryTitle) imgGalleryTitle.style.display = 'none';

        // Attiva navigazione lightbox (chiamata una sola volta)
        setupLightboxNavigation();
    }

    // ==============================================
    // 🔹 LIGHTBOX
    
    function openLightbox(fileId, isPdf, imageIndex = -1) {
        lightbox.classList.remove('hidden'); 
        lightbox.classList.add('visible'); 
        currentRotation = 0; 
        lightboxIframe.style.transform = `rotate(0deg)`; // Resetta rotazione visiva

        // Mostra SOLO l'iframe
        lightboxIframe.style.display = 'block';
        
        // Usa SEMPRE il link /preview
        lightboxIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
        
        // Gestisci visibilità controlli
        if (rotateBtn) rotateBtn.style.display = 'block'; // Rotazione sempre visibile
        const showNav = !isPdf && currentGalleryFiles.length > 1; // Navigazione solo per immagini multiple
        if (prevBtn) prevBtn.style.display = showNav ? 'block' : 'none';
        if (nextBtn) nextBtn.style.display = showNav ? 'block' : 'none';
        
        // Aggiorna contatore
        if(lightboxCounter){ // Controlla se l'elemento esiste
            if(isPdf){
                // Trova l'indice del PDF nella lista completa
                const pdfGlobalIndex = allFiles.findIndex(f => f.id === fileId);
                 // Aggiungi +1 perché gli indici partono da 0
                lightboxCounter.textContent = `File ${pdfGlobalIndex + 1} di ${allFiles.length}`; 
            } else {
                currentIndex = imageIndex; // Aggiorna indice solo per immagini
                 // Aggiungi +1 perché gli indici partono da 0
                lightboxCounter.textContent = `Immagine ${currentIndex + 1} di ${currentGalleryFiles.length}`; 
            }
        } else {
            console.warn("Elemento contatore non trovato!"); // Avviso se manca il contatore
        }
    }

    function closeLightbox() {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('visible');
        lightboxIframe.src = ''; 
        lightboxIframe.style.transform = ''; 
    }

    function rotate() {
        currentRotation = (currentRotation + 90) % 360;
        lightboxIframe.style.transform = `rotate(${currentRotation}deg)`;
    }

    // Naviga SOLO tra le immagini
    function navigate(dir) {
        if (currentGalleryFiles.length <= 1 || currentIndex === -1) return; 
        currentIndex = (currentIndex + dir + currentGalleryFiles.length) % currentGalleryFiles.length;
        const nextFile = currentGalleryFiles[currentIndex];
        // Apri sempre come immagine (isPdf = false) e passa il nuovo indice
        openLightbox(nextFile.id, false, currentIndex); 
    }

    // Setup listener una sola volta
    function setupLightboxNavigation(){
        // Evita di aggiungere listener multipli
        if (setupLightboxNavigation.initialized) return; 
        setupLightboxNavigation.initialized = true; 

        if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closeLightbox);
        if (rotateBtn) rotateBtn.addEventListener('click', rotate);
        if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

        document.addEventListener('keydown', (e) => {
            if (lightbox.classList.contains('hidden')) return;
            if (e.key === 'Escape') closeLightbox();
            // Navigazione tastiera solo se le frecce sono visibili
            if (prevBtn && prevBtn.style.display !== 'none') {
                 if (e.key === 'ArrowRight') navigate(1);
                 if (e.key === 'ArrowLeft') navigate(-1);
            }
            // Rotazione se il pulsante è visibile
            if (rotateBtn && rotateBtn.style.display !== 'none') { 
                if (e.key === 'r' || e.key === 'R') rotate();
            }
        });
         lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) { // Click sullo sfondo
                closeLightbox();
            }
         });
    }

    // ==============================================
    // 🔹 EFFETTO HEADER
    if (header) { 
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('hidden'); 
            else header.classList.remove('hidden');
        });
    }
}); // <-- Assicurati che questa parentesi graffa finale ci sia!