const C=[
  ['1','Unos'],['2','Doses'],['3','Treses'],['4','Cuatros'],['5','Cincos'],['6','Seises'],
  ['straight','Escalera'],['full','Full'],['poker','Póker'],['generala','Generala'],['double','Doble generala']
];
const K='generalamo.state.v2',OLD='generalamo.v0.1',HK='generalamo.history.v1',THEME='generalamo.theme';
const $=id=>document.getElementById(id);
let selectedMode='scorekeeper',activeView='home',shareInfo=null;

function fresh(players=[]){
  const seed=Date.now();
  const ps=players.map((p,i)=>({id:p.id||('p'+seed+i),name:p.name||String(p)}));
  const scores={}; ps.forEach(p=>scores[p.id]={});
  return {
    schema:3,title:'Partida '+new Date().toLocaleDateString(),mode:selectedMode,players:ps,scores,events:[],
    turn:0,dice:[1,1,1,1,1],held:[false,false,false,false,false],throws:0,rule:'served',
    startedAt:Date.now(),finishedAt:null,instantWinnerId:null
  };
}
function normalize(s){
  if(!s||typeof s!=='object') return fresh();
  s.schema=3;
  s.players=Array.isArray(s.players)?s.players:[];
  s.scores=s.scores&&typeof s.scores==='object'?s.scores:{};
  s.events=Array.isArray(s.events)?s.events:[];
  s.turn=Math.max(0,Math.min(Number(s.turn)||0,Math.max(0,s.players.length-1)));
  s.dice=Array.isArray(s.dice)&&s.dice.length===5?s.dice.map(v=>Math.max(1,Math.min(6,Number(v)||1))):[1,1,1,1,1];
  s.held=Array.isArray(s.held)&&s.held.length===5?s.held.map(Boolean):[false,false,false,false,false];
  s.throws=Math.max(0,Math.min(3,Number(s.throws)||0));
  s.rule=s.rule||'served';
  s.title=s.title||'Partida';
  s.startedAt=Number(s.startedAt)||Date.now();
  s.finishedAt=s.finishedAt?Number(s.finishedAt):null;
  s.instantWinnerId=s.instantWinnerId||null;
  s.players.forEach(p=>{if(!s.scores[p.id]||typeof s.scores[p.id]!=='object')s.scores[p.id]={}});
  return s;
}
function load(){
  for(const key of [K,OLD]){
    try{
      const raw=localStorage.getItem(key);
      if(raw){
        const state=normalize(JSON.parse(raw));
        if(key===OLD)localStorage.setItem(K,JSON.stringify(state));
        return state;
      }
    }catch{}
  }
  return fresh();
}
let g=load();

