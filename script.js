// ===== DATA LAYER =====
const DB={
  get(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))},
  getBooks(){return this.get('bv_books')},
  saveBooks(b){this.set('bv_books',b)},
  getRecs(){return this.get('bv_recs')},
  saveRecs(r){this.set('bv_recs',r)}
};

// ===== NAVIGATION =====
const pages=document.querySelectorAll('.page');
const navLinks=document.querySelectorAll('.nav-link');
const navToggle=document.getElementById('navToggle');
const navLinksContainer=document.getElementById('navLinks');

function navigateTo(pageId){
  pages.forEach(p=>p.classList.remove('active'));
  navLinks.forEach(l=>l.classList.remove('active'));
  const page=document.getElementById('page-'+pageId);
  if(page)page.classList.add('active');
  document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');
  navLinksContainer.classList.remove('open');
  navToggle.classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
  if(pageId==='library')renderLibrary();
  if(pageId==='home')renderHome();
  if(pageId==='recommendations')renderRecommendations();
  if(pageId==='stats')renderStats();
}

navLinks.forEach(l=>l.addEventListener('click',e=>{e.preventDefault();navigateTo(l.dataset.page)}));
navToggle.addEventListener('click',()=>{navToggle.classList.toggle('open');navLinksContainer.classList.toggle('open')});
document.getElementById('logoHome').addEventListener('click',e=>{e.preventDefault();navigateTo('home')});

// Scroll effect
window.addEventListener('scroll',()=>{document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50)});

// ===== TOAST =====
function showToast(msg,type='success'){
  const c=document.getElementById('toastContainer');
  const icons={success:'✅',error:'❌',info:'ℹ️'};
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<span class="toast-icon">${icons[type]}</span><span class="toast-message">${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  c.appendChild(t);
  setTimeout(()=>{t.style.animation='toastOut .3s ease forwards';setTimeout(()=>t.remove(),300)},3500);
}

// ===== STAR RATING =====
let currentRating=0;
const starBtns=document.querySelectorAll('.star-btn');
const ratingText=document.getElementById('ratingText');
const ratingLabels=['','Péssimo','Ruim','Regular','Bom','Excelente'];

starBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    currentRating=parseInt(btn.dataset.star);
    updateStars();
  });
  btn.addEventListener('mouseenter',()=>{
    const v=parseInt(btn.dataset.star);
    starBtns.forEach(b=>b.classList.toggle('active',parseInt(b.dataset.star)<=v));
  });
});
document.getElementById('starRatingInput')?.addEventListener('mouseleave',updateStars);

function updateStars(){
  starBtns.forEach(b=>b.classList.toggle('active',parseInt(b.dataset.star)<=currentRating));
  ratingText.textContent=currentRating?ratingLabels[currentRating]:'Sem avaliação';
}

// ===== COVER PREVIEW =====
const coverInput=document.getElementById('bookCover');
const coverPreview=document.getElementById('coverPreview');
let selectedColor='#6C5CE7';

coverInput?.addEventListener('input',()=>{
  const url=coverInput.value.trim();
  if(url){coverPreview.innerHTML=`<img src="${url}" onerror="this.parentElement.innerHTML='<div class=cover-placeholder><span class=cover-placeholder-icon>📖</span><span>Imagem inválida</span></div>'">`}
  else{coverPreview.innerHTML='<div class="cover-placeholder"><span class="cover-placeholder-icon">📖</span><span>Capa do Livro</span></div>'}
});

document.querySelectorAll('.color-swatch').forEach(s=>{
  s.addEventListener('click',()=>{
    document.querySelectorAll('.color-swatch').forEach(x=>x.classList.remove('active'));
    s.classList.add('active');
    selectedColor=s.dataset.color;
  });
});

// ===== ADD BOOK =====
document.getElementById('bookForm').addEventListener('submit',e=>{
  e.preventDefault();
  const title=document.getElementById('bookTitle').value.trim();
  const author=document.getElementById('bookAuthor').value.trim();
  const genre=document.getElementById('bookGenre').value;
  if(!title||!author||!genre){showToast('Preencha todos os campos obrigatórios!','error');return}
  const book={
    id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),
    title, author, genre,
    pages:parseInt(document.getElementById('bookPages').value)||0,
    year:parseInt(document.getElementById('bookYear').value)||0,
    status:document.getElementById('bookStatus').value,
    rating:currentRating,
    cover:document.getElementById('bookCover').value.trim(),
    color:selectedColor,
    description:document.getElementById('bookDescription').value.trim(),
    notes:document.getElementById('bookNotes').value.trim(),
    addedAt:new Date().toISOString(),
    recommended:false
  };
  const books=DB.getBooks();
  books.unshift(book);
  DB.saveBooks(books);
  showToast(`"${title}" adicionado à biblioteca!`);
  e.target.reset();
  currentRating=0;updateStars();
  coverPreview.innerHTML='<div class="cover-placeholder"><span class="cover-placeholder-icon">📖</span><span>Capa do Livro</span></div>';
  document.querySelectorAll('.color-swatch').forEach((s,i)=>s.classList.toggle('active',i===0));
  selectedColor='#6C5CE7';
  navigateTo('library');
});

// ===== RENDER BOOK CARD =====
function makeStars(n){return '★'.repeat(n)+'☆'.repeat(5-n)}
function statusBadge(s){
  const m={reading:['📖 Lendo','badge-reading'],read:['✅ Lido','badge-read'],want:['📌 Quero Ler','badge-want']};
  const[t,c]=m[s]||['',''];
  return`<span class="book-status-badge ${c}">${t}</span>`;
}

function renderBookCard(book){
  const coverHtml=book.cover
    ?`<img src="${book.cover}" alt="${book.title}" onerror="this.parentElement.innerHTML='<div class=book-cover-placeholder>📖</div>'">`
    :`<div class="book-cover-placeholder" style="background:${book.color||'#6C5CE7'}">📖</div>`;
  return`
  <div class="book-card" data-id="${book.id}" onclick="openBookModal('${book.id}')">
    <div class="book-card-actions">
      <button class="card-action-btn" onclick="event.stopPropagation();deleteBook('${book.id}')" title="Excluir">🗑️</button>
    </div>
    <div class="book-cover">${statusBadge(book.status)}${coverHtml}</div>
    <div class="book-info">
      <div class="book-title">${book.title}</div>
      <div class="book-author">${book.author}</div>
      <div class="book-meta">
        <span class="book-genre">${book.genre}</span>
        ${book.rating?`<span class="book-rating">${makeStars(book.rating)}</span>`:''}
      </div>
    </div>
  </div>`;
}

// ===== HOME PAGE =====
function renderHome(){
  const books=DB.getBooks();
  const recs=DB.getRecs();
  document.getElementById('statBooks').textContent=books.length;
  document.getElementById('statRead').textContent=books.filter(b=>b.status==='read').length;
  document.getElementById('statRecommendations').textContent=recs.length;

  const recentEl=document.getElementById('recentBooks');
  if(books.length===0){
    recentEl.innerHTML=`<div class="empty-state"><div class="empty-icon">📚</div><h3>Sua biblioteca está vazia</h3><p>Adicione seu primeiro livro para começar!</p><button class="btn btn-primary" onclick="navigateTo('add')">Adicionar Livro</button></div>`;
  }else{
    recentEl.innerHTML=books.slice(0,8).map(renderBookCard).join('');
  }

  const topSection=document.getElementById('topRatedSection');
  const rated=books.filter(b=>b.rating>0).sort((a,b)=>b.rating-a.rating);
  if(rated.length>0){
    topSection.style.display='block';
    document.getElementById('topRatedBooks').innerHTML=rated.slice(0,4).map(renderBookCard).join('');
  }else{topSection.style.display='none'}
}

