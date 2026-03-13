export function showCover() {
    document.getElementById('page-0').classList.add('active');
    document.getElementById('app-pages').classList.remove('active');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-0').classList.add('active');
}

export function hideCover() {
    document.getElementById('page-0').classList.remove('active');
    document.getElementById('app-pages').classList.add('active');
}

export function showUploadArea(message) {
    const uploadArea = document.getElementById('upload-area');
    const uploadStatus = document.getElementById('upload-status');
    uploadArea.style.display = 'flex';
    uploadStatus.innerText = message || 'Carregue um arquivo ou sincronize com a nuvem.';
    uploadStatus.style.color = 'var(--text-dark)';
}

export function hideUploadArea() {
    document.getElementById('upload-area').style.display = 'none';
}

export function setupCoverListeners(onFileDrop) {
    const uploadArea = document.getElementById('upload-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
    });

    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        onFileDrop(file);
    }, false);

    document.getElementById('csvFileInput').addEventListener('change', function (evt) {
        onFileDrop(evt.target.files[0]);
    });
}
