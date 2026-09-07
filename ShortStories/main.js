// =============================================
// 1. TUS POSTS - ¡AÑADE AQUÍ TUS TEXTOS!
// =============================================

const POSTS_DATA = [
    {
        title: "First",
        date: "2025-12-01",
        tags: ["primero", "inicio"],
        image: null,
        content: "shadupp this is not my fisrt post ever"
    },
    {
        title: "Haiku",
        date: "2025-12-15",
        tags: ["haiku", "poesía", "invierno"],
        image: null,
        content: "Mount Fuji snows"
    },
    {
        title: "Small Image",
        date: "2025-12-21",
        tags: ["image", "arte", "dibujo"],
        image: "https://www.newgrounds.com/dump/draw/0aff9772193c4c53a089376b6337238f",
        content: "My wambo wombo hurts\n"
    },
    {
        title: "Haiku shit",
        date: "2026-09-01",
        tags: ["haiku", "poesía", "otoño"],
        image: null,
        content: "wagamu tuusyututau"
    }
    {
        title: "I have a boyfriend",
        date: "2026-09-01",
        tags: ["personal"],
        image: null,
        content: "I killed my GF but was she my GF in the first place?"
    }
];

// =============================================
// 2. ESTADO DE LA APLICACIÓN
// =============================================

const state = {
    posts: [],
    filteredPosts: [],
    tags: new Set(),
    currentFilter: null,
    currentPost: null,
    isReadingMode: false
};

// =============================================
// 3. REFERENCIAS AL DOM
// =============================================

const DOM = {
    list: document.getElementById('list'),
    post: document.getElementById('post'),
    tags: document.getElementById('tags'),
    toggleTags: document.getElementById('toggleTags'),
    activeFilter: document.getElementById('activeFilter'),
    postCount: document.getElementById('postCount'),
    modoLecturaBtn: document.getElementById('modoLecturaBtn'),
    searchInput: document.getElementById('searchInput')
};

// =============================================
// 4. INICIALIZACIÓN
// =============================================

function init() {
    console.log('📖 Iniciando Archivo Personal...');
    
    // Cargar posts
    state.posts = POSTS_DATA.map((p, index) => ({ ...p, id: index }));
    state.filteredPosts = [...state.posts];
    
    // Ordenar por fecha
    state.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    state.filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Recolectar tags
    state.posts.forEach(post => {
        post.tags.forEach(tag => {
            state.tags.add(tag.trim().toLowerCase());
        });
    });
    
    console.log(`✅ ${state.posts.length} posts cargados`);
    console.log(`🏷️ ${state.tags.size} tags encontrados:`, Array.from(state.tags));
    
    // Renderizar
    renderList(state.filteredPosts);
    renderTags();
    updatePostCount();
    showWelcome();
}

// =============================================
// 5. RENDERIZAR LISTA
// =============================================

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
        div.dataset.id = post.id;
        
        if (state.currentPost && state.currentPost.id === post.id) {
            div.classList.add('active');
        }
        
        div.addEventListener('click', () => showPost(post));
        DOM.list.appendChild(div);
    });
}

// =============================================
// 6. MOSTRAR POST (CORREGIDO)
// =============================================

function showPost(post) {
    if (!post) return;
    state.currentPost = post;
    
    // Actualizar lista
    document.querySelectorAll('#list div').forEach(el => {
        const isActive = parseInt(el.dataset.id) === post.id;
        el.classList.toggle('active', isActive);
    });
    
    let html = `<h2>${post.title}</h2>`;
    html += `<div class="meta">📅 ${post.date}`;
    if (post.tags && post.tags.length > 0) {
        html += ` &nbsp;✦ <span class="tags">`;
        html += post.tags.map(tag => 
            `<span onclick="filtrarPorTag('${tag}')" style="cursor:pointer;">#${tag}</span>`
        ).join(' ');
        html += `</span>`;
    }
    html += `</div>`;
    
    if (post.image) {
        html += `<img src="${post.image}" class="post-image" alt="${post.title}" loading="lazy" onerror="this.style.display='none'">`;
    }
    
    html += `<div class="body">${post.content.replace(/\n/g, '<br>')}</div>`;
    html += `<div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-color); font-size:0.75rem; opacity:0.4;">✦ publicado el ${post.date}</div>`;
    
    DOM.post.innerHTML = html;
    
    // Activar modo lectura si no está activo
    if (!state.isReadingMode) {
        toggleModoLectura();
    }
}

// =============================================
// 7. CONSTELACIÓN DE TAGS (CORREGIDA)
// =============================================

