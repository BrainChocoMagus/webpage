// =============================================
// 1. DATOS DE LOS POSTS (¡AÑADE AQUÍ TUS TEXTOS!)
// =============================================
// Esta es la base de datos de tu blog.
// Para añadir un nuevo post, solo copia el formato
// y añádelo al array.
// =============================================

const POSTS_DATA = [
    {
        title: "First",                                              // Título del post
        date: "2025-12-01",                                          // Fecha (formato YYYY-MM-DD)
        tags: ["primero", "inicio"],                                 // Lista de tags (etiquetas)
        image: null,                                                 // URL de la imagen (o null)
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
    // AÑADE MÁS POSTS AQUÍ SIGUIENDO EL FORMATO
    // =========================================
];

// =============================================
// 2. ESTADO DE LA APLICACIÓN
// =============================================
// Aquí se guarda la información dinámica del blog

const state = {
    posts: [],          // Todos los posts (cargados desde POSTS_DATA)
    tags: new Set(),    // Conjunto de tags únicos
    currentFilter: null, // Filtro actual (null = sin filtro)
    currentPost: null   // Post que se está mostrando
};

// =============================================
// 3. REFERENCIAS A ELEMENTOS DEL DOM
// =============================================
// Acceso rápido a los elementos HTML que usaremos

const DOM = {
    list: document.getElementById('list'),           // Contenedor de la lista
    post: document.getElementById('post'),           // Contenedor del contenido
    tags: document.getElementById('tags'),           // Contenedor de la constelación
    toggleTags: document.getElementById('toggleTags'), // Botón de constelación
    activeFilter: document.getElementById('activeFilter'), // Filtro activo
    postCount: document.getElementById('postCount')  // Contador de posts
};

// =============================================
// 4. INICIALIZACIÓN
// =============================================
// Esta función se ejecuta al cargar la página

function init() {
    console.log('📖 Iniciando Archivo Personal...');
    
    // Copiar los datos y asignar un ID único a cada post
    state.posts = POSTS_DATA.map((p, index) => ({ ...p, id: index }));
    
    // Ordenar por fecha (más reciente primero)
    state.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Recolectar todos los tags únicos
    state.posts.forEach(post => {
        post.tags.forEach(tag => {
            state.tags.add(tag.trim().toLowerCase());
        });
    });
    
    console.log(`✅ ${state.posts.length} posts cargados`);
    console.log(`🏷️ ${state.tags.size} tags encontrados:`, Array.from(state.tags));
    
    // Renderizar la interfaz
    renderList(state.posts);
    renderTags();
    updatePostCount();
    showWelcome();
}

// =============================================
// 5. RENDERIZADO DE LA LISTA
// =============================================
// Muestra la lista de posts en el panel izquierdo

function renderList(posts) {
    if (!DOM.list) return;
    DOM.list.innerHTML = '';
    
    // Si no hay posts, mostrar mensaje
    if (!posts || posts.length === 0) {
        DOM.list.innerHTML = '<div style="opacity:0.4; text-align:center; padding:1rem;">✦ sin entradas ✦</div>';
        return;
    }
    
    // Crear un elemento por cada post
    posts.forEach(post => {
        const div = document.createElement('div');
        const date = formatDate(post.date);
        div.textContent = `${date} — ${post.title}`;
        div.dataset.id = post.id;
        
        // Resaltar el post activo
        if (state.currentPost && state.currentPost.id === post.id) {
            div.classList.add('active');
        }
        
        // Al hacer clic, mostrar el post
        div.addEventListener('click', () => showPost(post));
        DOM.list.appendChild(div);
    });
}

// =============================================
// 6. MOSTRAR UN POST
// =============================================
// Muestra el contenido completo de un post

function showPost(post) {
    if (!post) return;
    state.currentPost = post;
    
    // Actualizar la lista (resaltar el post activo)
    document.querySelectorAll('#list div').forEach(el => {
        const isActive = parseInt(el.dataset.id) === post.id;
        el.classList.toggle('active', isActive);
    });
    
    // Construir el HTML del post
    let html = `<h2>${post.title}</h2>`;
    
    // Metadatos: fecha y tags
    html += `<div class="meta">📅 ${post.date}`;
    if (post.tags && post.tags.length > 0) {
        html += ` &nbsp;✦ <span class="tags">`;
        html += post.tags.map(tag => 
            `<span onclick="filtrarPorTag('${tag}')">#${tag}</span>`
        ).join(' ');
        html += `</span>`;
    }
    html += `</div>`;
    
    // Imagen (si existe)
    if (post.image) {
        html += `<img src="${post.image}" class="post-image" alt="${post.title}" loading="lazy" onerror="this.style.display='none'">`;
    }
    
    // Contenido del post (convertir saltos de línea a <br>)
    html += `<div class="body">${post.content.replace(/\n/g, '<br>')}</div>`;
    
    // Pie del post
    html += `<div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-color); font-size:0.75rem; opacity:0.4;">✦ publicado el ${post.date}</div>`;
    
    // Insertar en el DOM
    DOM.post.innerHTML = html;
    
    // Activar modo lectura automáticamente
    document.body.classList.add('lectura');
}

// =============================================
// 7. CONSTELACIÓN DE TAGS
// =============================================
// Crea un círculo interactivo con todos los tags

function renderTags() {
    // Si no hay tags o no existe el contenedor
    if (!DOM.tags || state.tags.size === 0) {
        DOM.tags.innerHTML = '<div style="color: var(--text-muted); text-align:center; padding:1rem;">✦ sin tags ✦</div>';
        return;
    }
    
    DOM.tags.innerHTML = '';
    const tags = Array.from(state.tags);
    
    // Obtener dimensiones del contenedor
    const rect = DOM.tags.getBoundingClientRect();
    const size = Math.min(rect.width || 350, rect.height || 350);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(size * 0.38, 130); // Radio máximo 130px
    
    // Distribuir en círculo
    const angleStep = (Math.PI * 2) / tags.length;
    
    tags.forEach((tag, i) => {
        const el = document.createElement('div');
        el.className = 'tag';
        el.textContent = `#${tag}`;
        
        // Posición circular con variación aleatoria para aspecto orgánico
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
        
        // Colores sutiles para cada tag
        const hue = 260 + (i * 15) % 60;
        el.style.color = `hsl(${hue}, 70%, 75%)`;
        
        // Al hacer clic en un tag, filtrar por él
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            filtrarPorTag(tag);
        });
        
        DOM.tags.appendChild(el);
    });
}

