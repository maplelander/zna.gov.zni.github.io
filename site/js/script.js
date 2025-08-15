const repoOwner = 'maplelander'; // Your GitHub username
const repoName = 'zna.gov.zni.github.io'; // Your repo name
const basePath = 'documents'; // Folder to index
const apiBase = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allDocuments = []; // Store all fetched docs
let categories = new Set(); // Unique categories (subfolders)

async function fetchDirectory(path = basePath) {
    const response = await fetch(`${apiBase}${path}`);
    if (!response.ok) {
        console.error('API request failed:', response.status);
        return [];
    }
    const data = await response.json();
    
    let files = [];
    for (const item of data) {
        if (item.type === 'file') {
            const category = path.replace(basePath + '/', '').split('/')[0] || 'Uncategorized';
            categories.add(category);
            files.push({
                name: item.name,
                path: item.path,
                url: item.download_url,
                category: category
            });
        } else if (item.type === 'dir') {
            files = files.concat(await fetchDirectory(item.path));
        }
    }
    return files;
}

function populateCategories() {
    const filterSelect = document.getElementById('categoryFilter');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterSelect.appendChild(option);
    });
}

function displayDocuments(docs) {
    const list = document.getElementById('documentList');
    list.innerHTML = '';
    docs.forEach(doc => {
        const li = document.createElement('li');
        li.textContent = `${doc.name} (${doc.category})`;
        li.onclick = () => showPreview(doc);
        list.appendChild(li);
    });
}

function filterDocuments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value;
    
    const filtered = allDocuments.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || doc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    
    displayDocuments(filtered);
}

function showPreview(doc) {
    const previewContainer = document.getElementById('previewContainer');
    const previewFrame = document.getElementById('previewFrame');
    const downloadLink = document.getElementById('downloadLink');
    
    // Use Google Docs Viewer to embed supported formats (PDF, ODT, PNG, JPEG) without download
    const ext = doc.name.split('.').pop().toLowerCase();
    if (['pdf', 'odt', 'png', 'jpeg', 'jpg'].includes(ext)) {
        previewFrame.src = `https://docs.google.com/gview?url=${encodeURIComponent(doc.url)}&embedded=true`;
    } else {
        previewFrame.src = ''; // Hide preview for unsupported types
        console.warn(`Unsupported preview format: ${ext}`);
    }
    
    downloadLink.href = doc.url;
    downloadLink.download = doc.name;
    downloadLink.textContent = `Download ${doc.name}`;
    
    previewContainer.style.display = 'block';
}

async function init() {
    allDocuments = await fetchDirectory();
    populateCategories();
    displayDocuments(allDocuments);
}

init();