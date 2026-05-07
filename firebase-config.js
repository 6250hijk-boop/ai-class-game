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
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwvUEVKU8xYy3gezcnp0GX_ouFWOXCp3GwaCoK6k8p13t-8o9V2JP7lRlrToCarn0d_Bw/exec",
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
const STUDENT_ID = "student";
const STUDENT_PW = "20260404";

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

// ── 퀘스트 목록 ──
const QUESTS = [
  { id:1, title:"인공지능 세계의 법률", icon:"⚖️",  done:false },
  { id:2, title:"아버지를 찾아서",       icon:"🔍",  done:false },
  { id:3, title:"인공지능 수업자료 만들기", icon:"📚", done:false },
  { id:4, title:"인공지능 공부시키기",   icon:"🎓",  done:false },
  { id:5, title:"배운내용 확인하기",     icon:"✅",  done:false },
  { id:6, title:"데이터 수집하기",       icon:"📷",  done:false },
  { id:7, title:"라벨링하기",            icon:"🏷️",  done:false },
  { id:8, title:"테스트해보기",          icon:"🧪",  done:false },
];

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
