const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={step:0,photos:[],puzzle:null,theme:"wine",audioData:"",timer:null};

const themes={wine:"#ff4f8b",rose:"#ff6f91",lilac:"#b58cff",night:"#8ba7ff",gold:"#e4b65d"};
const landing=$("#landing"), editor=$("#editor"), viewer=$("#viewer"), home=$("#homeBtn");
const enc=x=>{try{return btoa(unescape(encodeURIComponent(x)))}catch{return""}};
const dec=x=>{try{return decodeURIComponent(escape(atob(x)))}catch{return""}};
const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function setTheme(t){state.theme=t;document.documentElement.style.setProperty("--accent",themes[t]||themes.wine);$$(".theme").forEach(b=>b.classList.toggle("active",b.dataset.theme===t))}
function renderSteps(){
 $$(".step").forEach((x,i)=>x.classList.toggle("hidden",i!==state.step));
 $("#progressBar").style.width=((state.step+1)/6*100)+"%";
 $("#prevBtn").style.visibility=state.step?"visible":"hidden";
 $("#nextBtn").classList.toggle("hidden",state.step===5);
 $("#createBtn").classList.toggle("hidden",state.step!==5);
 $("#steps").innerHTML=[1,2,3,4,5,6].map((n,i)=>`<span class="${i===state.step?"active":""}">${n}</span>`).join("");
 if(state.step===5) summary();
}
function start(){landing.classList.add("hidden");editor.classList.remove("hidden");viewer.classList.add("hidden");home.classList.remove("hidden");renderSteps()}
$("#startBtn").onclick=start;
home.onclick=()=>{clearInterval(state.timer);editor.classList.add("hidden");viewer.classList.add("hidden");landing.classList.remove("hidden");home.classList.add("hidden")};
$("#nextBtn").onclick=()=>{if(validate()){state.step++;renderSteps()}};
$("#prevBtn").onclick=()=>{if(state.step){state.step--;renderSteps()}};
function validate(){
 if(state.step===0&&!$("#yourName").value.trim()||state.step===0&&!$("#partnerName").value.trim()||state.step===0&&!$("#startDate").value){alert("Preencha os nomes e a data. 💗");return false}
 if(state.step===2&&!state.photos.length){alert("Adicione pelo menos uma foto.");return false}
 return true
}
$("#message").oninput=e=>$("#charCount").textContent=e.target.value.length;

