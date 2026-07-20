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
const STUDENT_ID = "student";
const STUDENT_PW = "123456";

// ── 욕설/비하 필터 ──
const BAD_WORDS = ["욕1","욕2","바보","멍청","시발","씨발","병신","개새","ㅅㅂ","ㅂㅅ","fuck","shit","damn","bitch"];
function filterName(name) {
  const lower = name.toLowerCase();
  return BAD_WORDS.some(w => lower.includes(w));
}

// ── 캐릭터 트랙 ──
const CHAR_TRACKS = {
  robot: [
    { level:1, name:"아기 로봇",     minScore:0,   img:"images/robot_1.png", emoji:"🤖" },
    { level:2, name:"초보 AI",       minScore:50,  img:"images/robot_2.png", emoji:"🦾" },
    { level:3, name:"학습 AI",       minScore:150, img:"images/robot_3.png", emoji:"🧠" },
    { level:4, name:"지능형 AI",     minScore:300, img:"images/robot_4.png", emoji:"⚡" },
    { level:5, name:"미래형 가디언", minScore:500, img:"images/robot_5.png", emoji:"🌟" },
  ],
  wizard: [
    { level:1, name:"견습 마법사",   minScore:0,   img:"images/wizard_1.png", emoji:"🧙" },
    { level:2, name:"마법사",        minScore:50,  img:"images/wizard_2.png", emoji:"✨" },
    { level:3, name:"상급 마법사",   minScore:150, img:"images/wizard_3.png", emoji:"🔮" },
    { level:4, name:"대마법사",      minScore:300, img:"images/wizard_4.png", emoji:"⚡" },
    { level:5, name:"아크메이지",    minScore:500, img:"images/wizard_5.png", emoji:"🌟" },
  ],
};

// 기존 LEVELS는 호환성 유지 (robot 기본)
const LEVELS = CHAR_TRACKS.robot;

function getLevelByScore(score, track) {
  const levels = CHAR_TRACKS[track||'robot'] || CHAR_TRACKS.robot;
  let lv = levels[0];
  for (const l of levels) { if (score >= l.minScore) lv = l; }
  return lv;
}

function getNextLevel(score, track) {
  const levels = CHAR_TRACKS[track||'robot'] || CHAR_TRACKS.robot;
  for (const l of levels) { if (score < l.minScore) return l; }
  return null;
}

