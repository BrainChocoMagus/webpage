// ============================================
// CONFIGURACIÓN
// ============================================
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

async function init() {
    try {
        console.log('📖 Iniciando Archivo Personal...');
        await loadPosts();
        console.log(`✅ ${state.posts.length} posts cargados`);
        console.log('📝 Posts:', state.posts);
        console.log(`🏷️ Tags encontrados:`, Array.from(state.tags));
        
        renderList(state.posts);
        renderTags();
        updatePostCount();
        showWelcome();
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showError(error.message);
    }
}

async function loadPosts() {
    // 1. Cargar el archivo JSON
    const response = await fetch(`${CONFIG.POSTS_FOLDER}${CONFIG.POSTS_JSON}`);
    if (!response.ok) {
        throw new Error(`No se pudo cargar ${CONFIG.POSTS_JSON}`);
    }
    
    const files = await response.json();
    console.log(`📋 Archivos encontrados:`, files);
    
    // 2. Cargar todos los archivos de texto
    const postsData = await Promise.all(
        files.map(async (filename) => {
            try {
                // Limpiar el nombre del archivo
                let cleanFilename = filename.replace('posts/', '').trim();
                // Codificar espacios para URL
                const encodedFilename = encodeURIComponent(cleanFilename);
                
                console.log(`📄 Intentando cargar: ${cleanFilename}`);
                
                const res = await fetch(`${CONFIG.POSTS_FOLDER}${encodedFilename}`);
                if (!res.ok) {
                    console.warn(`⚠️ No se pudo cargar ${cleanFilename} (${res.status})`);
                    return null;
                }
                const text = await res.text();
                return parsePost(text, cleanFilename);
            } catch (error) {
                console.warn(`⚠️ Error cargando ${filename}:`, error);
                return null;
            }
        })
    );
    
    // 3. Filtrar posts válidos
    state.posts = postsData.filter(p => p !== null);
    
    // 4. Ordenar por fecha
    state.posts.sort((a, b) => {
        try {
            return new Date(b.date) - new Date(a.date);
        } catch (e) {
            return 0;
        }
    });
    
    // 5. Recolectar todos los tags
    state.posts.forEach(post => {
        if (post.tags && post.tags.length > 0) {
            post.tags.forEach(tag => {
                const cleanTag = tag.trim().toLowerCase();
                if (cleanTag) state.tags.add(cleanTag);
            });
        }
    });
}

function parsePost(text, filename) {
    const lines = text.split('\n');
    
    // Título
    const titleLine = lines.find(l => l.trim().startsWith('#'));
    const title = titleLine ? titleLine.replace('#', '').trim() : filename.replace('.txt', '').trim();
    
    // Fecha
    const dateLine = lines.find(l => l.trim().startsWith('date:'));
    let date = dateLine ? dateLine.replace('date:', '').trim() : '0000-00-00';
    
    // Si la fecha está en formato YYYY-MM, agregar día 01
    if (date.match(/^\d{4}-\d{2}$/)) {
        date = `${date}-01`;
    }
    
    // Tags
    const tagsLine = lines.find(l => l.trim().startsWith('tags:'));
    let tags = [];
    if (tagsLine) {
        tags = tagsLine.replace('tags:', '')
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
    }
    
    // Imagen
    const imageLine = lines.find(l => l.trim().startsWith('image:'));
    const image = imageLine ? imageLine.replace('image:', '').trim() : null;
    
    // Contenido
    const contentParts = text.split('---');
    let content = '';
    if (contentParts.length > 1) {
        content = contentParts[1].trim();
    } else {
        const contentLines = lines.filter(l => 
            !l.trim().startsWith('#') && 
            !l.trim().startsWith('date:') && 
            !l.trim().startsWith('tags:') && 
            !l.trim().startsWith('image:')
        );
        content = contentLines.join('\n').trim();
    }
    
    return { title, date, tags, image, content, filename };
}

// ============================================
// FUNCIONES DE RENDERIZADO
// ============================================

function renderList(posts) {
    if (!DOM.list) return;
    
    DOM.list.innerHTML = '';
    
    if (!posts || posts.length === 0) {
        DOM.list.innerHTML = '<div style="opacity:0.4; text-align:center; padding:1rem;">✦ sin entradas ✦</div>';
        return;
    }
    
    posts.forEach(post => {
        const div = document.createElement('div');
        const date = formatDate(post.date);
        div.textContent = `${date} — ${post.title}`;
        div.title = post.title;
        div.dataset.filename = post.filename || '';
        
        if (state.currentPost && state.currentPost.filename === post.filename) {
            div.classList.add('active');
        }
        
        div.addEventListener('click', () => {
            if (post && post.title) {
                showPost(post);
            } else {
                console.warn('Post inválido:', post);
            }
        });
        DOM.list.appendChild(div);
    });
}