// ===== LIBRARY =====
function renderLibrary(){
  const books=DB.getBooks();
  const container=document.getElementById('libraryBooks');
  const search=document.getElementById('searchInput').value.toLowerCase();
  const filter=document.querySelector('.chip.active')?.dataset.filter||'all';
  const sort=document.getElementById('sortSelect').value;

  let filtered=books.filter(b=>{
    const matchSearch=!search||b.title.toLowerCase().includes(search)||b.author.toLowerCase().includes(search)||b.genre.toLowerCase().includes(search);
    const matchFilter=filter==='all'||b.status===filter||(filter==='recommended'&&b.recommended);
    return matchSearch&&matchFilter;
  });

  filtered.sort((a,b)=>{
    if(sort==='title')return a.title.localeCompare(b.title);
    if(sort==='author')return a.author.localeCompare(b.author);
    if(sort==='rating')return(b.rating||0)-(a.rating||0);
    return new Date(b.addedAt)-new Date(a.addedAt);
  });

  if(filtered.length===0){
    container.innerHTML=`<div class="empty-state"><div class="empty-icon">🔍</div><h3>Nenhum livro encontrado</h3><p>Tente ajustar seus filtros ou adicione novos livros.</p><button class="btn btn-primary" onclick="navigateTo('add')">Adicionar Livro</button></div>`;
  }else{container.innerHTML=filtered.map(renderBookCard).join('')}
}

document.getElementById('searchInput')?.addEventListener('input',renderLibrary);
document.getElementById('sortSelect')?.addEventListener('change',renderLibrary);
document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
  c.classList.add('active');renderLibrary();
}));

// ===== DELETE BOOK =====
function deleteBook(id){
  if(!confirm('Tem certeza que deseja excluir este livro?'))return;
  let books=DB.getBooks().filter(b=>b.id!==id);
  DB.saveBooks(books);
  showToast('Livro excluído!','info');
  renderHome();renderLibrary();
}

// ===== BOOK MODAL =====
function openBookModal(id){
  const book=DB.getBooks().find(b=>b.id===id);
  if(!book)return;
  const modal=document.getElementById('bookModal');
  const coverHtml=book.cover
    ?`<img src="${book.cover}" alt="${book.title}">`
    :`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${book.color||'#6C5CE7'};font-size:5rem">📖</div>`;

  document.getElementById('modalBody').innerHTML=`
    <div class="modal-cover">${coverHtml}</div>
    <h2 class="modal-title">${book.title}</h2>
    <p class="modal-author">por ${book.author}</p>
    <div class="modal-meta">
      <span class="modal-meta-item">📂 ${book.genre}</span>
      ${book.pages?`<span class="modal-meta-item">📄 ${book.pages} páginas</span>`:''}
      ${book.year?`<span class="modal-meta-item">📅 ${book.year}</span>`:''}
      <span class="modal-meta-item">${statusBadge(book.status)}</span>
    </div>
    ${book.rating?`<div class="modal-rating"><div class="modal-stars">${makeStars(book.rating)}</div><span style="color:var(--text2);margin-left:.5rem">${ratingLabels[book.rating]}</span></div>`:''}
    ${book.description?`<div class="modal-section"><h3>📝 Sinopse</h3><p>${book.description}</p></div>`:''}
    ${book.notes?`<div class="modal-section"><h3>📌 Suas Anotações</h3><p>${book.notes}</p></div>`:''}
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="changeStatus('${book.id}')">🔄 Alterar Status</button>
      <button class="btn btn-secondary" onclick="editRating('${book.id}')">⭐ Avaliar</button>
      <button class="btn btn-danger" onclick="deleteBook('${book.id}');closeModal('bookModal')">🗑️ Excluir</button>
    </div>`;
  modal.classList.add('active');
}

function closeModal(id){document.getElementById(id).classList.remove('active')}
document.getElementById('modalClose').addEventListener('click',()=>closeModal('bookModal'));
document.getElementById('whatToReadClose').addEventListener('click',()=>closeModal('whatToReadModal'));
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('active')}));

function changeStatus(id){
  const books=DB.getBooks();
  const book=books.find(b=>b.id===id);
  if(!book)return;
  const order=['want','reading','read'];
  const idx=order.indexOf(book.status);
  book.status=order[(idx+1)%3];
  DB.saveBooks(books);
  const labels={want:'📌 Quero Ler',reading:'📖 Lendo',read:'✅ Lido'};
  showToast(`Status alterado para: ${labels[book.status]}`);
  openBookModal(id);renderHome();
}

function editRating(id){
  const val=prompt('Dê uma nota de 1 a 5 estrelas:','5');
  const n=parseInt(val);
  if(!n||n<1||n>5){showToast('Nota inválida! Use 1 a 5.','error');return}
  const books=DB.getBooks();
  const book=books.find(b=>b.id===id);
  if(book){book.rating=n;DB.saveBooks(books);showToast(`Avaliação atualizada: ${makeStars(n)}`);openBookModal(id);renderHome()}
}

// ===== WHAT TO READ =====
function whatToRead(){
  const books=DB.getBooks();
  if(books.length===0){showToast('Adicione livros primeiro!','error');return}
  const unread=books.filter(b=>b.status!=='read');
  const pool=unread.length>0?unread:books;
  const book=pool[Math.floor(Math.random()*pool.length)];
  const modal=document.getElementById('whatToReadModal');
  const coverHtml=book.cover
    ?`<img src="${book.cover}" alt="${book.title}" style="max-height:200px;border-radius:12px">`
    :`<div style="width:150px;height:200px;background:${book.color||'#6C5CE7'};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:4rem;margin:0 auto">📖</div>`;

  document.getElementById('whatToReadBody').innerHTML=`
    <div style="text-align:center;padding:1rem">
      <div style="font-size:3rem;margin-bottom:1rem;animation:bookFloat 2s infinite">🎲</div>
      <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:.5rem;color:var(--primary2)">Você deveria ler...</h2>
      <div style="margin:1.5rem 0">${coverHtml}</div>
      <h3 class="rec-result-title">${book.title}</h3>
      <p class="rec-result-author">por ${book.author}</p>
      ${book.rating?`<div class="rec-result-stars">${makeStars(book.rating)}</div>`:''}
      <div class="modal-meta" style="justify-content:center;margin:1rem 0">
        <span class="modal-meta-item">📂 ${book.genre}</span>
        ${book.pages?`<span class="modal-meta-item">📄 ${book.pages} pág.</span>`:''}
      </div>
      ${book.description?`<p class="rec-result-description">${book.description}</p>`:''}
      <p class="rec-magic-text">✨ Selecionado especialmente para você!</p>
      <div style="margin-top:1.5rem;display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="whatToRead()">🎲 Sortear Outro</button>
        <button class="btn btn-secondary" onclick="closeModal('whatToReadModal')">Fechar</button>
      </div>
    </div>`;
  modal.classList.add('active');
}

document.getElementById('heroWhatToRead')?.addEventListener('click',whatToRead);
document.getElementById('whatToReadBtn')?.addEventListener('click',whatToRead);

