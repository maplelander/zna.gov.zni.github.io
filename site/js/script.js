const repoOwner = 'maplelander'; // e.g., 'ZNA-GOV-ZN'
const repoName = 'zna.gov.zni.github.io'; // e.g., 'ZNA-GOV-ZN.github.io'
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
            // Assume files are PDFs; adjust if needed
            const category = path.replace(basePath + '/', '').split('/')[0] || 'Uncategorized';
            categories.add(category);
            files.push({
                name: item.name,
                path: item.path,
                url: item.download_url, // Raw file URL for download/preview
                category: category
            });
        } else if (item.type === 'dir') {
            // Recurse into subfolders
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
    const previewEmbed = document.getElementById('previewEmbed');
    const downloadLink = document.getElementById('downloadLink');
    
    previewEmbed.src = doc.url; // Embed PDF
    downloadLink.href = doc.url;
    downloadLink.textContent = `Download ${doc.name}`;
    downloadLink.download = doc.name;
    
    previewContainer.style.display = 'block';
}

async function init() {
    allDocuments = await fetchDirectory();
    populateCategories();
    displayDocuments(allDocuments);
}

init();