function getCurrentCharImg(userData) {
  const score = userData.score || 0;
  const track = userData.charTrack || 'robot';
  return getLevelByScore(score, track).img;
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
const MAX_BOARD_XP = 8; // 게시판 활동 총 획득 가능 최대 점수

/**
 * 게시판 활동(게시글 작성, 댓글 작성)에 따른 점수를 가산합니다 (최대 8점 제한)
 */
async function addBoardActivityScore(currentUser, userData, actionType = 'comment', reason = '게시판 활동') {
  if (!currentUser) return { gained: 0, current: 0, isMax: true };
  const isTemp = currentUser.uid === 'student';

  let currentBoardXp = Number(userData.boardXp || 0);

  if (currentBoardXp >= MAX_BOARD_XP) {
    return { gained: 0, current: MAX_BOARD_XP, isMax: true };
  }

  // 첫 글이면 5점, 그 외 게시글/댓글은 1점
  let baseReward = (actionType === 'first_post') ? 5 : 1;
  let gained = Math.min(baseReward, MAX_BOARD_XP - currentBoardXp);

  if (gained > 0) {
    currentBoardXp += gained;
    userData.boardXp = currentBoardXp;
    userData.score = (userData.score || 0) + gained;

    if (isTemp) {
      localStorage.setItem('tempUserData', JSON.stringify(userData));
    } else {
      await addScore(currentUser.uid, gained, reason);
      await db.collection('users').doc(currentUser.uid).update({
        boardXp: currentBoardXp
      }).catch(e => console.error('boardXp update err:', e));
    }
  }

  return { gained, current: currentBoardXp, isMax: currentBoardXp >= MAX_BOARD_XP };
}

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

  // 점수 지급 (첫 글 5점, 최대 8점 상한)
  const isFirst = (userData.boardXp || 0) === 0;
  await addBoardActivityScore(currentUser, userData, isFirst ? 'first_post' : 'post', `게시글 작성 (${collectionName})`);
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

// ══════════════════════════════════════════
//  🔊 사운드 시스템
// ══════════════════════════════════════════
const SOUNDS = {
  BGM: {
    main:     'sounds/bgm_main.mp3',
    quest:    'sounds/bgm_quest.mp3',
  },
  SFX: {
    click:    'sounds/sfx_click.mp3',
    correct:  'sounds/sfx_correct.mp3',
    wrong:    'sounds/sfx_wrong.mp3',
    levelup:  'sounds/sfx_levelup.mp3',
    complete: 'sounds/sfx_complete.mp3',
  }
};

// 설정 로드 (localStorage)
function getSoundSettings() {
  return {
    bgm: localStorage.getItem('sound_bgm') !== 'off',
    sfx: localStorage.getItem('sound_sfx') !== 'off',
  };
}
function setSoundSettings(bgm, sfx) {
  localStorage.setItem('sound_bgm', bgm ? 'on' : 'off');
  localStorage.setItem('sound_sfx', sfx ? 'on' : 'off');
}

// BGM 관리
let _bgmAudio = null;
let _currentBgm = null;

function playBGM(key) {
  const settings = getSoundSettings();
  if (!settings.bgm) return;
  const src = SOUNDS.BGM[key];
  if (!src) return;
  if (_currentBgm === key && _bgmAudio && !_bgmAudio.paused) return;
  stopBGM();
  _bgmAudio = new Audio(src);
  _bgmAudio.loop = true;
  _bgmAudio.volume = 0.35;
  _bgmAudio.play().catch(()=>{});
  _currentBgm = key;
}

function stopBGM() {
  if (_bgmAudio) {
    _bgmAudio.pause();
    _bgmAudio.currentTime = 0;
    _bgmAudio = null;
    _currentBgm = null;
  }
}

function toggleBGM() {
  const s = getSoundSettings();
  setSoundSettings(!s.bgm, s.sfx);
  if (!getSoundSettings().bgm) {
    stopBGM();
  } else {
    if (_currentBgm) playBGM(_currentBgm);
  }
  return getSoundSettings().bgm;
}

function toggleSFX() {
  const s = getSoundSettings();
  setSoundSettings(s.bgm, !s.sfx);
  return getSoundSettings().sfx;
}

// 효과음 재생
function playSFX(key) {
  const settings = getSoundSettings();
  if (!settings.sfx) return;
  const src = SOUNDS.SFX[key];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.6;
  audio.play().catch(()=>{});
}

// BGM 볼륨 업데이트
function updateBGMVolume(vol) {
  if (_bgmAudio) _bgmAudio.volume = vol;
}

// ── 뱃지(업적) 정의 ──
const BADGES = [
  { id: 'ethics_guardian', title: '윤리의 수호자', icon: '⚖️', desc: '퀘스트 1 완료' },
  { id: 'truth_seeker', title: '진실의 추적자', icon: '🔍', desc: '퀘스트 2 완료' },
  { id: 'ai_educator', title: '지식의 전파자', icon: '📚', desc: '퀘스트 3 완료' },
  { id: 'young_scientist', title: '새내기 과학자', icon: '🎓', desc: '퀘스트 4 완료' },
  { id: 'flawless_master', title: '완벽한 마스터', icon: '💯', desc: '퀘스트 5에서 100점 달성' },
  { id: 'data_hunter', title: '데이터 사냥꾼', icon: '📷', desc: '퀘스트 6 완료' },
  { id: 'labeling_expert', title: '라벨링 전문가', icon: '🏷️', desc: '퀘스트 7 완료' },
  { id: 'safety_officer', title: '안전의 파수꾼', icon: '🛡️', desc: '퀘스트 8 완료' },
  { id: 'team_player', title: '협동의 마스터', icon: '🤝', desc: '학급 공동 목표 달성' }
];

async function unlockBadge(badgeId, userSession, userLocalData) {
  if (!badgeId) return false;
  if (!userLocalData.achievements) userLocalData.achievements = [];
  let achievements = userLocalData.achievements;
  if (achievements.includes(badgeId)) return false; // 이미 획득함

  achievements.push(badgeId);
  userLocalData.achievements = achievements;

  if (userSession.uid === 'student') {
    localStorage.setItem('tempUserData', JSON.stringify(userLocalData));
  } else if (userSession.uid !== 'admin') {
    try {
      await db.collection('users').doc(userSession.uid).update({
        achievements: achievements
      });
    } catch (e) {
      console.error("Firestore achievements update failed:", e);
    }
  }

  // 새로 획득한 경우 팝업 모달 표시
  showBadgeUnlockModal(badgeId);
  return true; // 새로 획득함
}

// ── 뱃지 획득 시 연출 모달 ──
function showBadgeUnlockModal(badgeId) {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return;

  // 효과음 재생
  playSFX('levelup');

  // 스타일 주입
  if (!document.getElementById('badge-unlock-modal-style')) {
    const style = document.createElement('style');
    style.id = 'badge-unlock-modal-style';
    style.innerHTML = `
      .badge-unlock-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn .3s ease;
      }
      .badge-unlock-card {
        background: #0f1420;
        border: 2px solid rgba(246, 173, 85, 0.4);
        box-shadow: 0 0 45px rgba(246, 173, 85, 0.25);
        border-radius: 24px;
        padding: 36px 28px;
        text-align: center;
        max-width: 360px;
        width: 100%;
        animation: badgePop .5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes badgePop {
        from { transform: scale(0.6); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .badge-unlock-icon-wrap {
        position: relative;
        width: 100px;
        height: 100px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle, rgba(246, 173, 85, 0.2) 0%, transparent 70%);
      }
      .badge-unlock-icon {
        font-size: 64px;
        animation: badgeFloat 2s ease-in-out infinite;
      }
      @keyframes badgeFloat {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-8px) scale(1.05); }
      }
      .badge-unlock-title {
        font-family: 'Jua', sans-serif;
        font-size: 22px;
        color: #f6ad55;
        margin-bottom: 8px;
      }
      .badge-unlock-name {
        font-size: 18px;
        font-weight: 700;
        color: #e2e8f0;
        margin-bottom: 12px;
      }
      .badge-unlock-desc {
        font-size: 13px;
        color: #8a9bb0;
        line-height: 1.6;
        margin-bottom: 24px;
        background: rgba(255, 255, 255, 0.03);
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .badge-unlock-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #f6ad55, #ed8936);
        border: none;
        border-radius: 12px;
        color: #0a0e1a;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: all .2s;
        touch-action: manipulation;
      }
      .badge-unlock-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(246, 173, 85, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  // DOM 생성
  const overlay = document.createElement('div');
  overlay.className = 'badge-unlock-overlay';
  overlay.id = 'badge-unlock-overlay-container';
  overlay.innerHTML = `
    <div class="badge-unlock-card">
      <div style="font-size: 12px; color: #f6ad55; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; font-weight: 700;">🎖️ 업적 달성!</div>
      <div class="badge-unlock-icon-wrap">
        <div class="badge-unlock-icon">${badge.icon}</div>
      </div>
      <div class="badge-unlock-title">새로운 뱃지 획득!</div>
      <div class="badge-unlock-name">${badge.title}</div>
      <div class="badge-unlock-desc">${badge.desc}</div>
      <button class="badge-unlock-btn" onclick="document.getElementById('badge-unlock-overlay-container').remove();">확인</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // 메인 페이지일 경우 꽃가루 날리기
  if (typeof startConfetti === 'function') {
    startConfetti();
  }
}

// ── 글로벌 오디오 플로팅 제어 버튼 주입 ──
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
    return;
  }

  // 스타일 주입
  if (!document.getElementById('global-sound-btn-style')) {
    const style = document.createElement('style');
    style.id = 'global-sound-btn-style';
    style.innerHTML = `
      .global-sound-btn {
        position: fixed;
        top: 10px;
        right: 14px;
        z-index: 1000;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(26, 34, 53, 0.85);
        border: 1px solid rgba(99, 179, 237, 0.3);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
        backdrop-filter: blur(4px);
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .global-sound-btn:hover {
        background: rgba(99, 179, 237, 0.15);
        border-color: #63b3ed;
        transform: scale(1.05);
      }
      .global-sound-btn:active {
        transform: scale(0.95);
      }
      @media (max-width: 768px) {
        .global-sound-btn {
          top: 10px;
          right: 56px; /* 모바일에서 햄버거 메뉴 옆에 겹치지 않게 여유 공간 조정 */
          width: 34px;
          height: 34px;
          font-size: 14px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 버튼 엘리먼트 생성
  const btn = document.createElement('button');
  btn.className = 'global-sound-btn';
  btn.id = 'global-sound-float-btn';

  const updateIcon = () => {
    const s = getSoundSettings();
    btn.textContent = s.bgm ? '🔊' : '🔇';
    btn.title = s.bgm ? '배경음 켜짐' : '배경음 꺼짐';
  };

  updateIcon();

  btn.addEventListener('click', () => {
    const on = toggleBGM();
    updateIcon();

    if (on) {
      const pageName = window.location.pathname.split('/').pop();
      if (pageName && pageName.startsWith('quest')) {
        playBGM('quest');
      } else {
        playBGM('main');
      }
    } else {
      stopBGM();
    }

    if (typeof updateSettingsBtns === 'function') {
      updateSettingsBtns();
    }
    if (typeof updateStoryBGMBtn === 'function') {
      updateStoryBGMBtn();
    }
  });

  document.body.appendChild(btn);
});

// ── 게시글 응원(좋아요) 시스템 ──
async function cheerPost(collectionName, docId, userId) {
  const ref = db.collection(collectionName).doc(docId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, msg: '게시글을 찾을 수 없습니다.' };
  const data = snap.data();
  const cheers = data.cheers || [];
  if (cheers.includes(userId)) return { ok: false, msg: '이미 응원했어요!' };
  cheers.push(userId);
  await ref.update({ cheers, cheerCount: cheers.length });
  // 응원받은 글쓴이에게 +2점
  if (!data.isTemp && data.authorId && data.authorId !== 'student') {
    await addScore(data.authorId, 2, '게시글 응원 받음 (' + collectionName + ')');
  }
  return { ok: true, count: cheers.length };
}

// ══════════════════════════════════════════
//  📋 사전 / 사후 설문조사 시스템
// ══════════════════════════════════════════
const SURVEY_REWARD_XP = 10; // 설문 응답 보상 점수

// 설문 완료 상태 확인
function checkSurveyStatus(userSession, userLocalData) {
  const isTemp = userSession.uid === 'student';
  if (isTemp) {
    const pre = localStorage.getItem('preSurveyCompleted') === 'true';
    const post = localStorage.getItem('postSurveyCompleted') === 'true';
    return { pre, post };
  } else {
    return {
      pre: !!(userLocalData && userLocalData.preSurveyCompleted),
      post: !!(userLocalData && userLocalData.postSurveyCompleted)
    };
  }
}

// 1. 사전 설문 제출
async function submitPreSurveyData(userSession, userLocalData, answers) {
  const isTemp = userSession.uid === 'student';
  const authorName = userLocalData.charName || userLocalData.name || '익명 학생';
  const uid = isTemp ? ('temp_' + authorName) : userSession.uid;

  const payload = {
    uid: uid,
    authorName: authorName,
    isTemp: isTemp,
    answers: answers,
    created_at: new Date().toISOString()
  };

  try {
    // Firestore 저장
    await db.collection('pre_surveys').add(payload);

    // 사용자 완료 상태 업데이트 & XP 보상
    if (isTemp) {
      localStorage.setItem('preSurveyCompleted', 'true');
      localStorage.setItem('preSurveyData', JSON.stringify(payload));
      userLocalData.preSurveyCompleted = true;
      userLocalData.score = (userLocalData.score || 0) + SURVEY_REWARD_XP;
      localStorage.setItem('tempUserData', JSON.stringify(userLocalData));
    } else if (userSession.uid !== 'admin') {
      userLocalData.preSurveyCompleted = true;
      await db.collection('users').doc(userSession.uid).update({
        preSurveyCompleted: true
      });
      await addScore(userSession.uid, SURVEY_REWARD_XP, '사전 설문조사 참여 보상');
    }
    return { ok: true, reward: SURVEY_REWARD_XP };
  } catch (e) {
    console.error("submitPreSurveyData error:", e);
    return { ok: false, msg: e.message };
  }
}

// 2. 사후 설문 제출
async function submitPostSurveyData(userSession, userLocalData, answers) {
  const isTemp = userSession.uid === 'student';
  const authorName = userLocalData.charName || userLocalData.name || '익명 학생';
  const uid = isTemp ? ('temp_' + authorName) : userSession.uid;

  const payload = {
    uid: uid,
    authorName: authorName,
    isTemp: isTemp,
    answers: answers,
    created_at: new Date().toISOString()
  };

  try {
    // Firestore 저장
    await db.collection('post_surveys').add(payload);

    // 사용자 완료 상태 업데이트 & XP 보상
    if (isTemp) {
      localStorage.setItem('postSurveyCompleted', 'true');
      localStorage.setItem('postSurveyData', JSON.stringify(payload));
      userLocalData.postSurveyCompleted = true;
      userLocalData.score = (userLocalData.score || 0) + SURVEY_REWARD_XP;
      localStorage.setItem('tempUserData', JSON.stringify(userLocalData));
    } else if (userSession.uid !== 'admin') {
      userLocalData.postSurveyCompleted = true;
      await db.collection('users').doc(userSession.uid).update({
        postSurveyCompleted: true
      });
      await addScore(userSession.uid, SURVEY_REWARD_XP, '사후 설문조사 참여 보상');
    }
    return { ok: true, reward: SURVEY_REWARD_XP };
  } catch (e) {
    console.error("submitPostSurveyData error:", e);
    return { ok: false, msg: e.message };
  }
}

// 3. 관리자용: 사전/사후 설문 데이터 목록 불러오기
async function loadAllSurveyData() {
  try {
    const preSnap = await db.collection('pre_surveys').orderBy('created_at', 'desc').get();
    const postSnap = await db.collection('post_surveys').orderBy('created_at', 'desc').get();

    const preList = preSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const postList = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { ok: true, preList, postList };
  } catch (e) {
    console.error("loadAllSurveyData error:", e);
    return { ok: false, msg: e.message, preList: [], postList: [] };
  }
}

// ══════════════════════════════════════════
//  ⏱️ 퀘스트 학습 시간 및 점수 추적 시스템
// ══════════════════════════════════════════
let _questStartTime = null;
let _currentQuestId = null;

// 1. 퀘스트 진입 시 타이머 시작
function startQuestTimer(questId) {
  _currentQuestId = questId;
  _questStartTime = Date.now();
}

// 2. 학습 시간 포맷팅 (초 -> 분/초)
function formatTimeSpent(seconds) {
  if (!seconds || seconds <= 0) return '0초';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}초`;
  return `${mins}분 ${secs}초`;
}

// 3. 퀘스트 학습시간 및 점수/완료 상태 기록
async function recordQuestProgress(userSession, userLocalData, questId, scoreDelta = 0, isComplete = false) {
  if (!questId) questId = _currentQuestId;
  if (!questId || !userSession) return;

  let elapsedSec = 0;
  if (_questStartTime) {
    elapsedSec = Math.floor((Date.now() - _questStartTime) / 1000);
    _questStartTime = Date.now(); // 타이머 리셋
  }

  const qKeyTime = `q${questId}_time`;
  const qKeyScore = `q${questId}_score`;
  const qKeyDone = `q${questId}_done`;

  const isTemp = userSession.uid === 'student';

  if (isTemp) {
    if (!userLocalData) userLocalData = JSON.parse(localStorage.getItem('tempUserData') || '{}');
    if (!userLocalData.quests) userLocalData.quests = {};

    const curTime = userLocalData.quests[qKeyTime] || 0;
    const curScore = userLocalData.quests[qKeyScore] || 0;

    userLocalData.quests[qKeyTime] = curTime + elapsedSec;
    if (scoreDelta > 0) {
      userLocalData.quests[qKeyScore] = Math.max(curScore, scoreDelta);
    }
    if (isComplete) {
      userLocalData.quests[qKeyDone] = true;
    }
    localStorage.setItem('tempUserData', JSON.stringify(userLocalData));
  } else if (userSession.uid !== 'admin') {
    try {
      const userRef = db.collection('users').doc(userSession.uid);
      await db.runTransaction(async t => {
        const doc = await t.get(userRef);
        if (!doc.exists) return;
        const data = doc.data() || {};
        const quests = data.quests || {};

        const curTime = quests[qKeyTime] || 0;
        const curScore = quests[qKeyScore] || 0;

        const updateObj = {};
        updateObj[`quests.${qKeyTime}`] = curTime + elapsedSec;
        if (scoreDelta > 0) {
          updateObj[`quests.${qKeyScore}`] = Math.max(curScore, scoreDelta);
        }
        if (isComplete) {
          updateObj[`quests.${qKeyDone}`] = true;
        }
        t.update(userRef, updateObj);
      });
    } catch (e) {
      console.error("recordQuestProgress error:", e);
    }
  }
}

// ══════════════════════════════════════════
//  📱 모바일 기기 감지 & 가로모드 회전 안내 유틸리티
// ══════════════════════════════════════════
function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTouchSmallScreen = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && Math.min(window.innerWidth, window.innerHeight) <= 900;
  return isMobileUA || isTouchSmallScreen;
}