// ===== RECOMMENDATIONS =====
function renderRecommendations(){
  const books=DB.getBooks();
  const sel=document.getElementById('recBookSelect');
  sel.innerHTML='<option value="">Selecione um livro...</option>'+books.map(b=>`<option value="${b.id}">${b.title} - ${b.author}</option>`).join('');

  const recs=DB.getRecs();
  const feed=document.getElementById('recommendationsFeed');
  if(recs.length===0){
    feed.innerHTML=`<div class="empty-state"><div class="empty-icon">💡</div><h3>Nenhuma recomendação ainda</h3><p>Seja o primeiro a recomendar um livro!</p></div>`;
  }else{
    feed.innerHTML=recs.map((r,i)=>{
      const initials=(r.from||'A').substring(0,2).toUpperCase();
      return`<div class="rec-card">
        <div class="rec-card-header">
          <div class="rec-avatar">${initials}</div>
          <div class="rec-user-info">
            <div class="rec-username">${r.from||'Anônimo'}</div>
            <div class="rec-date">${new Date(r.date).toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
        <div class="rec-book-title">📖 ${r.bookTitle}</div>
        <div style="color:var(--warning);margin-bottom:.5rem">${r.bookRating?makeStars(r.bookRating):''}</div>
        <p class="rec-message">"${r.message}"</p>
        <div class="rec-card-footer">
          <button class="rec-action ${r.liked?'liked':''}" onclick="toggleLike(${i})">
            ${r.liked?'❤️':'🤍'} ${r.likes||0}
          </button>
        </div>
      </div>`}).join('');
  }
}

document.getElementById('recommendForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const bookId=document.getElementById('recBookSelect').value;
  const message=document.getElementById('recMessage').value.trim();
  if(!bookId){showToast('Selecione um livro!','error');return}
  if(!message){showToast('Escreva por que recomenda!','error');return}
  const book=DB.getBooks().find(b=>b.id===bookId);
  if(!book)return;
  const recs=DB.getRecs();
  recs.unshift({
    bookId:book.id,bookTitle:book.title,bookAuthor:book.author,bookRating:book.rating,
    message,from:document.getElementById('recFrom').value.trim()||'Anônimo',
    date:new Date().toISOString(),likes:0,liked:false
  });
  DB.saveRecs(recs);
  book.recommended=true;
  const books=DB.getBooks();
  const idx=books.findIndex(b=>b.id===book.id);
  if(idx>=0){books[idx]=book;DB.saveBooks(books)}
  showToast('Recomendação publicada!');
  e.target.reset();
  renderRecommendations();renderHome();
});

function toggleLike(i){
  const recs=DB.getRecs();
  if(recs[i]){
    recs[i].liked=!recs[i].liked;
    recs[i].likes=(recs[i].likes||0)+(recs[i].liked?1:-1);
    DB.saveRecs(recs);renderRecommendations();
  }
}

// ===== STATS =====
function renderStats(){
  const books=DB.getBooks();
  const read=books.filter(b=>b.status==='read');
  const reading=books.filter(b=>b.status==='reading');
  const want=books.filter(b=>b.status==='want');
  const totalPages=books.reduce((s,b)=>s+(b.pages||0),0);
  const rated=books.filter(b=>b.rating>0);
  const avgRating=rated.length?rated.reduce((s,b)=>s+b.rating,0)/rated.length:0;

  document.getElementById('totalBooksCount').textContent=books.length;
  document.getElementById('readBooksCount').textContent=read.length;
  document.getElementById('readingBooksCount').textContent=reading.length;
  document.getElementById('wantBooksCount').textContent=want.length;
  document.getElementById('totalPagesCount').textContent=totalPages.toLocaleString('pt-BR');
  document.getElementById('avgRatingValue').textContent=avgRating.toFixed(1);

  const pct=books.length?Math.round(read.length/books.length*100):0;
  document.getElementById('readingProgress').style.width=pct+'%';
  document.getElementById('progressText').textContent=`${pct}% dos livros lidos (${read.length}/${books.length})`;

  // Genre chart
  const genres={};
  books.forEach(b=>{genres[b.genre]=(genres[b.genre]||0)+1});
  const sorted=Object.entries(genres).sort((a,b)=>b[1]-a[1]);
  const max=sorted.length?sorted[0][1]:1;
  const chart=document.getElementById('genreChart');
  if(sorted.length===0){chart.innerHTML='<p style="color:var(--text3);text-align:center">Adicione livros para ver estatísticas de gênero.</p>'}
  else{chart.innerHTML=sorted.map(([g,c])=>`
    <div class="genre-bar">
      <span class="genre-bar-label">${g}</span>
      <div class="genre-bar-track"><div class="genre-bar-fill" style="width:${(c/max)*100}%">${c} livro${c>1?'s':''}</div></div>
    </div>`).join('')}
}

// ===== NAVIGATION BUTTONS =====
document.getElementById('heroExplore')?.addEventListener('click',()=>navigateTo('library'));
document.getElementById('seeAllRecent')?.addEventListener('click',()=>navigateTo('library'));
document.getElementById('addFirstBook')?.addEventListener('click',()=>navigateTo('add'));
document.getElementById('addBookFromLibrary')?.addEventListener('click',()=>navigateTo('add'));

// ===== SEED DATA =====
function seedIfEmpty(){
  if(DB.getBooks().length>0)return;
  const seed=[
    {id:'s1',title:'Dom Casmurro',author:'Machado de Assis',genre:'Romance',pages:256,year:1899,status:'read',rating:5,cover:'img/dom_casmurro.png',color:'#6C5CE7',description:'A história de Bentinho e Capitu, um dos maiores romances da literatura brasileira.',notes:'',addedAt:new Date(Date.now()-86400000*9).toISOString(),recommended:false},
    {id:'s2',title:'O Pequeno Príncipe',author:'Antoine de Saint-Exupéry',genre:'Ficção',pages:96,year:1943,status:'read',rating:5,cover:'img/pequeno_principe.png',color:'#E17055',description:'Um piloto perdido no deserto encontra um pequeno príncipe vindo de outro planeta.',notes:'',addedAt:new Date(Date.now()-86400000*8).toISOString(),recommended:false},
    {id:'s3',title:'1984',author:'George Orwell',genre:'Ficção Científica',pages:328,year:1949,status:'reading',rating:4,cover:'img/1984.png',color:'#2D3436',description:'Em um futuro distópico, o Grande Irmão controla tudo e todos.',notes:'',addedAt:new Date(Date.now()-86400000*7).toISOString(),recommended:false},
    {id:'s4',title:'Harry Potter e a Pedra Filosofal',author:'J.K. Rowling',genre:'Fantasia',pages:264,year:1997,status:'read',rating:5,cover:'img/harry_potter.png',color:'#0984E3',description:'Harry descobre que é um bruxo e começa sua jornada em Hogwarts.',notes:'',addedAt:new Date(Date.now()-86400000*6).toISOString(),recommended:false},
    {id:'s5',title:'A Revolução dos Bichos',author:'George Orwell',genre:'Ficção',pages:152,year:1945,status:'want',rating:0,cover:'img/revolucao_bichos.png',color:'#00B894',description:'Uma fábula sobre animais que se rebelam contra o fazendeiro.',notes:'',addedAt:new Date(Date.now()-86400000*5).toISOString(),recommended:false},
    {id:'s6',title:'O Alquimista',author:'Paulo Coelho',genre:'Aventura',pages:208,year:1988,status:'want',rating:0,cover:'img/alquimista.png',color:'#FDCB6E',description:'Santiago, um pastor de ovelhas, parte em busca de um tesouro no Egito.',notes:'',addedAt:new Date(Date.now()-86400000*4).toISOString(),recommended:false},
    {id:'s7',title:'Naruto',author:'Masashi Kishimoto',genre:'HQ/Mangá',pages:192,year:1999,status:'reading',rating:5,cover:'img/naruto.png',color:'#FF6B00',description:'Naruto Uzumaki, um jovem ninja com o sonho de se tornar Hokage, a maior autoridade de sua vila.',notes:'Dattebayo!',addedAt:new Date(Date.now()-86400000*3).toISOString(),recommended:false},
    {id:'s8',title:'Bleach',author:'Tite Kubo',genre:'HQ/Mangá',pages:200,year:2001,status:'reading',rating:4,cover:'img/bleach.png',color:'#1a1a2e',description:'Ichigo Kurosaki se torna um Shinigami e passa a proteger os vivos dos espíritos malignos.',notes:'',addedAt:new Date(Date.now()-86400000*2).toISOString(),recommended:false},
    {id:'s9',title:'Dragon Ball',author:'Akira Toriyama',genre:'HQ/Mangá',pages:180,year:1984,status:'read',rating:5,cover:'img/dragon_ball.png',color:'#FF9F43',description:'Goku, um garoto com cauda de macaco, parte em busca das Esferas do Dragão em uma aventura épica.',notes:'Kamehameha!',addedAt:new Date(Date.now()-86400000).toISOString(),recommended:false},
    {id:'s10',title:'One Piece',author:'Eiichiro Oda',genre:'HQ/Mangá',pages:200,year:1997,status:'reading',rating:5,cover:'img/one_piece.png',color:'#E74C3C',description:'Monkey D. Luffy e sua tripulação navegam pelo Grand Line em busca do tesouro One Piece.',notes:'O Rei dos Piratas!',addedAt:new Date().toISOString(),recommended:false}
  ];
  DB.saveBooks(seed);
  DB.saveRecs([{
    bookId:'s2',bookTitle:'O Pequeno Príncipe',bookAuthor:'Antoine de Saint-Exupéry',bookRating:5,
    message:'Um livro que todo mundo deveria ler pelo menos uma vez na vida. Cada releitura traz uma nova perspectiva!',
    from:'Maria Leitora',date:new Date(Date.now()-86400000*2).toISOString(),likes:3,liked:false
  },{
    bookId:'s4',bookTitle:'Harry Potter e a Pedra Filosofal',bookAuthor:'J.K. Rowling',bookRating:5,
    message:'O início de uma saga mágica que marcou gerações. Impossível não se apaixonar por Hogwarts!',
    from:'Pedro Mago',date:new Date(Date.now()-86400000).toISOString(),likes:5,liked:false
  }]);
}