function histories(){try{const x=JSON.parse(localStorage.getItem(HK)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function saveHistory(list){localStorage.setItem(HK,JSON.stringify(list.slice(0,30)))}
function safe(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function categoryLabel(cat){return C.find(x=>x[0]===cat)?.[1]||cat}
function player(pid,state=g){return state.players.find(p=>p.id===pid)}
function event(text,data={}){
  g.events.push({t:Date.now(),text,...data});
  g.events=g.events.slice(-240);
}
function save(){
  g=normalize(g);
  localStorage.setItem(K,JSON.stringify(g));
  if($('state'))$('state').textContent='Guardado';
  if(window.GeneralAMONative&&shareInfo){
    try{GeneralAMONative.updateSharedState(JSON.stringify(g))}catch{}
  }
}
function total(pid,state=g){
  return C.reduce((sum,[cat])=>sum+(Number(state.scores?.[pid]?.[cat])||0),0);
}
function hasScores(state=g){return state.players.some(p=>Object.keys(state.scores?.[p.id]||{}).length)}
function filledCount(state=g){return state.players.reduce((n,p)=>n+Object.keys(state.scores?.[p.id]||{}).length,0)}
function allComplete(state=g){return state.players.length>0&&state.players.every(p=>Object.keys(state.scores?.[p.id]||{}).length>=C.length)}
function showNotice(text,tone='good'){
  const n=$('gameNotice'); if(!n)return;
  n.textContent=text;n.className='notice '+tone;
  clearTimeout(showNotice.t);showNotice.t=setTimeout(()=>n.classList.add('hidden'),3200);
}
function rankPlayers(state=g){
  return state.players.map(p=>({id:p.id,name:p.name,total:total(p.id,state)})).sort((a,b)=>b.total-a.total);
}
function outcome(state=g){
  if(state.instantWinnerId){
    const p=player(state.instantWinnerId,state);
    return {done:true,text:p?`🏆 ${p.name} ganó con Generala servida`:'Partida finalizada',winners:p?[p]:[]};
  }
  if(!state.finishedAt&&!allComplete(state))return{done:false,text:'',winners:[]};
  const rank=rankPlayers(state); if(!rank.length)return{done:true,text:'Partida finalizada',winners:[]};
  const top=rank[0].total,winners=rank.filter(x=>x.total===top);
  return{done:true,text:winners.length===1?`🏆 ${winners[0].name} ganó con ${top} puntos`:`🤝 Empate: ${winners.map(x=>x.name).join(' · ')} (${top} puntos)`,winners};
}
function finishIfNeeded(){
  if(g.finishedAt)return true;
  if(g.instantWinnerId||allComplete(g)){
    g.finishedAt=Date.now();
    const o=outcome(g);
    event(o.text,{type:'finish',winnerIds:o.winners.map(x=>x.id)});
    save();
    return true;
  }
  return false;
}
function archiveCurrent(){
  if(!g.players.length||!hasScores())return;
  const copy=JSON.parse(JSON.stringify(g));
  copy.endedAt=copy.finishedAt||Date.now();
  copy.totals=Object.fromEntries(copy.players.map(p=>[p.id,total(p.id,copy)]));
  const list=histories();
  const signature=copy.startedAt+'|'+copy.endedAt+'|'+JSON.stringify(copy.totals);
  const exists=list.some(x=>(x.startedAt+'|'+(x.endedAt||x.finishedAt)+'|'+JSON.stringify(x.totals||{}))===signature);
  if(!exists)list.unshift(copy);
  saveHistory(list);
}
function renderPlayers(){
  if(!g.players.length){$('players').innerHTML='<span class="muted">Agregá entre 1 y 8 jugadores.</span>';return}
  $('players').innerHTML=g.players.map(p=>`<span class="chip">${safe(p.name)} <button data-remove="${p.id}" aria-label="Eliminar ${safe(p.name)}">×</button></span>`).join('');
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();removePlayer(b.dataset.remove)});
}
function addPlayer(){
  const n=$('name').value.trim(); if(!n||g.players.length>=8)return;
  const id='p'+Date.now()+Math.floor(Math.random()*99);
  g.players.push({id,name:n});g.scores[id]={};$('name').value='';
  event(`${n} se sumó a la mesa`,{type:'player-add',pid:id});save();renderPlayers();
}
function removePlayer(pid){
  const p=player(pid);if(!p)return;
  const used=Object.keys(g.scores[pid]||{}).length;
  if(used&&!confirm(`¿Eliminar a ${p.name} y sus ${used} anotaciones?`))return;
  g.players=g.players.filter(x=>x.id!==pid);delete g.scores[pid];
  if(g.turn>=g.players.length)g.turn=Math.max(0,g.players.length-1);
  event(`${p.name} fue eliminado de la mesa`,{type:'player-remove',pid});save();renderPlayers();
  if(activeView==='game')renderGame();
}
function counts(state=g){const c=[0,0,0,0,0,0,0];state.dice.forEach(v=>c[v]++);return c}
function baseDiceScore(cat,state=g){
  const c=counts(state),unique=[...new Set(state.dice)].sort().join(''),groups=c.filter(Boolean).sort((a,b)=>a-b);
  if(/^[1-6]$/.test(cat))return c[+cat]*(+cat);
  if(cat==='straight')return(unique==='12345'||unique==='23456')?20:0;
  if(cat==='full')return groups.join(',')==='2,3'?30:0;
  if(cat==='poker')return groups.some(n=>n>=4)?40:0;
  if(cat==='generala')return groups.includes(5)?50:0;
  if(cat==='double')return groups.includes(5)?100:0;
  return 0;
}
function isServed(cat,state=g){
  return state.rule==='served'&&state.throws===1&&['straight','full','poker'].includes(cat)&&baseDiceScore(cat,state)>0;
}
function diceScore(cat,state=g){
  const base=baseDiceScore(cat,state);
  return base+(isServed(cat,state)?5:0);
}
function isGeneralaServed(state=g){return state.throws===1&&baseDiceScore('generala',state)===50}
function nextPlayerName(state=g){
  if(!state.players.length)return'—';
  const i=(state.turn+1)%state.players.length;
  return state.players[i]?.name||'—';
}
function scoreEventText(pid,cat,value,prev,source){
  const p=player(pid),name=p?.name||'Jugador',label=categoryLabel(cat),remote=source==='remote'?' · desde Wi‑Fi':'';
  if(value===null)return`${name} dejó ${label} libre${remote}`;
  if(Number(value)===0)return`${name} tachó ${label} ❌ · 0 puntos${remote}`;
  if(prev!==null&&prev!==undefined)return`${name} corrigió ${label}: ${prev} → ${value}${remote}`;
  return`${name} anotó ${value} en ${label}${remote}`;
}
function recordScore(pid,cat,value,source='local',advance=true){
  if(!C.some(x=>x[0]===cat)||!player(pid))return false;
  if(!g.scores[pid])g.scores[pid]={};
  const hasPrev=Object.prototype.hasOwnProperty.call(g.scores[pid],cat);
  const prev=hasPrev?g.scores[pid][cat]:null;
  const parsed=(value===null||value==='')?null:Math.max(0,Math.min(999,Number(value)||0));
  if(parsed===null)delete g.scores[pid][cat];else g.scores[pid][cat]=parsed;
  const shouldAdvance=advance&&!hasPrev&&parsed!==null&&g.players[g.turn]?.id===pid&&!g.finishedAt;
  const next=shouldAdvance?nextPlayerName():null,turnBefore=g.turn;
  event(scoreEventText(pid,cat,parsed,prev,source)+(next?` · sigue ${next}`:''),{type:'score',pid,cat,prev,next:parsed,source,turnBefore,turnAdvanced:shouldAdvance});
  if(shouldAdvance)nextTurn(false);
  finishIfNeeded();save();return true;
}
function nextTurn(log=true,source='local'){
  if(!g.players.length||g.finishedAt)return;
  const from=g.players[g.turn]?.name||'Jugador';
  g.turn=(g.turn+1)%g.players.length;
  g.dice=[1,1,1,1,1];g.held=[false,false,false,false,false];g.throws=0;
  if(log)event(`${from} pasó el turno · sigue ${g.players[g.turn]?.name||'—'}${source==='remote'?' · desde Wi‑Fi':''}`,{type:'turn',source});
  save();
}
function commitDigital(cat,source='local'){
  const p=g.players[g.turn];
  if(!p||g.finishedAt||Object.prototype.hasOwnProperty.call(g.scores[p.id]||{},cat)||!g.throws)return;
  if(cat==='double'&&!Object.prototype.hasOwnProperty.call(g.scores[p.id]||{},'generala')){
    showNotice('La Doble generala se habilita después de haber anotado una Generala.','warn');return;
  }
  const value=diceScore(cat),served=isServed(cat);
  const prevTurn=g.turn,diceBefore=[...g.dice],heldBefore=[...g.held],throwsBefore=g.throws;
  let turnAdvanced=false;
  if(!g.scores[p.id])g.scores[p.id]={};
  g.scores[p.id][cat]=value;
  let text=value===0?`${p.name} tachó ${categoryLabel(cat)} ❌ · 0 puntos`:`${p.name} anotó ${value} en ${categoryLabel(cat)}${served?' · servida 🎯':''}`;
  if(cat==='generala'&&isGeneralaServed(g)){
    g.instantWinnerId=p.id;g.finishedAt=Date.now();text=`${p.name} hizo Generala servida 🎲🏆 · gana la partida`;
    event(text,{type:'finish',pid:p.id,cat,value,source,served:true});
    save();renderGame();showNotice(text);return;
  }
  if(!allComplete(g)){
    g.turn=(g.turn+1)%g.players.length;g.dice=[1,1,1,1,1];g.held=[false,false,false,false,false];g.throws=0;turnAdvanced=true;
    text+=` · sigue ${g.players[g.turn]?.name||'—'}`;
  }
  event(text,{type:'score',pid:p.id,cat,prev:null,next:value,source,served,turnBefore:prevTurn,turnAdvanced,diceBefore,heldBefore,throwsBefore});
  finishIfNeeded();save();renderGame();showNotice(text);
}
function scoreRecency(pid){
  const current=g.scores[pid]||{},seen=new Set(),rank=[];
  for(let i=g.events.length-1;i>=0;i--){
    const e=g.events[i];
    if(e.type!=='score'||e.pid!==pid||!Object.prototype.hasOwnProperty.call(current,e.cat)||seen.has(e.cat))continue;
    seen.add(e.cat);rank.push(e.cat);
  }
  return rank;
}
function recencyClass(pid,cat){
  if(!Object.prototype.hasOwnProperty.call(g.scores[pid]||{},cat))return'';
  const rank=scoreRecency(pid),i=rank.indexOf(cat);
  if(i===0)return'mark-last';if(i===1)return'mark-prev';return'mark-old';
}
function pipPositions(v){return{1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]}[v]||[]}
function dieHtml(v,i){
  const set=new Set(pipPositions(v));let cells='';
  for(let p=1;p<=9;p++)cells+=set.has(p)?'<i class="pip"></i>':'<i></i>';
  return`<button class="die ${g.held[i]?'held':''}" data-die="${i}" ${g.finishedAt?'disabled':''} aria-label="Dado ${i+1}: ${v}">${cells}</button>`;
}
function renderDice(){
  const p=g.players[g.turn];$('turn').textContent=p?`Turno: ${p.name}`:'Sin jugadores';$('throws').textContent=`${g.throws} / 3 tiradas`;
  $('dice').innerHTML=g.dice.map(dieHtml).join('');
  document.querySelectorAll('[data-die]').forEach(b=>b.onclick=()=>{if(!g.throws||g.finishedAt)return;const i=Number(b.dataset.die);g.held[i]=!g.held[i];save();renderDice()});
  $('roll').disabled=g.finishedAt||g.throws>=3||!p;
  $('skip').disabled=g.finishedAt||!p;
  $('preview').innerHTML=C.map(([cat,label])=>{
    const used=p&&Object.prototype.hasOwnProperty.call(g.scores[p.id]||{},cat),stored=used?g.scores[p.id][cat]:null;
    const doubleLocked=cat==='double'&&p&&!Object.prototype.hasOwnProperty.call(g.scores[p.id]||{},'generala');
    const cls=used?`used ${recencyClass(p.id,cat)}`:'';
    const value=used?stored:(g.throws?diceScore(cat):null);
    let sub=used?'Ya anotado':(!g.throws?'Tirá los dados':doubleLocked?'Primero necesitás Generala':value===0?'Usa la casilla y suma 0':isServed(cat)?'Servida · +5':'Puntaje posible');
    const main=used?stored:(value===0?'❌ Tachar':(value??'—'));
    return`<button class="pick ${cls} ${value===0&&!used?'zero':''}" data-pick="${cat}" ${!g.throws||used||doubleLocked||g.finishedAt?'disabled':''}><span>${label}</span><b>${main}</b><small>${sub}</small></button>`;
  }).join('');
  document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>commitDigital(b.dataset.pick));
}
function renderTable(){
  let h='<tr><th>Categoría</th>'+g.players.map(p=>`<th><span class="scorePlayer">${safe(p.name)}</span><span class="scoreTotal">${total(p.id)} pts</span></th>`).join('')+'</tr>';
  for(const[cat,label]of C){
    h+=`<tr><td>${label}</td>`+g.players.map(p=>{
      const used=Object.prototype.hasOwnProperty.call(g.scores[p.id]||{},cat),val=used?g.scores[p.id][cat]:'',cls=used?`filled ${recencyClass(p.id,cat)} ${Number(val)===0?'zeroFilled':''}`:'';
      const title=used&&Number(val)===0?'Tachado · 0 puntos':'';
      return`<td><input class="cell ${cls}" ${g.mode==='digital'||g.finishedAt?'readonly':''} data-p="${p.id}" data-c="${cat}" inputmode="numeric" value="${val}" placeholder="—" title="${title}" aria-label="${safe(label)} de ${safe(p.name)}"></td>`;
    }).join('')+'</tr>';
  }
  h+='<tr><td><b>TOTAL</b></td>'+g.players.map(p=>`<td><b>${total(p.id)}</b></td>`).join('')+'</tr>';
  $('table').innerHTML=h;$('table').style.minWidth=(132+Math.max(1,g.players.length)*96)+'px';
  if(g.mode==='scorekeeper'&&!g.finishedAt){
    document.querySelectorAll('.cell').forEach(i=>i.onchange=()=>{
      const raw=i.value.trim();
      recordScore(i.dataset.p,i.dataset.c,raw===''?null:Number(raw),'local',true);
      renderGame();
      const p=player(i.dataset.p),v=raw===''?null:Number(raw);
      if(v===0)showNotice(`${p?.name||'Jugador'} tachó ${categoryLabel(i.dataset.c)} ❌`);
    });
  }
}
function renderMeta(){
  const totalSlots=Math.max(1,g.players.length*C.length),filled=filledCount(),pct=Math.round(filled/totalSlots*100),current=g.finishedAt?'Finalizada':(g.players[g.turn]?.name||'—');
  $('gameMeta').innerHTML=`<div class="metaCard"><span>JUGADORES</span><b>${g.players.length}</b></div><div class="metaCard"><span>PROGRESO</span><b>${filled}/${totalSlots}</b><div class="progressBar"><i style="width:${pct}%"></i></div></div><div class="metaCard"><span>${g.finishedAt?'ESTADO':'TURNO'}</span><b>${safe(current)}</b></div>`;
}
function iconForEvent(e){
  return{score:Number(e.next)===0?'❌':'📝',roll:'🎲',turn:'➡️',finish:'🏆','player-add':'➕','player-remove':'➖',start:'🎯',undo:'↩️'}[e.type]||'•';
}
function renderActivity(){
  const rows=g.events.slice(-12).reverse();
  $('activity').innerHTML=rows.length?rows.map(e=>`<div class="activityItem"><span class="activityIcon">${iconForEvent(e)}</span><div><b>${safe(e.text)}</b><small>${new Date(e.t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></div></div>`).join(''):'<div class="muted">Sin movimientos todavía.</div>';
}
function renderResult(){
  const box=$('gameResult'),o=outcome(g);
  if(!o.done){box.classList.add('hidden');box.innerHTML='';return}
  const rank=rankPlayers(g),top=rank[0],second=rank[1],margin=top&&second?top.total-second.total:null;
  box.innerHTML=`<h2>🎉 ¡Partida finalizada!</h2><div class="winner">${safe(o.text)}</div>${margin!==null&&o.winners.length===1?`<p>Ventaja de <b>${margin}</b> puntos sobre ${safe(second.name)}.</p>`:''}<p>${rank.map((x,i)=>`${i+1}. ${safe(x.name)} · <b>${x.total}</b>`).join('<br>')}</p>`;
  box.classList.remove('hidden');
}
function renderGame(){
  $('gameTitle').textContent=g.title;$('digitalPanel').classList.toggle('hidden',g.mode!=='digital');
  renderMeta();renderResult();renderTable();if(g.mode==='digital')renderDice();renderActivity();
  $('undo').disabled=g.finishedAt||!g.events.some(e=>e.type==='score');
}
function historyTotals(x){return Object.fromEntries(x.players.map(p=>[p.id,x.totals?.[p.id]??total(p.id,x)]))}
function renderHistory(){
  const list=histories();
  $('historyList').innerHTML=list.length?list.map((x,i)=>{
    x=normalize(JSON.parse(JSON.stringify(x)));const totals=historyTotals(x);x.totals=totals;
    const rank=x.players.map(p=>({name:p.name,total:totals[p.id]||0})).sort((a,b)=>b.total-a.total),o=outcome(x);
    return`<article class="card historyCard"><div class="kicker">${new Date(x.endedAt||x.finishedAt||x.startedAt).toLocaleString()}</div><h3>${safe(x.title||('Partida '+(i+1)))}</h3><p class="historyPodium">${o.done?safe(o.text):rank.map((w,j)=>`${j===0?'🏆 ':''}${safe(w.name)}: ${w.total}`).join(' · ')}</p><div class="historyActions"><button class="btn primary" data-view-history="${i}">Ver partida</button><button class="btn" data-restore="${i}">Restaurar</button></div></article>`;
  }).join(''):'<div class="card empty">Todavía no hay partidas archivadas.</div>';
  document.querySelectorAll('[data-view-history]').forEach(b=>b.onclick=()=>openHistory(Number(b.dataset.viewHistory)));
  document.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>restoreHistory(Number(b.dataset.restore)));
}
function openHistory(i){
  const raw=histories()[i];if(!raw)return;
  const x=normalize(JSON.parse(JSON.stringify(raw)));x.totals=historyTotals(x);
  $('historyTitle').textContent=x.title||'Partida';
  const o=outcome(x),rank=rankPlayers(x);
  let table='<div class="summaryTable"><table><tr><th>Categoría</th>'+x.players.map(p=>`<th>${safe(p.name)}</th>`).join('')+'</tr>';
  C.forEach(([cat,label])=>{table+=`<tr><td>${label}</td>`+x.players.map(p=>{const used=Object.prototype.hasOwnProperty.call(x.scores?.[p.id]||{},cat),v=used?x.scores[p.id][cat]:'—';return`<td>${used&&Number(v)===0?'❌ 0':v}</td>`}).join('')+'</tr>'});
  table+='<tr><td><b>TOTAL</b></td>'+x.players.map(p=>`<td><b>${total(p.id,x)}</b></td>`).join('')+'</tr></table></div>';
  const activity=(x.events||[]).slice(-10).reverse().map(e=>`<div class="activityItem"><span class="activityIcon">${iconForEvent(e)}</span><div><b>${safe(e.text)}</b><small>${new Date(e.t).toLocaleString()}</small></div></div>`).join('');
  $('historySummary').innerHTML=`<div class="summaryHero"><div class="winner">${safe(o.text||'Resumen de la partida')}</div><p>${rank.map((p,i)=>`${i+1}. ${safe(p.name)} · <b>${p.total}</b> puntos`).join('<br>')}</p></div>${table}<h3>Últimos movimientos</h3><div class="activity">${activity||'<span class="muted">Sin actividad registrada.</span>'}</div>`;
  $('historyOverlay').classList.remove('hidden');
}
function restoreHistory(i){
  const x=histories()[i];if(!x)return;
  if(hasScores()&&!confirm('La partida actual se archivará antes de restaurar.'))return;
  archiveCurrent();g=normalize(JSON.parse(JSON.stringify(x)));g.endedAt=undefined;g.finishedAt=null;g.instantWinnerId=null;
  event('Partida restaurada desde el historial',{type:'start'});save();renderPlayers();renderGame();navigate('game');
}
function navigate(view){
  activeView=view;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===view));
  if(view==='game')renderGame();if(view==='history')renderHistory();if(view==='share')renderShare();
}
function newGame(){
  if(hasScores()&&!confirm('¿Archivar esta partida y empezar una nueva?'))return;
  archiveCurrent();const keep=g.players.map(p=>({id:p.id,name:p.name}));
  g=fresh(keep);g.mode=selectedMode;g.rule=$('rules').value||'served';save();renderPlayers();navigate('home');
}
function startGame(){
  if(!g.players.length){alert('Agregá al menos un jugador.');return}
  if(hasScores()){if(!confirm('Hay anotaciones en la partida actual. ¿Archivarla y empezar una nueva?'))return;archiveCurrent();const keep=g.players.map(p=>({id:p.id,name:p.name}));g=fresh(keep)}
  g.mode=selectedMode;g.rule=$('rules').value||'served';g.turn=0;g.finishedAt=null;g.instantWinnerId=null;
  event(`Partida iniciada · turno de ${g.players[0]?.name||'—'}`,{type:'start'});save();renderGame();navigate('game');
}
function roll(source='local'){
  if(g.throws>=3||!g.players.length||g.finishedAt)return;
  const p=g.players[g.turn];g.dice=g.dice.map((v,i)=>g.held[i]?v:Math.floor(Math.random()*6)+1);g.throws++;
  event(`${p?.name||'Jugador'} tiró ${g.dice.join(' · ')} · ${g.throws}/3${source==='remote'?' · desde Wi‑Fi':''}`,{type:'roll',pid:p?.id,throw:g.throws,dice:[...g.dice],source});
  save();renderGame();
}
function undo(){
  for(let i=g.events.length-1;i>=0;i--){
    const e=g.events[i];
    if(e.type==='score'&&e.pid&&e.cat){
      if(e.prev===null||e.prev===undefined)delete g.scores[e.pid][e.cat];else g.scores[e.pid][e.cat]=e.prev;
      if(e.turnAdvanced&&Number.isInteger(e.turnBefore)){
        g.turn=Math.max(0,Math.min(e.turnBefore,Math.max(0,g.players.length-1)));
        if(Array.isArray(e.diceBefore)&&e.diceBefore.length===5)g.dice=[...e.diceBefore];
        if(Array.isArray(e.heldBefore)&&e.heldBefore.length===5)g.held=[...e.heldBefore];
        if(Number.isInteger(e.throwsBefore))g.throws=e.throwsBefore;
      }
      g.events.splice(i,1);g.finishedAt=null;g.instantWinnerId=null;
      event(`Se deshizo la última anotación de ${player(e.pid)?.name||'un jugador'}`,{type:'undo'});
      save();renderGame();showNotice('Última anotación deshecha');return;
    }
  }
  showNotice('No hay una anotación para deshacer','warn');
}
function renderShare(){
  if(shareInfo){
    $('shareLinks').classList.remove('hidden');$('viewerUrl').textContent=shareInfo.viewerUrl;$('editorUrl').textContent=shareInfo.editorUrl;
    $('shareStatus').textContent='Acceso local activo · la partida se actualiza automáticamente.';$('shareStatus').className='notice good';
  }
}
function startShare(){
  if(!window.GeneralAMONative){$('shareStatus').textContent='El acceso Wi‑Fi está disponible en la app Android instalada desde StoreAMO.';return}
  try{
    const r=JSON.parse(GeneralAMONative.startSharing(JSON.stringify(g)));if(!r.ok)throw new Error(r.error||'No se pudo iniciar');
    shareInfo=r;renderShare();
  }catch(e){$('shareStatus').textContent='No se pudo iniciar el acceso local: '+e.message;$('shareStatus').className='notice warn'}
}
function stopShare(){
  if(window.GeneralAMONative)try{GeneralAMONative.stopSharing()}catch{}
  shareInfo=null;$('shareLinks').classList.add('hidden');$('shareStatus').textContent='Acceso local detenido.';$('shareStatus').className='notice';
}
function nativeCopy(text){if(window.GeneralAMONative)GeneralAMONative.copyText(text);else navigator.clipboard?.writeText(text)}
function nativeShare(text){if(window.GeneralAMONative)GeneralAMONative.shareText(text);else nativeCopy(text)}