function renderTags() {
    if (!DOM.tags || state.tags.size === 0) {
        DOM.tags.innerHTML = '<div style="color: var(--text-muted); text-align:center; padding:1rem;">✦ sin tags ✦</div>';
        return;
    }
    
    DOM.tags.innerHTML = '';
    const tags = Array.from(state.tags);
    
    // Obtener dimensiones del contenedor
    const rect = DOM.tags.getBoundingClientRect();
    const size = Math.min(rect.width || 400, rect.height || 400);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(size * 0.38, 150);
    const angleStep = (Math.PI * 2) / tags.length;
    
    tags.forEach((tag, i) => {
        const el = document.createElement('div');
        el.className = 'tag';
        el.textContent = `#${tag}`;
        
        // Posición circular con variación
        const angle = angleStep * i - Math.PI / 2;
        const variation = 1 + (Math.random() - 0.5) * 0.15;
        const x = centerX + radius * Math.cos(angle) * variation;
        const y = centerY + radius * Math.sin(angle) * variation;
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = 'translate(-50%, -50%)';
        
        // Tamaño según cantidad de tags
        const baseSize = Math.max(0.7, 1.2 - (tags.length / 30));
        el.style.fontSize = `${baseSize + 0.1}rem`;
        
        // Colores únicos para cada tag
        const hue = 260 + (i * 15) % 60;
        el.style.color = `hsl(${hue}, 70%, 75%)`;
        
        // AL HACER CLICK - FILTRAR POR TAG (CORREGIDO)
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`🔍 Filtrando por tag: ${tag}`);
            filtrarPorTag(tag);
        });
        
        DOM.tags.appendChild(el);
    });
}

// =============================================
// 8. FILTRAR POR TAG (CORREGIDO)
// =============================================

function filtrarPorTag(tag) {
    if (!tag) return;
    const cleanTag = tag.trim().toLowerCase();
    console.log(`🔍 Filtrando por: ${cleanTag}`);
    
    // Buscar posts que tengan este tag
    const filtered = state.posts.filter(p => 
        p.tags.some(t => t.trim().toLowerCase() === cleanTag)
    );
    
    console.log(`📊 Encontrados ${filtered.length} posts con tag #${cleanTag}`);
    
    // Actualizar estado
    state.filteredPosts = filtered;
    renderList(filtered);
    setActiveFilter(`#${cleanTag}`);
    DOM.tags.classList.remove('active'); // Cerrar constelación
    
    // Mostrar mensaje de filtro con los posts encontrados
    if (filtered.length > 0) {
        let html = `
            <div style="text-align:center; padding:1rem 2rem; opacity:0.8;">
                <p style="font-size:1.1rem;">✦ posts con <strong style="color:var(--accent);">#${cleanTag}</strong></p>
                <p style="font-size:0.85rem; margin-top:0.3rem; color:var(--text-muted);">${filtered.length} entradas encontradas</p>
            </div>
        `;
        
        // Mostrar lista de títulos de los posts filtrados
        html += `<div style="margin-top:1rem;">`;
        filtered.forEach(p => {
            html += `<div style="padding:0.5rem 0; border-bottom:1px solid var(--border-color); cursor:pointer;" onclick="showPostById(${p.id})">`;
            html += `<span style="color:var(--text-secondary);">${formatDate(p.date)}</span> — `;
            html += `<span style="color:var(--text-primary);">${p.title}</span>`;
            html += `</div>`;
        });
        html += `</div>`;
        
        DOM.post.innerHTML = html;
    } else {
        DOM.post.innerHTML = `
            <div style="text-align:center; padding:2rem; opacity:0.4;">
                <p>✦ no hay posts con <strong style="color:var(--accent);">#${cleanTag}</strong></p>
            </div>
        `;
    }
}

// Función auxiliar para mostrar post por ID
function showPostById(id) {
    const post = state.posts.find(p => p.id === id);
    if (post) showPost(post);
}

// =============================================
// 9. FILTRAR POR FECHA (CORREGIDO)
// =============================================

function filtrarPorFecha(yearMonth) {
    if (!yearMonth) return;
    const filtered = state.posts.filter(p => p.date.startsWith(yearMonth));
    const label = yearMonth.length === 4 ? `año ${yearMonth}` : yearMonth;
    
    state.filteredPosts = filtered;
    renderList(filtered);
    setActiveFilter(label);
    
    if (filtered.length > 0) {
        let html = `
            <div style="text-align:center; padding:1rem 2rem; opacity:0.8;">
                <p style="font-size:1.1rem;">✦ ${label}</p>
                <p style="font-size:0.85rem; margin-top:0.3rem; color:var(--text-muted);">${filtered.length} entradas encontradas</p>
            </div>
        `;
        
        filtered.forEach(p => {
            html += `<div style="padding:0.5rem 0; border-bottom:1px solid var(--border-color); cursor:pointer;" onclick="showPostById(${p.id})">`;
            html += `<span style="color:var(--text-secondary);">${formatDate(p.date)}</span> — `;
            html += `<span style="color:var(--text-primary);">${p.title}</span>`;
            html += `</div>`;
        });
        
        DOM.post.innerHTML = html;
    } else {
        DOM.post.innerHTML = `
            <div style="text-align:center; padding:2rem; opacity:0.4;">
                <p>✦ no hay posts para ${label}</p>
            </div>
        `;
    }
}

// =============================================
// 10. BÚSQUEDA DE POSTS (CORREGIDO)
// =============================================