let _userDismissedOrientation = false;

function initMobileOrientationCheck() {
  // 모바일 디바이스가 아니면 작동하지 않음 (PC/노트북은 무시)
  if (!isMobileDevice()) return;

  function updateOrientationOverlay() {
    let overlay = document.getElementById('mobile-rotate-overlay');
    
    // 모바일 세로 모드(Portrait) 여부 감지
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isPortrait && !_userDismissedOrientation) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mobile-rotate-overlay';
        overlay.style.cssText = `
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(10, 14, 26, 0.92);
          backdrop-filter: blur(10px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 24px; text-align: center; color: #f8fafc; font-family: 'Noto Sans KR', sans-serif;
          animation: fadeIn .3s ease;
        `;
        overlay.innerHTML = `
          <style>
            @keyframes phoneRotate {
              0%, 10% { transform: rotate(0deg); }
              40%, 60% { transform: rotate(-90deg); }
              90%, 100% { transform: rotate(0deg); }
            }
          </style>
          <div style="background:rgba(99,179,237,0.12);border:2px solid rgba(99,179,237,0.4);border-radius:24px;padding:32px 24px;max-width:340px;width:90%;box-shadow:0 0 50px rgba(99,179,237,0.25);">
            <div style="font-size:54px;margin-bottom:16px;display:inline-block;animation:phoneRotate 2.5s ease-in-out infinite;">📱</div>
            <h3 style="font-family:'Jua',sans-serif;font-size:22px;color:#63b3ed;margin:0 0 10px 0;">화면을 가로로 돌려주세요! 🔄</h3>
            <p style="font-size:13.5px;color:rgba(255,255,255,0.75);line-height:1.6;margin:0 0 20px 0;">
              핸드폰을 가로로 누르면 퀘스트 지도와 라벨링 화면을 더 넓고 신나게 즐길 수 있어요 ✨
            </p>
            <button onclick="dismissMobileOrientationOverlay()" style="width:100%;padding:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:12px;color:rgba(255,255,255,0.8);font-size:13px;cursor:pointer;font-family:inherit;">
              ✕ 세로로 계속하기
            </button>
          </div>
        `;
        document.body.appendChild(overlay);
      } else {
        overlay.style.display = 'flex';
      }
    } else {
      if (overlay) overlay.style.display = 'none';
    }
  }

  window.dismissMobileOrientationOverlay = function() {
    _userDismissedOrientation = true;
    const overlay = document.getElementById('mobile-rotate-overlay');
    if (overlay) overlay.style.display = 'none';
  };

  window.addEventListener('resize', updateOrientationOverlay);
  window.addEventListener('orientationchange', updateOrientationOverlay);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updateOrientationOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', updateOrientationOverlay);
  }
}