// ===== PATCH SEED COVERS =====
function patchSeedCovers(){
  const coverMap={s1:'img/dom_casmurro.png',s2:'img/pequeno_principe.png',s3:'img/1984.png',s4:'img/harry_potter.png',s5:'img/revolucao_bichos.png',s6:'img/alquimista.png',s7:'img/naruto.png',s8:'img/bleach.png',s9:'img/dragon_ball.png',s10:'img/one_piece.png'};
  const books=DB.getBooks();
  let changed=false;
  books.forEach(b=>{
    if(coverMap[b.id] && b.cover !== coverMap[b.id]){
      b.cover = coverMap[b.id];
      changed = true;
    }
  });
  if(changed)DB.saveBooks(books);
}

// ===== STORE DATA =====
const STORE_CATALOG=[
  {id:'st1',title:'Dom Casmurro',author:'Machado de Assis',genre:'Romance',rating:5,cover:'img/dom_casmurro.png',color:'#6C5CE7',price:24.90,rentPrice:9.90,badge:'bestseller',description:'A história de Bentinho e Capitu, um dos maiores romances da literatura brasileira. Narrado em primeira pessoa por Bento Santiago, o romance explora ciúme, traição e memória.',pages:256},
  {id:'st2',title:'O Pequeno Príncipe',author:'Antoine de Saint-Exupéry',genre:'Ficção',rating:5,cover:'img/pequeno_principe.png',color:'#E17055',price:19.90,rentPrice:7.90,badge:'bestseller',description:'Um piloto perdido no deserto encontra um pequeno príncipe vindo de outro planeta. Uma fábula sobre amizade, amor e o sentido da vida.',pages:96},
  {id:'st3',title:'1984',author:'George Orwell',genre:'Ficção Científica',rating:4,cover:'img/1984.png',color:'#2D3436',price:29.90,rentPrice:11.90,badge:'',description:'Em um futuro distópico, o Grande Irmão controla tudo e todos. Winston Smith luta contra a opressão em um mundo sem liberdade.',pages:328},
  {id:'st4',title:'Harry Potter e a Pedra Filosofal',author:'J.K. Rowling',genre:'Fantasia',rating:5,cover:'img/harry_potter.png',color:'#0984E3',price:34.90,rentPrice:14.90,badge:'bestseller',description:'Harry descobre que é um bruxo e começa sua jornada em Hogwarts, a escola de magia e bruxaria.',pages:264},
  {id:'st5',title:'A Revolução dos Bichos',author:'George Orwell',genre:'Ficção',rating:4,cover:'img/revolucao_bichos.png',color:'#00B894',price:18.90,rentPrice:6.90,badge:'sale',description:'Uma fábula sobre animais que se rebelam contra o fazendeiro. Uma sátira política sobre poder e corrupção.',pages:152},
  {id:'st6',title:'O Alquimista',author:'Paulo Coelho',genre:'Aventura',rating:4,cover:'img/alquimista.png',color:'#FDCB6E',price:22.90,rentPrice:8.90,badge:'new',description:'Santiago, um pastor de ovelhas, parte em busca de um tesouro no Egito. Uma jornada de autodescoberta.',pages:208},
  {id:'st7',title:'O Cortiço',author:'Aluísio Azevedo',genre:'Romance',rating:4,cover:'',color:'#D63031',price:16.90,rentPrice:5.90,badge:'',description:'Um retrato realista da vida em um cortiço no Rio de Janeiro do século XIX. Personagens marcantes lutam pela sobrevivência.',pages:312},
  {id:'st8',title:'Frankenstein',author:'Mary Shelley',genre:'Terror',rating:4,cover:'',color:'#2D3436',price:21.90,rentPrice:8.90,badge:'new',description:'Victor Frankenstein cria uma criatura a partir de partes de cadáveres. Um clássico do terror e da ficção científica.',pages:280},
  {id:'st9',title:'Naruto Vol. 1',author:'Masashi Kishimoto',genre:'HQ/Mangá',rating:5,cover:'img/naruto.png',color:'#FF6B00',price:29.90,rentPrice:12.90,badge:'bestseller',description:'Naruto Uzumaki é um jovem ninja que carrega dentro de si a Raposa de Nove Caudas. Seu sonho é se tornar o Hokage!',pages:192},
  {id:'st10',title:'Bleach Vol. 1',author:'Tite Kubo',genre:'HQ/Mangá',rating:4,cover:'img/bleach.png',color:'#1a1a2e',price:27.90,rentPrice:11.90,badge:'',description:'Ichigo Kurosaki é um adolescente que pode ver espíritos. Quando uma Shinigami aparece, sua vida muda para sempre.',pages:200},
  {id:'st11',title:'Dragon Ball Vol. 1',author:'Akira Toriyama',genre:'HQ/Mangá',rating:5,cover:'img/dragon_ball.png',color:'#FF9F43',price:26.90,rentPrice:10.90,badge:'bestseller',description:'O jovem Goku parte em uma aventura épica para encontrar as sete Esferas do Dragão que concedem qualquer desejo.',pages:180},
  {id:'st12',title:'One Piece Vol. 1',author:'Eiichiro Oda',genre:'HQ/Mangá',rating:5,cover:'img/one_piece.png',color:'#E74C3C',price:28.90,rentPrice:11.90,badge:'bestseller',description:'Monkey D. Luffy comeu a Fruta Gomu Gomu e agora é um homem-borracha! Ele parte para o mar em busca do One Piece.',pages:200}
];

