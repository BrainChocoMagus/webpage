// ============================================
// 1. REFERENCIAS A ELEMENTOS DEL DOM
// ============================================

const list = document.getElementById("list");           // Lista de posts
const post = document.getElementById("post");           // Área para mostrar el contenido del post
const tagsDiv = document.getElementById("tags");        // Contenedor de constelación de tags
const toggleTagsBtn = document.getElementById("toggleTags"); // Botón para mostrar/ocultar constelación
const activeFilter = document.getElementById("activeFilter"); // Muestra el filtro activo
const dateMenu = document.getElementById("dateMenu");   // Menú de fechas (aunque no se usa directamente)

// ============================================
// 2. VARIABLES GLOBALES
// ============================================

let posts = [];           // Array para almacenar todos los posts
let tagsSet = new Set();  // Set para almacenar tags únicos
let currentFilter = null; // Para rastrear el filtro actual

// ============================================
// 3. CONFIGURACIÓN
// ============================================

const POSTS_FOLDER = "posts/"; // Carpeta donde están los archivos de posts

// ============================================
// 4. FUNCIÓN PRINCIPAL: CARGAR POSTS
// ============================================

/**
 * Carga los posts desde la carpeta especificada
 * 1. Lee posts.json que contiene la lista de archivos
 * 2. Carga cada archivo de texto
 * 3. Parsea el contenido
 * 4. Renderiza la lista y los tags
 */
