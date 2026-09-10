(() => {
  "use strict";

  const hasSupabaseConfig = () =>
    window.NC_SUPABASE_URL &&
    window.NC_SUPABASE_KEY &&
    !window.NC_SUPABASE_URL.includes("SEU-PROJETO") &&
    !window.NC_SUPABASE_KEY.includes("SUA_CHAVE");

  const sb = hasSupabaseConfig() && window.supabase
    ? window.supabase.createClient(window.NC_SUPABASE_URL, window.NC_SUPABASE_KEY)
    : null;

  const $ = (id) => document.getElementById(id);
  const landing = $("landing"), editor = $("editor"), viewer = $("viewer"), toast = $("toast");
  const homeBtn = $("homeBtn");
  const totalSteps = 6;
  let step = 0;
  let theme = "wine";
  let session = null;
  let currentFiles = { photos: [], puzzle: null, audio: null };
  let timerHandle = null;

  function showToast(msg, ms = 3500) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("show"), ms);
  }
  function escapeHtml(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  }
  function setVisible(el, yes) { el.classList.toggle("hidden", !yes); }

  function renderSteps() {
    $("steps").innerHTML = Array.from({length: totalSteps}, (_, i) =>
      `<span class="${i <= step ? "active" : ""}"></span>`).join("");
    $("progressBar").style.width = `${((step + 1) / totalSteps) * 100}%`;
    document.querySelectorAll(".step").forEach((el, i) => el.classList.toggle("hidden", i !== step));
    setVisible($("prevBtn"), step > 0);
    setVisible($("nextBtn"), step < totalSteps - 1);
    setVisible($("createBtn"), step === totalSteps - 1);
    if (step === 5) updateSummary();
  }

  function collectData() {
    return {
      your_name: $("yourName").value.trim(),
      partner_name: $("partnerName").value.trim(),
      nickname: $("nickname").value.trim(),
      message_title: $("messageTitle").value.trim(),
      message: $("message").value.trim(),
      signature: $("signature").value.trim(),
      song_name: $("songName").value.trim(),
      artist: $("artist").value.trim(),
      youtube_url: $("youtubeUrl").value.trim(),
      audio_url: $("audioUrl").value.trim(),
      theme,
      start_date: $("startDate").value ? new Date($("startDate").value).toISOString() : null,
      surprise_message: $("surpriseMessage").value.trim()
    };
  }

  function saveDraft() {
    try { localStorage.setItem("nc_draft_v5", JSON.stringify(collectData())); } catch {}
  }
  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem("nc_draft_v5") || "null");
      if (!d) return;
      ["your_name","partner_name","nickname","message_title","message","signature","song_name","artist","youtube_url","audio_url","surprise_message"]
        .forEach(k => { const el = $(k.replaceAll("_","")); });
      const map = {
        your_name:"yourName",partner_name:"partnerName",nickname:"nickname",message_title:"messageTitle",
        message:"message",signature:"signature",song_name:"songName",artist:"artist",
        youtube_url:"youtubeUrl",audio_url:"audioUrl",surprise_message:"surpriseMessage"
      };
      Object.entries(map).forEach(([k,id]) => { if (d[k] != null && $(id)) $(id).value = d[k]; });
      if (d.start_date) {
        const dt = new Date(d.start_date);
        if (!Number.isNaN(dt.getTime())) $("startDate").value = new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
      }
      if (d.theme) setTheme(d.theme);
      $("charCount").textContent = $("message").value.length;
    } catch {}
  }

  function setTheme(t) {
    theme = t;
    document.documentElement.dataset.theme = t;
    document.querySelectorAll(".theme").forEach(b => b.classList.toggle("active", b.dataset.theme === t));
  }

  function updateSummary() {
    const d = collectData();
    $("summary").innerHTML = `
      <b>${escapeHtml(d.your_name || "Você")} ♥ ${escapeHtml(d.partner_name || "Seu amor")}</b><br>
      ${d.nickname ? `Apelido: ${escapeHtml(d.nickname)}<br>` : ""}
      ${currentFiles.photos.length} foto(s) • ${currentFiles.puzzle ? "puzzle" : "sem puzzle"} •
      ${d.youtube_url ? "YouTube" : currentFiles.audio ? "MP3" : d.audio_url ? "áudio por URL" : "sem música"}<br>
      Tema: ${escapeHtml(theme)}
    `;
  }

  function previewPhotos() {
    const box = $("photoPreview"); box.innerHTML = "";
    currentFiles.photos.forEach((file, i) => {
      const url = URL.createObjectURL(file);
      box.insertAdjacentHTML("beforeend", `<div><img src="${url}" alt="Foto ${i+1}"></div>`);
    });
  }
  function previewPuzzle() {
    const box = $("puzzlePreview"); box.innerHTML = "";
    if (currentFiles.puzzle) {
      const url = URL.createObjectURL(currentFiles.puzzle);
      box.innerHTML = `<img src="${url}" alt="Prévia do puzzle">`;
    }
  }

  function youtubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0];
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname === "/watch") return u.searchParams.get("v");
        const parts = u.pathname.split("/").filter(Boolean);
        if (["embed","shorts","live"].includes(parts[0])) return parts[1];
      }
    } catch {}
    return null;
  }

  function previewMusic() {
    const box = $("musicTest");
    const d = collectData();
    const yt = youtubeId(d.youtube_url);
    if (yt) {
      box.classList.remove("hidden");
      box.innerHTML = `<div class="musicTitle">${escapeHtml(d.song_name || "Nossa música")}</div><div class="musicMeta">${escapeHtml(d.artist || "")}</div>
      <div class="viewerMusic" style="margin-top:12px"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    } else if (currentFiles.audio || d.audio_url) {
      box.classList.remove("hidden");
      const src = currentFiles.audio ? URL.createObjectURL(currentFiles.audio) : d.audio_url;
      box.innerHTML = `<div class="musicTitle">${escapeHtml(d.song_name || "Nossa música")}</div><div class="musicMeta">${escapeHtml(d.artist || "")}</div><div class="musicControls"><audio controls src="${escapeHtml(src)}"></audio></div>`;
    } else box.classList.add("hidden");
  }

  function validateStep() {
    if (step === 0 && (!$("yourName").value.trim() || !$("partnerName").value.trim() || !$("startDate").value)) {
      showToast("Preencha seu nome, o nome do amor e a data em que começaram."); return false;
    }
    return true;
  }

  async function ensureSession() {
    if (!sb) return null;
    const { data: { session: s } } = await sb.auth.getSession();
    if (s) { session = s; return s; }
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
    return session;
  }

  async function uploadFile(file, ownerId, surpriseId, kind) {
    const ext = (file.name.split(".").pop() || "bin").replace(/[^a-z0-9]/gi,"").toLowerCase() || "bin";
    const path = `${ownerId}/${surpriseId}/${kind}-${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("surpresas").upload(path, file, { upsert:false, contentType:file.type || undefined });
    if (error) throw error;
    const { data } = sb.storage.from("surpresas").getPublicUrl(path);
    return data.publicUrl;
  }

  async function createRemote() {
    if (!sb) throw new Error("Supabase ainda não foi configurado no config.js.");
    const s = await ensureSession();
    const d = collectData();

    if (!d.your_name || !d.partner_name || !d.start_date) throw new Error("Preencha os campos obrigatórios.");

    const musicType = d.youtube_url ? "youtube" : currentFiles.audio ? "mp3" : d.audio_url ? "url" : "none";
    const insert = {
      owner_id:s.user.id, your_name:d.your_name, partner_name:d.partner_name, nickname:d.nickname,
      message_title:d.message_title, message:d.message, signature:d.signature, photos:[],
      puzzle_url:null, song_name:d.song_name, artist:d.artist, music_type:musicType,
      music_url:d.youtube_url || d.audio_url || null, theme:d.theme, start_date:d.start_date,
      surprise_message:d.surprise_message
    };

    const { data: row, error } = await sb.from("surpresas").insert(insert).select().single();
    if (error) throw error;

    const photoUrls = [];
    for (const file of currentFiles.photos.slice(0,9)) photoUrls.push(await uploadFile(file, s.user.id, row.id, "photo"));
    let puzzleUrl = null, musicUrl = insert.music_url;
    if (currentFiles.puzzle) puzzleUrl = await uploadFile(currentFiles.puzzle, s.user.id, row.id, "puzzle");
    if (currentFiles.audio) musicUrl = await uploadFile(currentFiles.audio, s.user.id, row.id, "music");

    const patch = { photos: photoUrls, puzzle_url:puzzleUrl, music_url:musicUrl, updated_at:new Date().toISOString() };
    const { error: upErr } = await sb.from("surpresas").update(patch).eq("id", row.id);
    if (upErr) throw upErr;
    return row.id;
  }

  function publicLink(id) {
    const u = new URL(location.href);
    u.search = "";
    u.hash = "";
    u.searchParams.set("surpresa", id);
    return u.toString();
  }

  async function createSurprise(e) {
    e.preventDefault();
    const btn = $("createBtn");
    btn.disabled = true; btn.textContent = "⏳ Enviando...";
    try {
      saveDraft();
      const id = await createRemote();
      const link = publicLink(id);
      viewer.classList.remove("hidden");
      landing.classList.add("hidden"); editor.classList.add("hidden"); homeBtn.classList.remove("hidden");
      $("viewerContent").innerHTML = `
        <div class="card viewerHero">
          <div class="eyebrow">sua surpresa está pronta</div>
          <h1>Feito com amor. 💖</h1>
          <p class="muted">Este é o link que você pode enviar para o seu amor:</p>
          <input id="shareLink" readonly value="${escapeHtml(link)}">
          <div class="actions">
            <button class="primary" id="copyLink" type="button">🔗 Copiar link</button>
            <button class="secondary" id="openLink" type="button">💗 Abrir surpresa</button>
          </div>
        </div>`;
      $("copyLink").onclick = async () => {
        try { await navigator.clipboard.writeText(link); showToast("Link copiado!"); }
        catch { $("shareLink").select(); showToast("Selecione e copie o link."); }
      };
      $("openLink").onclick = () => window.open(link, "_blank");
      showToast("Surpresa criada e salva no Supabase!", 5000);
    } catch (err) {
      console.error(err);
      showToast("Não foi possível criar: " + (err?.message || err), 6000);
    } finally {
      btn.disabled = false; btn.textContent = "💖 CRIAR MINHA SURPRESA";
    }
  }

  function formatElapsed(start) {
    const ms = Date.now() - new Date(start).getTime();
    if (!Number.isFinite(ms) || ms < 0) return "Ainda não começou 💕";
    const sec = Math.floor(ms/1000), min = Math.floor(sec/60), h = Math.floor(min/60), d = Math.floor(h/24);
    const years = Math.floor(d/365.2425);
    const remDays = Math.floor(d - years*365.2425);
    const remH = h % 24, remM = min % 60, remS = sec % 60;
    return `${years} ano(s), ${remDays} dia(s), ${remH}h ${remM}m ${remS}s`;
  }

  function puzzleHtml(url) {
    const order = Array.from({length:9},(_,i)=>i);
    for (let i=8;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
    return `<div class="puzzleBoard" data-img="${escapeHtml(url)}">${order.map((piece,i)=>`<button class="piece" data-pos="${i}" data-piece="${piece}" type="button" style="background-image:url('${escapeHtml(url)}');background-position:${(piece%3)*50}% ${Math.floor(piece/3)*50}%"></button>`).join("")}</div>
    <div class="tip" style="text-align:center">Toque em duas peças para trocar.</div><div class="puzzleDone hidden"></div>`;
  }

  function initPuzzle() {
    const board = document.querySelector(".puzzleBoard");
    if (!board) return;
    let selected = null;
    const pieces = [...board.querySelectorAll(".piece")];
    pieces.forEach(btn => btn.addEventListener("click", () => {
      if (selected === null) {
        selected = btn; btn.classList.add("selected"); return;
      }
      if (selected === btn) { btn.classList.remove("selected"); selected=null; return; }
      const a = selected.dataset.piece, b = btn.dataset.piece;
      selected.dataset.piece = b; btn.dataset.piece = a;
      [selected,btn].forEach(x => {
        const p = Number(x.dataset.piece);
        x.style.backgroundPosition = `${(p%3)*50}% ${Math.floor(p/3)*50}%`;
        x.classList.remove("selected");
      });
      selected=null;
      const solved = pieces.every((x,i)=>Number(x.dataset.piece)===i);
      if (solved) {
        const done = board.parentElement.querySelector(".puzzleDone");
        done.classList.remove("hidden");
        done.innerHTML = `<p>Você conseguiu! 💕</p><img src="${escapeHtml(board.dataset.img)}" alt="Foto completa">`;
      }
    }));
  }

  function renderViewer(data) {
    landing.classList.add("hidden"); editor.classList.add("hidden"); viewer.classList.remove("hidden"); homeBtn.classList.remove("hidden");
    document.documentElement.dataset.theme = data.theme || "wine";
    const photos = Array.isArray(data.photos) ? data.photos : [];
    let music = "";
    if (data.music_type === "youtube" && data.music_url) {
      const id = youtubeId(data.music_url);
      if (id) music = `<div class="section viewerMusic"><h2>🎵 Nossa música</h2><div class="musicPlayer"><div class="musicTitle">${escapeHtml(data.song_name || "Nossa música")}</div><div class="musicMeta">${escapeHtml(data.artist || "")}</div><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div></div>`;
    } else if ((data.music_type === "mp3" || data.music_type === "url") && data.music_url) {
      music = `<div class="section"><h2>🎵 Nossa música</h2><div class="musicPlayer"><div class="musicTitle">${escapeHtml(data.song_name || "Nossa música")}</div><div class="musicMeta">${escapeHtml(data.artist || "")}</div><div class="musicControls"><audio controls preload="metadata" src="${escapeHtml(data.music_url)}"></audio></div></div></div>`;
    }
    $("viewerContent").innerHTML = `<div class="viewerWrap">
      <section class="card viewerHero">
        <div class="eyebrow">um cantinho só nosso</div>
        <div class="nickname">${escapeHtml(data.nickname || "")}</div>
        <h1>${escapeHtml(data.your_name)} <span style="color:var(--accent)">♥</span> ${escapeHtml(data.partner_name)}</h1>
        <div class="counterBox"><div class="eyebrow">estamos juntos há</div><div id="counterValue" class="counterValue">${formatElapsed(data.start_date)}</div></div>
      </section>
      ${data.message || data.message_title ? `<section class="section"><h2>${escapeHtml(data.message_title || "Uma mensagem para você")}</h2><div class="letter">${escapeHtml(data.message || "")}${data.signature ? `\n\n— ${escapeHtml(data.signature)}` : ""}</div></section>` : ""}
      ${photos.length ? `<section class="section"><h2>📸 Nossas memórias</h2><div class="viewerGallery">${photos.map((u,i)=>`<img src="${escapeHtml(u)}" alt="Memória ${i+1}" data-lightbox="${escapeHtml(u)}">`).join("")}</div></section>` : ""}
      ${data.puzzle_url ? `<section class="section"><h2>🧩 Uma lembrança para montar</h2>${puzzleHtml(data.puzzle_url)}</section>` : ""}
      ${music}
      ${data.surprise_message ? `<section class="section surpriseBox"><div class="eyebrow">e ainda tem mais...</div><h2>💌 Uma última coisa</h2><p>${escapeHtml(data.surprise_message)}</p></section>` : ""}
    </div>`;
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = setInterval(() => { const c=$("counterValue"); if(c)c.textContent=formatElapsed(data.start_date); },1000);
    initPuzzle();
    document.querySelectorAll("[data-lightbox]").forEach(img => img.addEventListener("click", () => {
      const w = window.open("", "_blank");
      if (w) w.document.write(`<title>Nosso Cantinho</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#111;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style><img src="${img.dataset.lightbox}">`);
    }));
  }

  async function loadPublic(id) {
    if (!sb) {
      showToast("Configure o config.js com a URL e a chave do Supabase.");
      return;
    }
    try {
      const { data, error } = await sb.from("surpresas").select("*").eq("id", id).single();
      if (error) throw error;
      renderViewer(data);
    } catch (err) {
      viewer.classList.remove("hidden"); landing.classList.add("hidden");
      $("viewerContent").innerHTML = `<div class="card viewerHero"><h2>Surpresa não encontrada 💔</h2><p class="muted">${escapeHtml(err.message || "Verifique o link e tente novamente.")}</p></div>`;
    }
  }

  function startEditor() {
    landing.classList.add("hidden"); viewer.classList.add("hidden"); editor.classList.remove("hidden"); homeBtn.classList.remove("hidden");
    renderSteps(); loadDraft();
  }
  function goHome() {
    if (location.search) history.pushState({}, "", location.pathname);
    viewer.classList.add("hidden"); editor.classList.add("hidden"); landing.classList.remove("hidden"); homeBtn.classList.add("hidden");
  }

  $("startBtn").onclick = startEditor;
  homeBtn.onclick = goHome;
  $("prevBtn").onclick = () => { if(step>0){step--;renderSteps();window.scrollTo({top:0,behavior:"smooth"});} };
  $("nextBtn").onclick = () => { if(validateStep() && step<totalSteps-1){step++;renderSteps();saveDraft();window.scrollTo({top:0,behavior:"smooth"});} };
  $("creatorForm").addEventListener("submit", createSurprise);
  $("message").addEventListener("input", () => $("charCount").textContent = $("message").value.length);
  ["yourName","partnerName","nickname","messageTitle","message","signature","songName","artist","youtubeUrl","audioUrl","surpriseMessage","startDate"]
    .forEach(id => $(id).addEventListener("input", saveDraft));
  document.querySelectorAll(".theme").forEach(b => b.onclick = () => { setTheme(b.dataset.theme); saveDraft(); updateSummary(); });
  $("photos").addEventListener("change", e => {
    currentFiles.photos = [...e.target.files].slice(0,9);
    if (e.target.files.length > 9) showToast("Só as primeiras 9 fotos serão usadas.");
    previewPhotos(); updateSummary();
  });
  $("puzzlePhoto").addEventListener("change", e => { currentFiles.puzzle = e.target.files[0] || null; previewPuzzle(); updateSummary(); });
  $("audioFile").addEventListener("change", e => { currentFiles.audio = e.target.files[0] || null; previewMusic(); updateSummary(); });
  ["youtubeUrl","audioUrl","songName","artist"].forEach(id => $(id).addEventListener("input", previewMusic));

  function spawnHeart() {
    const h=document.createElement("div"); h.className="heart"; h.textContent=["♥","♡","💕","💗"][Math.floor(Math.random()*4)];
    h.style.left=Math.random()*100+"vw"; h.style.animationDuration=(4+Math.random()*5)+"s"; document.querySelector(".hearts").appendChild(h);
    setTimeout(()=>h.remove(),10000);
  }
  setInterval(spawnHeart,1200);

  const id = new URLSearchParams(location.search).get("surpresa");
  if (id) loadPublic(id);
  else { homeBtn.classList.add("hidden"); loadDraft(); }
})();