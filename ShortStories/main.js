// =============================================
// 1. TUS POSTS - ¡AÑADE AQUÍ TUS TEXTOS!
// =============================================

const POSTS_DATA = [
    {
        title: "First",
        date: "2025-12-01",
        tags: ["primero", "inicio"],
        image: null,
        content: "Este es mi primer post en el archivo personal.\n\nBienvenidos a mi espacio de reflexiones y pensamientos."
    },
    {
        title: "Haiku de Invierno",
        date: "2025-12-15",
        tags: ["haiku", "poesía", "invierno"],
        image: null,
        content: "Nieve cayendo,\nsilencio blanco y frío,\npaz en el alma.\n\nEl viento susurra\nentre las ramas desnudas,\nmelodía triste."
    },
    {
        title: "Small Image",
        date: "2025-12-21",
        tags: ["image", "arte", "dibujo"],
        image: "https://www.newgrounds.com/dump/draw/0aff9772193c4c53a089376b6337238f",
        content: "My wambo wombo hurts\n\nEste es un dibujo que hice mientras experimentaba con nuevas técnicas.\n\nEl arte es una forma de expresar lo que las palabras no pueden decir."
    },
    {
        title: "Haiku de Otoño",
        date: "2026-09-01",
        tags: ["haiku", "poesía", "otoño"],
        image: null,
        content: "Hojas que caen,\npintando el suelo de oro,\notoño llega.\n\nEl viento juega\ncon los colores del sol,\nmelancolía."
    }
    // =========================================
    // AÑADE MÁS POSTS AQUÍ
    // =========================================
];

// =============================================
// 2. ESTADO DE LA APLICACIÓN
// =============================================

const state = {
    posts: [],
    tags: new Set(),
    currentFilter: null,
    currentPost: null,
    isReadingMode: false   // NUEVO: para rastrear el modo lectura
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
    modoLecturaBtn: document.getElementById('modoLecturaBtn')  // NUEVO
};

// =============================================
// 4. INICIALIZACIÓN
// =============================================

function init() {
    console.log('📖 Iniciando Archivo Personal...');
    
    state.posts = POSTS_DATA.map((p, index) => ({ ...p, id: index }));
    state.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    state.posts.forEach(post => {
        post.tags.forEach(tag => {
            state.tags.add(tag.trim().toLowerCase());
        });
    });
    
    console.log(`✅ ${state.posts.length} posts cargados`);
    console.log(`🏷️ ${state.tags.size} tags encontrados`);
    
    renderList(state.posts);
    renderTags();
    updatePostCount();
    showWelcome();
}

// =============================================
// 5. MODO LECTURA MEJORADO
// =============================================

function toggleModoLectura() {
    state.isReadingMode = !state.isReadingMode;
    document.body.classList.toggle('lectura', state.isReadingMode);
    
    // Cambiar el texto del botón
    if (DOM.modoLecturaBtn) {
        DOM.modoLecturaBtn.textContent = state.isReadingMode ? '✕ Salir Lectura' : '📖 Modo Lectura';
    }
    
    // Si estamos en modo lectura y no hay post seleccionado, mostrar mensaje
    if (state.isReadingMode && !state.currentPost) {
        DOM.post.innerHTML = `
            <div style="text-align:center; padding:2rem; opacity:0.6;">
                <p>📖 Selecciona un post para leer en modo lectura</p>
            </div>
        `;
    }
}

// =============================================
// 6. MOSTRAR POST (ahora con modo lectura automático)
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
            `<span onclick="filtrarPorTag('${tag}')">#${tag}</span>`
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
    
    // Si estamos en modo lectura, mantenerlo, si no, activarlo
    if (!state.isReadingMode) {
        toggleModoLectura(); // Activar modo lectura automáticamente al seleccionar un post
    }
}

// =============================================
// 7. MOSTRAR TODOS (con limpieza de modo lectura)
// =============================================

function mostrarTodos() {
    clearActiveFilter();
    state.currentPost = null;
    
    // Si estamos en modo lectura, salir
    if (state.isReadingMode) {
        toggleModoLectura();
    }
    
    renderList(state.posts);
    showWelcome();
}

// =============================================
// 8. CONSTELACIÓN DE TAGS (mejorada)
// =============================================