function cargarPosts() {
    // Paso 1: Cargar el archivo JSON que lista todos los posts
    fetch(`${POSTS_FOLDER}posts.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No se pudo cargar posts.json: ${response.status}`);
            }
            return response.json();
        })
        .then(files => {
            console.log(`📋 Cargando ${files.length} posts...`);
            
            // Paso 2: Cargar cada archivo de post en paralelo
            return Promise.all(
                files.map(fileName => 
                    fetch(`${POSTS_FOLDER}${fileName}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`No se pudo cargar ${fileName}: ${response.status}`);
                            }
                            return response.text();
                        })
                        .catch(err => {
                            console.error(`❌ Error cargando ${fileName}:`, err);
                            return null; // Si falla un archivo, continuamos con los demás
                        })
                )
            );
        })
        .then(textos => {
            // Paso 3: Parsear todos los textos que se cargaron correctamente
            textos.forEach(text => {
                if (text) parsePost(text);
            });
            
            // Ordenar posts por fecha (más reciente primero)
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            console.log(`✅ ${posts.length} posts cargados correctamente`);
            console.log(`🏷️ ${tagsSet.size} tags encontrados`);
            
            // Paso 4: Renderizar todo
            renderList(posts);
            renderTags(); // Renderizar tags incluso si está oculto
            
            // Mostrar mensaje de bienvenida
            post.innerHTML = `
                <p style="opacity:0.6; text-align:center; padding:2rem 0;">
                    ✦ selecciona un post para leer ✦
                </p>
            `;
        })
        .catch(err => {
            // Manejo de errores
            console.error("❌ ERROR CRÍTICO:", err);
            post.innerHTML = `
                <div style="text-align:center; padding:2rem; color:#b89cff; opacity:0.6;">
                    <p>⚠️ Error al cargar los posts</p>
                    <p style="font-size:0.8rem; margin-top:1rem;">
                        Asegúrate de que la carpeta "${POSTS_FOLDER}" existe y contiene:<br>
                        1. posts.json con la lista de archivos<br>
                        2. Los archivos .txt de los posts
                    </p>
                    <p style="font-size:0.7rem; margin-top:1rem; opacity:0.5;">
                        ${err.message}
                    </p>
                </div>
            `;
        });
}

// ============================================
// 5. PARSEAR UN POST
// ============================================

/**
 * Analiza el texto de un post y extrae sus metadatos
 * Formato esperado:
 *   # Título
 *   date: 2026-01-15
 *   tags: tag1, tag2, tag3
 *   image: imagen.jpg
 *   ---
 *   Contenido del post...
 */
function parsePost(text) {
    const lines = text.split("\n");
    
    // Extraer título (primera línea que comienza con #)
    const titleLine = lines.find(l => l.startsWith("#"));
    const title = titleLine ? titleLine.replace("#", "").trim() : "Sin título";
    
    // Extraer fecha
    const dateLine = lines.find(l => l.startsWith("date:"));
    const date = dateLine ? dateLine.replace("date:", "").trim() : new Date().toISOString().split('T')[0];
    
    // Extraer tags
    const tagsLine = lines.find(l => l.startsWith("tags:"));
    const tags = tagsLine 
        ? tagsLine.replace("tags:", "").split(",").map(t => t.trim()).filter(t => t)
        : [];
    
    // Agregar tags al Set global (para evitar duplicados)
    tags.forEach(t => tagsSet.add(t));
    
    // Extraer imagen
    const imageLine = lines.find(l => l.startsWith("image:"));
    const image = imageLine ? imageLine.replace("image:", "").trim() : null;
    
    // Extraer contenido (todo después de ---)
    const contentParts = text.split("---");
    const content = contentParts.length > 1 ? contentParts[1].trim() : text;
    
    // Guardar el post en el array global
    posts.push({ 
        title, 
        date, 
        tags, 
        image, 
        content
    });
}

// ============================================
// 6. RENDERIZAR LISTA DE POSTS
// ============================================

/**
 * Muestra la lista de posts en el panel izquierdo
 * @param {Array} arr - Array de posts a mostrar
 */
function renderList(arr) {
    list.innerHTML = "";
    
    if (arr.length === 0) {
        list.innerHTML = '<div style="opacity:0.4; text-align:center; padding:1rem;">✦ no hay posts ✦</div>';
        return;
    }
    
    arr.forEach(p => {
        const div = document.createElement("div");
        
        // Formatear fecha para mostrar
        let fechaMostrada = p.date;
        try {
            const fecha = new Date(p.date);
            if (!isNaN(fecha)) {
                fechaMostrada = fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch(e) {
            // Si falla, usar la fecha como está
        }
        
        // Mostrar título con fecha
        div.textContent = `${fechaMostrada} — ${p.title}`;
        
        // Al hacer clic, mostrar el post completo
        div.onclick = () => mostrarPost(p);
        
        list.appendChild(div);
    });
}

// ============================================
// 7. MOSTRAR UN POST COMPLETO
// ============================================

/**
 * Muestra el contenido completo de un post en el área principal
 * @param {Object} p - Objeto del post a mostrar
 */
function mostrarPost(p) {
    // Construir el HTML del post
    let html = `<h2>${p.title}</h2>`;
    
    // Agregar metadatos (fecha y tags)
    html += `<div style="opacity:0.6; font-size:0.85rem; margin:0.5rem 0 1.5rem 0;">`;
    html += `📅 ${p.date}`;
    if (p.tags && p.tags.length > 0) {
        html += ` &nbsp;✦ ${p.tags.map(t => `#${t}`).join(' ')}`;
    }
    html += `</div>`;
    
    // Agregar imagen si existe
    if (p.image) {
        html += `<img src="${POSTS_FOLDER}${p.image}" class="post-image" alt="${p.title}">`;
    }
    
    // Agregar contenido (convertir saltos de línea a <br>)
    html += `<div style="margin-top:1.5rem;">`;
    html += p.content.replace(/\n/g, "<br>");
    html += `</div>`;
    
    // Agregar pie de página
    html += `<div style="margin-top:2rem; padding-top:1rem; border-top:1px solid rgba(184,156,255,0.1); font-size:0.7rem; opacity:0.3;">`;
    html += `✦ publicado el ${p.date}`;
    html += `</div>`;
    
    post.innerHTML = html;
    
    // Activar modo lectura automáticamente
    document.body.classList.add("lectura");
}

// ============================================
// 8. RENDERIZAR CONSTELACIÓN DE TAGS
// ============================================

/**
 * Crea una constelación visual de todos los tags
 * Los tags se distribuyen en un círculo dentro del contenedor
 */
function renderTags() {
    if (tagsSet.size === 0) return;
    
    tagsDiv.innerHTML = "";
    const tags = Array.from(tagsSet);
    
    // Obtener dimensiones del contenedor
    const rect = tagsDiv.getBoundingClientRect();
    const width = rect.width || tagsDiv.offsetWidth || 700;
    const height = rect.height || tagsDiv.offsetHeight || 300;
    
    // Calcular centro y radio
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    // Distribuir tags en círculo
    const angleStep = (Math.PI * 2) / tags.length;
    
    tags.forEach((tag, i) => {
        const el = document.createElement("div");
        el.className = "tag";
        el.textContent = `#${tag}`;
        
        // Posición circular
        const angle = angleStep * i - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // Aplicar posición
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = "translate(-50%, -50%)";
        
        // Tamaño variable según cantidad de tags
        const baseSize = 0.7;
        const sizeVariation = tags.length < 10 ? 0.3 : 0.1;
        el.style.fontSize = `${baseSize + sizeVariation}rem`;
        
        // Al hacer clic en un tag, filtrar por ese tag
        el.onclick = (e) => {
            e.stopPropagation();
            filtrarPorTag(tag);
        };
        
        tagsDiv.appendChild(el);
    });
}

// ============================================
// 9. TOGGLE CONSTELACIÓN DE TAGS
// ============================================

// Mostrar/ocultar la constelación de tags
toggleTagsBtn.onclick = () => {
    tagsDiv.classList.toggle("active");
    
    // Si se está mostrando, renderizar tags
    if (tagsDiv.classList.contains("active")) {
        // Esperar un poco para que el contenedor tenga dimensiones
        setTimeout(renderTags, 50);
    }
};

// Cerrar constelación al hacer clic fuera
document.addEventListener('click', (e) => {
    if (tagsDiv.classList.contains('active') && 
        !tagsDiv.contains(e.target) && 
        e.target !== toggleTagsBtn) {
        tagsDiv.classList.remove('active');
    }
});

// ============================================
// 10. FILTROS
// ============================================

/**
 * Filtra posts por tag
 * @param {string} tag - Tag por el que filtrar
 */
function filtrarPorTag(tag) {
    const filtrados = posts.filter(p => p.tags && p.tags.includes(tag));
    renderList(filtrados);
    setActiveFilter(`#${tag}`);
    tagsDiv.classList.remove('active'); // Ocultar constelación
    
    // Mostrar mensaje de filtro activo
    post.innerHTML = `
        <div style="text-align:center; padding:2rem; opacity:0.6;">
            <p>✦ posts con <strong style="color:#b89cff;">#${tag}</strong></p>
            <p style="font-size:0.8rem; margin-top:0.5rem;">${filtrados.length} entradas encontradas</p>
        </div>
    `;
}

/**
 * Filtra posts por año o año-mes
 * @param {string} yearMonth - Año (YYYY) o año-mes (YYYY-MM)
 */
function filtrarPorFecha(yearMonth) {
    const filtrados = posts.filter(p => 
        p.date && p.date.startsWith(yearMonth)
    );
    
    // Crear etiqueta legible
    let label = yearMonth;
    if (yearMonth.length === 4) {
        label = `año ${yearMonth}`;
    } else if (yearMonth.length === 7) {
        const [year, month] = yearMonth.split('-');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        label = `${meses[parseInt(month)-1]} ${year}`;
    }
    
    renderList(filtrados);
    setActiveFilter(label);
    
    // Mostrar mensaje de filtro activo
    post.innerHTML = `
        <div style="text-align:center; padding:2rem; opacity:0.6;">
            <p>✦ ${label}</p>
            <p style="font-size:0.8rem; margin-top:0.5rem;">${filtrados.length} entradas encontradas</p>
        </div>
    `;
}

// ============================================
// 11. FUNCIONES DE UTILIDAD
// ============================================

/**
 * Establece el filtro activo en la interfaz
 * @param {string} label - Etiqueta del filtro
 */
function setActiveFilter(label) {
    activeFilter.textContent = label;
    activeFilter.style.display = "block";
    currentFilter = label;
}

/**
 * Limpia el filtro activo y muestra todos los posts
 */
function clearActiveFilter() {
    activeFilter.textContent = "";
    activeFilter.style.display = "none";
    currentFilter = null;
    renderList(posts);
    
    // Restaurar mensaje de bienvenida
    if (!post.querySelector('h2')) {
        post.innerHTML = `
            <p style="opacity:0.6; text-align:center; padding:2rem 0;">
                ✦ selecciona un post para leer ✦
            </p>
        `;
    }
}

// Hacer click en el filtro activo lo limpia
activeFilter.onclick = clearActiveFilter;

/**
 * Muestra todos los posts (limpia cualquier filtro)
 */
function mostrarTodos() {
    clearActiveFilter();
    document.body.classList.remove("lectura");
}

/**
 * Alterna el modo lectura (oculta lista y tags)
 */
function modoLectura() {
    document.body.classList.toggle("lectura");
}

// ============================================
// 12. INICIALIZAR LA APLICACIÓN
// ============================================

// Cargar los posts cuando la página esté lista
cargarPosts();

// ============================================
// 13. MENSAJES DE CONSOLA PARA DEBUG
// ============================================

console.log('📖 Archivo personal cargado');
console.log('📁 Los posts deben estar en la carpeta "posts/"');
console.log('📄 El archivo posts.json debe listar los archivos .txt');
console.log('📝 Ejemplo de posts.json: ["2026-01-15-mi-post.txt", "2026-01-20-otro-post.txt"]');
console.log('✨ Estilo visual: tema oscuro con acentos morados');