function fileData(file,maxMB){return new Promise((resolve,reject)=>{if(file.size>maxMB*1024*1024){alert(`O arquivo deve ter no máximo ${maxMB} MB.`);return reject()};const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
$("#photos").onchange=async e=>{
 for(const f of [...e.target.files].slice(0,9-state.photos.length)){try{state.photos.push(await fileData(f,5))}catch{}}
 e.target.value="";drawPhotos()
};
function drawPhotos(){$("#photoPreview").innerHTML=state.photos.map((p,i)=>`<div class="photoItem"><img src="${p}"><button type="button" data-remove="${i}">×</button></div>`).join("");$$("[data-remove]").forEach(b=>b.onclick=()=>{state.photos.splice(+b.dataset.remove,1);drawPhotos()})}
$("#puzzlePhoto").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{state.puzzle=await fileData(f,6);$("#puzzlePreview").innerHTML=`<img src="${state.puzzle}">`}catch{}};

function youtubeId(v){try{const u=new URL(v.trim());if(u.hostname==="youtu.be"||u.hostname.endsWith(".youtu.be"))return u.pathname.split("/").filter(Boolean)[0]||"";if(u.searchParams.get("v"))return u.searchParams.get("v");const m=u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/);return m?m[1]:""}catch{return""}}
$("#youtubeUrl").oninput=()=>{if(youtubeId($("#youtubeUrl").value)){$("#audioUrl").value="";state.audioData=""}};
$("#audioUrl").oninput=()=>{if($("#audioUrl").value){$("#youtubeUrl").value="";state.audioData=""}};
$("#audioFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{state.audioData=await fileData(f,15);$("#youtubeUrl").value="";$("#audioUrl").value="";}catch{}};

$$(".theme").forEach(b=>b.onclick=()=>setTheme(b.dataset.theme));

function summary(){$("#summary").innerHTML=`<b>${esc($("#yourName").value||"Você")} ♥ ${esc($("#partnerName").value||"Seu amor")}</b><br>${state.photos.length}/9 fotos • ${state.puzzle?"quebra-cabeça 3×3":"sem puzzle"} • ${youtubeId($("#youtubeUrl").value)?"YouTube":state.audioData?"MP3":$("#audioUrl").value?"URL de áudio":"sem música"}`}

function collect(){
 return {v:4,yourName:$("#yourName").value.trim(),partnerName:$("#partnerName").value.trim(),nickname:$("#nickname").value.trim(),startDate:$("#startDate").value,messageTitle:$("#messageTitle").value.trim(),message:$("#message").value,signature:$("#signature").value.trim(),photos:state.photos,puzzle:state.puzzle,songName:$("#songName").value.trim()||"Nossa música",artist:$("#artist").value.trim()||"Só nós dois",audio:state.audioData,audioUrl:$("#audioUrl").value.trim(),youtube:youtubeId($("#youtubeUrl").value),theme:state.theme,surpriseMessage:$("#surpriseMessage").value};
}
function save(d){const id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);const key="nc4_"+id;try{localStorage.setItem(key,JSON.stringify(d));localStorage.setItem("nc4_last",key);return key}catch(e){alert("O navegador ficou sem espaço. Reduza o tamanho das fotos/MP3.");return""}}

$("#creatorForm").onsubmit=e=>{e.preventDefault();if(!validate())return;const d=collect(),key=save(d);show(d,key)};
function show(d,key){
 editor.classList.add("hidden");viewer.classList.remove("hidden");home.classList.remove("hidden");
 setTheme(d.theme);renderViewer(d,key);counter(d.startDate);
 const publicUrl=location.href.split("#")[0].split("?")[0]+"?surpresa="+encodeURIComponent(key);
 $("#shareBtn").onclick=async()=>{try{await navigator.clipboard.writeText(publicUrl);alert("Link copiado! 💗")}catch{prompt("Copie este link:",publicUrl)}};
 $("#editBtn").onclick=()=>{viewer.classList.add("hidden");editor.classList.remove("hidden")};
}
function counter(start){
 clearInterval(state.timer);const t=new Date(start).getTime();
 const tick=()=>{let s=Math.max(0,Math.floor((Date.now()-t)/1000));$("#days").textContent=Math.floor(s/86400);$("#hours").textContent=String(Math.floor(s%86400/3600)).padStart(2,"0");$("#mins").textContent=String(Math.floor(s%3600/60)).padStart(2,"0");$("#secs").textContent=String(s%60).padStart(2,"0")};
 tick();state.timer=setInterval(tick,1000)
}
function renderViewer(d,key){
 const music=d.youtube||d.audio||d.audioUrl;
 $("#viewerContent").innerHTML=`
 <div class="loveHero"><span class="eyebrow">um lugar só nosso</span><h1>Nosso Cantinho</h1><div class="names">${esc(d.yourName)} ♥ ${esc(d.partnerName)}</div>${d.nickname?`<div class="nick">${esc(d.nickname)}</div>`:""}</div>
 <div class="counterBox"><div><strong id="days">0</strong><small>dias</small></div><div><strong id="hours">00</strong><small>horas</small></div><div><strong id="mins">00</strong><small>minutos</small></div><div><strong id="secs">00</strong><small>segundos</small></div></div>
 ${d.message||d.messageTitle?`<article class="viewerCard"><h2>${esc(d.messageTitle||"Para você")}</h2><div class="messageText">${esc(d.message)}</div>${d.signature?`<div class="signature">${esc(d.signature)}</div>`:""}</article>`:""}
 ${d.photos?.length?`<article class="viewerCard"><h2>Nossas memórias 📸</h2><div class="gallery">${d.photos.map(p=>`<img src="${p}">`).join("")}</div></article>`:""}
 ${d.puzzle?`<article class="viewerCard"><h2>Monte nossa memória 🧩</h2><p class="muted">Toque em duas peças para trocar.</p><div id="puzzleGame" class="puzzleGame"></div><div id="puzzleWin"></div></article>`:""}
 ${music?`<article class="viewerCard"><h2>Nossa música 🎵</h2><div class="musicPlayer"><div class="musicMain"><div class="album">♥</div><div class="song"><strong>${esc(d.songName)}</strong><span>${esc(d.artist)}</span></div>${(d.audio||d.audioUrl)?`<button id="viewerPlay" class="play">▶</button>`:""}</div>${d.youtube?`<iframe class="ytFrame" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.youtube)}?rel=0&modestbranding=1" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>`:""}<div class="bar"><i id="musicBar"></i></div></div></article>`:""}
 ${d.surpriseMessage?`<article class="viewerCard surpriseBox"><span class="eyebrow">uma última coisa...</span><p>${esc(d.surpriseMessage)}</p>💗</article>`:""}
 <div class="viewerActions"><button id="shareBtn" class="primary">🔗 Compartilhar</button><button id="editBtn" class="secondary">✏️ Editar</button></div>`;
 $$(".gallery img").forEach(i=>i.onclick=()=>light(i.src));
 if(d.puzzle) puzzle(d.puzzle);
 if(d.audio||d.audioUrl){const a=new Audio(d.audio||d.audioUrl);$("#viewerPlay").onclick=()=>a.paused?(a.play(),$("#viewerPlay").textContent="Ⅱ"): (a.pause(),$("#viewerPlay").textContent="▶");a.ontimeupdate=()=>{if(a.duration)$("#musicBar").style.width=(a.currentTime/a.duration*100)+"%"}}}
function puzzle(src){
 const arr=[0,1,2,3,4,5,6,7,8].sort(()=>Math.random()-.5),c=$("#puzzleGame");let sel=-1;
 const draw=()=>{c.innerHTML=arr.map((v,i)=>`<button class="piece ${sel===i?"selected":""}" data-i="${i}"><img src="${src}" style="object-position:${(v%3)*50}% ${Math.floor(v/3)*50}%;object-fit:cover;transform:scale(3.05)"></button>`).join("");$$(".piece").forEach(b=>b.onclick=()=>pick(+b.dataset.i))};
 const pick=i=>{if(sel<0){sel=i;draw();return}if(sel!==i)[arr[sel],arr[i]]=[arr[i],arr[sel]];sel=-1;draw();if(arr.every((v,i)=>v===i)){$("#puzzleWin").innerHTML='<div class="puzzleWin">💖 Você montou nossa memória!</div>';setTimeout(()=>light(src),400)}};
 draw()
}
function light(src){const d=document.createElement("div");d.className="lightbox";d.innerHTML=`<img src="${src}">`;d.onclick=()=>d.remove();document.body.appendChild(d)}
function boot(){
 const k=new URLSearchParams(location.search).get("surpresa");if(!k)return;
 try{const d=JSON.parse(localStorage.getItem(k));if(d){landing.classList.add("hidden");editor.classList.add("hidden");viewer.classList.remove("hidden");home.classList.remove("hidden");show(d,k)}}catch{}
}
(function(){setTheme("wine");renderSteps();boot();})();
