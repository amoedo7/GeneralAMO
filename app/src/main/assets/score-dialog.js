(()=>{
  const NUMERIC={
    '1':[1,2,3,4,5],
    '2':[2,4,6,8,10],
    '3':[3,6,9,12,15],
    '4':[4,8,12,16,20],
    '5':[5,10,15,20,25],
    '6':[6,12,18,24,30]
  };
  const SPECIAL={straight:[20,25],full:[30,35],poker:[40,45],generala:[50],double:[100]};
  const ARM_MS=180;
  let current=null,previousOverflow='',armTimer=0,armedAt=0;

  const style=document.createElement('style');
  style.textContent=`
    #scoreChoiceOverlay{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.66);backdrop-filter:blur(2px)}
    #scoreChoiceOverlay.hidden{display:none}
    .scoreChoiceCard{width:min(560px,92vw);max-height:min(82vh,760px);overflow:auto;background:#29282f;color:#fff;border-radius:34px;padding:34px 28px 28px;box-shadow:0 24px 80px rgba(0,0,0,.55);transform:translateY(0);transition:transform .14s ease,opacity .14s ease}
    .scoreChoiceCard.arming{transform:translateY(5px)}
    .scoreChoiceCard h2{margin:0 0 26px;font-size:clamp(31px,7vw,44px);font-weight:500;letter-spacing:-.02em}
    .scoreChoicePlayer{margin:-18px 0 18px;color:#b9b6c3;font-size:14px}
    .scoreChoiceValues{display:flex;flex-direction:column;align-items:stretch;gap:2px}
    .scoreChoiceValue,.scoreChoiceAction{appearance:none;border:0;background:transparent;width:100%;min-height:68px;border-radius:18px;color:#ffeb00;font:inherit;font-size:22px;font-weight:750;cursor:pointer;text-align:center;padding:14px 18px;touch-action:manipulation}
    .scoreChoiceValue:active,.scoreChoiceAction:active{background:rgba(255,235,0,.11);transform:scale(.99)}
    .scoreChoiceCard.arming .scoreChoiceValue,.scoreChoiceCard.arming .scoreChoiceAction{pointer-events:none}
    .scoreChoiceAction.danger{margin-top:4px}
    .scoreChoiceAction.delete{margin-top:2px}
    .scoreChoiceAction.cancel{text-align:right;padding-right:12px;margin-top:4px}
    @media(max-width:560px){
      #scoreChoiceOverlay{padding:18px}
      .scoreChoiceCard{width:100%;border-radius:30px;padding:32px 22px 22px}
      .scoreChoiceCard h2{font-size:40px;margin-bottom:22px}
      .scoreChoiceValue,.scoreChoiceAction{min-height:64px;font-size:21px}
    }
  `;
  document.head.appendChild(style);

  const overlay=document.createElement('div');
  overlay.id='scoreChoiceOverlay';
  overlay.className='hidden';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','scoreChoiceTitle');
  overlay.innerHTML=`<div class="scoreChoiceCard">
    <h2 id="scoreChoiceTitle"></h2>
    <div id="scoreChoicePlayer" class="scoreChoicePlayer"></div>
    <div id="scoreChoiceValues" class="scoreChoiceValues"></div>
    <button id="scoreChoiceScratch" class="scoreChoiceAction danger" type="button">❌ Tachar</button>
    <button id="scoreChoiceDelete" class="scoreChoiceAction delete" type="button">Borrar casilla</button>
    <button id="scoreChoiceCancel" class="scoreChoiceAction cancel" type="button">Cancelar</button>
  </div>`;
  document.body.appendChild(overlay);

  const card=overlay.querySelector('.scoreChoiceCard');
  const values=overlay.querySelector('#scoreChoiceValues');
  const title=overlay.querySelector('#scoreChoiceTitle');
  const playerLine=overlay.querySelector('#scoreChoicePlayer');
  const scratch=overlay.querySelector('#scoreChoiceScratch');
  const del=overlay.querySelector('#scoreChoiceDelete');
  const cancel=overlay.querySelector('#scoreChoiceCancel');

  function allowed(cat){
    if(NUMERIC[cat])return NUMERIC[cat];
    const list=SPECIAL[cat]?[...SPECIAL[cat]]:[];
    let served=true;
    try{served=typeof g==='undefined'||g.rule!=='classic'}catch{served=true}
    if(!served&&['straight','full','poker'].includes(cat))return list.slice(0,1);
    return list;
  }
  function arm(){
    clearTimeout(armTimer);
    armedAt=performance.now()+ARM_MS;
    card.classList.add('arming');
    card.setAttribute('aria-busy','true');
    armTimer=setTimeout(()=>{
      if(overlay.classList.contains('hidden'))return;
      card.classList.remove('arming');
      card.removeAttribute('aria-busy');
      values.querySelector('button')?.focus({preventScroll:true});
    },ARM_MS);
  }
  function close(){
    clearTimeout(armTimer);
    overlay.classList.add('hidden');
    card.classList.remove('arming');
    card.removeAttribute('aria-busy');
    document.body.style.overflow=previousOverflow;
    current=null;
  }
  function commit(value){
    if(!current||performance.now()<armedAt)return;
    const {pid,cat}=current;
    close();
    if(typeof recordScore!=='function')return;
    if(recordScore(pid,cat,value,'local',true)){
      if(typeof renderGame==='function')renderGame();
      if(value===0&&typeof showNotice==='function'){
        const p=typeof player==='function'?player(pid):null;
        showNotice(`${p?.name||'Jugador'} tachó ${typeof categoryLabel==='function'?categoryLabel(cat):cat} ❌`);
      }
    }
  }
  function open(input){
    const pid=input.dataset.p,cat=input.dataset.c;
    if(!pid||!cat||input.readOnly||input.disabled)return;
    current={pid,cat};
    title.textContent=typeof categoryLabel==='function'?categoryLabel(cat):cat;
    let p=null;try{p=typeof player==='function'?player(pid):null}catch{}
    playerLine.textContent=p?.name?`Jugador: ${p.name}`:'';
    values.innerHTML=allowed(cat).map(v=>`<button class="scoreChoiceValue" type="button" data-score-choice="${v}">${v}</button>`).join('');
    values.querySelectorAll('[data-score-choice]').forEach(b=>b.onclick=()=>commit(Number(b.dataset.scoreChoice)));
    previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    overlay.classList.remove('hidden');
    arm();
  }

  scratch.onclick=()=>commit(0);
  del.onclick=()=>commit(null);
  cancel.onclick=()=>{if(performance.now()>=armedAt)close()};
  overlay.addEventListener('click',e=>{if(e.target===overlay&&performance.now()>=armedAt)close()});
  document.addEventListener('keydown',e=>{
    if(!overlay.classList.contains('hidden')){
      if(e.key==='Escape'){e.preventDefault();close()}
      return;
    }
    const cell=e.target.closest?.('.cell');
    if(!cell||cell.readOnly||cell.disabled)return;
    if(e.key==='Enter'||e.key===' '){e.preventDefault();open(cell);return}
    if(e.key!=='Tab'&&e.key!=='Shift')e.preventDefault();
  },true);

  // Importante: el diálogo NO se abre en pointerdown. Abrirlo antes de que
  // termine el mismo toque permite que el pointerup/click caiga sobre una
  // opción recién aparecida y la anote sin intención (tap-through/ghost click).
  document.addEventListener('pointerdown',e=>{
    const cell=e.target.closest?.('.cell');
    if(!cell||cell.readOnly||cell.disabled)return;
    e.preventDefault();
  },true);
  document.addEventListener('click',e=>{
    const cell=e.target.closest?.('.cell');
    if(!cell||cell.readOnly||cell.disabled)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    setTimeout(()=>open(cell),0);
  },true);
})();
