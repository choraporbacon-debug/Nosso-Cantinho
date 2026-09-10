(() => {
"use strict";
const $=id=>document.getElementById(id), home=$("home"),builder=$("builder"),result=$("result"),viewer=$("viewer"),toast=$("toast");
const configured=()=>window.NC_SUPABASE_URL&&window.NC_SUPABASE_KEY&&!String(window.NC_SUPABASE_URL).includes("SEU-PROJETO")&&!String(window.NC_SUPABASE_KEY).includes("SUA_CHAVE");
const sb=configured()&&window.supabase?window.supabase.createClient(window.NC_SUPABASE_URL,window.NC_SUPABASE_KEY):null;
let step=0,theme="wine",musicTab="yt",files={photos:[],puzzle:null,audio:null},timer;
function msg(t){toast.textContent=t;toast.classList.add("show");clearTimeout(msg.t);msg.t=setTimeout(()=>toast.classList.remove("show"),4000)}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toggle(x,v){x.classList.toggle("hidden",!v)}
function draw(){
 document.querySelectorAll(".step").forEach((x,i)=>x.classList.toggle("hidden",i!==step));
 $("stepLabel").textContent=`${step+1} de 7`; $("bar").style.width=`${(step+1)/7*100}%`;
 toggle($("prev"),step>0);toggle($("next"),step<6);toggle($("publish"),step===6);
 if(step===6)review();
}
function data(){return{your_name:$("yourName").value.trim(),partner_name:$("partnerName").value.trim(),nickname:$("nickname").value.trim(),message_title:$("messageTitle").value.trim(),message:$("message").value.trim(),signature:$("signature").value.trim(),song_name:$("song").value.trim(),artist:$("artist").value.trim(),youtube:$("youtube").value.trim(),audioUrl:$("audioUrl").value.trim(),theme,start_date:$("startDate").value?new Date($("startDate").value).toISOString():null,surprise_message:$("surprise").value.trim()}}
function valid(){if(step===0&&!data().your_name||step===0&&!data().partner_name||step===0&&!data().start_date){msg("Preencha os nomes e a data para continuar.");return false}return true}
function previewPhotos(){let g=$("photoGrid");g.innerHTML=files.photos.map(f=>`<img src="${URL.createObjectURL(f)}">`).join("")}
function previewPuzzle(){ $("puzzlePrev").innerHTML=files.puzzle?`<img src="${URL.createObjectURL(files.puzzle)}">`:""}
function ytId(s){try{let u=new URL(s);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];if(u.hostname.includes("youtube.com")){if(u.pathname==="/watch")return u.searchParams.get("v");let p=u.pathname.split("/").filter(Boolean);if(["embed","shorts","live"].includes(p[0]))return p[1]}}catch{}return null}
function musicPreview(){let d=data(),box=$("musicPreview"),id=ytId(d.youtube);$("trackName").textContent=d.song_name||"Nossa música";$("trackArtist").textContent=d.artist||"Escolha uma faixa";
if(musicTab==="yt"&&id)box.innerHTML=`<div class="musicPreview"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="YouTube" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe></div>`;
else if(musicTab==="file"&&files.audio)box.innerHTML=`<div class="musicPreview"><audio controls src="${URL.createObjectURL(files.audio)}"></audio></div>`;
else if(musicTab==="url"&&d.audioUrl)box.innerHTML=`<div class="musicPreview"><audio controls src="${esc(d.audioUrl)}"></audio></div>`;else box.innerHTML=""}
function review(){let d=data();$("review").innerHTML=`<b>${esc(d.your_name)} ♥ ${esc(d.partner_name)}</b><br>${d.nickname?esc(d.nickname)+"<br>":""}${files.photos.length} foto(s) • ${files.puzzle?"puzzle":"sem puzzle"} • ${musicTab==="yt"&&d.youtube?"YouTube":musicTab==="file"&&files.audio?"MP3":musicTab==="url"&&d.audioUrl?"URL de áudio":"sem música"}<br>Tema: ${esc(theme)}`}
async function session(){if(!sb)throw Error("O Supabase ainda não foi conectado ao site.");let {data,error}=await sb.auth.getSession();if(error)throw error;if(data.session)return data.session;let r=await sb.auth.signInAnonymously();if(r.error)throw r.error;return r.data.session}
async function upload(file,uid,id,kind){let ext=(file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"").toLowerCase();let path=`${uid}/${id}/${kind}-${crypto.randomUUID()}.${ext}`;let r=await sb.storage.from("surpresas").upload(path,file,{contentType:file.type||undefined});if(r.error)throw r.error;return sb.storage.from("surpresas").getPublicUrl(path).data.publicUrl}
async function publish(){
 if(!sb){msg("Primeiro conecte o config.js ao seu projeto Supabase.");return}
 let d=data(),s=await session();let music_type=musicTab==="yt"&&ytId(d.youtube)?"youtube":musicTab==="file"&&files.audio?"mp3":musicTab==="url"&&d.audioUrl?"url":"none";
 let r=await sb.from("surpresas").insert({owner_id:s.user.id,your_name:d.your_name,partner_name:d.partner_name,nickname:d.nickname,message_title:d.message_title,message:d.message,signature:d.signature,photos:[],puzzle_url:null,song_name:d.song_name,artist:d.artist,music_type,music_url:music_type==="youtube"?d.youtube:music_type==="url"?d.audioUrl:null,theme,start_date:d.start_date,surprise_message:d.surprise_message}).select().single();
 if(r.error)throw r.error;let id=r.data.id,photos=[];for(let f of files.photos.slice(0,12))photos.push(await upload(f,s.user.id,id,"photo"));
 let puzzle_url=files.puzzle?await upload(files.puzzle,s.user.id,id,"puzzle"):null,music_url=r.data.music_url;if(files.audio)music_url=await upload(files.audio,s.user.id,id,"music");
 let up=await sb.from("surpresas").update({photos,puzzle_url,music_url,updated_at:new Date().toISOString()}).eq("id",id);if(up.error)throw up.error;return id}
function link(id){let u=new URL(location.href);u.search="";u.hash="";u.searchParams.set("surpresa",id);return u.toString()}
function elapsed(s){let ms=Date.now()-new Date(s).getTime();if(!Number.isFinite(ms))return"—";let sec=Math.max(0,Math.floor(ms/1000)),m=Math.floor(sec/60),h=Math.floor(m/60),d=Math.floor(h/24),y=Math.floor(d/365.2425);d=Math.floor(d-y*365.2425);return`${y} ano(s), ${d} dia(s), ${h%24}h ${m%60}m ${sec%60}s`}
function puzzle(url){let a=[0,1,2,3,4,5,6,7,8];for(let i=8;i;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return`<div class="puzzle" data-img="${esc(url)}">${a.map((p,i)=>`<button type="button" class="piece" data-p="${p}" style="background-image:url('${esc(url)}');background-position:${p%3*50}% ${Math.floor(p/3)*50}%"></button>`).join("")}</div><div class="done hidden"></div>`}
function initPuzzle(){let b=document.querySelector(".puzzle");if(!b)return;let sel=null,ps=[...b.querySelectorAll(".piece")];ps.forEach(x=>x.onclick=()=>{if(sel===null){sel=x;x.classList.add("sel");return}if(sel===x){x.classList.remove("sel");sel=null;return}let a=sel.dataset.p;x= x;let q=x.dataset.p;sel.dataset.p=q;x.dataset.p=a;[sel,x].forEach(z=>{let p=+z.dataset.p;z.style.backgroundPosition=`${p%3*50}% ${Math.floor(p/3)*50}%`;z.classList.remove("sel")});sel=null;if(ps.every((z,i)=>+z.dataset.p===i)){let d=b.nextElementSibling;d.classList.remove("hidden");d.innerHTML=`<p>Conseguiu! 💕</p><img src="${esc(b.dataset.img)}">`}})}
function render(d){home.classList.add("hidden");builder.classList.add("hidden");result.classList.add("hidden");viewer.classList.remove("hidden");$("backHome").classList.remove("hidden");document.documentElement.dataset.theme=d.theme||"wine";let ph=Array.isArray(d.photos)?d.photos:[],music="";
if(d.music_type==="youtube"){let id=ytId(d.music_url||"");if(id)music=`<div class="section"><h2>🎵 Nossa música</h2><div class="player"><b>${esc(d.song_name||"Nossa música")}</b><div class="sub">${esc(d.artist||"")}</div><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe></div></div>`}
else if(d.music_url)music=`<div class="section"><h2>🎵 Nossa música</h2><div class="player"><b>${esc(d.song_name||"Nossa música")}</b><div class="sub">${esc(d.artist||"")}</div><audio controls src="${esc(d.music_url)}"></audio></div></div>`;
$("view").innerHTML=`<section class="panel viewerHero"><div class="pill">um lugar só de vocês</div><div class="nick">${esc(d.nickname||"")}</div><h1>${esc(d.your_name)} <span style="color:var(--accent)">♥</span> ${esc(d.partner_name)}</h1><div class="counterBox"><div class="pill">juntos há</div><div id="cv" class="counterVal">${elapsed(d.start_date)}</div></div></section>
${d.message||d.message_title?`<section class="section"><h2>${esc(d.message_title||"Uma carta para você")}</h2><div class="letter">${esc(d.message||"")}${d.signature?"\n\n— "+esc(d.signature):""}</div></section>`:""}
${ph.length?`<section class="section"><h2>📸 Nossas memórias</h2><div class="gallery">${ph.map(u=>`<img src="${esc(u)}">`).join("")}</div></section>`:""}
${d.puzzle_url?`<section class="section"><h2>🧩 Monte nossa lembrança</h2>${puzzle(d.puzzle_url)}</section>`:""}${music}${d.surprise_message?`<section class="section surprise"><b>💌 E ainda tem mais...</b><p>${esc(d.surprise_message)}</p></section>`:""}`;initPuzzle();clearInterval(timer);timer=setInterval(()=>{if($("cv"))$("cv").textContent=elapsed(d.start_date)},1000)}
async function load(id){if(!sb){$("view").innerHTML='<div class="panel result"><h2>Configure o Supabase primeiro.</h2></div>';viewer.classList.remove("hidden");home.classList.add("hidden");return}try{let r=await sb.from("surpresas").select("*").eq("id",id).single();if(r.error)throw r.error;render(r.data)}catch(e){viewer.classList.remove("hidden");home.classList.add("hidden");$("view").innerHTML=`<div class="panel result"><h2>Surpresa não encontrada 💔</h2><p class="sub">${esc(e.message)}</p></div>`}}
$("begin").onclick=()=>{home.classList.add("hidden");builder.classList.remove("hidden");$("backHome").classList.remove("hidden");draw()};
$("prev").onclick=()=>{if(step){step--;draw();scrollTo(0,0)}};
$("next").onclick=()=>{if(valid()&&step<6){step++;draw();scrollTo(0,0)}};
$("form").onsubmit=async e=>{e.preventDefault();let b=$("publish");b.disabled=true;b.textContent="⏳ Publicando...";try{let id=await publish(),l=link(id);builder.classList.add("hidden");result.classList.remove("hidden");$("share").value=l;$("copy").onclick=async()=>{try{await navigator.clipboard.writeText(l);msg("Link copiado!")}catch{msg("Selecione o link e copie.")}};$("open").onclick=()=>open(l,"_blank");msg("Sua surpresa foi salva online!",5000)}catch(err){console.error(err);msg("Erro: "+(err.message||err),6500)}finally{b.disabled=false;b.textContent="💖 Publicar surpresa"}};
$("message").oninput=()=>$("count").textContent=$("message").value.length;
$("photos").onchange=e=>{files.photos=[...e.target.files].slice(0,12);previewPhotos()};
$("puzzle").onchange=e=>{files.puzzle=e.target.files[0]||null;previewPuzzle()};
$("audio").onchange=e=>{files.audio=e.target.files[0]||null;musicPreview()};
document.querySelectorAll(".musicTab").forEach(b=>b.onclick=()=>{musicTab=b.dataset.tab;document.querySelectorAll(".musicTab").forEach(x=>x.classList.toggle("active",x===b));["yt","file","url"].forEach(t=>$("music-"+t).classList.toggle("hidden",t!==musicTab));musicPreview()});
["youtube","audioUrl","song","artist"].forEach(id=>$(id).oninput=musicPreview);
document.querySelectorAll(".theme").forEach(b=>b.onclick=()=>{theme=b.dataset.theme;document.documentElement.dataset.theme=theme;document.querySelectorAll(".theme").forEach(x=>x.classList.toggle("active",x===b))});
$("backHome").onclick=()=>{history.pushState({},"",location.pathname);location.reload()};
let q=new URLSearchParams(location.search).get("surpresa");if(q)load(q);else{home.classList.remove("hidden");$("backHome").classList.add("hidden")}
})();