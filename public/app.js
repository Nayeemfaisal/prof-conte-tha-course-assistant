const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const api=async(path,options={})=>{const r=await fetch(path,{headers:{'content-type':'application/json',...(options.headers||{})},...options});const data=await r.json();if(!r.ok)throw new Error(data.error||'Request failed');return data};
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let questions=[],selected=null,currentFilter='all';

function show(id){
  $$('.view,.nav').forEach(x=>x.classList.remove('active'));
  $(`#${id}`).classList.add('active');
  $(`.nav[data-view="${id}"]`)?.classList.add('active');
  location.hash=id;
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='faq')loadFaq();
  if(id==='professor')checkSession();
}
$$('.nav,.view-link').forEach(b=>b.onclick=()=>show(b.dataset.view));
$$('.ask-now').forEach(b=>b.onclick=()=>{show('home');setTimeout(()=>$('#question-form').scrollIntoView({behavior:'smooth',block:'start'}),120)});

$('textarea[name="body"]').oninput=e=>$('#counter').textContent=e.target.value.length;
$('#question-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),data=Object.fromEntries(f);data.anonymous=f.has('anonymous');const m=$('#form-message');m.style.color='';try{const r=await api('/api/questions',{method:'POST',body:JSON.stringify(data)});m.textContent=r.whatsappNotified?`✓ Sent to Prof. Conte on WhatsApp. Reference #${r.id}. His reply will arrive by email.`:`✓ Saved as reference #${r.id}. Prof. Conte can see it in his dashboard.`;e.target.reset();$('#counter').textContent='0'}catch(err){m.textContent=err.message;m.style.color='#b24132'}};

async function loadFaq(){const list=$('#faq-list');try{const rows=await api('/api/faqs');list.dataset.rows=JSON.stringify(rows);renderFaq(rows)}catch{list.innerHTML='<div class="empty">Answers could not be loaded.</div>'}}
function renderFaq(rows){$('#faq-list').innerHTML=rows.length?rows.map(x=>`<article class="faq"><div class="meta"><span class="badge">✓ Professor approved</span><span>${esc(x.category)}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p><div class="answer">${esc(x.final_text)}</div></article>`).join(''):'<div class="empty">No published answers yet. Ask the first question!</div>'}
$('#faq-search').oninput=e=>{const rows=JSON.parse($('#faq-list').dataset.rows||'[]'),q=e.target.value.toLowerCase();renderFaq(rows.filter(x=>`${x.title} ${x.body} ${x.final_text} ${x.category}`.toLowerCase().includes(q)))};

$('#login-form').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));try{await api('/api/login',{method:'POST',body:JSON.stringify(data)});$('#login-message').textContent='';await checkSession()}catch(err){$('#login-message').textContent=err.message;$('#login-message').style.color='#b24132'}};
async function checkSession(){const s=await api('/api/session');$('#login-card').hidden=s.authenticated;$('#dashboard').hidden=!s.authenticated;if(s.authenticated){renderProfile(s.profile);await Promise.all([loadQuestions(),loadStats(),loadWhatsApp(),loadAudit()])}}
function renderProfile(profile={}){const name=profile.name||'Prof. Dr. Fiorentino Valerio Conte';$('#professor-name').textContent=name;$('#professor-role').textContent=profile.role||'Mechanical and Process Engineering · THA';const avatar=$('#professor-avatar');if(profile.photo)avatar.innerHTML=`<img src="${esc(profile.photo)}" alt="${esc(name)}">`;else avatar.textContent='VC'}
$('#logout').onclick=async()=>{await api('/api/logout',{method:'POST'});selected=null;await checkSession()};