window.applyRemoteScore=function(pid,cat,value){window.applyRemoteAction({type:'score',pid,cat,value})};
window.applyRemoteAction=function(action){
  if(!action||typeof action!=='object')return;
  const source='remote';
  if(action.type==='roll'){if(g.mode==='digital')roll(source);return}
  if(action.type==='hold'){
    if(g.mode!=='digital'||!g.throws||g.finishedAt)return;
    const i=Number(action.index);if(i<0||i>4)return;g.held[i]=!g.held[i];event(`${g.players[g.turn]?.name||'Jugador'} ${g.held[i]?'retuvo':'liberó'} un dado · desde Wi‑Fi`,{type:'roll',source});save();renderGame();return;
  }
  if(action.type==='skip'){nextTurn(true,source);renderGame();return}
  if(action.type==='digital-score'){if(g.mode==='digital')commitDigital(String(action.cat||''),source);return}
  if(action.type==='score'){
    const pid=String(action.pid||''),cat=String(action.cat||'');
    const value=action.value===null||action.value===''?null:Number(action.value);
    if(recordScore(pid,cat,value,source,true)){renderGame();showNotice('Anotación recibida desde Wi‑Fi')}
  }
};

document.querySelectorAll('.mode').forEach(m=>m.onclick=()=>{selectedMode=m.dataset.mode;document.querySelectorAll('.mode').forEach(x=>x.classList.toggle('active',x===m))});
document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>navigate(n.dataset.view));
$('add').onclick=addPlayer;$('name').onkeydown=e=>{if(e.key==='Enter')addPlayer()};
$('start').onclick=startGame;$('roll').onclick=()=>roll('local');$('skip').onclick=()=>{nextTurn(true,'local');renderGame()};
$('undo').onclick=undo;$('newGame').onclick=newGame;$('shareQuick').onclick=()=>navigate('share');
$('startShare').onclick=startShare;$('stopShare').onclick=stopShare;
$('copyViewer').onclick=()=>nativeCopy(shareInfo?.viewerUrl||'');$('copyEditor').onclick=()=>nativeCopy(shareInfo?.editorUrl||'');
$('sendViewer').onclick=()=>nativeShare('GeneralAMO · ver partida\n'+(shareInfo?.viewerUrl||''));
$('sendEditor').onclick=()=>nativeShare('GeneralAMO · jugar / anotar\n'+(shareInfo?.editorUrl||''));
$('closeHistory').onclick=()=>$('historyOverlay').classList.add('hidden');
$('historyOverlay').onclick=e=>{if(e.target===$('historyOverlay'))$('historyOverlay').classList.add('hidden')};

function applyTheme(value){document.documentElement.dataset.theme=value==='dark'?'dark':'';localStorage.setItem(THEME,value)}
const savedTheme=localStorage.getItem(THEME);applyTheme(savedTheme||((window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'));
$('theme').onclick=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
renderPlayers();$('rules').value=g.rule||'served';selectedMode=g.mode||'scorekeeper';document.querySelectorAll('.mode').forEach(m=>m.classList.toggle('active',m.dataset.mode===selectedMode));
if(g.players.length&&hasScores()){renderGame();navigate('game')}