// Book content simulation (chapters)
const BOOK_CONTENT={
  'st1':[
    {title:'Capítulo I — Do Título',content:'<p>Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu. Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos. A viagem era curta, e os versos pode ser que não fossem inteiramente maus. Sucedeu, porém, que, como eu estava cansado, fechei os olhos três ou quatro vezes; tanto bastou para que ele interrompesse a leitura e metesse os versos no bolso.</p><p>— Continue, disse eu acordando.</p><p>— Já acabei, murmurou ele.</p><p>— São muito bonitos.</p><p>Vi-lhe fazer um gesto para tirá-los outra vez do bolso, mas não passou do gesto; estava amuado. No dia seguinte entrou a dizer de mim nomes feios, e acabou alcunhando-me Dom Casmurro. Os vizinhos, que não gostam dos meus hábitos reclusos e calados, deram curso à alcunha, que afinal pegou. Nem por isso me zanguei. Contei a anedota aos amigos da cidade, e eles, por graça, chamam-me assim, alguns em bilhetes.</p>'},
    {title:'Capítulo II — Do Livro',content:'<p>Agora que expliquei o título, passo a escrever o livro. Antes disso, porém, digamos os motivos que me põem a pena na mão.</p><p>Vivo só, com um criado. A casa em que moro é própria; fi-la construir de propósito, levado de um desejo tão particular que me vexa imprimi-lo, mas vá lá. Um dia, uma ideia me deu a vontade de reproduzir no Engenho Novo a casa em que me criei na antiga Rua de Matacavalos, dando-lhe o mesmo aspecto e economia daquela outra.</p><p>O meu fim evidente era atar as duas pontas da vida, e restaurar na velhice a adolescência. Pois, senhor, não consegui recompor o que foi nem o que fui.</p>'},
    {title:'Capítulo III — A Denúncia',content:'<p>Mas, vamos ao que trazia àquela tarde, que eu não posso esquecer, por mais que tente e teime. Era a confissão de minha mãe. Minha mãe era devota e temente a Deus; ia à missa todos os domingos, confessava-se cada quinzena, e dava esmolas, não com ostentação, mas com o coração. Viúva desde os trinta e um anos, dedicara-se inteiramente à educação do filho único.</p><p>Naquela tarde de novembro, achei minha mãe ajoelhada ao pé da cama, rezando. Tinha a cabeça entre as mãos, os olhos cerrados, a boca movendo-se em oração silenciosa. Esperei que acabasse, mas a oração não tinha fim.</p>'}
  ],
  'st2':[
    {title:'Capítulo I — O Desenho',content:'<p>Certa vez, quando tinha seis anos, vi num livro sobre a Floresta Virgem, "Histórias Vividas", uma magnífica gravura. Representava ela uma jiboia que engolia uma fera. Era assim que o livro descrevia a cena.</p><p>Dizia o livro: "As jiboias engolem, sem mastigar, a presa inteira. Em seguida, não podem mover-se e dormem os seis meses da digestão."</p><p>Refleti muito então sobre as aventuras da selva, e fiz, com lápis de cor, o meu primeiro desenho. O meu desenho número 1 era assim: representava uma jiboia que digeria um elefante.</p><p>Mostrei minha obra-prima às pessoas grandes e perguntei se o meu desenho lhes fazia medo.</p><p>Responderam-me: "Por que é que um chapéu faria medo?"</p>'},
    {title:'Capítulo II — O Encontro',content:'<p>Vivi, pois, sozinho, sem ter com quem conversar de verdade, até o dia em que tive uma pane no deserto do Saara, seis anos atrás. Alguma coisa se quebrara no motor. E como não levava comigo nem mecânico nem passageiros, preparei-me para tentar fazer sozinho o difícil conserto.</p><p>Era uma questão de vida ou morte. Tinha água para apenas oito dias.</p><p>Na primeira noite, adormeci sobre a areia, a mil milhas de qualquer terra habitada. Estava mais isolado que um náufrago sobre uma jangada no meio do oceano.</p><p>Imaginai a minha surpresa quando, ao romper do dia, uma vozinha estranha me acordou. Dizia:</p><p>"Por favor... desenha-me um carneiro!"</p>'},
    {title:'Capítulo III — O Planeta',content:'<p>Precisei de muito tempo para compreender de onde ele vinha. O pequeno príncipe, que me fazia tantas perguntas, parecia nunca ouvir as minhas. Foram palavras pronunciadas por acaso que, pouco a pouco, me revelaram tudo.</p><p>Assim, quando viu meu avião pela primeira vez (não vou desenhar o meu avião, pois é um desenho complicado demais para mim), perguntou:</p><p>"Que coisa é esta?"</p><p>"Não é uma coisa. Isto voa. É um avião. É o meu avião."</p><p>E eu estava orgulhoso de lhe dizer que voava. Então exclamou:</p><p>"Como? Tu caíste do céu?"</p><p>"Sim", respondi modestamente.</p>'}
  ],
  'default':[
    {title:'Capítulo I',content:'<p>Era uma vez, em um lugar distante, uma história que esperava para ser contada. As palavras dançavam nas páginas, ansiosas para encontrar um leitor que as desse vida.</p><p>O sol nascia no horizonte, pintando o céu com tons de laranja e rosa. A brisa matinal trazia consigo o perfume das flores do jardim, e os pássaros cantavam suas melodias.</p><p>Neste mundo de possibilidades infinitas, cada página virada era uma nova aventura, cada capítulo uma jornada diferente. O leitor, sentado confortavelmente, deixava-se levar pelas palavras que fluíam como um rio sereno.</p>'},
    {title:'Capítulo II',content:'<p>Os dias passavam com a suavidade de uma brisa de verão. Cada momento era precioso, cada instante guardava uma lição. As personagens ganhavam vida à medida que a narrativa se desenrolava.</p><p>Na quietude da tarde, o protagonista refletia sobre suas escolhas. O caminho percorrido havia sido longo, mas cada passo tinha seu propósito. As dificuldades enfrentadas forjaram um caráter resiliente e sábio.</p><p>A narrativa avançava, revelando segredos há muito guardados. Cada descoberta trazia consigo uma onda de emoções — surpresa, alegria, e por vezes, uma doce melancolia que só os grandes livros conseguem provocar.</p>'},
    {title:'Capítulo III',content:'<p>O desfecho se aproximava, mas a jornada estava longe de terminar. As páginas finais guardavam as maiores revelações, os momentos mais intensos e as reflexões mais profundas.</p><p>O leitor, agora completamente imerso na história, sentia cada palavra como se fosse parte dela. A fronteira entre a ficção e a realidade se dissolvia, e por alguns momentos, existia apenas o universo criado pelo autor.</p><p>E assim, como toda grande história, esta também chegava ao seu momento de reflexão. Não era um fim, mas um convite para começar de novo, para reler, para redescobrir nuances que passaram despercebidas na primeira leitura.</p>'}
  ],
  'st9':[
    {title:'Cap. 1 — Uzumaki Naruto!',content:'<p>Era uma vez, na Vila Oculta da Folha, um garoto chamado Naruto Uzumaki. Ele era barulhento, hiperativo e o pior aluno da Academia Ninja. Mas havia algo que ninguém sabia sobre ele — dentro de seu corpo estava selada a temível Raposa de Nove Caudas, o monstro que quase destruiu a vila anos atrás.</p><p>— Eu vou ser o Hokage! Dattebayo! — gritava Naruto pelos corredores da academia, enquanto todos reviravam os olhos.</p><p>Iruka-sensei observava o garoto com um misto de preocupação e carinho. Ele sabia que por trás daquela máscara de palhaço, havia uma solidão profunda. Naruto não tinha família, não tinha amigos. Tudo o que ele queria era ser reconhecido.</p>'},
    {title:'Cap. 2 — O Pergaminho Proibido',content:'<p>Naquela noite, Mizuki apareceu com uma proposta irresistível: se Naruto roubasse o Pergaminho Proibido e aprendesse um jutsu dele, passaria de ano automaticamente. Era uma mentira, claro, mas Naruto não sabia disso.</p><p>O garoto invadiu o escritório do Hokage com uma facilidade surpreendente e fugiu para a floresta com o pergaminho. Ali, sob a luz da lua, ele abriu o rolo enorme e encontrou o primeiro jutsu: Kage Bunshin no Jutsu — a técnica dos Clones das Sombras.</p><p>— Justo a técnica que eu mais odeio... clones! — reclamou Naruto, mas começou a treinar mesmo assim. Horas se passaram. Suor escorria pelo seu rosto. Mas ele não desistiu.</p>'},
    {title:'Cap. 3 — O Time 7',content:'<p>— Time 7: Uzumaki Naruto, Haruno Sakura e... Uchiha Sasuke. Sensei: Hatake Kakashi.</p><p>Naruto quase explodiu de raiva ao descobrir que ficaria no mesmo time que Sasuke, o gênio convencido que todas as garotas adoravam. E para piorar, Sakura — a garota por quem Naruto era apaixonado — só tinha olhos para o Uchiha.</p><p>Kakashi-sensei chegou três horas atrasado, com as mãos nos bolsos e uma expressão entediada visível mesmo sob sua máscara.</p><p>— Minha primeira impressão de vocês é... que eu não gosto de vocês — disse ele com naturalidade.</p>'}
  ],
  'st10':[
    {title:'Cap. 1 — O Shinigami',content:'<p>Ichigo Kurosaki não era um adolescente normal. Desde criança, ele podia ver espíritos — fantasmas que vagavam pelo mundo dos vivos sem conseguir seguir em frente. Ele tentava ignorá-los, mas nem sempre conseguia.</p><p>Naquela noite, tudo mudou. Uma borboleta negra atravessou a parede de seu quarto, seguida por uma garota vestida de samurai negro. Ela tinha uma katana na cintura e olhos violeta intensos.</p><p>— Eu sou Kuchiki Rukia, uma Shinigami — disse ela calmamente. — Estou aqui para caçar um Hollow.</p><p>— Um o quê? — Ichigo mal teve tempo de perguntar quando um rugido ensurdecedor sacudiu a casa inteira.</p>'},
    {title:'Cap. 2 — Poder Emprestado',content:'<p>O Hollow era enorme — uma criatura mascarada com um buraco no peito, feita de pura energia negativa. Rukia tentou lutar, mas foi gravemente ferida.</p><p>— Há apenas um jeito... — ela estendeu sua zanpakutō para Ichigo. — Eu vou transferir parte dos meus poderes de Shinigami para você. Aceita o risco?</p><p>Ichigo não hesitou. Agarrou a espada e uma explosão de energia espiritual consumiu o quarto. Quando a luz se dissipou, Ichigo estava vestido com o uniforme negro dos Shinigami, segurando uma zanpakutō gigantesca.</p><p>Com um único golpe, ele cortou o Hollow ao meio.</p>'},
    {title:'Cap. 3 — A Soul Society',content:'<p>Os dias seguintes foram caóticos. Rukia havia perdido quase todos os seus poderes na transferência, e agora Ichigo precisava fazer o trabalho dela: purificar Hollows e guiar almas perdidas para a Soul Society.</p><p>— Isso não era parte do acordo! — reclamava Ichigo enquanto corria pelos telhados de Karakura atrás de outro Hollow.</p><p>— Você aceitou o poder, aceitou a responsabilidade — respondia Rukia calmamente, anotando tudo em seu caderninho com desenhos horríveis de coelhos.</p>'}
  ],
  'st11':[
    {title:'Cap. 1 — O Garoto com Cauda',content:'<p>Nas montanhas remotas, vivia um garoto solitário chamado Goku. Ele tinha cabelos espetados que desafiavam a gravidade, uma força sobre-humana e uma cauda de macaco. Sua única companhia era uma esfera laranja com quatro estrelas — a Esfera do Dragão de Quatro Estrelas, herança de seu avô Gohan.</p><p>Um dia, uma garota de cabelos azuis chegou em um veículo estranho e quase o atropelou.</p><p>— Meu nome é Bulma! E eu estou procurando as Esferas do Dragão! — ela exclamou, mostrando um radar. — Se juntarmos todas as sete, podemos invocar o Dragão Shenlong e ele concede qualquer desejo!</p><p>— Qualquer desejo? — Goku inclinou a cabeça, curioso.</p>'},
    {title:'Cap. 2 — A Jornada Começa',content:'<p>Goku e Bulma partiram juntos em uma aventura pelo mundo. No caminho, encontraram personagens incríveis: o Mestre Kame, um velho pervertido mas incrivelmente poderoso; Yamcha, um bandido do deserto com medo de garotas; e Oolong, um porquinho que podia se transformar em qualquer coisa.</p><p>— KAMEHAMEHA! — gritou Mestre Kame, e um feixe de energia azul disparou de suas mãos, destruindo uma montanha inteira.</p><p>— Eu quero aprender isso! — disse Goku com os olhos brilhando.</p><p>A jornada pelas Esferas do Dragão era apenas o começo. Goku não sabia, mas seu destino era muito maior do que ele podia imaginar.</p>'},
    {title:'Cap. 3 — O Torneio de Artes Marciais',content:'<p>O Torneio Mundial de Artes Marciais reunia os lutadores mais fortes do mundo. Goku, agora treinado pelo Mestre Kame, estava ansioso para testar suas habilidades.</p><p>Na arena, ele enfrentou adversários formidáveis. Cada luta era mais intensa que a anterior. O público vibrava com cada golpe, cada esquiva, cada técnica especial.</p><p>— Você é forte, garoto — disse seu oponente final, limpando o sangue do lábio. — Mas eu sou o mais forte do mundo!</p><p>Goku sorriu. Aquele sorriso inocente que escondia uma determinação inabalável.</p><p>— Então vamos descobrir quem é mais forte! — e avançou com toda a velocidade.</p>'}
  ],
  'st12':[
    {title:'Cap. 1 — Romance Dawn',content:'<p>No East Blue, um garoto com um chapéu de palha olhava para o horizonte. Monkey D. Luffy tinha um sonho: encontrar o lendário tesouro One Piece e se tornar o Rei dos Piratas.</p><p>— Eu vou reunir uma tripulação incrível e navegar pelo Grand Line! — declarou ele para o mar vazio.</p><p>Havia apenas um detalhe: Luffy não sabia nadar. Quando era criança, ele comeu a Gomu Gomu no Mi, uma Fruta do Diabo que transformou seu corpo em borracha. Ele podia esticar seus braços e pernas como elástico, mas em troca, o mar se tornou seu inimigo mortal.</p><p>— Gomu Gomu no... PISTOL! — seu braço se esticou vários metros e acertou o alvo em cheio.</p>'},
    {title:'Cap. 2 — O Caçador de Piratas',content:'<p>A primeira pessoa que Luffy queria em sua tripulação era Roronoa Zoro, o famoso caçador de piratas que usava três espadas — uma em cada mão e uma na boca.</p><p>Zoro estava amarrado em um poste no pátio de uma base da Marinha, cumprindo uma punição injusta. Luffy apareceu com seu sorriso de sempre.</p><p>— Ei, você! Quer ser meu companheiro? — perguntou Luffy casualmente.</p><p>— Eu sou um caçador de piratas. Por que eu seria pirata? — respondeu Zoro com cara de poucos amigos.</p><p>— Porque vai ser divertido! — e aquele sorriso era impossível de recusar.</p>'},
    {title:'Cap. 3 — A Grande Aventura',content:'<p>Com Zoro a bordo, Luffy partiu para o mar. Logo encontraram Nami, uma navegadora talentosa com um passado sombrio; Usopp, um atirador mentiroso mas corajoso; e Sanji, um cozinheiro que lutava apenas com as pernas.</p><p>Juntos, eles formavam os Piratas do Chapéu de Palha, e seu navio — o Going Merry — cortava as ondas do East Blue rumo ao Grand Line.</p><p>— Eu vou ser o Rei dos Piratas! — gritou Luffy no topo do mastro, com o vento batendo em seu chapéu de palha.</p><p>— Cala a boca, capitão idiota! — gritaram todos ao mesmo tempo, mas sorriam. A aventura estava apenas começando.</p>'}
  ],
  'default':[
    {title:'Capítulo I',content:'<p>Era uma vez, em um lugar distante, uma história que esperava para ser contada. As palavras dançavam nas páginas, ansiosas para encontrar um leitor que as desse vida.</p><p>O sol nascia no horizonte, pintando o céu com tons de laranja e rosa. A brisa matinal trazia consigo o perfume das flores do jardim, e os pássaros cantavam suas melodias.</p><p>Neste mundo de possibilidades infinitas, cada página virada era uma nova aventura, cada capítulo uma jornada diferente. O leitor, sentado confortavelmente, deixava-se levar pelas palavras que fluíam como um rio sereno.</p>'},
    {title:'Capítulo II',content:'<p>Os dias passavam com a suavidade de uma brisa de verão. Cada momento era precioso, cada instante guardava uma lição. As personagens ganhavam vida à medida que a narrativa se desenrolava.</p><p>Na quietude da tarde, o protagonista refletia sobre suas escolhas. O caminho percorrido havia sido longo, mas cada passo tinha seu propósito. As dificuldades enfrentadas forjaram um caráter resiliente e sábio.</p><p>A narrativa avançava, revelando segredos há muito guardados. Cada descoberta trazia consigo uma onda de emoções — surpresa, alegria, e por vezes, uma doce melancolia que só os grandes livros conseguem provocar.</p>'},
    {title:'Capítulo III',content:'<p>O desfecho se aproximava, mas a jornada estava longe de terminar. As páginas finais guardavam as maiores revelações, os momentos mais intensos e as reflexões mais profundas.</p><p>O leitor, agora completamente imerso na história, sentia cada palavra como se fosse parte dela. A fronteira entre a ficção e a realidade se dissolvia, e por alguns momentos, existia apenas o universo criado pelo autor.</p><p>E assim, como toda grande história, esta também chegava ao seu momento de reflexão. Não era um fim, mas um convite para começar de novo, para reler, para redescobrir nuances que passaram despercebidas na primeira leitura.</p>'}
  ]
};