async function loadStats(){const s=await api('/api/stats');$('#stat-open').textContent=Number(s.open||0);$('#stat-draft').textContent=Number(s.draft||0);$('#stat-answered').textContent=Number(s.answered||0);$('#stat-whatsapp').textContent=Number(s.total||0);$('#stat-whatsapp').nextElementSibling.textContent='Total app messages'}
function visibleQuestions(){return questions.filter(q=>currentFilter==='all'||q.status===currentFilter||(currentFilter==='whatsapp'&&q.channel==='whatsapp'))}
function renderQuestions(){const rows=visibleQuestions();$('#question-list').innerHTML=rows.length?rows.map(q=>`<button class="question-item ${selected===q.id?'active':''}" data-id="${q.id}"><div class="item-top"><span class="state">${esc(q.status)}</span><span class="channel-pill ${q.channel==='whatsapp'?'wa':''}">${q.channel==='whatsapp'?'WhatsApp':'Web'}</span></div><h3>${esc(q.title)}</h3><p>${esc(q.student_name)} · ${esc(q.category)}</p></button>`).join(''):'<div class="empty">No questions in this view.</div>';$$('.question-item').forEach(b=>b.onclick=()=>selectQuestion(Number(b.dataset.id)))}
async function loadQuestions(){questions=await api('/api/questions');renderQuestions()}
$$('.filter').forEach(b=>b.onclick=()=>{$$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;renderQuestions()});
$('.filter[data-filter="whatsapp"]')?.remove();

function selectQuestion(id){
  selected=id;const q=questions.find(x=>x.id===id);if(!q)return;
  $$('.question-item').forEach(x=>x.classList.toggle('active',Number(x.dataset.id)===id));
  const answer=q.final_text||q.draft||'',wa=q.channel==='whatsapp'&&q.external_contact,sources=q.sources&&q.sources!=='[]'?JSON.parse(q.sources):[];
  $('#editor').classList.remove('empty');
  $('#editor').innerHTML=`<div class="editor-head"><div><p class="eyebrow">${esc(q.category)} · ${esc(q.channel)}</p><h2>${esc(q.title)}</h2></div><span class="status-badge">${esc(q.status)}</span></div><p class="student-question">${esc(q.body)}</p><p class="sources">From ${esc(q.student_name)}${wa?' · Reply to '+esc(q.external_contact):''} · ${new Date(q.created_at+'Z').toLocaleString()}</p><div class="evidence-box"><b>Evidence status</b><span>${sources.length?`Retrieved from ${esc(sources.join(', '))}`:'No verified source retrieved yet.'}</span></div><div class="editor-actions"><button id="draft" class="secondary">Find sources & prepare draft</button><button id="archive" class="text-button">Archive</button></div><label>Professor answer<textarea id="answer" placeholder="Review, edit, and approve the final answer…">${esc(answer)}</textarea></label><p id="sources" class="sources">${sources.length?'Sources: '+esc(sources.join(', ')):''}${q.delivery_status==='sent'?' · ✓ Delivered on WhatsApp':''}</p><div class="form-actions"><p id="editor-message" role="status"></p><div class="editor-actions"><button id="publish" class="secondary">Approve & publish FAQ</button>${wa?'<button id="publish-whatsapp" class="primary">Approve & send on WhatsApp</button>':''}</div></div>`;
  $('#draft').onclick=generateDraft;$('#archive').onclick=archiveQuestion;$('#publish').onclick=()=>publishAnswer(false);if(wa)$('#publish-whatsapp').onclick=()=>publishAnswer(true);
}
async function generateDraft(){const m=$('#editor-message');m.style.color='';m.textContent='Searching approved course knowledge…';try{const r=await api(`/api/questions/${selected}/draft`,{method:'POST'});$('#answer').value=r.draft;$('#sources').textContent=r.sources.length?`Sources: ${r.sources.join(', ')}`:'No relevant source found — manual answer required.';m.textContent=r.sources.length?'Draft ready. Verify the source before publishing.':'The assistant abstained because evidence was insufficient.';await Promise.all([loadQuestions(),loadStats()]);selectQuestion(selected)}catch(e){m.textContent=e.message;m.style.color='#b24132'}}
async function publishAnswer(sendWhatsApp=false){const answer=$('#answer').value,m=$('#editor-message');m.style.color='';m.textContent=sendWhatsApp?'Sending the approved answer through Meta WhatsApp…':'Publishing approved answer…';try{const r=await api(`/api/questions/${selected}/answer`,{method:'PUT',body:JSON.stringify({answer,sendWhatsApp})});m.textContent=r.whatsappSent?'✓ Published and delivered to the original WhatsApp chat.':'✓ Approved and published to the FAQ.';await Promise.all([loadQuestions(),loadStats(),loadAudit()]);selectQuestion(selected)}catch(e){m.textContent=e.message;m.style.color='#b24132'}}
async function archiveQuestion(){try{await api(`/api/questions/${selected}/archive`,{method:'POST'});selected=null;$('#editor').classList.add('empty');$('#editor').innerHTML='<p>Select a question to review it.</p>';await Promise.all([loadQuestions(),loadStats(),loadAudit()])}catch(e){$('#editor-message').textContent=e.message}}

