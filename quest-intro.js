// quest-intro.js: QUEST 1~7 대화형 비주얼 인트로 시스템
(function() {
  function detectQuestNumber() {
    const fullPath = window.location.pathname + window.location.search + window.location.hash;
    const match = fullPath.match(/quest(\d+)/i);
    if (match) return parseInt(match[1], 10);
    const scriptTag = document.currentScript;
    if (scriptTag && scriptTag.getAttribute('data-quest')) {
      return parseInt(scriptTag.getAttribute('data-quest'), 10);
    }
    return 1;
  }

  const qNum = detectQuestNumber();
  if (qNum < 1 || qNum > 7) return;

  // 인트로 표시 여부 판별 (이번 세션에서 방금 완료했거나 닫은 경우만 스킵, 강제 실행 시 무조건 표시)
  function shouldSkipIntro(num) {
    try {
      // 1. URL에 intro=1 또는 replay=1 파라미터가 있으면 무조건 표시
      const params = new URLSearchParams(window.location.search);
      if (params.get('intro') === '1' || params.get('replay') === '1') {
        return false;
      }

      // 2. 현재 탭 세션에서 방금 퀘스트를 완료(제출)하고 재진입한 경우 스킵
      if (sessionStorage.getItem(`quest${num}_just_completed`) === 'true') {
        return true;
      }

      // 3. 현재 탭 세션에서 사용자가 이미 인트로를 보고 '시작하기'나 '스킵'으로 닫은 경우 스킵
      if (sessionStorage.getItem(`quest_intro_dismissed_${num}`) === 'true') {
        return true;
      }
    } catch(e) {
      console.warn('[quest-intro] shouldSkipIntro error:', e);
    }
    return false;
  }


  const INTRO_DIALOGS = {
    1: {
      title: "QUEST 1. AI의 눈",
      speaker: "AI 자원순환 탐정단 본부",
      lines: [
        "우리학교 분리배출함에서 이상한 사건이 일어나고 있대요! 탐정단의 첫 임무는 사건 현장을 조사하는 거에요.",
        "그리고 우리를 도와줄 AI탐정에게 이름을 지어 주세요, AI탐정은 '눈'으로 사진을 보고 물건을 알아본답니다."
      ]
    },
    2: {
      title: "QUEST 2. 분류기준 만들기",
      speaker: "AI 자원순환 탐정단 본부",
      lines: [
        "사람은 말로 된 규칙으로 분류하지만, 규칙이 애매하면 사람마다 다르게 판단해요.",
        "누가 따라 해도 같은 결과가 나오는 탐정단 분류 규칙을 만들어 봐요!"
      ]
    },
    3: {
      title: "QUEST 3. AI가 잘 배우는 사진",
      speaker: "AI 자원순환 탐정단 본부",
      lines: [
        "AI는 사진을 아주 많이 봐야 잘 배워요. 그런데 아무 사진이나 좋은건 아니래요.",
        "어두운사진, 반쯤 가려진사진으로 공부하면 AI가 헷갈리겠죠? 좋은 증거 사진을 모아 AI공부 자료실에 보내주세요!"
      ]
    },
    4: {
      title: "QUEST 4. 이름표 붙이기",
      speaker: "AI 자원순환 탐정단 본부",
      lines: [
        "AI는 사진만 봐서는 그게 무엇인지 몰라요. '이건 캔이야'라는 이름표가 붙어있어야 배울 수 있어요.",
        "이름표가 틀리면 AI도 틀리게 배워요. 우리 모둠 규칙을 보면서 정확하게 붙여 주세요."
      ]
    },
    5: {
      title: "QUEST 5. 교실쓰레기 AI탐정단",
      speaker: "AI 자원순환 탐정단 본부",
      lines: [
        "AI가 제대로 배우려면 이름표 붙은 사진이 수천장 필요해요. 그래서 탐정단 선생님들이 여러분처럼 모은 사진으로 AI를 미리 공부시켜두었어요.",
        "AI가 어떻게 공부했는지 먼저 보고, 처음보는 쓰레기로 AI탐정을 시험해봐요. AI의 답을 그대로 믿으면 안돼요!"
      ]
    },
    6: {
      title: "QUEST 6. 오류박물관",
      speaker: "AI 자원순환 탐정단 본부",
      lines: [
        "오류 박물관에 오신 걸 환영해요! 여기엔 AI가 틀린 사건들이 전시되어 있어요.",
        "AI는 왜 틀렸을까요? 원인을 찾아내면 AI를 더 똑똑하게 만들 수 있어요."
      ]
    },
    7: {
      title: "QUEST 7. 실천 규약 초안",
      speaker: "AI 자원순환 탐정단 본부",
      lines: [
        "지금까지 모은 증거로 우리 학교를 바꿀 차례에요!",
        "좋은 약속은 '왜 필요한지(근거)', '무엇을 할지(행동)', 'AI를 어떻게 쓸지(한계와 사람의 역할)'가 들어있어야 해요."
      ]
    }
  };

  const currentIntro = INTRO_DIALOGS[qNum];
  if (!currentIntro) return;

  // 스타일 주입
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .quest-intro-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      width: 100vw;
      height: 100vh;
      background: #000000;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      padding: 24px;
      overflow: hidden;
      transition: opacity 0.4s ease, visibility 0.4s ease;
      cursor: pointer;
      user-select: none;
    }

    .quest-intro-bg-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      z-index: 1;
      filter: brightness(0.9);
      transition: transform 10s ease;
      transform: scale(1.02);
    }

    .quest-intro-overlay:hover .quest-intro-bg-img {
      transform: scale(1.05);
    }

    .quest-intro-vignette {
      position: absolute;
      inset: 0;
      z-index: 2;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.45) 45%, rgba(0, 0, 0, 0.2) 100%);
      pointer-events: none;
    }

    .quest-intro-skip-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
      background: rgba(15, 23, 42, 0.8);
      color: #E2E8F0;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .quest-intro-skip-btn:hover {
      background: rgba(220, 38, 38, 0.9);
      border-color: #F87171;
      color: #FFFFFF;
      transform: scale(1.05);
    }

    .quest-intro-dialog-card {
      position: relative;
      z-index: 5;
      width: 100%;
      max-width: 920px;
      background: rgba(15, 23, 42, 0.88);
      border: 2.5px solid #38BDF8;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.35);
      border-radius: 24px;
      padding: 24px 30px;
      backdrop-filter: blur(12px);
      margin-bottom: 20px;
      animation: dialogPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
    }

    @keyframes dialogPop {
      0% { opacity: 0; transform: translateY(20px) scale(0.97); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    .quest-intro-speaker-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #0284C7, #0369A1);
      color: #FFFFFF;
      font-family: 'Jua', sans-serif;
      font-size: 15px;
      padding: 5px 14px;
      border-radius: 10px;
      border: 1px solid #38BDF8;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
      margin-bottom: 12px;
    }

    .quest-intro-quest-badge {
      font-size: 12px;
      background: rgba(255, 255, 255, 0.25);
      padding: 1px 7px;
      border-radius: 6px;
      font-weight: 800;
    }

    .quest-intro-text {
      font-family: 'Pretendard', sans-serif;
      font-size: clamp(17px, 2.2vw, 22px);
      font-weight: 700;
      color: #F8FAFC;
      line-height: 1.7;
      word-break: keep-all;
      min-height: 64px;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    }

    .quest-intro-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed rgba(255, 255, 255, 0.2);
    }

    .quest-intro-step-hint {
      font-size: 13px;
      font-weight: 700;
      color: #38BDF8;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .quest-intro-click-prompt {
      font-size: 13.5px;
      font-weight: 800;
      color: #FACC15;
      animation: promptBlink 1.4s infinite ease-in-out;
    }

    @keyframes promptBlink {
      0%, 100% { opacity: 0.45; transform: translateX(0); }
      50% { opacity: 1; transform: translateX(4px); }
    }

    /* 시작하기 팝업 모달 */
    .quest-intro-modal-wrap {
      position: absolute;
      inset: 0;
      z-index: 20;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      animation: fadeInModal 0.3s ease forwards;
    }

    @keyframes fadeInModal {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .quest-intro-popup-box {
      background: linear-gradient(135deg, #0F172A, #1E293B);
      border: 3px solid #F59E0B;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.5);
      border-radius: 26px;
      padding: 34px 40px;
      max-width: 480px;
      width: 90%;
      text-align: center;
      animation: popUpBox 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes popUpBox {
      0% { transform: scale(0.85); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .quest-intro-popup-title {
      font-family: 'Jua', sans-serif;
      font-size: 28px;
      color: #FCD34D;
      margin-bottom: 12px;
      text-shadow: 0 2px 10px rgba(245, 158, 11, 0.4);
    }

    .quest-intro-popup-desc {
      font-size: 16px;
      color: #E2E8F0;
      font-weight: 600;
      line-height: 1.6;
      margin-bottom: 26px;
      word-break: keep-all;
    }

    .quest-intro-btn-start {
      background: linear-gradient(135deg, #10B981, #059669);
      color: #FFFFFF;
      font-family: 'Jua', sans-serif;
      font-size: 22px;
      border: none;
      padding: 16px 42px;
      border-radius: 18px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.45);
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: inline-block;
      width: 100%;
      animation: btnPulse 2s infinite ease-in-out;
    }

    .quest-intro-btn-start:hover {
      transform: scale(1.04);
      box-shadow: 0 12px 30px rgba(16, 185, 129, 0.6);
      background: linear-gradient(135deg, #34D399, #059669);
    }

    @keyframes btnPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      50% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
    }
  `;
  document.head.appendChild(styleEl);

  function playTone(freq = 600, duration = 0.08) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    } catch(e) {}
  }

  function playFanfare() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.2, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.09 + 0.22);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.22);
      });
    } catch(e) {}
  }

  function createIntroDOM(force = false) {
    // 세션 건너뛰기 조건 확인 (force === true인 경우 수동 다시보기이므로 무조건 표시)
    if (!force && shouldSkipIntro(qNum)) {
      return;
    }

    // 이미 오버레이가 생성되어 있으면 중복 생성 방지
    if (document.getElementById('questIntroOverlay')) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'quest-intro-overlay';
    overlay.id = 'questIntroOverlay';

    overlay.innerHTML = `
      <img src="images/bs-bg.png" alt="퀘스트 인트로 배경" class="quest-intro-bg-img" onerror="this.style.display='none'">
      <div class="quest-intro-vignette"></div>

      <button class="quest-intro-skip-btn" id="questIntroSkipBtn">스킵 (건너뛰기)</button>

      <div class="quest-intro-dialog-card" id="questIntroDialogCard">
        <div class="quest-intro-speaker-tag">
          <span class="quest-intro-quest-badge">Q${qNum}</span>
          <span id="questIntroSpeakerText">${currentIntro.speaker}</span>
        </div>
        <div class="quest-intro-text" id="questIntroDialogText"></div>
        <div class="quest-intro-footer">
          <span class="quest-intro-step-hint" id="questIntroStepHint">대화 1 / ${currentIntro.lines.length}</span>
          <span class="quest-intro-click-prompt" id="questIntroClickPrompt">화면을 클릭하여 계속 진행 ▶</span>
        </div>
      </div>

      <!-- 시작하기 팝업 모달 -->
      <div class="quest-intro-modal-wrap" id="questIntroStartModal">
        <div class="quest-intro-popup-box" id="questIntroPopupBox">
          <div class="quest-intro-popup-title">${currentIntro.title} 준비 완료!</div>
          <div class="quest-intro-popup-desc">
            탐정단 브리핑을 모두 확인했습니다.<br>
            지금 바로 탐정 활동에 도전해볼까요?
          </div>
          <button class="quest-intro-btn-start" id="questIntroStartBtn">
            시작하기
          </button>
        </div>
      </div>
    `;

    document.body.prepend(overlay);

    let currentLineIndex = 0;
    const dialogTextEl = overlay.querySelector('#questIntroDialogText');
    const stepHintEl = overlay.querySelector('#questIntroStepHint');
    const modalWrapEl = overlay.querySelector('#questIntroStartModal');
    const startBtn = overlay.querySelector('#questIntroStartBtn');
    const skipBtn = overlay.querySelector('#questIntroSkipBtn');
    const popupBox = overlay.querySelector('#questIntroPopupBox');

    function renderLine(idx) {
      if (idx < currentIntro.lines.length) {
        dialogTextEl.textContent = currentIntro.lines[idx];
        stepHintEl.textContent = `대화 ${idx + 1} / ${currentIntro.lines.length}`;
      }
    }

    renderLine(0);

    function nextDialog(e) {
      // 팝업 박스 자체 클릭 시 대화 넘김 무시
      if (e && e.target && popupBox && popupBox.contains(e.target)) {
        return;
      }

      if (modalWrapEl.style.display === 'flex') {
        return;
      }

      currentLineIndex++;
      if (currentLineIndex < currentIntro.lines.length) {
        playTone(620);
        renderLine(currentLineIndex);
      } else {
        // 모든 대화 완료 -> 시작하기 팝업 띄우기
        playTone(850, 0.15);
        modalWrapEl.style.display = 'flex';
      }
    }

    function closeIntro() {
      try {
        sessionStorage.setItem(`quest_intro_dismissed_${qNum}`, 'true');
      } catch(e) {}
      playFanfare();
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => {
        overlay.style.display = 'none';
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 400);
    }

    overlay.addEventListener('click', nextDialog);

    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeIntro();
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeIntro();
      });
    }
  }

  // 인트로 수동 다시보기 함수 (헤더 버튼 또는 개발자 콘솔에서 호출 가능)
  window.replayQuestIntro = function() {
    try {
      sessionStorage.removeItem(`quest_intro_dismissed_${qNum}`);
      sessionStorage.removeItem(`quest${qNum}_just_completed`);
    } catch(e) {}
    const existing = document.getElementById('questIntroOverlay');
    if (existing) {
      existing.remove();
    }
    createIntroDOM(true);
  };

  // 초기 실행: 인트로 표시
  function initIntro() {
    if (!shouldSkipIntro(qNum)) {
      createIntroDOM(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();