function buscarPosts(query) {
    if (!query || query.trim() === '') {
        state.filteredPosts = [...state.posts];
        renderList(state.filteredPosts);
        if (!state.currentPost) showWelcome();
        // Restaurar el filtro activo si existe
        if (state.currentFilter) {
            setActiveFilter(state.currentFilter);
        }
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const filtered = state.posts.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        p.content.toLowerCase().includes(searchTerm) ||
        p.tags.some(t => t.toLowerCase().includes(searchTerm))
    );
    
    state.filteredPosts = filtered;
    renderList(filtered);
    
    if (filtered.length > 0) {
        let html = `
            <div style="text-align:center; padding:1rem 2rem; opacity:0.8;">
                <p style="font-size:1.1rem;">🔍 Resultados para "<strong style="color:var(--accent);">${searchTerm}</strong>"</p>
                <p style="font-size:0.85rem; margin-top:0.3rem; color:var(--text-muted);">${filtered.length} entradas encontradas</p>
            </div>
        `;
        
        filtered.forEach(p => {
            html += `<div style="padding:0.5rem 0; border-bottom:1px solid var(--border-color); cursor:pointer;" onclick="showPostById(${p.id})">`;
            html += `<span style="color:var(--text-secondary);">${formatDate(p.date)}</span> — `;
            html += `<span style="color:var(--text-primary);">${p.title}</span>`;
            html += `</div>`;
        });
        
        DOM.post.innerHTML = html;
    } else {
        DOM.post.innerHTML = `
            <div style="text-align:center; padding:2rem; opacity:0.4;">
                <p>✦ no se encontraron resultados para "<strong>${searchTerm}</strong>"</p>
            </div>
        `;
    }
}

// =============================================
// 11. MODO LECTURA (CORREGIDO)
// =============================================

function toggleModoLectura() {
    state.isReadingMode = !state.isReadingMode;
    document.body.classList.toggle('lectura', state.isReadingMode);
    
    if (DOM.modoLecturaBtn) {
        DOM.modoLecturaBtn.textContent = state.isReadingMode ? '✕ Salir Lectura' : '📖 Modo Lectura';
        DOM.modoLecturaBtn.style.background = state.isReadingMode ? 'var(--accent)' : 'transparent';
        DOM.modoLecturaBtn.style.color = state.isReadingMode ? 'var(--bg-primary)' : 'var(--text-secondary)';
        DOM.modoLecturaBtn.style.borderColor = state.isReadingMode ? 'var(--accent)' : 'var(--border-color)';
    }
    
    // Si estamos en modo lectura y no hay post seleccionado
    if (state.isReadingMode && !state.currentPost) {
        DOM.post.innerHTML = `
            <div style="text-align:center; padding:2rem; opacity:0.6;">
                <p>📖 Selecciona un post para leer en modo lectura</p>
            </div>
        `;
    }
}

// =============================================
// 12. FUNCIONES DE UTILIDAD
// =============================================

function setActiveFilter(label) {
    if (!DOM.activeFilter) return;
    DOM.activeFilter.textContent = label || '';
    DOM.activeFilter.style.display = label ? 'inline-block' : 'none';
    state.currentFilter = label || null;
}

function clearActiveFilter() {
    setActiveFilter(null);
    state.filteredPosts = [...state.posts];
    renderList(state.filteredPosts);
    state.currentFilter = null;
    if (!state.isReadingMode) {
        showWelcome();
    }
}

function mostrarTodos() {
    clearActiveFilter();
    state.currentPost = null;
    state.filteredPosts = [...state.posts];
    renderList(state.filteredPosts);
    
    if (state.isReadingMode) {
        toggleModoLectura();
    }
    
    showWelcome();
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
    } catch (e) {}
    return dateStr;
}

// =============================================
// 13. EVENTOS
// =============================================

// Toggle constelación
if (DOM.toggleTags) {
    DOM.toggleTags.addEventListener('click', () => {
        if (!DOM.tags) return;
        DOM.tags.classList.toggle('active');
        if (DOM.tags.classList.contains('active')) {
            setTimeout(renderTags, 100);
        }
    });
}

// Cerrar constelación al hacer clic fuera
document.addEventListener('click', (e) => {
    if (DOM.tags?.classList.contains('active') &&
        !DOM.tags.contains(e.target) &&
        e.target !== DOM.toggleTags) {
        DOM.tags.classList.remove('active');
    }
});

// Limpiar filtro
if (DOM.activeFilter) {
    DOM.activeFilter.addEventListener('click', clearActiveFilter);
}

// =============================================
// 14. INICIAR
// =============================================

document.addEventListener('DOMContentLoaded', init);

// =============================================
// 15. FUNCIONES GLOBALES
// =============================================

window.mostrarTodos = mostrarTodos;
window.toggleModoLectura = toggleModoLectura;
window.filtrarPorTag = filtrarPorTag;
window.filtrarPorFecha = filtrarPorFecha;
window.clearActiveFilter = clearActiveFilter;
window.buscarPosts = buscarPosts;
window.showPostById = showPostById;