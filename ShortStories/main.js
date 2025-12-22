const list = document.getElementById("list");
const post = document.getElementById("post");
const tagsDiv = document.getElementById("tags");

let posts = [];
let tagsSet = new Set();

// Cargar lista de archivos
fetch("listar.php")
  .then(r => r.json())
  .then(files => Promise.all(files.map(f => fetch(f).then(r => r.text()))))
  .then(textos => {
    textos.forEach(parsePost);
    renderTags();
    renderList(posts);
  });

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

  posts.push({ title, date, tags, content });
}

// Render lista (diario)
function renderList(arr) {
  list.innerHTML = "";
  arr.forEach(p => {
    const div = document.createElement("div");
    div.textContent = `${p.date} — ${p.title}`;
    div.onclick = () => {
      post.innerHTML = `
        <h2>${p.title}</h2>
        <p>${p.content.replace(/\n/g, "<br>")}</p>
      `;
    };
    list.appendChild(div);
  });
}

// Render constelaciones (tags)
function renderTags() {
  tagsDiv.innerHTML = "";
  tagsSet.forEach(tag => {
    const el = document.createElement("div");
    el.className = "tag";
    el.textContent = tag;

    el.style.left = Math.random() * 90 + "%";
    el.style.top = Math.random() * 90 + "%";

    el.onclick = () => filtrarPorTag(tag);
    tagsDiv.appendChild(el);
  });
}

// Filtrar por tag
function filtrarPorTag(tag) {
  renderList(posts.filter(p => p.tags.includes(tag)));
}

// Filtrar por año y mes
function filtrarPorFecha(year, month) {
  renderList(
    posts.filter(p => p.date.startsWith(`${year}-${month}`))
  );
}

// Modo lectura
function modoLectura() {
  document.body.classList.toggle("lectura");
}