// ===== BALANCE MANAGEMENT =====
function getBalance(){return parseFloat(localStorage.getItem('bv_balance'))||150}
function setBalance(v){localStorage.setItem('bv_balance',v.toFixed(2));const el=document.getElementById('userBalance');if(el)el.textContent=v.toFixed(2)}
function getDigitalBooks(){try{return JSON.parse(localStorage.getItem('bv_digital'))||[]}catch{return[]}}
function saveDigitalBooks(d){localStorage.setItem('bv_digital',JSON.stringify(d))}

// ===== STORE RENDERING =====
function renderStore(){
  const grid=document.getElementById('storeGrid');
  const search=(document.getElementById('storeSearch')?.value||'').toLowerCase();
  const filterEl=document.querySelector('[data-store-filter].active');
  const filter=filterEl?filterEl.dataset.storeFilter:'all';
  const digital=getDigitalBooks();

  let items=STORE_CATALOG.filter(b=>{
    const matchSearch=!search||b.title.toLowerCase().includes(search)||b.author.toLowerCase().includes(search);
    const matchFilter=filter==='all'||b.genre===filter;
    return matchSearch&&matchFilter;
  });

  if(items.length===0){grid.innerHTML='<div class="empty-state"><div class="empty-icon">🔍</div><h3>Nenhum livro encontrado</h3></div>';return}

  grid.innerHTML=items.map(b=>{
    const owned=digital.find(d=>d.storeId===b.id);
    const coverHtml=b.cover?`<img src="${b.cover}" alt="${b.title}">`:`<div class="store-card-cover-placeholder" style="background:${b.color}">📖</div>`;
    const badgeHtml=b.badge?`<span class="store-card-badge badge-${b.badge}">${{bestseller:'⭐ Bestseller',new:'🆕 Novo',sale:'🔥 Promoção'}[b.badge]||''}</span>`:'';
    const actionsHtml=owned
      ?`<div class="owned-badge">✅ ${owned.type==='purchased'?'Comprado':'Alugado'} — <a href="#" onclick="event.preventDefault();openReader('${b.id}')" style="color:var(--primary2);text-decoration:underline">Ler agora</a></div>`
      :`<div class="store-card-actions"><button class="btn btn-buy" onclick="buyBook('${b.id}')">🛒 Comprar</button><button class="btn btn-rent" onclick="rentBook('${b.id}')">⏳ Alugar</button></div>`;
    return`<div class="store-card">
      <div class="store-card-cover">${badgeHtml}${coverHtml}</div>
      <div class="store-card-body">
        <div class="store-card-title">${b.title}</div>
        <div class="store-card-author">${b.author}</div>
        <div class="store-card-rating">${makeStars(b.rating)}</div>
        <div class="store-pricing">
          <div class="price-row"><span>Comprar:</span><span class="price-tag">R$ ${b.price.toFixed(2)}</span></div>
          <div class="price-row"><span>Alugar (30 dias):</span><span class="price-tag rent">R$ ${b.rentPrice.toFixed(2)}</span></div>
        </div>
        ${actionsHtml}
      </div>
    </div>`}).join('');

  setBalance(getBalance());
}