// =============================================
// 8. FUNCIONES DE FILTRO
// =============================================

// Filtrar posts por tag
function filtrarPorTag(tag) {
    if (!tag) return;
    const cleanTag = tag.trim().toLowerCase();
    
    // Buscar posts que tengan este tag
    const filtered = state.posts.filter(p => 
        p.tags.some(t => t.trim().toLowerCase() === cleanTag)
    );
    
    renderList(filtered);
    setActiveFilter(`#${cleanTag}`);
    DOM.tags.classList.remove('active'); // Cerrar constelación
    
    // Mostrar mensaje de filtro
    DOM.post.innerHTML = `
        <div style="text-align:center; padding:2rem; opacity:0.6;">
            <p>✦ posts con <strong style="color:var(--accent);">#${cleanTag}</strong></p>
            <p style="font-size:0.8rem; margin-top:0.5rem;">${filtered.length} entradas</p>
        </div>
    `;
}

// Filtrar posts por año o año-mes
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
// 9. FUNCIONES DE UTILIDAD
// =============================================

// Mostrar el filtro activo en la interfaz
function setActiveFilter(label) {
    if (!DOM.activeFilter) return;
    DOM.activeFilter.textContent = label || '';
    DOM.activeFilter.style.display = label ? 'inline-block' : 'none';
}

// Limpiar el filtro activo y mostrar todos los posts
function clearActiveFilter() {
    setActiveFilter(null);
    renderList(state.posts);
    showWelcome();
    document.body.classList.remove('lectura');
}

// Mostrar todos los posts (sin filtro)
function mostrarTodos() {
    clearActiveFilter();
    state.currentPost = null;
}

// Alternar modo lectura
function modoLectura() {
    document.body.classList.toggle('lectura');
}

// Actualizar el contador de posts en el footer
function updatePostCount() {
    if (DOM.postCount) {
        DOM.postCount.textContent = state.posts.length || 0;
    }
}

// Mostrar mensaje de bienvenida
function showWelcome() {
    DOM.post.innerHTML = `
        <div class="welcome-message">
            <p>✦ selecciona un post para leer ✦</p>
        </div>
    `;
}

// Formatear fecha para mostrar
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
// 10. EVENTOS
// =============================================

// Mostrar/ocultar constelación de tags
if (DOM.toggleTags) {
    DOM.toggleTags.addEventListener('click', () => {
        if (!DOM.tags) return;
        DOM.tags.classList.toggle('active');
        if (DOM.tags.classList.contains('active')) {
            setTimeout(renderTags, 150);
        }
    });
}

// Cerrar constelación al hacer clic fuera de ella
document.addEventListener('click', (e) => {
    if (DOM.tags?.classList.contains('active') &&
        !DOM.tags.contains(e.target) &&
        e.target !== DOM.toggleTags) {
        DOM.tags.classList.remove('active');
    }
});

// Limpiar filtro al hacer clic en el filtro activo
if (DOM.activeFilter) {
    DOM.activeFilter.addEventListener('click', clearActiveFilter);
}

// =============================================
// 11. INICIAR LA APLICACIÓN
// =============================================

// Ejecutar init cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', init);

// =============================================
// 12. EXPONER FUNCIONES GLOBALES
// =============================================
// Estas funciones están disponibles desde el HTML
// (para los onclick de los botones)

window.mostrarTodos = mostrarTodos;
window.modoLectura = modoLectura;
window.filtrarPorTag = filtrarPorTag;
window.filtrarPorFecha = filtrarPorFecha;
window.clearActiveFilter = clearActiveFilter;