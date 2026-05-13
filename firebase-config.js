// ══════════════════════════════════════════
//  Firebase 설정 - 본인 프로젝트 값으로 교체
// ══════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyAEqfJTRbb48PyNabGSL2p5Y5Gciw7ljRQ",
  authDomain: "ai-class-2731a.firebaseapp.com",
  projectId: "ai-class-2731a",
  storageBucket: "ai-class-2731a.firebasestorage.app",
  messagingSenderId: "590479208871",
  appId: "1:590479208871:web:33059fdf5780b379bd0682"
};

// ══════════════════════════════════════════
//  Google Drive 설정 - 선생님이 설정하는 부분
// ══════════════════════════════════════════
const GDRIVE_CONFIG = {
  CLIENT_ID: "103338765759-0efg8dvocht355vab1jmhe4dps0md5r1.apps.googleusercontent.com",
  ROOT_FOLDER_ID: "1geDWq2RrVjHenewwf5Bxg_6rWEOZtnz_",
  API_KEY: "AIzaSyAPfaW3Vb9beLdcgGlus1ZMADRhjIXpmwE",
  SCOPES: "https://www.googleapis.com/auth/drive.file",
  // Apps Script 웹앱 배포 후 URL 입력
  APPS_SCRIPT_URL: "여기에_APPS_SCRIPT_URL",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
// Storage는 SDK가 로드된 페이지에서만 초기화
const storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;

// ── 관리자 계정 ──
const ADMIN_ID = "admin";
const ADMIN_PW = "20260404";

// ── 임시 학생 계정 ──
const STUDENT_ID = "student01";
const STUDENT_PW = "123465";

// ── 욕설/비하 필터 ──
const BAD_WORDS = ["욕1","욕2","바보","멍청","시발","씨발","병신","개새","ㅅㅂ","ㅂㅅ","fuck","shit","damn","bitch"];
function filterName(name) {
  const lower = name.toLowerCase();
  return BAD_WORDS.some(w => lower.includes(w));
}

// ── 레벨 설정 ──
const LEVELS = [
  { level:1, name:"아기 로봇",       minScore:0,    img:"images/robot_1.png", emoji:"🤖" },
  { level:2, name:"초보 AI",         minScore:50,   img:"images/robot_2.png", emoji:"🦾" },
  { level:3, name:"학습 AI",         minScore:150,  img:"images/robot_3.png", emoji:"🧠" },
  { level:4, name:"지능형 AI",       minScore:300,  img:"images/robot_4.png", emoji:"⚡" },
  { level:5, name:"미래형 가디언",   minScore:500,  img:"images/robot_5.png", emoji:"🌟" },
];

function getLevelByScore(score) {
  let lv = LEVELS[0];
  for (const l of LEVELS) { if (score >= l.minScore) lv = l; }
  return lv;
}

function getNextLevel(score) {
  for (const l of LEVELS) { if (score < l.minScore) return l; }
  return null;
}

// ── 퀘스트 목록 (미니 스토리 포함) ──
const QUESTS = [
  { id:1, title:"인공지능 세계의 법률", icon:"⚖️",  done:false,
    subtitle:"AI 헌법의 수호자가 되어라",
    story:"AI 의회에 입장하려면 인공지능 헌법을 알아야 한다. 가디언 후보여, 첫 시련을 통과하라." },
  { id:2, title:"아버지를 찾아서",       icon:"🔍",  done:false,
    subtitle:"창조자의 흔적을 찾아라",
    story:"AI의 창조자... 그를 찾아야 한다. 인공지능의 뿌리를 알아야 진정한 가디언이 될 수 있다." },
  { id:3, title:"인공지능 수업자료 만들기", icon:"📚", done:false,
    subtitle:"지식을 전파하라",
    story:"가디언의 임무는 배우는 것에 그치지 않는다. 알게 된 것을 세상에 전해야 한다." },
  { id:4, title:"인공지능 공부시키기",   icon:"🎓",  done:false,
    subtitle:"동료에게 빛을 비추라",
    story:"가디언은 혼자가 아니다. 다른 이들도 함께 깨우쳐야 모두가 살아남는다." },
  { id:5, title:"배운내용 확인하기",     icon:"✅",  done:false,
    subtitle:"기억을 단단히 새겨라",
    story:"전투를 앞두고 자신의 무기를 점검하라. 흔들리는 지식으로는 AI를 깨울 수 없다." },
  { id:6, title:"데이터 수집하기",       icon:"📷",  done:false,
    subtitle:"AI에게 눈을 만들어주어라",
    story:"AI에게 세상을 보여주려면 눈을 만들어줘야 한다. 가디언이여, 세상을 카메라에 담아라." },
  { id:7, title:"라벨링하기",            icon:"🏷️",  done:false,
    subtitle:"사물의 이름을 가르쳐라",
    story:"AI에게 사물의 이름을 가르쳐라. 가디언의 손길로 AI는 의미를 배운다." },
  { id:8, title:"테스트해보기",          icon:"🧪",  done:false,
    subtitle:"AI를 깨워라",
    story:"당신의 AI가 깨어난다! 마지막 시련을 통과하면 진정한 가디언이 탄생한다." },
];

// ── 메인 스토리 (오프닝) ──
const STORY = [
  "🌌 2050년, 인공지능 세계가 위험에 빠졌다...",
  "혼란에 빠진 AI 세계를 구할 수 있는 건\n오직 미래에서 온 'AI 가디언'뿐.",
  "당신이 바로 그 가디언이 될 운명입니다. ⚡",
  "8개의 시련을 통과하면\n진정한 가디언으로 거듭납니다.",
  "데이터를 수집하고, AI를 가르치고,\n세상에 진정한 AI를 깨워내십시오!",
  "자, 먼저 당신의 AI 가디언에게\n이름을 지어주세요! 💫"
];

// ── 칭호(업적) 시스템 ──
// condition은 userData + stats 객체를 받아서 boolean 반환
const TITLES = [
  {
    id: 'first_step',
    icon: '🥇',
    name: '첫 발걸음',
    desc: '첫 퀘스트를 완료한 자',
    condition: (u) => {
      const quests = u.quests || {};
      return Object.keys(quests).some(k => k.endsWith('_done') && quests[k]);
    }
  },
  {
    id: 'collector',
    icon: '📸',
    name: '수집가',
    desc: '사진 10장을 모은 자',
    condition: (u, s) => (s.totalImages || 0) >= 10
  },
  {
    id: 'expert',
    icon: '🏆',
    name: '전문가',
    desc: '사진 50장을 모은 자',
    condition: (u, s) => (s.totalImages || 0) >= 50
  },
  {
    id: 'sharp_eye',
    icon: '🎯',
    name: '정확한 눈',
    desc: '라벨링 50개를 완료한 자',
    condition: (u, s) => (s.totalLabels || 0) >= 50
  },
  {
    id: 'accuracy_master',
    icon: '🚀',
    name: '정확도 마스터',
    desc: 'mAP 70% 이상 달성한 자',
    condition: (u) => (u.bestMAP || 0) >= 0.70
  },
  {
    id: 'wise_guardian',
    icon: '🦉',
    name: '지혜의 가디언',
    desc: '모든 퀘스트를 완료한 자',
    condition: (u) => {
      const quests = u.quests || {};
      return [1,2,3,4,5,6,7,8].every(id => quests[`q${id}_done`]);
    }
  },
  {
    id: 'perfect_expert',
    icon: '💯',
    name: '완벽한 전문가',
    desc: '모든 퀴즈를 정답으로 푼 자',
    condition: (u) => {
      const quizzes = u.quizzes || {};
      // q1, q5 등 퀴즈가 있는 퀘스트들의 정답률이 모두 100%
      const ids = Object.keys(quizzes);
      if (ids.length === 0) return false;
      return ids.every(id => quizzes[id] && quizzes[id].score === quizzes[id].total);
    }
  },
];

// 학생이 획득한 칭호 목록 반환
function getEarnedTitles(userData, stats) {
  const u = userData || {};
  const s = stats || {};
  return TITLES.filter(t => {
    try { return t.condition(u, s); } catch(e) { return false; }
  });
}

// ── 퀘스트 페이지에 미니 스토리 배너 표시 ──
// 사용법: 퀘스트 페이지 body 시작 부분에서 호출
//   showQuestStory(7)  // 퀘스트 ID
function showQuestStory(questId) {
  const q = QUESTS.find(x => x.id === questId);
  if (!q) return;
  // 이미 본 배너는 다시 안 보이기 (sessionStorage)
  const seenKey = 'questStorySeen_' + questId;
  if (sessionStorage.getItem(seenKey)) return;

  const banner = document.createElement('div');
  banner.id = 'quest-story-banner';
  banner.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:rgba(0,0,0,0.85);
    display:flex; align-items:center; justify-content:center;
    padding:24px;
    animation:fadeIn .4s ease;
  `;
  banner.innerHTML = `
    <div style="
      background:linear-gradient(135deg,#1a1f3a,#0a0e1a);
      border:2px solid #a78bfa;
      border-radius:20px;
      padding:32px 28px;
      max-width:480px; width:100%;
      text-align:center;
      box-shadow:0 0 80px rgba(167,139,250,0.4);
      animation:slideUp .5s cubic-bezier(.34,1.56,.64,1);
    ">
      <div style="font-size:56px;margin-bottom:12px;">${q.icon}</div>
      <div style="font-size:11px;color:var(--muted,#aab2d5);letter-spacing:2px;margin-bottom:4px;">시련 ${q.id} / 8</div>
      <div style="font-family:'Jua',sans-serif;font-size:22px;color:white;margin-bottom:4px;">${q.title}</div>
      <div style="font-size:14px;color:#a78bfa;font-style:italic;margin-bottom:16px;">"${q.subtitle}"</div>
      <div style="font-size:13px;color:#cbd5e0;line-height:1.7;border-top:1px dashed rgba(255,255,255,0.15);padding-top:14px;margin-bottom:20px;">
        ${q.story}
      </div>
      <button id="quest-story-close" style="
        background:linear-gradient(135deg,#a78bfa,#7c3aed);
        color:white; border:none;
        padding:10px 28px; border-radius:10px;
        font-weight:700; cursor:pointer;
        font-family:inherit; font-size:14px;
      ">시작하기 →</button>
    </div>
    <style>
      @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
      @keyframes slideUp { from{transform:translateY(20px);opacity:0;} to{transform:translateY(0);opacity:1;} }
    </style>
  `;
  document.body.appendChild(banner);
  document.getElementById('quest-story-close').onclick = () => {
    banner.style.animation = 'fadeIn .3s ease reverse';
    setTimeout(() => banner.remove(), 280);
    sessionStorage.setItem(seenKey, '1');
  };
}

// ── 공통 함수 ──
function requireAuth(cb) {
  const user = JSON.parse(sessionStorage.getItem('gameUser') || 'null');
  if (!user) { window.location.href = 'index.html'; return; }
  cb(user);
}

function requireAdmin(cb) {
  const user = JSON.parse(sessionStorage.getItem('gameUser') || 'null');
  if (!user || !user.isAdmin) { window.location.href = 'index.html'; return; }
  cb(user);
}

function showXPPopup(text) {
  const el = document.createElement('div');
  el.className = 'xp-popup';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

async function addScore(uid, amount, reason) {
  if (uid === 'admin' || uid === 'student') return;
  const ref = db.collection('users').doc(uid);
  await db.runTransaction(async t => {
    const doc = await t.get(ref);
    const cur = (doc.data() || {}).score || 0;
    t.update(ref, {
      score: cur + amount,
      score_log: firebase.firestore.FieldValue.arrayUnion({
        amount, reason, date: new Date().toISOString()
      })
    });
  });
}

async function saveProgress(uid, key, value) {
  if (uid === 'admin' || uid === 'student') return;
  await db.collection('users').doc(uid).update({ [key]: value });
}

// ── 게시판 공통 함수 ──
const BOARD_DEFAULT_XP = 5; // 게시글 작성 기본 점수

async function submitBoardPost(collectionName, userData, currentUser, content, link) {
  if (!content.trim()) return { ok:false, msg:'내용을 입력해주세요.' };
  if (link && !link.startsWith('http')) return { ok:false, msg:'링크는 http://로 시작해야 해요.' };

  const isTemp = currentUser.uid === 'student';
  const authorId = isTemp ? ('temp_'+(userData.charName||'익명')) : currentUser.uid;

  const docRef = await db.collection(collectionName).add({
    content: content.trim(),
    link: link||'',
    authorId,
    authorName: userData.charName||userData.name||'익명',
    isTemp,
    xp: BOARD_DEFAULT_XP,
    created_at: new Date().toISOString(),
  });

  // 점수 지급
  if (!isTemp) {
    await addScore(currentUser.uid, BOARD_DEFAULT_XP, `게시글 작성 (${collectionName})`);
  } else {
    userData.score = (userData.score||0) + BOARD_DEFAULT_XP;
    localStorage.setItem('tempUserData', JSON.stringify(userData));
  }
  return { ok:true, docId:docRef.id };
}

async function loadBoardPosts(collectionName, myAuthorId) {
  const snap = await db.collection(collectionName)
    .orderBy('created_at','desc').limit(50).get();
  return snap.docs.map(doc => ({ id:doc.id, ...doc.data() }));
}

async function deleteBoardPost(collectionName, docId, post, targetUid) {
  // 글 삭제
  await db.collection(collectionName).doc(docId).delete();
  // 점수 회수
  const xp = post.xp || BOARD_DEFAULT_XP;
  if (!post.isTemp && targetUid && targetUid !== 'student') {
    await addScore(targetUid, -xp, `게시글 삭제 (${collectionName})`);
  }
}

async function updateBoardPostXP(collectionName, docId, post, newXp, targetUid) {
  const oldXp = post.xp || BOARD_DEFAULT_XP;
  const diff = newXp - oldXp;
  await db.collection(collectionName).doc(docId).update({ xp: newXp });
  if (!post.isTemp && targetUid && diff !== 0) {
    await addScore(targetUid, diff, `게시글 점수 조정 (${collectionName})`);
  }
}