function buyBook(storeId){
  const book=STORE_CATALOG.find(b=>b.id===storeId);
  if(!book)return;
  const balance=getBalance();
  if(balance<book.price){showToast(`Saldo insuficiente! Você precisa de R$ ${book.price.toFixed(2)}`,'error');return}
  if(!confirm(`Comprar "${book.title}" por R$ ${book.price.toFixed(2)}?`))return;
  const digital=getDigitalBooks();
  if(digital.find(d=>d.storeId===storeId)){showToast('Você já possui este livro!','info');return}
  digital.push({storeId,title:book.title,author:book.author,cover:book.cover,color:book.color,type:'purchased',date:new Date().toISOString(),genre:book.genre,pages:book.pages});
  saveDigitalBooks(digital);
  setBalance(balance-book.price);
  showToast(`📚 "${book.title}" comprado! Acesse em Meus Digitais.`);
  renderStore();
}

function rentBook(storeId){
  const book=STORE_CATALOG.find(b=>b.id===storeId);
  if(!book)return;
  const balance=getBalance();
  if(balance<book.rentPrice){showToast(`Saldo insuficiente! Você precisa de R$ ${book.rentPrice.toFixed(2)}`,'error');return}
  if(!confirm(`Alugar "${book.title}" por R$ ${book.rentPrice.toFixed(2)} (30 dias)?`))return;
  const digital=getDigitalBooks();
  if(digital.find(d=>d.storeId===storeId)){showToast('Você já possui este livro!','info');return}
  const expDate=new Date();expDate.setDate(expDate.getDate()+30);
  digital.push({storeId,title:book.title,author:book.author,cover:book.cover,color:book.color,type:'rented',date:new Date().toISOString(),expires:expDate.toISOString(),genre:book.genre,pages:book.pages});
  saveDigitalBooks(digital);
  setBalance(balance-book.rentPrice);
  showToast(`⏳ "${book.title}" alugado por 30 dias!`);
  renderStore();
}