$('#seed-demo').onclick=async()=>{const b=$('#seed-demo');b.disabled=true;try{const r=await api('/api/demo/seed',{method:'POST'});b.textContent=r.message;await Promise.all([loadQuestions(),loadStats(),loadAudit()])}catch(e){b.textContent=e.message}finally{setTimeout(()=>{b.disabled=false;b.textContent='Load demo questions'},2500)}};

async function loadWhatsApp(){const dot=$('#wa-dot'),status=$('#wa-status'),detail=$('#wa-detail'),setup=$('#wa-setup'),start=$('#wa-start'),qr=$('#wa-qr'),dash=$('#wa-dashboard');start.hidden=true;qr.hidden=true;try{const w=await api('/api/integrations/whatsapp/status');dot.className=`connection-dot ${w.configured?'on':''}`;setup.hidden=w.configured&&w.emailConfigured;dash.hidden=!w.dashboardUrl;if(w.dashboardUrl)dash.href=w.dashboardUrl;if(!w.configured){status.textContent='Meta WhatsApp setup required';detail.textContent='Website questions are saved safely, but WhatsApp delivery is waiting for the production Meta connection.';setup.innerHTML='<b>Connect the approved course number</b><span>Add Prof. Conte’s number in Meta WhatsApp Manager, then the website can deliver questions and accept his replies.</span>';return}status.textContent='Meta WhatsApp Cloud API connected';detail.textContent=w.emailConfigured?'Questions go to Prof. Conte on WhatsApp and his replies return to students by email.':'WhatsApp is connected. Add the email delivery key to return professor replies to students.';if(!w.emailConfigured)setup.innerHTML='<b>Email delivery still needs configuration</b><span>WhatsApp replies are received securely; a verified email sender is required before student email delivery can begin.</span>'}catch(e){dot.className='connection-dot';status.textContent='Connection status unavailable';detail.textContent='Student questions continue to arrive in this protected dashboard.'}}
const labelStatus=s=>({not_configured:'Not configured',ready:'Connected'}[s]||String(s||'Unknown').replaceAll('_',' '));
$('#wa-refresh').onclick=loadWhatsApp;
$('#wa-start').onclick=loadWhatsApp;
$('#wa-qr').onclick=loadWhatsApp;

async function loadAudit(){try{const rows=await api('/api/audit');$('#audit-list').innerHTML=rows.length?rows.slice(0,8).map(x=>`<div class="audit-row"><span>${auditLabel(x.event)}</span><time>${new Date(x.created_at+'Z').toLocaleString()}</time></div>`).join(''):'<p class="muted">No activity recorded yet.</p>'}catch(e){$('#audit-list').innerHTML=`<p class="muted">${esc(e.message)}</p>`}}
const auditLabel=e=>({login:'Professor signed in',question_created:'Question received',answer_published:'Answer published',answer_published_whatsapp:'Answer sent on WhatsApp',professor_reply_emailed:'WhatsApp reply emailed to student',whatsapp_alert_failed:'WhatsApp alert failed',email_delivery_failed:'Student email delivery failed',question_archived:'Question archived',demo_seeded:'Demo questions loaded'}[e]||e.replaceAll('_',' '));
$('#audit-refresh').onclick=loadAudit;

let installPrompt=null;
const installButton=$('#install-app');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton.hidden=false});
installButton.onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.hidden=true};
window.addEventListener('appinstalled',()=>{installPrompt=null;installButton.hidden=true});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));
const initial=location.hash.slice(1);if(['home','faq','workflow','research','professor'].includes(initial))show(initial);
