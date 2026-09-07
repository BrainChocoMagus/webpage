// ============================================
// CONFIGURACIÓN - ¡IMPORTANTE PARA PORKBUN!
// ============================================
// Usamos rutas relativas que funcionan tanto local como en servidor
const CONFIG = {
    POSTS_FOLDER: 'posts/',
    POSTS_JSON: 'posts.json'
};

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
const state = {
    posts: [],
    tags: new Set(),
    currentFilter: null,
    currentPost: null
};

// ============================================
// DOM REFERENCIAS
// ============================================
const DOM = {
    list: document.getElementById('list'),
    post: document.getElementById('post'),
    tags: document.getElementById('tags'),
    toggleTags: document.getElementById('toggleTags'),
    activeFilter: document.getElementById('activeFilter'),
    postCount: document.getElementById('postCount')
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Inicializa la aplicación cargando los posts
 */
async function init() {
    try {
        console.log('📖 Iniciando Archivo Personal...');
        await loadPosts();
        console.log(`✅ ${state.posts.length} posts cargados`);
        console.log(`🏷️ ${state.tags.size} tags encontrados`);
        
        renderList(state.posts);
        renderTags();
        updatePostCount();
        showWelcome();
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showError(error.message);
    }
}

/**
 * Carga los posts desde el archivo JSON y los archivos .txt
 */
async function loadPosts() {
    // 1. Cargar el archivo JSON
    const response = await fetch(`${CONFIG.POSTS_FOLDER}${CONFIG.POSTS_JSON}`);
    if (!response.ok) {
        throw new Error(`No se pudo cargar ${CONFIG.POSTS_JSON}`);
    }
    
    const files = await response.json();
    console.log(`📋 Encontrados ${files.length} archivos`);
    
    // 2. Cargar todos los archivos de texto
    const postsData = await Promise.all(
        files.map(async (filename) => {
            try {
                const res = await fetch(`${CONFIG.POSTS_FOLDER}${filename}`);
                if (!res.ok) throw new Error(`Error cargando ${filename}`);
                const text = await res.text();
                return parsePost(text, filename);
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar ${filename}:`, error);
                return null;
            }
        })
    );
    
    // 3. Filtrar posts válidos y ordenar
    state.posts = postsData
        .filter(p => p !== null)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 4. Recolectar todos los tags
    state.posts.forEach(post => {
        post.tags.forEach(tag => state.tags.add(tag));
    });
}

/**
 * Parsea un archivo de texto a objeto Post
 */
function parsePost(text, filename) {
    const lines = text.split('\n');
    
    // Título
    const titleLine = lines.find(l => l.startsWith('#'));
    const title = titleLine ? titleLine.replace('#', '').trim() : 'Sin título';
    
    // Fecha
    const dateLine = lines.find(l => l.startsWith('date:'));
    const date = dateLine ? dateLine.replace('date:', '').trim() : '0000-00-00';
    
    // Tags
    const tagsLine = lines.find(l => l.startsWith('tags:'));
    const tags = tagsLine 
        ? tagsLine.replace('tags:', '').split(',').map(t => t.trim()).filter(t => t)
        : [];
    
    // Imagen
    const imageLine = lines.find(l => l.startsWith('image:'));
    const image = imageLine ? imageLine.replace('image:', '').trim() : null;
    
    // Contenido
    const contentParts = text.split('---');
    const content = contentParts.length > 1 
        ? contentParts[1].trim() 
        : lines.filter(l => !l.startsWith('#') && !l.startsWith('date:') && !l.startsWith('tags:') && !l.startsWith('image:')).join('\n').trim();
    
    return { title, date, tags, image, content, filename };
}

// ============================================
// FUNCIONES DE RENDERIZADO
// ============================================

/**
 * Renderiza la lista de posts
 */
function renderList(posts) {
    if (!DOM.list) return;
    
    DOM.list.innerHTML = '';
    
    if (posts.length === 0) {
        DOM.list.innerHTML = '<div style="opacity:0.4; text-align:center; padding:1rem;">✦ sin entradas ✦</div>';
        return;
    }
    
    posts.forEach(post => {
        const div = document.createElement('div');
        const date = formatDate(post.date);
        div.textContent = `${date} — ${post.title}`;
        div.title = post.title;
        div.dataset.filename = post.filename;
        
        if (state.currentPost && state.currentPost.filename === post.filename) {
            div.classList.add('active');
        }
        
        div.addEventListener('click', () => showPost(post));
        DOM.list.appendChild(div);
    });
}

/**
 * Muestra un post en el área de contenido
 */
function showPost(post) {
    state.currentPost = post;
    
    // Actualizar lista (marcar activo)
    document.querySelectorAll('#list div').forEach(el => {
        el.classList.toggle('active', el.dataset.filename === post.filename);
    });
    
    let html = `<h2>${post.title}</h2>`;
    
    // Metadatos
    html += `<div class="meta">`;
    html += `<span>📅 ${post.date}</span>`;
    if (post.tags.length > 0) {
        html += ` &nbsp;✦ <span class="tags">`;
        html += post.tags.map(tag => 
            `<span onclick="filtrarPorTag('${tag}')">#${tag}</span>`
        ).join(' ');
        html += `</span>`;
    }
    html += `</div>`;
    
    // Imagen
    if (post.image) {
        html += `<img src="${CONFIG.POSTS_FOLDER}${post.image}" class="post-image" alt="${post.title}" loading="lazy">`;
    }
    
    // Contenido
    html += `<div class="body">${post.content.replace(/\n/g, '<br>')}</div>`;
    
    // Footer del post
    html += `<div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-color); font-size:0.75rem; opacity:0.4;">`;
    html += `✦ publicado el ${post.date}`;
    html += `</div>`;
    
    DOM.post.innerHTML = html;
    
    // Activar modo lectura
    document.body.classList.add('lectura');
}

/**
 * Renderiza la constelación de tags
 */
function renderTags() {
    if (!DOM.tags || state.tags.size === 0) return;
    
    DOM.tags.innerHTML = '';
    const tags = Array.from(state.tags);
    
    // Obtener dimensiones
    const rect = DOM.tags.getBoundingClientRect();
    const size = Math.min(rect.width || 350, rect.height || 350);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;
    
    // Distribuir en círculo
    const angleStep = (Math.PI * 2) / tags.length;
    
    tags.forEach((tag, i) => {
        const el = document.createElement('div');
        el.className = 'tag';
        el.textContent = `#${tag}`;
        
        const angle = angleStep * i - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = 'translate(-50%, -50%)';
        
        // Tamaño variable
        const sizeFactor = Math.max(0.7, 1 - (tags.length / 50));
        el.style.fontSize = `${0.7 + sizeFactor * 0.3}rem`;
        
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            filtrarPorTag(tag);
        });
        
        DOM.tags.appendChild(el);
    });
}

// ============================================
// FUNCIONES DE FILTRO
// ============================================

/**
 * Filtra posts por tag
 */
function filtrarPorTag(tag) {
    const filtered = state.posts.filter(p => p.tags.includes(tag));
    renderList(filtered);
    setActiveFilter(`#${tag}`);
    DOM.tags.classList.remove('active');
    
    // Mostrar contador
    DOM.post.innerHTML = `
        <div style="text-align:center; padding:2rem; opacity:0.6;">
            <p>✦ posts con <strong style="color:var(--accent);">#${tag}</strong></p>
            <p style="font-size:0.8rem; margin-top:0.5rem;">${filtered.length} entradas</p>
        </div>
    `;
}

/**
 * Filtra posts por fecha
 */
function filtrarPorFecha(yearMonth) {
    const filtered = state.posts.filter(p => p.date.startsWith(yearMonth));
    
    let label = yearMonth;
    if (yearMonth.length === 4) {
        label = `año ${yearMonth}`;
    }
    
    renderList(filtered);
    setActiveFilter(label);
    
    DOM.post.innerHTML = `
        <div style="text-align:center; padding:2rem; opacity:0.6;">
            <p>✦ ${label}</p>
            <p style="font-size:0.8rem; margin-top:0.5rem;">${filtered.length} entradas</p>
        </div>
    `;
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function setActiveFilter(label) {
    DOM.activeFilter.textContent = label;
    DOM.activeFilter.style.display = 'inline-block';
    state.currentFilter = label;
}

function clearActiveFilter() {
    DOM.activeFilter.textContent = '';
    DOM.activeFilter.style.display = 'none';
    state.currentFilter = null;
    renderList(state.posts);
    showWelcome();
}

function mostrarTodos() {
    clearActiveFilter();
    document.body.classList.remove('lectura');
    state.currentPost = null;
}

function modoLectura() {
    document.body.classList.toggle('lectura');
}

function updatePostCount() {
    if (DOM.postCount) {
        DOM.postCount.textContent = state.posts.length;
    }
}

function showWelcome() {
    DOM.post.innerHTML = `
        <div class="welcome-message">
            <p>✦ selecciona un post para leer ✦</p>
        </div>
    `;
}

function showError(message) {
    DOM.post.innerHTML = `
        <div style="text-align:center; padding:2rem; color: #ff6b6b; opacity:0.8;">
            <p>⚠️ Error al cargar los posts</p>
            <p style="font-size:0.8rem; margin-top:0.5rem; opacity:0.6;">${message}</p>
            <p style="font-size:0.7rem; margin-top:1rem; opacity:0.4;">
                Asegúrate de que la carpeta "${CONFIG.POSTS_FOLDER}" existe<br>
                y contiene "${CONFIG.POSTS_JSON}" con la lista de archivos
            </p>
        </div>
    `;
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (e) {}
    return dateStr;
}

// ============================================
// EVENTOS
// ============================================

// Toggle constelación
DOM.toggleTags.addEventListener('click', () => {
    DOM.tags.classList.toggle('active');
    if (DOM.tags.classList.contains('active')) {
        setTimeout(renderTags, 100);
    }
});

// Cerrar constelación al hacer click fuera
document.addEventListener('click', (e) => {
    if (DOM.tags.classList.contains('active') &&
        !DOM.tags.contains(e.target) &&
        e.target !== DOM.toggleTags) {
        DOM.tags.classList.remove('active');
    }
});

// Limpiar filtro al hacer click
DOM.activeFilter.addEventListener('click', clearActiveFilter);

// ============================================
// INICIALIZAR
// ============================================

document.addEventListener('DOMContentLoaded', init);

// ============================================
// EXPONER FUNCIONES GLOBALES (para HTML)
// ============================================
window.mostrarTodos = mostrarTodos;
window.modoLectura = modoLectura;
window.filtrarPorTag = filtrarPorTag;
window.filtrarPorFecha = filtrarPorFecha;
window.clearActiveFilter = clearActiveFilter;