function showPost(post) {
    if (!post || !post.title) {
        console.error('Post inválido:', post);
        DOM.post.innerHTML = `
            <div style="text-align:center; padding:2rem; color: #ff6b6b; opacity:0.8;">
                <p>⚠️ Error: Este post no se pudo cargar correctamente</p>
            </div>
        `;
        return;
    }
    
    state.currentPost = post;
    
    // Actualizar lista
    document.querySelectorAll('#list div').forEach(el => {
        el.classList.toggle('active', el.dataset.filename === post.filename);
    });
    
    let html = `<h2>${post.title}</h2>`;
    
    // Metadatos
    html += `<div class="meta">`;
    html += `<span>📅 ${post.date || 'Fecha desconocida'}</span>`;
    if (post.tags && post.tags.length > 0) {
        html += ` &nbsp;✦ <span class="tags">`;
        html += post.tags.map(tag => 
            `<span onclick="filtrarPorTag('${tag.trim()}')">#${tag.trim()}</span>`
        ).join(' ');
        html += `</span>`;
    }
    html += `</div>`;
    
    // Imagen
    if (post.image && post.image.trim()) {
        const imageUrl = post.image.trim();
        // Si es URL externa o ruta local
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            html += `<img src="${imageUrl}" class="post-image" alt="${post.title}" loading="lazy" onerror="this.style.display='none'">`;
        } else {
            html += `<img src="${CONFIG.POSTS_FOLDER}${imageUrl}" class="post-image" alt="${post.title}" loading="lazy" onerror="this.style.display='none'">`;
        }
    }
    
    // Contenido
    if (post.content) {
        html += `<div class="body">${post.content.replace(/\n/g, '<br>')}</div>`;
    }
    
    // Footer
    html += `<div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-color); font-size:0.75rem; opacity:0.4;">`;
    html += `✦ publicado el ${post.date || 'Fecha desconocida'}`;
    html += `</div>`;
    
    DOM.post.innerHTML = html;
    document.body.classList.add('lectura');
}

function renderTags() {
    if (!DOM.tags || state.tags.size === 0) {
        console.warn('No hay tags para renderizar');
        DOM.tags.innerHTML = '<div style="color: var(--text-muted); text-align:center; padding:1rem;">✦ sin tags ✦</div>';
        return;
    }
    
    DOM.tags.innerHTML = '';
    const tags = Array.from(state.tags);
    console.log('🎨 Renderizando tags:', tags);
    
    // Obtener dimensiones
    const rect = DOM.tags.getBoundingClientRect();
    const size = Math.min(rect.width || 350, rect.height || 350);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(size * 0.35, 120);
    
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

function filtrarPorTag(tag) {
    if (!tag) return;
    
    const cleanTag = tag.trim().toLowerCase();
    const filtered = state.posts.filter(p => 
        p.tags && p.tags.some(t => t.trim().toLowerCase() === cleanTag)
    );
    
    renderList(filtered);
    setActiveFilter(`#${cleanTag}`);
    DOM.tags.classList.remove('active');
    
    DOM.post.innerHTML = `
        <div style="text-align:center; padding:2rem; opacity:0.6;">
            <p>✦ posts con <strong style="color:var(--accent);">#${cleanTag}</strong></p>
            <p style="font-size:0.8rem; margin-top:0.5rem;">${filtered.length} entradas</p>
        </div>
    `;
}

function filtrarPorFecha(yearMonth) {
    if (!yearMonth) return;
    
    const filtered = state.posts.filter(p => p.date && p.date.startsWith(yearMonth));
    
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
    if (!DOM.activeFilter) return;
    DOM.activeFilter.textContent = label || '';
    DOM.activeFilter.style.display = label ? 'inline-block' : 'none';
    state.currentFilter = label || null;
}

function clearActiveFilter() {
    setActiveFilter(null);
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
        DOM.postCount.textContent = state.posts.length || 0;
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
            <p style="font-size:0.8rem; margin-top:0.5rem; opacity:0.6;">${message || 'Error desconocido'}</p>
            <p style="font-size:0.7rem; margin-top:1rem; opacity:0.4;">
                Asegúrate de que la carpeta "${CONFIG.POSTS_FOLDER}" existe<br>
                y contiene "${CONFIG.POSTS_JSON}" con la lista de archivos
            </p>
        </div>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return 'Fecha desconocida';
    
    try {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (e) {
        console.warn('Error formateando fecha:', dateStr);
    }
    return dateStr;
}

// ============================================
// EVENTOS
// ============================================

if (DOM.toggleTags) {
    DOM.toggleTags.addEventListener('click', () => {
        if (!DOM.tags) return;
        DOM.tags.classList.toggle('active');
        if (DOM.tags.classList.contains('active')) {
            setTimeout(renderTags, 100);
        }
    });
}

document.addEventListener('click', (e) => {
    if (DOM.tags && DOM.tags.classList.contains('active') &&
        !DOM.tags.contains(e.target) &&
        e.target !== DOM.toggleTags) {
        DOM.tags.classList.remove('active');
    }
});

if (DOM.activeFilter) {
    DOM.activeFilter.addEventListener('click', clearActiveFilter);
}

// ============================================
// INICIALIZAR
// ============================================

document.addEventListener('DOMContentLoaded', init);

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================
window.mostrarTodos = mostrarTodos;
window.modoLectura = modoLectura;
window.filtrarPorTag = filtrarPorTag;
window.filtrarPorFecha = filtrarPorFecha;
window.clearActiveFilter = clearActiveFilter;