function renderTags() {
    if (!DOM.tags || state.tags.size === 0) {
        DOM.tags.innerHTML = '<div style="color: var(--text-muted); text-align:center; padding:1rem;">✦ sin tags ✦</div>';
        return;
    }
    
    DOM.tags.innerHTML = '';
    const tags = Array.from(state.tags);
    
    const rect = DOM.tags.getBoundingClientRect();
    const size = Math.min(rect.width || 350, rect.height || 350);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(size * 0.38, 130);
    const angleStep = (Math.PI * 2) / tags.length;
    
    tags.forEach((tag, i) => {
        const el = document.createElement('div');
        el.className = 'tag';
        el.textContent = `#${tag}`;
        
        const angle = angleStep * i - Math.PI / 2;
        const variation = 1 + (Math.random() - 0.5) * 0.15;
        const x = centerX + radius * Math.cos(angle) * variation;
        const y = centerY + radius * Math.sin(angle) * variation;
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = 'translate(-50%, -50%)';
        
        const baseSize = Math.max(0.7, 1.2 - (tags.length / 30));
        el.style.fontSize = `${baseSize + 0.1}rem`;
        
        // Colores personalizables
        const hue = 260 + (i * 15) % 60;
        el.style.color = `hsl(${hue}, 70%, 75%)`;
        
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            filtrarPorTag(tag);
        });
        
        DOM.tags.appendChild(el);
    });
}

// =============================================
// 9. FILTROS (sin cambios)
// =============================================

function filtrarPorTag(tag) {
    if (!tag) return;
    const cleanTag = tag.trim().toLowerCase();
    const filtered = state.posts.filter(p => 
        p.tags.some(t => t.trim().toLowerCase() === cleanTag)
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
    const filtered = state.posts.filter(p => p.date.startsWith(yearMonth));
    const label = yearMonth.length === 4 ? `año ${yearMonth}` : yearMonth;
    
    renderList(filtered);
    setActiveFilter(label);
    
    DOM.post.innerHTML = `
        <div style="text-align:center; padding:2rem; opacity:0.6;">
            <p>✦ ${label}</p>
            <p style="font-size:0.8rem; margin-top:0.5rem;">${filtered.length} entradas</p>
        </div>
    `;
}

// =============================================
// 10. FUNCIONES DE UTILIDAD
// =============================================

function setActiveFilter(label) {
    if (!DOM.activeFilter) return;
    DOM.activeFilter.textContent = label || '';
    DOM.activeFilter.style.display = label ? 'inline-block' : 'none';
}

function clearActiveFilter() {
    setActiveFilter(null);
    renderList(state.posts);
    if (!state.isReadingMode) {
        showWelcome();
    }
}

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

function updatePostCount() {
    if (DOM.postCount) {
        DOM.postCount.textContent = state.posts.length || 0;
    }
}

function showWelcome() {
    if (!state.isReadingMode) {
        DOM.post.innerHTML = `
            <div class="welcome-message">
                <p>✦ selecciona un post para leer ✦</p>
            </div>
        `;
    }
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
// 11. EVENTOS
// =============================================

if (DOM.toggleTags) {
    DOM.toggleTags.addEventListener('click', () => {
        if (!DOM.tags) return;
        DOM.tags.classList.toggle('active');
        if (DOM.tags.classList.contains('active')) {
            setTimeout(renderTags, 150);
        }
    });
}

document.addEventListener('click', (e) => {
    if (DOM.tags?.classList.contains('active') &&
        !DOM.tags.contains(e.target) &&
        e.target !== DOM.toggleTags) {
        DOM.tags.classList.remove('active');
    }
});

if (DOM.activeFilter) {
    DOM.activeFilter.addEventListener('click', clearActiveFilter);
}

// =============================================
// 12. INICIAR
// =============================================

document.addEventListener('DOMContentLoaded', init);

// =============================================
// 13. FUNCIONES GLOBALES
// =============================================

window.mostrarTodos = mostrarTodos;
window.toggleModoLectura = toggleModoLectura;
window.filtrarPorTag = filtrarPorTag;
window.filtrarPorFecha = filtrarPorFecha;
window.clearActiveFilter = clearActiveFilter;