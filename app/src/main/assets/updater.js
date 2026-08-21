(()=>{
  const REPO='amoedo7/GeneralAMO';
  const RELEASES_API='https://api.github.com/repos/'+REPO+'/releases/latest';
  const RELEASES_PAGE='https://github.com/'+REPO+'/releases/latest';
  const FALLBACK_VERSION='0.1.16';
  let latestApkUrl=RELEASES_PAGE;

  const style=document.createElement('style');
  style.textContent=`
    #settingsOverlay{position:fixed;inset:0;z-index:1400;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.68);backdrop-filter:blur(3px)}
    #settingsOverlay.hidden{display:none}
    .settingsCard{width:min(560px,94vw);max-height:min(86vh,760px);overflow:auto;border-radius:28px;background:var(--panel,#0f2438);color:var(--text,#f7fbff);border:1px solid var(--line,#294863);padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
    .settingsHead{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
    .settingsHead h2{margin:0;font-size:30px}
    .settingsSection{padding:16px 0;border-top:1px solid var(--line,#294863)}
    .settingsSection:first-of-type{border-top:0}
    .settingsTitle{font-weight:850;margin-bottom:5px}.settingsMeta{color:var(--muted,#9db2c5);font-size:14px;line-height:1.45}
    .settingsActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.settingsActions .btn{flex:1;min-width:150px}
    #updateStatus.good{color:#43c884}#updateStatus.warn{color:#f4c24c}
    .settingsPlatform{display:grid;gap:7px;margin-top:10px}.settingsPlatform div{padding:10px 12px;border-radius:12px;background:rgba(127,127,127,.08)}
  `;
  document.head.appendChild(style);

  const overlay=document.createElement('div');
  overlay.id='settingsOverlay';
  overlay.className='hidden';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','settingsTitle');
  overlay.innerHTML=`
    <div class="settingsCard">
      <div class="settingsHead"><h2 id="settingsTitle">⚙️ Ajustes</h2><button id="settingsClose" class="iconBtn" type="button" aria-label="Cerrar ajustes">×</button></div>
      <section class="settingsSection">
        <div class="settingsTitle">Apariencia</div>
        <div class="settingsMeta">Cambiá entre tema claro y oscuro.</div>
        <div class="settingsActions"><button id="settingsTheme" class="btn" type="button">Cambiar tema</button></div>
      </section>
      <section class="settingsSection">
        <div class="settingsTitle">Actualizaciones</div>
        <div class="settingsMeta">Versión instalada: <b id="installedVersion">—</b></div>
        <div id="updateStatus" class="settingsMeta" style="margin-top:6px">Abrí Ajustes para comprobar si hay una versión nueva.</div>
        <div class="settingsActions">
          <button id="checkUpdate" class="btn" type="button">Buscar actualización</button>
          <button id="downloadUpdate" class="btn primary hidden" type="button">Descargar actualización</button>
        </div>
        <div class="settingsMeta" style="margin-top:10px">La descarga es directa desde la release oficial de GeneralAMO en GitHub. Android puede pedirte confirmar la instalación o habilitar temporalmente “instalar apps desconocidas”.</div>
      </section>
      <section class="settingsSection">
        <div class="settingsTitle">Compatibilidad</div>
        <div class="settingsPlatform">
          <div><b>Android</b><br><span class="settingsMeta">App completa, puede crear la mesa y compartirla por Wi‑Fi/hotspot.</span></div>
          <div><b>iPhone / iPad</b><br><span class="settingsMeta">Compatible para jugar, anotar o mirar desde Safari usando el enlace Wi‑Fi compartido por un Android. Todavía no existe una app iOS instalable independiente.</span></div>
        </div>
      </section>
    </div>`;
  document.body.appendChild(overlay);

  const gear=document.getElementById('theme');
  const close=document.getElementById('settingsClose');
  const installed=document.getElementById('installedVersion');
  const status=document.getElementById('updateStatus');
  const check=document.getElementById('checkUpdate');
  const download=document.getElementById('downloadUpdate');
  const theme=document.getElementById('settingsTheme');

  function currentVersion(){
    try{
      if(window.GeneralAMONative?.getVersionName)return String(GeneralAMONative.getVersionName()||FALLBACK_VERSION);
    }catch{}
    return FALLBACK_VERSION;
  }
  function parts(v){return String(v).replace(/^v/i,'').split(/[^0-9]+/).filter(Boolean).map(Number)}
  function newer(remote,local){
    const a=parts(remote),b=parts(local),n=Math.max(a.length,b.length);
    for(let i=0;i<n;i++){const x=a[i]||0,y=b[i]||0;if(x!==y)return x>y}
    return false;
  }
  function openExternal(url){
    try{
      if(window.GeneralAMONative?.openExternal&&GeneralAMONative.openExternal(url))return;
    }catch{}
    location.href=url;
  }
  function setStatus(text,tone=''){
    status.textContent=text;
    status.className='settingsMeta '+tone;
  }
  async function checkUpdate(){
    check.disabled=true;download.classList.add('hidden');
    setStatus('Buscando la última versión…');
    try{
      const r=await fetch(RELEASES_API,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const data=await r.json();
      const remote=String(data.tag_name||'').replace(/^v/i,'');
      const local=currentVersion();
      const asset=(data.assets||[]).find(a=>/GeneralAMO-.*\.apk$/i.test(a.name||''))||(data.assets||[]).find(a=>/\.apk$/i.test(a.name||''));
      latestApkUrl=asset?.browser_download_url||data.html_url||RELEASES_PAGE;
      if(remote&&newer(remote,local)){
        setStatus(`Nueva versión disponible: ${remote}`,'good');
        download.textContent=`Descargar ${remote}`;
        download.classList.remove('hidden');
      }else if(remote){
        setStatus(`GeneralAMO ${local} está actualizado.`,'good');
      }else{
        throw new Error('Release sin versión');
      }
    }catch(e){
      latestApkUrl=RELEASES_PAGE;
      setStatus('No pude comprobar la versión ahora. Podés abrir igualmente la página oficial de actualizaciones.','warn');
      download.textContent='Abrir actualizaciones';
      download.classList.remove('hidden');
    }finally{check.disabled=false}
  }
  function openSettings(){
    installed.textContent=currentVersion();
    overlay.classList.remove('hidden');
    document.body.style.overflow='hidden';
    checkUpdate();
  }
  function closeSettings(){overlay.classList.add('hidden');document.body.style.overflow=''}

  if(gear){gear.textContent='⚙';gear.setAttribute('aria-label','Abrir ajustes');gear.onclick=openSettings}
  close.onclick=closeSettings;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeSettings()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.classList.contains('hidden'))closeSettings()});
  check.onclick=checkUpdate;
  download.onclick=()=>openExternal(latestApkUrl);
  theme.onclick=()=>{
    try{
      if(typeof applyTheme==='function')applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
    }catch{}
  };
})();