document.getElementById('storeSearch')?.addEventListener('input',renderStore);
document.querySelectorAll('[data-store-filter]').forEach(c=>c.addEventListener('click',()=>{
  document.querySelectorAll('[data-store-filter]').forEach(x=>x.classList.remove('active'));
  c.classList.add('active');renderStore();
}));
document.getElementById('addBalanceBtn')?.addEventListener('click',()=>{
  const val=prompt('Quanto deseja adicionar ao saldo? (R$)','50');
  const n=parseFloat(val);
  if(!n||n<=0){showToast('Valor inválido!','error');return}
  setBalance(getBalance()+n);
  showToast(`💰 R$ ${n.toFixed(2)} adicionado ao saldo!`);
});

// ===== MY DIGITAL BOOKS =====
let digitalTab='purchased';
function renderDigitalBooks(){
  const digital=getDigitalBooks();
  const grid=document.getElementById('digitalBooksGrid');
  const filtered=digital.filter(d=>d.type===digitalTab);

  if(filtered.length===0){
    grid.innerHTML=`<div class="empty-state"><div class="empty-icon">${digitalTab==='purchased'?'🛍️':'⏳'}</div><h3>Nenhum livro ${digitalTab==='purchased'?'comprado':'alugado'} ainda</h3><p>Visite a loja para adquirir livros!</p><button class="btn btn-primary" onclick="navigateTo('store')">Ir para a Loja</button></div>`;
    return;
  }

  grid.innerHTML=filtered.map(d=>{
    const coverHtml=d.cover?`<img src="${d.cover}" alt="${d.title}">`:`<div style="width:100%;height:100%;background:${d.color||'#6C5CE7'};display:flex;align-items:center;justify-content:center;font-size:2rem">📖</div>`;
    const typeHtml=d.type==='purchased'
      ?'<span class="digital-card-type type-purchased">🛍️ Comprado</span>'
      :'<span class="digital-card-type type-rented">⏳ Alugado</span>';
    const expireHtml=d.expires?`<div class="digital-card-expire">⏰ Expira em: ${new Date(d.expires).toLocaleDateString('pt-BR')}</div>`:'';
    return`<div class="digital-card">
      <div class="digital-card-cover">${coverHtml}</div>
      <div class="digital-card-info">
        <div class="digital-card-title">${d.title}</div>
        <div class="digital-card-author">${d.author}</div>
        ${typeHtml}${expireHtml}
        <div class="digital-card-actions">
          <button class="btn btn-primary" onclick="openReader('${d.storeId}')">📖 Ler Agora</button>
          <button class="btn btn-danger" onclick="removeDigital('${d.storeId}')" style="padding:.4rem .6rem;font-size:.75rem">🗑️</button>
        </div>
      </div>
    </div>`}).join('');
}

function removeDigital(storeId){
  if(!confirm('Remover este livro digital?'))return;
  let digital=getDigitalBooks().filter(d=>d.storeId!==storeId);
  saveDigitalBooks(digital);
  showToast('Livro removido!','info');
  renderDigitalBooks();renderStore();
}

document.querySelectorAll('.digital-tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.digital-tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  digitalTab=t.dataset.dtab;
  renderDigitalBooks();
}));

// ===== BOOK READER =====
let readerState={bookId:null,chapters:[],currentPage:0,fontSize:1.05,lightMode:false};

function openReader(storeId){
  const digital=getDigitalBooks();
  const owned=digital.find(d=>d.storeId===storeId);
  if(!owned){showToast('Você não possui este livro!','error');return}
  if(owned.expires&&new Date(owned.expires)<new Date()){showToast('O aluguel deste livro expirou!','error');return}
  
  const chapters=BOOK_CONTENT[storeId]||BOOK_CONTENT['default'];
  readerState={bookId:storeId,chapters,currentPage:0,fontSize:1.05,lightMode:false};
  
  document.getElementById('readerTitle').textContent=owned.title;
  renderReaderPage();
  document.getElementById('readerModal').classList.add('active');
}

function renderReaderPage(){
  const ch=readerState.chapters[readerState.currentPage];
  const body=document.getElementById('readerBody');
  body.innerHTML=`<h2>${ch.title}</h2>${ch.content}`;
  body.style.fontSize=readerState.fontSize+'rem';
  body.className='reader-body'+(readerState.lightMode?' light':'');
  document.getElementById('readerPageInfo').textContent=`Página ${readerState.currentPage+1} de ${readerState.chapters.length}`;
  body.scrollTop=0;
}

document.getElementById('readerClose')?.addEventListener('click',()=>closeModal('readerModal'));
document.getElementById('readerPrev')?.addEventListener('click',()=>{
  if(readerState.currentPage>0){readerState.currentPage--;renderReaderPage()}
});
document.getElementById('readerNext')?.addEventListener('click',()=>{
  if(readerState.currentPage<readerState.chapters.length-1){readerState.currentPage++;renderReaderPage()}
});
document.getElementById('readerFontUp')?.addEventListener('click',()=>{
  readerState.fontSize=Math.min(readerState.fontSize+.1,1.6);renderReaderPage();
});
document.getElementById('readerFontDown')?.addEventListener('click',()=>{
  readerState.fontSize=Math.max(readerState.fontSize-.1,.8);renderReaderPage();
});
document.getElementById('readerThemeToggle')?.addEventListener('click',()=>{
  readerState.lightMode=!readerState.lightMode;renderReaderPage();
  document.getElementById('readerThemeToggle').textContent=readerState.lightMode?'🌑':'🌙';
});

// ===== UPDATE NAVIGATION =====
const origNavigateTo=navigateTo;
const _nav=function(pageId){
  if(pageId==='store')renderStore();
  if(pageId==='mydigital')renderDigitalBooks();
};
const origNavFn=navigateTo;

// Patch navigateTo to handle new pages
(function(){
  const oldNav=window.navigateTo||navigateTo;
})();

// Add store/digital rendering to navigation
document.querySelectorAll('.nav-link').forEach(l=>{
  l.addEventListener('click',e=>{
    const pg=l.dataset.page;
    if(pg==='store')setTimeout(renderStore,100);
    if(pg==='mydigital')setTimeout(renderDigitalBooks,100);
  });
});

// ===== INIT =====
seedIfEmpty();
patchSeedCovers();
renderHome();

