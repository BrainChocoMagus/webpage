const list = document.getElementById("list");
const post = document.getElementById("post");
const tagsDiv = document.getElementById("tags");
const toggleTagsBtn = document.getElementById("toggleTags");
const activeFilter = document.getElementById("activeFilter");
activeFilter.onclick = clearActiveFilter;


let posts = [];
let tagsSet = new Set();

// Cargar lista de archivos
fetch("posts.json")
  .then(r => r.json())
  .then(files => Promise.all(
    files.map(f => fetch(f).then(r => r.text()))
  ))
  .then(textos => {
    textos.forEach(parsePost);
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderList(posts);
  })
  .catch(err => console.error("ERROR:", err));

// Leer cada post
function parsePost(text) {
  const lines = text.split("\n");

  const title = lines[0].replace("#", "").trim();
  const date = lines.find(l => l.startsWith("date:"))
    ?.replace("date:", "").trim();

  const tags = lines.find(l => l.startsWith("tags:"))
    ?.replace("tags:", "")
    .split(",")
    .map(t => t.trim()) || [];

  tags.forEach(t => tagsSet.add(t));

  const content = text.split("---")[1]?.trim();

  const image = lines.find(l => l.startsWith("image:"))
  ?.replace("image:", "")
  .trim();

  posts.push({ title, date, tags, image,content });
}

// Render lista (diario)
function renderList(arr) {
  list.innerHTML = "";

  arr.forEach(p => {
    const div = document.createElement("div");

    // Título en la lista
    div.textContent = `${p.date} — ${p.title}`;

    div.onclick = () => {
      post.innerHTML = `
        <h2>${p.title}</h2>
        ${p.image ? `<img src="${p.image}" class="post-image">` : ""}
        <p>${p.content.replace(/\n/g, "<br>")}</p>
      `;

      // activa modo lectura automáticamente
      document.body.classList.add("lectura");
    };

    list.appendChild(div);
  });
}

// Render constelaciones (tags)
function renderTags() {
  tagsDiv.innerHTML = "";

  const radius = 100;
  const centerX = tagsDiv.offsetWidth / 2;
  const centerY = tagsDiv.offsetHeight / 2;

  const tags = Array.from(tagsSet);
  const step = (Math.PI * 2) / tags.length;

  tags.forEach((tag, i) => {
    const el = document.createElement("div");
    el.className = "tag";
    el.textContent = `#${tag}`;

    const angle = step * i;
    el.style.left = `${centerX + radius * Math.cos(angle)}px`;
    el.style.top = `${centerY + radius * Math.sin(angle)}px`;

    el.onclick = () => filtrarPorTag(tag);
    tagsDiv.appendChild(el);
  });
}


//toggle tags
toggleTagsBtn.onclick = () => {
  tagsDiv.classList.toggle("active");
  if (tagsDiv.classList.contains("active")) {
    renderTags();
  }
};

// Filtrar por tag
function filtrarPorTag(tag) {
  const filtrados = posts.filter(p => p.tags.includes(tag));
  renderList(filtrados);
  setActiveFilter(tag);
}

// Filtrar por año y mes
function filtrarPorFecha(year, month = "") {
  const filtro = posts.filter(p =>
    p.date && p.date.startsWith(`${year}-${month}`)
  );

  renderList(filtro);
  setActiveFilter(month ? `${year}-${month}` : year);
}

// Modo lectura
function modoLectura() {
  document.body.classList.toggle("lectura");
}


function mostrarTodos() {
  renderList(posts);
  document.body.classList.remove("lectura");
}

function filtrarPorFecha(year, month = "") {
  const filtro = posts.filter(p =>
    p.date && p.date.startsWith(`${year}-${month}`)
  );
  const label = month
    ? `${year}-${month}`
    : year;

  renderList(filtro);
  setActiveFilter(label);
}

function setActiveFilter(label) {
  activeFilter.textContent = label;
  activeFilter.style.display = "block";
}

function clearActiveFilter() {
  activeFilter.textContent = "";
  activeFilter.style.display = "none";

  renderList(posts);
}