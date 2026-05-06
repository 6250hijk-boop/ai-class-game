<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
  <title>퀘스트 6: 데이터 수집하기</title>
  <link rel="stylesheet" href="css/style.css">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;font-family:'Noto Sans KR',sans-serif;background:var(--bg);min-height:100vh;}
    .page-wrap{max-width:700px;margin:0 auto;padding:clamp(16px,3vw,28px);}
    .page-title{font-family:'Jua',sans-serif;font-size:clamp(20px,4vw,26px);color:#a78bfa;margin-bottom:6px;}
    .page-desc{font-size:clamp(13px,2.3vw,14px);color:var(--muted);margin-bottom:24px;line-height:1.6;}
    .card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:clamp(16px,3vw,24px);margin-bottom:16px;}
    .card h3{font-size:clamp(14px,2.5vw,16px);margin-bottom:14px;color:var(--primary);}
    .btn{display:inline-block;padding:clamp(10px,2.2vw,13px) clamp(16px,3vw,22px);border:none;border-radius:11px;font-size:clamp(13px,2.5vw,15px);font-weight:700;cursor:pointer;font-family:inherit;transition:all .3s;text-decoration:none;}
    .btn-primary{background:linear-gradient(135deg,#a78bfa,#7c3aed);color:white;}
    .btn-primary:hover{transform:translateY(-2px);}
    .btn-ghost{background:rgba(255,255,255,0.07);border:1px solid var(--border);color:var(--text);}
    .btn:disabled{opacity:0.5;cursor:not-allowed;transform:none!important;}
    .upload-zone{border:2px dashed rgba(167,139,250,0.4);border-radius:16px;padding:clamp(28px,5vw,44px) 20px;text-align:center;cursor:pointer;transition:all .3s;background:rgba(167,139,250,0.04);margin-bottom:20px;}
    .upload-zone:hover,.upload-zone.dragover{border-color:#a78bfa;background:rgba(167,139,250,0.1);}
    .upload-zone .icon{font-size:clamp(36px,7vw,52px);margin-bottom:12px;}
    .upload-zone h3{font-size:clamp(15px,3vw,18px);margin-bottom:6px;color:var(--text);}
    .upload-zone p{font-size:clamp(12px,2.2vw,13px);color:var(--muted);}
    #file-input{display:none;}
    .preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(80px,18vw,110px),1fr));gap:clamp(6px,1.5vw,10px);}
    .preview-item{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;border:2px solid var(--border);}
    .preview-item img{width:100%;height:100%;object-fit:cover;}
    .preview-item .remove-btn{position:absolute;top:4px;right:4px;background:rgba(252,129,129,0.9);border:none;border-radius:50%;width:22px;height:22px;color:white;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    .preview-item .status-badge{position:absolute;bottom:0;left:0;right:0;padding:3px;font-size:10px;text-align:center;}
    .status-pending{background:rgba(246,173,85,0.85);color:#0a0e1a;}
    .status-done{background:rgba(104,211,145,0.85);color:#0a0e1a;}
    .status-error{background:rgba(252,129,129,0.85);color:white;}
    .progress-wrap{background:rgba(255,255,255,0.08);border-radius:20px;height:10px;overflow:hidden;margin:12px 0;}
    .progress-bar{height:100%;background:linear-gradient(90deg,#a78bfa,#63b3ed);border-radius:20px;transition:width .3s;}
    .uploaded-item{display:flex;align-items:center;gap:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:6px;flex-wrap:wrap;}
    .uploaded-item img{width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;}
    .uploaded-item .name{flex:1;min-width:100px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .uploaded-item .date{font-size:11px;color:var(--muted);flex-shrink:0;}
    .del-btn{background:rgba(252,129,129,0.15);border:1px solid rgba(252,129,129,0.3);border-radius:6px;padding:3px 8px;color:var(--red);font-size:11px;cursor:pointer;font-family:inherit;flex-shrink:0;}
    .alert{padding:10px 14px;border-radius:9px;font-size:13px;margin-bottom:12px;line-height:1.5;}
    .alert-success{background:rgba(104,211,145,0.12);border:1px solid var(--green);color:var(--green);}
    .alert-error{background:rgba(252,129,129,0.12);border:1px solid var(--red);color:var(--red);}
    .alert-warn{background:rgba(246,173,85,0.12);border:1px solid var(--accent);color:var(--accent);}
    @media(max-width:480px){.page-wrap{padding:12px;}}
  </style>
</head>
<body>
<div class="page-wrap">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
    <a href="main.html" onclick="sessionStorage.setItem('from_quest','1')"
      style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:6px 12px;color:var(--text);font-size:13px;text-decoration:none;">← 메인</a>
    <div id="hud-score" style="background:rgba(167,139,250,0.2);border:1px solid rgba(167,139,250,0.3);border-radius:20px;padding:4px 12px;font-size:13px;color:#a78bfa;font-weight:700;margin-left:auto;">0 점</div>
  </div>
  <div class="page-title">📁 퀘스트 6: 데이터 수집하기</div>
  <div class="page-desc">AI 학습에 사용할 사진을 선생님의 Google Drive에 업로드하세요.<br>사진은 자동으로 600×600px로 변환됩니다!</div>
  <div id="main-alert"></div>

  <!-- 업로드 영역 -->
  <div class="card">
    <h3>📸 사진 업로드</h3>
    <div class="upload-zone" id="upload-zone" onclick="document.getElementById('file-input').click()"
      ondragover="dragOver(event)" ondragleave="dragLeave(event)" ondrop="dropFiles(event)">
      <div class="icon">📸</div>
      <h3>사진을 여기에 드래그하거나 클릭하세요</h3>
      <p>JPG, PNG, WEBP · 자동 600×600 변환 · 최대 20장</p>
    </div>
    <input type="file" id="file-input" accept="image/*" multiple onchange="handleFiles(this.files)">

    <div id="pending-card" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
        <span style="font-size:13px;color:var(--muted);">대기: <strong id="pending-count">0</strong>장</span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" id="upload-btn" onclick="uploadAll()" style="padding:8px 16px;font-size:13px;">☁️ Drive에 업로드</button>
          <button class="btn btn-ghost" onclick="clearPending()" style="padding:8px 12px;font-size:12px;">초기화</button>
        </div>
      </div>
      <div class="preview-grid" id="preview-grid"></div>
      <div class="progress-wrap" id="progress-wrap" style="display:none;">
        <div class="progress-bar" id="progress-bar" style="width:0%;"></div>
      </div>
      <div id="upload-status" style="font-size:13px;color:var(--muted);margin-top:6px;min-height:20px;"></div>
    </div>
  </div>

  <!-- 업로드 목록 -->
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <h3 style="margin:0;">☁️ 내가 올린 사진 (<span id="my-count">0</span>장)</h3>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px;" onclick="loadMyFiles()">🔄</button>
        <a href="quest7.html" class="btn btn-primary" style="font-size:12px;padding:6px 12px;">라벨링하러 가기 →</a>
      </div>
    </div>
    <div id="my-uploads"><div style="text-align:center;padding:20px;color:var(--muted);">로딩 중...</div></div>
  </div>
</div>

<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script>
const TARGET_SIZE = 600;
const QUALITY = 0.75;
const PARALLEL = 5;

let currentUser=null, userData=null;
let pendingFiles=[];

requireAuth(async (user)=>{
  currentUser=user;
  if(user.uid==='student'){
    const local=JSON.parse(localStorage.getItem('tempUserData')||'null');
    userData=local||{charName:'AI',score:0,quests:{},name:'임시학생'};
  } else {
    const snap=await db.collection('users').where('id','==',user.id).get();
    if(!snap.empty){userData=snap.docs[0].data();currentUser.uid=snap.docs[0].id;}
  }
  document.getElementById('hud-score').textContent=(userData.score||0)+' 점';
  loadMyFiles();
});

// ── Apps Script 호출 ──
async function callAppsScript(data){
  if(!GDRIVE_CONFIG.APPS_SCRIPT_URL||GDRIVE_CONFIG.APPS_SCRIPT_URL.includes('https://script.google.com/macros/s/AKfycbwqOI5DXKfzY1vemjUzZPzPOHj95strY_JT-rWcn8vnlPbTOZkVooId9gl4fQD0yxm0wg/exec')){
    throw new Error('Apps Script URL이 설정되지 않았습니다. firebase-config.js를 확인하세요.');
  }
  const res=await fetch(GDRIVE_CONFIG.APPS_SCRIPT_URL,{
    method:'POST',
    body:JSON.stringify(data),
  });
  const result=await res.json();
  if(!result.ok) throw new Error(result.error||'서버 오류');
  return result;
}

// ── 리사이징 ──
function resizeImage(file){
  return new Promise((resolve)=>{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      canvas.width=TARGET_SIZE; canvas.height=TARGET_SIZE;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,TARGET_SIZE,TARGET_SIZE);
      const scale=Math.min(TARGET_SIZE/img.width,TARGET_SIZE/img.height);
      const dw=img.width*scale, dh=img.height*scale;
      ctx.drawImage(img,(TARGET_SIZE-dw)/2,(TARGET_SIZE-dh)/2,dw,dh);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob=>{
        const reader=new FileReader();
        reader.onload=e=>resolve(e.target.result.split(',')[1]); // base64만 추출
        reader.readAsDataURL(blob);
      },'image/jpeg',QUALITY);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);resolve(null);};
    img.src=url;
  });
}

// ── 드래그앤드롭 ──
function dragOver(e){e.preventDefault();document.getElementById('upload-zone').classList.add('dragover');}
function dragLeave(e){document.getElementById('upload-zone').classList.remove('dragover');}
function dropFiles(e){e.preventDefault();document.getElementById('upload-zone').classList.remove('dragover');handleFiles(e.dataTransfer.files);}

function handleFiles(files){
  const arr=Array.from(files).filter(f=>f.type.startsWith('image/'));
  if(!arr.length){showAlert('이미지 파일만 가능합니다.','error');return;}
  if(pendingFiles.length+arr.length>20){showAlert('최대 20장까지 가능합니다.','error');return;}
  arr.forEach(file=>{
    const id='f'+Date.now()+Math.random().toString(36).slice(2);
    pendingFiles.push({id,file,status:'pending',base64:null});
  });
  renderPreview();
  document.getElementById('pending-card').style.display='block';
  // 백그라운드 리사이징
  pendingFiles.filter(f=>!f.base64).forEach(async pf=>{
    pf.base64=await resizeImage(pf.file);
  });
}

function renderPreview(){
  document.getElementById('pending-count').textContent=pendingFiles.length;
  document.getElementById('preview-grid').innerHTML=pendingFiles.map(pf=>{
    const url=URL.createObjectURL(pf.file);
    const sc=pf.status==='done'?'status-done':pf.status==='error'?'status-error':'status-pending';
    const st=pf.status==='done'?'✅':pf.status==='error'?'❌':'⏳';
    return `<div class="preview-item" id="prev-${pf.id}">
      <img src="${url}">
      ${pf.status==='pending'?`<button class="remove-btn" onclick="removeFile('${pf.id}')">✕</button>`:''}
      <div class="status-badge ${sc}" id="badge-${pf.id}">${st}</div>
    </div>`;
  }).join('');
}

function removeFile(id){
  pendingFiles=pendingFiles.filter(f=>f.id!==id);
  if(!pendingFiles.length) document.getElementById('pending-card').style.display='none';
  else renderPreview();
}
function clearPending(){pendingFiles=[];document.getElementById('pending-card').style.display='none';}

// ── 업로드 ──
async function uploadAll(){
  const toUpload=pendingFiles.filter(f=>f.status==='pending');
  if(!toUpload.length) return;
  const btn=document.getElementById('upload-btn');
  btn.disabled=true;
  document.getElementById('progress-wrap').style.display='block';

  const userId=currentUser.id||currentUser.uid||'unknown';
  const userName=userData.name||userData.charName||'익명';
  let done=0; const total=toUpload.length;

  const updateUI=()=>{
    document.getElementById('progress-bar').style.width=(done/total*100)+'%';
    document.getElementById('upload-status').textContent=
      `☁️ Drive 업로드 중... ${done}/${total}장 (${Math.round(done/total*100)}%)`;
  };
  updateUI();

  for(let i=0;i<toUpload.length;i+=PARALLEL){
    const chunk=toUpload.slice(i,i+PARALLEL);
    await Promise.all(chunk.map(async pf=>{
      try{
        const badge=document.getElementById('badge-'+pf.id);
        if(badge){badge.textContent='⚙️';}
        // 리사이징 (미리 된 거 재사용)
        const base64=pf.base64||await resizeImage(pf.file);
        if(!base64) throw new Error('변환 실패');
        if(badge){badge.textContent='☁️';}
        const fileName=`${userId}_${Date.now()}_${pf.file.name.replace(/\s/g,'_')}`;
        const result=await callAppsScript({
          action:'upload',
          userId, userName, fileName,
          imageBase64:base64,
          mimeType:'image/jpeg',
        });
        // Firestore 메타데이터 저장
        await db.collection('uploads').add({
          userId:currentUser.uid==='student'?('temp_'+userName):currentUser.uid,
          userName, fileName,
          originalName:pf.file.name,
          driveFileId:result.fileId,
          driveLink:result.webViewLink||'',
          url:result.url,
          labeled:false,
          width:TARGET_SIZE, height:TARGET_SIZE,
          created_at:new Date().toISOString(),
        });
        pf.status='done';
        if(badge){badge.className='status-badge status-done';badge.textContent='✅';}
      }catch(e){
        pf.status='error';
        const badge=document.getElementById('badge-'+pf.id);
        if(badge){badge.className='status-badge status-error';badge.textContent='❌';}
        console.error(e);
      }
      done++; updateUI();
    }));
  }

  document.getElementById('upload-status').textContent=`✅ ${done}장 Drive 업로드 완료!`;
  document.getElementById('progress-bar').style.width='100%';
  btn.disabled=false;
  loadMyFiles();

  if(currentUser.uid!=='student'){
    const q=(userData.quests||{});
    if(!q.q6_done){
      await addScore(currentUser.uid,20,'퀘스트6 첫 업로드');
      await db.collection('users').doc(currentUser.uid).update({'quests.q6_done':true});
      showAlert('🎉 퀘스트 6 완료! +20점!','success');
    }
  }
}

async function loadMyFiles(){
  const uid=currentUser.uid==='student'?('temp_'+(userData.charName||'익명')):currentUser.uid;
  try{
    const snap=await db.collection('uploads').where('userId','==',uid).orderBy('created_at','desc').get();
    document.getElementById('my-count').textContent=snap.size;
    if(snap.empty){
      document.getElementById('my-uploads').innerHTML=
        `<div style="text-align:center;padding:20px;color:var(--muted);">아직 없어요! 사진을 올려보세요 📸</div>`;return;
    }
    document.getElementById('my-uploads').innerHTML=snap.docs.map(doc=>{
      const d=doc.data();
      const date=d.created_at?.slice(0,16).replace('T',' ')||'';
      return `<div class="uploaded-item">
        <img src="${d.url||''}" onerror="this.style.display='none'" style="${d.url?'':'display:none'}">
        ${!d.url?`<div style="width:44px;height:44px;background:rgba(167,139,250,0.15);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📷</div>`:''}
        <div class="name">
          ${d.fileName||'파일'}
          ${d.driveLink?`<a href="${d.driveLink}" target="_blank" style="font-size:10px;color:var(--primary);display:block;">Drive ↗</a>`:''}
        </div>
        <div style="font-size:11px;padding:2px 7px;border-radius:5px;flex-shrink:0;
          ${d.labeled?'background:rgba(104,211,145,0.15);color:#68d391;':'background:rgba(246,173,85,0.15);color:#f6ad55;'}">
          ${d.labeled?'✅ 완료':'⏳ 미완료'}
        </div>
        <div class="date">${date}</div>
        <button class="del-btn" onclick="deleteFile('${doc.id}','${d.driveFileId||''}')">🗑️</button>
      </div>`;
    }).join('');
  }catch(e){
    document.getElementById('my-uploads').innerHTML=
      `<div style="color:var(--red);padding:16px;">오류: ${e.message}</div>`;
  }
}

async function deleteFile(docId, driveFileId){
  if(!confirm('이 사진을 삭제할까요?')) return;
  try{
    if(driveFileId){
      await callAppsScript({action:'delete',fileId:driveFileId}).catch(()=>{});
    }
    await db.collection('uploads').doc(docId).delete();
    loadMyFiles();
  }catch(e){alert('삭제 실패: '+e.message);}
}

function showAlert(msg,type='info'){
  const c={info:'alert-info',success:'alert-success',error:'alert-error',warn:'alert-warn'};
  document.getElementById('main-alert').innerHTML=`<div class="alert ${c[type]||'alert-info'}">${msg}</div>`;
  setTimeout(()=>{const el=document.getElementById('main-alert');if(el)el.innerHTML='';},5000);
}
</script>
</body>
</html>
