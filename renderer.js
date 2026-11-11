const $=id=>document.getElementById(id);
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>show(b.dataset.page));
document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>show(b.dataset.jump));
function show(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));$('crumb').textContent=({overview:'Обзор',obs:'OBS Studio',audio:'Микрофон и звук',chat:'Центр чата',donations:'Донаты',thumb:'Дизайн обложек',ai:'AI-помощник',plugins:'Плагины',games:'Интерактив'})[id]||id}
let obsConnected=false;
async function connectOBS(){
  $('obs-message').textContent='Подключение...';$('obs-connect').disabled=true;
  try{
    await window.streamx.obsConnect({host:$('obs-host').value.trim()||'127.0.0.1',port:Number($('obs-port').value)||4455,password:$('obs-password').value});
    obsConnected=true;$('obs-badge').textContent='CONNECTED';$('overview-obs').textContent='Подключено';
    $('obs-disconnect').disabled=false;$('stream-start').disabled=false;$('stream-stop').disabled=false;
    $('obs-message').textContent='Успешное подключение';await refreshScenes();await refreshStream();
  }catch(e){obsConnected=false;$('obs-connect').disabled=false;$('obs-message').textContent='Ошибка: '+(e.message||String(e))}
}
async function refreshScenes(){
  if(!obsConnected)return;
  try{
    const d=await window.streamx.obsRequest('GetSceneList');$('scene-list').innerHTML='';
    d.scenes.forEach(s=>{
      const row=document.createElement('div');row.className='scene-row';
      const name=document.createElement('span');name.textContent=s.sceneName;
      const btn=document.createElement('button');btn.textContent=s.sceneName===d.currentProgramSceneName?'АКТИВНАЯ':'ВКЛЮЧИТЬ';
      btn.disabled=s.sceneName===d.currentProgramSceneName;
      btn.onclick=async()=>{try{await window.streamx.obsRequest('SetCurrentProgramScene',{sceneName:s.sceneName});await refreshScenes()}catch(e){$('obs-message').textContent=e.message}};
      row.append(name,btn);$('scene-list').append(row);
    });
  }catch(e){$('scene-list').textContent='Не удалось загрузить сцены: '+e.message}
}
async function refreshStream(){
  if(!obsConnected)return;
  try{const d=await window.streamx.obsRequest('GetStreamStatus');$('live-text').textContent=d.outputActive?'Эфир запущен':'Эфир не запущен'}catch(e){$('obs-message').textContent=e.message}
}
$('obs-connect').onclick=connectOBS;
$('obs-disconnect').onclick=async()=>{
  try{await window.streamx.obsDisconnect()}catch(e){$('obs-message').textContent=e.message}
  obsConnected=false;$('obs-badge').textContent='OFFLINE';$('overview-obs').textContent='Не подключено';
  $('obs-connect').disabled=false;$('obs-disconnect').disabled=true;$('stream-start').disabled=true;$('stream-stop').disabled=true;
  $('scene-list').textContent='Сначала подключи OBS';$('obs-message').textContent='Отключено';
};
$('stream-start').onclick=async()=>{try{await window.streamx.obsRequest('StartStream');await refreshStream()}catch(e){$('obs-message').textContent=e.message}};
$('stream-stop').onclick=async()=>{try{await window.streamx.obsRequest('StopStream');await refreshStream()}catch(e){$('obs-message').textContent=e.message}};
let micStream=null,audioCtx=null,frame=null;
$('mic-start').onclick=async()=>{try{micStream=await navigator.mediaDevices.getUserMedia({audio:true});const devices=await navigator.mediaDevices.enumerateDevices();$('mic-select').innerHTML='';devices.filter(d=>d.kind==='audioinput').forEach(d=>{const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label||'Микрофон';$('mic-select').append(o)});audioCtx=new AudioContext();const analyser=audioCtx.createAnalyser();analyser.fftSize=512;audioCtx.createMediaStreamSource(micStream).connect(analyser);const data=new Uint8Array(analyser.frequencyBinCount);$('mic-badge').textContent='ACTIVE';$('mic-start').disabled=true;$('mic-stop').disabled=false;const tick=()=>{analyser.getByteTimeDomainData(data);let sum=0;for(const v of data){const x=(v-128)/128;sum+=x*x}const pct=Math.min(100,Math.round(Math.sqrt(sum/data.length)*240));$('meter-fill').style.width=pct+'%';$('meter-value').textContent=pct+'%';frame=requestAnimationFrame(tick)};tick()}catch(e){$('mic-badge').textContent='NO ACCESS';alert('Не удалось получить доступ к микрофону: '+e.message)}};
$('mic-stop').onclick=()=>{if(frame)cancelAnimationFrame(frame);if(micStream)micStream.getTracks().forEach(t=>t.stop());if(audioCtx)audioCtx.close();micStream=null;audioCtx=null;$('mic-badge').textContent='NOT ACTIVE';$('mic-start').disabled=false;$('mic-stop').disabled=true;$('meter-fill').style.width='0%';$('meter-value').textContent='0%'};
function updateGoal(){const target=Math.max(1,Number($('goal-target').value)||1),current=Math.max(0,Number($('goal-current').value)||0),pct=Math.min(100,Math.round(current/target*100));$('goal-preview-name').textContent=$('goal-name').value||'Цель сбора';$('goal-preview-current').textContent=current.toLocaleString('ru-RU')+' ₽';$('goal-preview-target').textContent='из '+target.toLocaleString('ru-RU')+' ₽';$('goal-progress').style.width=pct+'%';$('goal-percent').textContent=pct+'% собрано'}$('goal-update').onclick=updateGoal;
const canvas=$('thumb-canvas'),ctx=canvas.getContext('2d');function drawThumb(){const title=$('thumb-title').value||'МОЙ НОВЫЙ СТРИМ',sub=$('thumb-subtitle').value||'',accent=$('thumb-color').value,bg=$('thumb-bg').value;const grad=ctx.createLinearGradient(0,0,1280,720);if(bg==='dark'){grad.addColorStop(0,'#090711');grad.addColorStop(1,'#251632')}else if(bg==='pink'){grad.addColorStop(0,'#3b123f');grad.addColorStop(1,'#d946a6')}else{grad.addColorStop(0,'#170b2b');grad.addColorStop(.55,'#54208b');grad.addColorStop(1,'#12091f')}ctx.fillStyle=grad;ctx.fillRect(0,0,1280,720);ctx.fillStyle=accent+'30';ctx.beginPath();ctx.arc(1010,330,260,0,Math.PI*2);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.beginPath();ctx.arc(1010,330,205,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff';ctx.font='800 82px Arial';ctx.shadowColor=accent;ctx.shadowBlur=25;ctx.fillText(title.toUpperCase().slice(0,23),75,330);ctx.shadowBlur=0;ctx.fillStyle='#d7b7f4';ctx.font='700 34px Arial';ctx.fillText(sub.toUpperCase().slice(0,38),80,400);ctx.fillStyle=accent;ctx.fillRect(80,445,150,9);ctx.fillStyle='#fff';ctx.font='800 24px Arial';ctx.fillText('STREAMX STUDIO',80,640)}$('thumb-update').onclick=drawThumb;$('thumb-download').onclick=()=>{const a=document.createElement('a');a.download='streamx-thumbnail.png';a.href=canvas.toDataURL('image/png');a.click()};['thumb-title','thumb-subtitle','thumb-color','thumb-bg'].forEach(id=>$(id).addEventListener('input',drawThumb));drawThumb();
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('ai-prompt').value=b.dataset.prompt});$('ai-send').onclick=()=>{$('ai-response').textContent=$('ai-prompt').value.trim()?'Запрос подготовлен. Для реального ответа подключи AI API.':'Сначала напиши запрос.'};
$('random-btn').onclick=()=>{$('random-result').textContent=String(Math.floor(Math.random()*100)+1)};let timer=null;$('timer-btn').onclick=()=>{if(timer)clearInterval(timer);let left=30;$('timer-result').textContent='00:30';timer=setInterval(()=>{left--;$('timer-result').textContent='00:'+String(left).padStart(2,'0');if(left<=0){clearInterval(timer);timer=null;$('timer-result').textContent='ВРЕМЯ!'}},1000)};