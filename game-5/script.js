// =========================
// 我的選擇就是你 - 完整版（含返回功能 + 告白動畫 + 聽到壞話場景）
// =========================
const $ = (sel) => document.querySelector(sel);
const bgEl = $("#bg");
const charImg = $("#charImg");
const speakerEl = $("#speaker");
const textEl = $("#text");
const choicesEl = $("#choices");
const playerNameEl = $("#playerName");
const affectionEl = $("#affection");
const modalEl = $("#nameModal");
const nicknameInput = $("#nickname");
const startBtn = $("#startBtn");
const statsHint = $("#statsHint");

const musicBtn = $("#musicBtn");
const volumeBtn = $("#volumeBtn");
const volumePanel = $("#volumePanel");
const bgmVolumeSlider = $("#bgmVolume");
const seVolumeSlider = $("#seVolume");

const settingsBtn = $("#settingsBtn");
const settingsModal = $("#settingsModal");
const closeSettingsBtn = $("#closeSettingsBtn");
const backToCoverBtn = $("#backToCoverBtn");

const profileBtn = $("#profileBtn");
const profileModal = $("#profileModal");
const closeProfileBtn = $("#closeProfileBtn");

const tipsBtn = $("#tipsBtn");
const tipsModal = $("#tipsModal");
const closeTipsBtn = $("#closeTipsBtn");

const confirmModal = $("#confirmModal");
const confirmIcon = $("#confirmIcon");
const confirmTitle = $("#confirmTitle");
const confirmText = $("#confirmText");
const confirmOkBtn = $("#confirmOkBtn");
const confirmCancelBtn = $("#confirmCancelBtn");

// ====== 音樂系統 ======
const audioContext = {
  bgm: null,
  currentBGM: null,
  clickSE: null,
  affectionUpSE: null,
  affectionDownSE: null,
  musicEnabled: true,
  bgmVolume: 0.7,
  seVolume: 0.8,
  isFading: false
};

// BGM 音樂庫（你需要在 assets 文件夾中放入這些音樂文件）
const BGM_LIBRARY = {
  daily: "assets/bgm/daily.mp3",           // 日常場景（教室）
  library: "assets/bgm/library.mp3",       // 圖書館
  romantic: "assets/bgm/romantic.mp3",     // 浪漫場景（公園夜晚）
  tension: "assets/bgm/tension.mp3",       // 緊張場景（聽到壞話）
  confess: "assets/bgm/confess.mp3",       // 告白場景
  success: "assets/bgm/success.mp3",       // 成功結局
  fail: "assets/bgm/fail.mp3"              // 失敗結局
};

// 場景對應的 BGM
const SCENE_BGM_MAP = {
  classroom: 'daily',
  library: 'library',
  hallway: 'daily',
  cinema: 'romantic',
  parkNight: 'romantic',
  parkConfess: 'confess'
};

function createBeep(freq, duration, volume) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch(e) {
    console.log('音效播放失敗:', e);
  }
}

function playClickSE() {
  if (!audioContext.musicEnabled) return;
  createBeep(800, 0.1, audioContext.seVolume * 0.3);
}

function playAffectionUpSE() {
  if (!audioContext.musicEnabled) return;
  createBeep(1200, 0.15, audioContext.seVolume * 0.4);
}

function playAffectionDownSE() {
  if (!audioContext.musicEnabled) return;
  createBeep(400, 0.15, audioContext.seVolume * 0.4);
}

// 淡出當前 BGM
function fadeBGM(audio, duration, callback) {
  if (!audio) {
    console.log('⚠️ fadeBGM: audio 為 null，直接執行回調');
    if (callback) callback();
    return;
  }
  
  console.log(`🔽 fadeBGM: 開始淡出，當前音量 ${audio.volume}`);
  
  const startVolume = audio.volume;
  const fadeStep = startVolume / (duration / 50);
  
  const fadeInterval = setInterval(() => {
    if (audio.volume > fadeStep) {
      audio.volume -= fadeStep;
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(fadeInterval);
      console.log('✅ fadeBGM: 淡出完成');
      if (callback) callback();
    }
  }, 50);
}

// 淡入新 BGM
function fadeInBGM(audio, targetVolume, duration) {
  if (!audio) {
    console.log('❌ fadeInBGM: audio 為 null');
    return;
  }
  
  console.log(`🔊 fadeInBGM: 開始淡入`);
  console.log(`   目標音量: ${targetVolume}`);
  console.log(`   持續時間: ${duration}ms`);
  console.log(`   開始時間點: ${audio.currentTime}秒`);
  
  // 不要重置 currentTime，保持在設定的時間點
  audio.volume = 0;
  
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log('✅ 音樂開始播放');
        
        // 開始淡入
        const fadeStep = targetVolume / (duration / 50);
        
        const fadeInterval = setInterval(() => {
          if (audio.volume < targetVolume - fadeStep) {
            audio.volume += fadeStep;
          } else {
            audio.volume = targetVolume;
            clearInterval(fadeInterval);
            console.log(`✅ 淡入完成，最終音量: ${audio.volume}`);
          }
        }, 50);
      })
      .catch(e => {
        console.log('❌ BGM 播放失敗:', e.message);
        console.log('   可能原因：瀏覽器阻止自動播放');
      });
  }
}

// 播放 BGM（根據場景）
function playBGM(bgKey, force = false) {
  console.log(`🎵 playBGM 被調用: bgKey="${bgKey}", force=${force}, musicEnabled=${audioContext.musicEnabled}, currentBGM="${audioContext.currentBGM}"`);
  
  if (!audioContext.musicEnabled) {
    console.log('❌ 音樂被關閉，跳過播放');
    return;
  }
  
  // 如果正在播放相同的 BGM，不切換（除非強制）
  if (!force && audioContext.currentBGM === bgKey && audioContext.bgm && !audioContext.bgm.paused) {
    console.log(`⏭️ 已經在播放 ${bgKey}，跳過`);
    return;
  }
  
  // 強制模式下的額外訊息
  if (force) {
    console.log(`💪 強制模式：無論如何都會播放 ${bgKey}`);
  }
  
  const bgmPath = BGM_LIBRARY[bgKey];
  if (!bgmPath) {
    console.log('❌ 找不到 BGM:', bgKey);
    return;
  }
  
  console.log(`✅ 準備播放: ${bgKey} (${bgmPath})`);
  
  // 如果有舊音樂，立即停止
  if (audioContext.bgm) {
    console.log(`⏹️ 停止舊音樂: ${audioContext.currentBGM}`);
    try {
      audioContext.bgm.pause();
      audioContext.bgm.volume = 0;
      // 不要設為 null，保留引用以便檢查
    } catch (e) {
      console.log('停止舊音樂時出錯:', e);
    }
  }
  
  // 創建新音樂實例
  console.log(`🎼 創建新音樂實例: ${bgKey}`);
  const newBGM = new Audio(bgmPath);
  newBGM.loop = true;
  newBGM.volume = 0;
  
  audioContext.bgm = newBGM;
  audioContext.currentBGM = bgKey;
  
  console.log(`▶️ 開始播放新音樂: ${bgKey}`);
  
  // 立即嘗試播放
  const playPromise = newBGM.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log('✅ 音樂開始播放，開始淡入');
        
        // 音樂成功播放後，從第 2 秒開始
        setTimeout(() => {
          if (newBGM.duration > 2) {
            newBGM.currentTime = 2;
            console.log(`⏩ 跳到第 2 秒`);
          }
        }, 100);
        
        // 開始淡入
        const targetVolume = audioContext.bgmVolume;
        const duration = 1000;
        const fadeStep = targetVolume / (duration / 50);
        
        const fadeInterval = setInterval(() => {
          if (newBGM.volume < targetVolume - fadeStep) {
            newBGM.volume += fadeStep;
          } else {
            newBGM.volume = targetVolume;
            clearInterval(fadeInterval);
            console.log(`✅ 淡入完成，最終音量: ${newBGM.volume}`);
          }
        }, 50);
      })
      .catch(e => {
        console.log('❌ BGM 播放失敗:', e.message);
        console.log('   請檢查：');
        console.log('   1. 音樂文件是否存在');
        console.log('   2. 文件路徑是否正確');
        console.log('   3. 瀏覽器是否阻止自動播放');
      });
  }
}


// 根據背景切換 BGM
function playBGMByBackground(bg) {
  const bgmKey = SCENE_BGM_MAP[bg];
  if (bgmKey) {
    playBGM(bgmKey);
  }
}

// 播放特殊場景 BGM
function playSpecialBGM(nodeId) {
  console.log(`🎯 playSpecialBGM 被調用: nodeId="${nodeId}"`);
  
  // 完美結局和統計頁面（強制播放）
  if (nodeId === 'end_perfect' || nodeId === 'stats_perfect') {
    console.log(`🏆 檢測到完美結局，播放 success 音樂`);
    playBGM('success', true);  // force = true
  }
  // 成功結局和統計頁面（強制播放）
  else if (nodeId === 'end_an_confess' || nodeId === 'end_success' || nodeId === 'stats_success') {
    console.log(`🎉 檢測到成功結局，播放 success 音樂`);
    playBGM('success', true);  // force = true
  } 
  // 失敗結局和統計頁面（強制播放）
  else if (nodeId === 'end_fail' || nodeId === 'stats_fail') {
    console.log(`😢 檢測到失敗結局，播放 fail 音樂`);
    playBGM('fail', true);  // force = true
  } 
  // 緊張場景（強制播放）
  else if (nodeId.includes('gossip_confrontation') || nodeId.includes('gossip_an_intervene')) {
    console.log(`😰 檢測到緊張場景，播放 tension 音樂`);
    playBGM('tension', true);  // force = true
  } else {
    console.log(`ℹ️ 沒有特殊 BGM`);
  }
}

function stopBGM() {
  if (audioContext.bgm) {
    fadeBGM(audioContext.bgm, 500);
    // 不要清除 currentBGM，以便重新開啟音樂時知道要播放什麼
  }
}

musicBtn.addEventListener('click', () => {
  audioContext.musicEnabled = !audioContext.musicEnabled;
  musicBtn.classList.toggle('active', audioContext.musicEnabled);
  if (!audioContext.musicEnabled) {
    stopBGM();
  } else {
    // 重新開啟音樂時，播放當前應該播放的 BGM
    if (audioContext.currentBGM) {
      playBGM(audioContext.currentBGM);
    } else {
      // 如果沒有記錄，播放 daily
      playBGM('daily');
    }
  }
  saveAudioSettings();
  playClickSE();
});

volumeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  volumePanel.classList.toggle('show');
  playClickSE();
});

document.addEventListener('click', (e) => {
  if (!volumeBtn.contains(e.target) && !volumePanel.contains(e.target)) {
    volumePanel.classList.remove('show');
  }
});

bgmVolumeSlider.addEventListener('input', (e) => {
  audioContext.bgmVolume = e.target.value / 100;
  if (audioContext.bgm) {
    audioContext.bgm.volume = audioContext.bgmVolume;
  }
  saveAudioSettings();
});

seVolumeSlider.addEventListener('input', (e) => {
  audioContext.seVolume = e.target.value / 100;
  saveAudioSettings();
  playClickSE();
});

function saveAudioSettings() {
  const settings = {
    musicEnabled: audioContext.musicEnabled,
    bgmVolume: audioContext.bgmVolume,
    seVolume: audioContext.seVolume
  };
  localStorage.setItem('myChoiceIsYou_audio', JSON.stringify(settings));
}

function loadAudioSettings() {
  try {
    const saved = localStorage.getItem('myChoiceIsYou_audio');
    if (saved) {
      const settings = JSON.parse(saved);
      audioContext.musicEnabled = settings.musicEnabled ?? true;
      audioContext.bgmVolume = settings.bgmVolume ?? 0.7;
      audioContext.seVolume = settings.seVolume ?? 0.8;
      musicBtn.classList.toggle('active', audioContext.musicEnabled);
      bgmVolumeSlider.value = audioContext.bgmVolume * 100;
      seVolumeSlider.value = audioContext.seVolume * 100;
    }
  } catch(e) {
    console.log('載入音樂設定失敗');
  }
}

settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'flex';
  playClickSE();
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
  playClickSE();
});

// 角色介紹按鈕
profileBtn.addEventListener('click', () => {
  profileModal.style.display = 'flex';
  playClickSE();
});

closeProfileBtn.addEventListener('click', () => {
  profileModal.style.display = 'none';
  playClickSE();
});

// 攻略提示按鈕
tipsBtn.addEventListener('click', () => {
  tipsModal.style.display = 'flex';
  playClickSE();
});

closeTipsBtn.addEventListener('click', () => {
  tipsModal.style.display = 'none';
  playClickSE();
});

// 打字速度控制
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const speed = parseInt(btn.dataset.speed);
    typewriterSpeed = speed;
    
    // 更新按鈕狀態
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 保存設定
    localStorage.setItem('myChoiceIsYou_textSpeed', speed);
    playClickSE();
  });
});

// 載入打字速度設定
function loadTextSpeed() {
  const saved = localStorage.getItem('myChoiceIsYou_textSpeed');
  if (saved !== null) {
    typewriterSpeed = parseInt(saved);
    document.querySelectorAll('.speed-btn').forEach(btn => {
      if (parseInt(btn.dataset.speed) === typewriterSpeed) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

backToCoverBtn.addEventListener('click', () => {
  showConfirm('🏠', '返回封面', '確定要返回封面嗎？\n未保存的進度將會遺失。', () => {
    settingsModal.style.display = 'none';
    modalEl.style.display = 'flex';
    nicknameInput.value = '';
    state.player = '努那';
    state.affection = 0;
    state.unlockedSecondDate = false;
    history.length = 0;
    setBg('classroom');
    setFace('cool');
    updateMeters();
    renderStatsHint();
    
    // 🎵 播放封面音樂
    playBGM('opening');
    
    playClickSE();
  });
});

let confirmCallback = null;

function showConfirm(icon, title, text, onConfirm) {
  confirmIcon.textContent = icon;
  confirmTitle.textContent = title;
  confirmText.textContent = text;
  confirmCallback = onConfirm;
  confirmModal.style.display = 'flex';
}

confirmOkBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
  if (confirmCallback) {
    confirmCallback();
    confirmCallback = null;
  }
});

confirmCancelBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
  confirmCallback = null;
  playClickSE();
});

// ====== 素材路徑 ======
const ASSETS = {
  bg: {
    classroom: "assets/bg_classroom.jpg",
    library: "assets/bg_library.jpg",
    hallway: "assets/bg_hallway.jpg",
    cinema: "assets/bg_cinema.jpg",
    cinemaInside: "assets/bg_cinema_inside.jpg",  // 新增：電影院內部（紅色座椅）
    parkNight: "assets/bg_park_night.jpg",
    parkConfess: "assets/bg_park_confess.jpg",
    playground: "assets/playground.jpg",      // 新增：操場
    rooftop: "assets/rooftop.jpg",            // 新增：天台
  },
  an: {
    normal: "assets/an_1_normal.jpg",
    cool: "assets/an_2_cool.jpg",
    smile: "assets/an_3_smile.jpg",
    blush: "assets/an_4_blush.jpg",
    sad: "assets/an_5_sad.jpg",
    surprised: "assets/an_6_surprised.jpg",
    serious: "assets/an_7_serious.jpg",
  },
  seong: {                                    // 新增：嚴成玹立繪
    normal: "assets/seong_normal.jpg",
    smile: "assets/seong_smile.jpg",
    playful: "assets/seong_playful.jpg",
  }
};

// ====== 統計 ======
const STATS_KEY = "myChoiceIsYou_stats_v1";

function loadStats(){
  try{
    const raw = localStorage.getItem(STATS_KEY);
    if(!raw) return { total:0, perfect:0, success:0, fail:0, perfectNames:[], successNames:[], failNames:[] };
    const obj = JSON.parse(raw);
    return {
      total: obj.total ?? 0,
      perfect: obj.perfect ?? 0,
      success: obj.success ?? 0,
      fail: obj.fail ?? 0,
      perfectNames: Array.isArray(obj.perfectNames) ? obj.perfectNames : [],
      successNames: Array.isArray(obj.successNames) ? obj.successNames : [],
      failNames: Array.isArray(obj.failNames) ? obj.failNames : [],
    };
  }catch{
    return { total:0, perfect:0, success:0, fail:0, perfectNames:[], successNames:[], failNames:[] };
  }
}

function saveStats(stats){
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function addUnique(arr, name){
  if(!name) return arr;
  if(arr.includes(name)) return arr;
  return [...arr, name];
}

function renderStatsHint(){
  const st = loadStats();
  statsHint.textContent = `目前本機統計：總遊玩 ${st.total} 次｜完美 ${st.perfect}｜成功 ${st.success}｜失敗 ${st.fail}`;
}

// ====== 遊戲狀態 ======
const state = {
  player: "努那",
  affection: 0,
  unlockedSecondDate: false,
  approachedActively: false,  // 新增：是否主動靠近過小安
  startTime: null,            // 📊 記錄遊戲開始時間
  metSeong: false,            // 📊 是否遇到嚴成玹
};

const history = [];
const THRESHOLD_ACCEPT = 10;       // 普通成功：10-15
const THRESHOLD_AN_CONFESS = 16;   // 大成功：16-21
const THRESHOLD_PERFECT = 22;      // 完美結局：≥22

// ====== 場景資料 ======
const NODES = {
  start: {
    id:"start",
    bg:"classroom",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`放學後的教室只剩風扇的聲音。\n你在收書包時，看到安乾皓還坐在位子上。\n他抬眼看你一眼，像是在等你先說話。`,
    choices: [
      { label:"（假裝自然）「你今天…好像很安靜。」", delta:0, next:"intro1" },
      { label:"（退一步）算了，先離開教室", delta:-1, next:"intro_leave" },
      { 
        label:"（靠近）「安乾皓，你等等有空嗎？」", 
        delta:+2,  // 從 +1 改為 +2（主動很重要）
        next:"intro1",
        onSelect: (s) => {
          s.approachedActively = true;  // 設定「主動靠近」標記
          console.log("✅ 標記：主動靠近小安");
        }
      },
    ]
  },
  intro_leave: {
    id:"intro_leave",
    bg:"classroom",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`你突然覺得有點累，選擇先離開。\n走到門口時，你聽見身後傳來一個聲音——`,
    choices: [
      { label:"回頭", delta:0, next:"intro_leave2" },
      { label:"不回頭（直接走）", delta:-1, next:"fail_early" },
      { label:"停一下再回頭", delta:0, next:"intro_leave2" },
    ]
  },
  intro_leave2: {
    id:"intro_leave2",
    bg:"classroom",
    face:"surprised",
    speaker:"安乾皓",
    text: (s)=>`「${s.player}。」\n他用你的暱稱叫住你。\n「你要走了？」`,
    choices: [
      { label:"「你如果不忙，我想約你。」", delta:+2, next:"ask_out_direct" },
      { label:"「沒事，我只是…突然累了。」", delta:-1, next:"intro_afterTired" },
      { label:"「嗯…其實我想找你聊一下。」", delta:+2, next:"intro1" },
    ]
  },
  intro_afterTired: {
    id:"intro_afterTired",
    bg:"classroom",
    face:"normal",
    speaker:"安乾皓",
    text: (s)=>`他看著你，沒有笑，但語氣放輕。\n「那就別硬撐。」\n「改天再說。」`,
    choices: [
      { label:"（收回）「好，我先走了。」", delta:-2, next:"fail_early" },
      { label:"（坦白）「我其實是緊張，不是累。」", delta:+2, next:"ask_out_direct" },
      { label:"（趁機）「那改天…你願意跟我去看電影嗎？」", delta:+1, next:"ask_out_direct" },
    ]
  },
  intro1: {
    id:"intro1",
    bg:"classroom",
    face:"normal",
    speaker:"安乾皓",
    text: (s)=>`他闔上筆記本，抬眼看你。\n「怎麼了？」\n你心跳很吵，但你知道——你要開始攻略他了。`,
    choices: [
      { label:"「你有沒有喜歡的電影類型？」", delta:+1, next:"movie_taste" },
      { label:"「算了，我是不是太突然？」", delta:-1, next:"shy_backoff" },
      { label:"「我想約你…看電影。」", delta:+1, next:"ask_out_direct" },
    ]
  },
  shy_backoff: {
    id:"shy_backoff",
    bg:"classroom",
    face:"cool",
    speaker:"安乾皓",
    text: (s)=>`他沉默幾秒，然後才開口：\n「有一點突然。」\n\n但他沒有站起來，也沒有離開。\n「不過…也不是不能聊聊。」`,
    choices: [
      { label:"（慌張）「對不起我太唐突了！」", delta:-2, next:"fail_early" },
      { label:"（溫和）「我只是想多認識你一點。」", delta:+2, next:"shy_get_closer" },
      { label:"（抓住機會）「那你週末有空嗎？我們去看電影？」", delta:+2, next:"shy_ask_movie" },
    ]
  },
  shy_ask_movie: {
    id:"shy_ask_movie",
    bg:"classroom",
    face:"surprised",
    speaker:"安乾皓",
    text: (s)=>`他看著你，眼神裡有一點意外。\n「看電影？」\n「……好。你想看哪一種？」`,
    choices: [
      { label:"「血腥恐怖片。」", delta:-2, next:"date1_cinema" },
      { label:"「懸疑／推理。」", delta:+2, next:"date1_cinema" },
      { label:"「浪漫喜劇。」", delta:+1, next:"date1_cinema" },
    ]
  },
  shy_get_closer: {
    id:"shy_get_closer",
    bg:"classroom",
    face:"normal",
    speaker:"安乾皓",
    text: (s)=>`「認識我？」\n他挑了挑眉。\n「那你想怎麼認識？」`,
    choices: [
      { label:"「從看電影開始？」", delta:+2, next:"shy_ask_movie" },
      { label:"「從…當朋友開始。」", delta:0, next:"shy_friend_route" },
      { label:"「我也不知道…」", delta:-1, next:"shy_ask_movie" },
    ]
  },
  shy_friend_route: {
    id:"shy_friend_route",
    bg:"classroom",
    face:"sad",
    speaker:"安乾皓",
    text: (s)=>`他點點頭。\n「朋友…嗯，可以。」\n\n但你總覺得，他的語氣有一點失望。`,
    choices: [
      { label:"（補救）「朋友也可以一起看電影對吧？」", delta:+2, next:"shy_ask_movie" },
      { label:"（就這樣）「那我先走了。」", delta:-2, next:"fail_early" },
      { label:"（試探）「或者…我們可以不只是朋友？」", delta:+3, next:"shy_ask_movie" },
    ]
  },
  movie_taste: {
    id:"movie_taste",
    bg:"classroom",
    face:"normal",
    speaker:"安乾皓",
    text: (s)=>`他想了想。\n「我不太看太吵的。」\n「偏向劇情、懸疑。」`,
    choices: [
      { label:"「那我找一部懸疑片，週末一起看？」", delta:+2, next:"movie_invite" },
      { label:"「我也是！我們改天一起去看吧。」", delta:+1, next:"movie_invite" },
      { label:"「喔…我比較喜歡浪漫喜劇。」", delta:0, next:"movie_invite" },
    ]
  },
  movie_invite: {
    id:"movie_invite",
    bg:"classroom",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`你深吸一口氣，決定開口邀請。\n「安乾皓，週末…要不要一起去看電影？」\n他看著你，沉默了幾秒。`,
    choices: [
      { label:"（補充）「我會選你喜歡的類型。」", delta:+1, next:"ask_out" },
      { label:"（等他回答）", delta:0, next:"ask_out" },
      { label:"（緊張）「如果你不方便也沒關係…」", delta:-1, next:"ask_out" },
    ]
  },
  ask_out: {
    id:"ask_out",
    bg:"classroom",
    face:"normal",
    speaker:"安乾皓",
    text: (s)=>`他終於開口。\n「……可以。」\n他頓了頓，又問：「你想看哪一種？」`,
    choices: [
      { label:"「懸疑／推理。」", delta:+2, next:"date1_cinema" },
      { label:"「浪漫喜劇。」", delta:+1, next:"date1_cinema" },
      { label:"「血腥恐怖片。」", delta:-2, next:"date1_cinema" },
    ]
  },
  ask_out_direct: {
    id:"ask_out_direct",
    bg:"classroom",
    face:"surprised",
    speaker:"安乾皓",
    text: (s)=>`你開口問出口的瞬間，整個世界像是按了靜音。\n他看著你，像在判斷你是不是認真。\n「你想看哪一種？」`,
    choices: [
      { label:"「懸疑／推理。」", delta:+2, next:"date1_cinema" },
      { label:"「浪漫喜劇。」", delta:+1, next:"date1_cinema" },
      { label:"「血腥恐怖片。」", delta:-2, next:"date1_cinema" },
    ]
  },
  date1_cinema: {
    id:"date1_cinema",
    bg:"cinema",
    face:"normal",
    speaker:"旁白",
    onEnter:(s)=>{
      s.unlockedSecondDate = s.affection >= 3;
    },
    text: (s)=>`週末，你們站在電影院售票口。\n這是你們第一次單獨出來。\n買完票後，他偏頭看你：\n「${s.player}，你緊張嗎？」`,
    choices: [
      { label:"「還好啊，我只是怕選錯電影你不喜歡。」", delta:+1, next:"date1_cinema_inside" },
      { label:"「我今天其實很累…」", delta:-1, next:"date1_cinema_inside" },
      { label:"「有一點…但我很想跟你待在一起。」", delta:+2, next:"date1_cinema_inside" },
    ]
  },
  date1_cinema_inside: {
    id:"date1_cinema_inside",
    bg:"cinemaInside",  // 改用紅色座椅的電影院內部
    face:"cool",
    speaker:"安乾皓",
    text: (s)=>`電影開始前，影廳很暗。\n他低聲說：\n「你的選擇沒錯。」\n「…至少今天沒錯。」\n\n你聽出他話裡的保留，但也感覺到他在給你機會。`,
    choices: [
      { label:"（輕鬆）「你喜歡這部片哪裡？」", delta:+1, next:"cinema_end_check" },
      { label:"（退縮）「我怕我太黏人了。」", delta:-1, next:"cinema_end_check" },
      { label:"（小聲）「那下次…也可以一起嗎？」", delta:+2, next:"cinema_end_check" },
    ]
  },
  
  // 電影結束檢查點：判斷是否觸發嚴成玹
  cinema_end_check: {
    id:"cinema_end_check",
    bg:"cinema",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`電影結束了。\n燈光亮起，你們緩緩起身。\n\n走出電影院...`,
    choices: [
      { 
        label:"（繼續）", 
        delta:0, 
        next: (s) => {
          // 好感度≥7 且選過「主動靠近」才觸發
          if (s.affection >= 7 && s.approachedActively) {
            return "seong_meet";
          } else {
            return "invite_secondDate";
          }
        }
      }
    ]
  },
  
  // ========== 嚴成玹簡單版場景 ==========
  seong_meet: {
    id:"seong_meet",
    bg:"cinema",  // 電影院大廳
    face:"smile",
    character: "seong",
    speaker:"嚴成玹",
    onEnter: (s) => {
      s.metSeong = true;  // 📊 記錄遇到嚴成玹
      console.log("📊 標記：遇到嚴成玹");
    },
    text: (s)=>`走出電影院，你們在大廳遇到一個男生。\n\n「欸！小安！」\n\n他笑得很開朗，走過來打招呼。\n\n「這位是...？」他看向你。`,
    choices: [
      { label:"（等小安介紹）", delta:0, next:"seong_ask" },
    ]
  },
  
  seong_ask: {
    id:"seong_ask",
    bg:"cinema",  // 電影院大廳
    face:"normal",
    speaker:"安乾皓",
    text: (s)=>`小安淡淡地說：「嚴成玹。我朋友。」\n\n然後看向你：「${s.player}。」\n\n嚴成玹眼睛一亮：「哦～你們在約會啊？」`,
    choices: [
      { label:"（尷尬）「只是一起看電影...」", delta:0, next:"seong_end" },
      { label:"（大方）「算是吧」", delta:+2, next:"seong_bonus" },
      { label:"（不說話）", delta:0, next:"seong_end" },
    ]
  },
  
  seong_bonus: {
    id:"seong_bonus",
    bg:"cinema",  // 電影院大廳
    face:"smile",
    character: "seong",
    speaker:"嚴成玹",
    text: (s)=>`嚴成玹笑得更開心了。\n\n「厲害！小安這傢伙終於開竅了！」\n\n他拍拍小安的肩膀。\n「好好珍惜喔～」\n\n【嚴成玹的鼓勵：+2 分】`,
    choices: [
      { label:"（繼續）", delta:0, next:"seong_end" },
    ]
  },
  
  seong_end: {
    id:"seong_end",
    bg:"cinema",  // 電影院大廳
    face:"smile",
    character: "seong",
    speaker:"嚴成玹",
    text: (s)=>`「好啦，我不打擾你們了。」\n\n嚴成玹揮揮手，轉身離開。\n\n「拜拜～」`,
    choices: [
      { label:"（繼續）", delta:0, next:"invite_secondDate" },
    ]
  },
  // ========== 嚴成玹場景結束 ==========
  
  invite_secondDate: {
    id:"invite_secondDate",
    bg:"cinema",
    face:"normal",
    speaker:"旁白",
    text: (s)=>{
      if(s.unlockedSecondDate){
        return `電影結束後，你們走出影廳。\n你感覺到——現在是你提出第二次約會的時機。\n你要怎麼開口？`;
      }
      return `電影結束後，你們走出影廳。\n氣氛沒有壞，但也沒有靠得很近。\n你猶豫：要不要再推進一步？`;
    },
    choices: [
      { label:"「等一下…要不要一起散步？」", delta:(state.unlockedSecondDate? +2 : +1), next:"date2_walk" },
      { label:"「謝謝你陪我，改天再約。」", delta:0, next:"library_encounter" },
      { label:"「我先回去了，我有點疲憊。」", delta:-1, next:"library_encounter" },
    ]
  },
  date2_walk: {
    id:"date2_walk",
    bg:"parkNight",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`夜裡的公園很安靜。\n你們並肩走著，路燈把影子拉得很長。\n他突然問：\n「你為什麼…想靠近我？」`,
    choices: [
      { label:"「我不知道，可能只是衝動。」", delta:-2, next:"date2_react" },
      { label:"「因為你讓我覺得安心。」", delta:+2, next:"date2_react" },
      { label:"「因為我想試試看…你會不會也喜歡我。」", delta:+2, next:"date2_react" },
    ]
  },
  date2_react: {
    id:"date2_react",
    bg:"parkNight",
    face:"serious",
    speaker:"安乾皓",
    text: (s)=>`他停下腳步。\n眼神像是要把你看穿。\n「那你現在…後悔嗎？」`,
    choices: [
      { label:"「有一點怕，但我不想退。」", delta:+1, next:"library_encounter" },
      { label:"「我想先離開一下…我需要冷靜。」", delta:-2, next:"library_encounter" },
      { label:"「不後悔。」", delta:+2, next:"library_encounter" },
    ]
  },
  library_encounter: {
    id:"library_encounter",
    bg:"library",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`週一午休，你在圖書館找參考書。\n轉角處，你看到安乾皓坐在窗邊看書。\n陽光灑在他身上，他專注的側臉…讓你心跳加速。`,
    choices: [
      { label:"（靠近）「在看什麼書？」", delta:+2, next:"library_talk" },
      { label:"（偷看一會）不打擾他好了", delta:0, next:"library_watch" },
      { label:"（避開）假裝沒看到", delta:-2, next:"library_avoid" },
    ]
  },
  library_talk: {
    id:"library_talk",
    bg:"library",
    face:"smile",
    speaker:"安乾皓",
    text: (s)=>`他抬頭，看到是你，嘴角微微上揚。\n「${s.player}。」\n他把書翻過來給你看——是一本推理小說。\n「上次看完電影，想找原著來看。」`,
    choices: [
      { label:"「你還記得那天！我也覺得很開心。」", delta:+2, next:"library_close" },
      { label:"「我可以坐你旁邊嗎？」", delta:+2, next:"library_sit" },
      { label:"「喔…那我不打擾你了。」", delta:-1, next:"library_close" },
    ]
  },
  library_sit: {
    id:"library_sit",
    bg:"library",
    face:"normal",
    speaker:"安乾皓",
    text: (s)=>`「可以。」\n他把旁邊的椅子拉出來一點。\n\n你們就這樣安靜地坐著，偶爾視線交會。\n他沒有趕你走，甚至…還把書分享給你看。\n\n【你注意到桌上還有幾本書...】`,
    choices: [
      { label:"（小聲）「謝謝你願意陪我。」", delta:+2, next:"library_close" },
      { label:"（拿起旁邊的推理小說翻閱）", delta:+2, next:"library_book_sync" },  // 🌟 隱藏加分
      { label:"（享受這個氛圍）", delta:+1, next:"library_close" },
    ]
  },
  
  // 隱藏加分：默契選書
  library_book_sync: {
    id:"library_book_sync",
    bg:"library",
    face:"smile",
    speaker:"安乾皓",
    text: (s)=>`你拿起桌上的另一本推理小說。\n\n小安注意到了，微微挑眉。\n\n「那本...不錯。」\n他的聲音很輕，但你聽得出來他有點意外。\n\n「你也喜歡這種類型？」\n\n【默契獎勵！+2 分】`,
    choices: [
      { label:"「對啊，我也喜歡推理」", delta:0, next:"library_close" },
    ]
  },
  
  library_watch: {
    id:"library_watch",
    bg:"library",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`你遠遠地看著他。\n他突然抬頭，和你的視線對上。\n你慌張地移開目光，臉有點燙。`,
    choices: [
      { label:"（過去打招呼）", delta:+1, next:"library_talk" },
      { label:"（快速離開）", delta:-1, next:"library_close" },
    ]
  },
  library_avoid: {
    id:"library_avoid",
    bg:"library",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`你選擇繞過他。\n但走到門口時，你聽到他叫住你。\n「${s.player}。」`,
    choices: [
      { label:"（回頭）「你看到我了？」", delta:+1, next:"library_talk" },
      { label:"（裝作沒聽到）繼續走", delta:-2, next:"fail_early" },
    ]
  },
  library_close: {
    id:"library_close",
    bg:"library",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`你們短暫地聊了幾句。\n他沒有多說什麼，但你感覺…距離又近了一點。`,
    choices: [
      { label:"（繼續）", delta:0, next:"gossip_encounter" },
    ]
  },

  // ========== 新增：聽到壞話場景 ==========
  
  gossip_encounter: {
    id:"gossip_encounter",
    bg:"hallway",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`離開圖書館後，你經過轉角。\n突然聽到有人在聊天——\n\n「欸你看，${s.player}最近一直纏著安乾皓耶。」\n「對啊超明顯，安會理他才怪。」`,
    choices: [
      { label:"（停下來繼續聽）", delta:0, next:"gossip_listen" },
      { label:"（直接走過去面對）", delta:+1, next:"gossip_confront" },
      { label:"（假裝沒聽到繼續走）", delta:+1, next:"gossip_ignore" },
      { label:"（繞路快速離開）", delta:-2, next:"gossip_escape" },
    ]
  },

  gossip_listen: {
    id:"gossip_listen",
    bg:"hallway",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`你停在轉角，忍不住繼續聽下去。\n\n「安乾皓那種人，怎麼可能看得上${s.player}？」\n「就是說啊，自作多情吧哈哈。」\n「而且聽說他們只是普通同學，${s.player}一廂情願而已。」\n\n你的手指緊緊握住書包帶，指節發白。`,
    choices: [
      { label:"（深呼吸，冷靜離開）", delta:+2, next:"gossip_mature" },
      { label:"（忍不住衝出去）", delta:-2, next:"gossip_confrontation" },
      { label:"（難過地逃走）", delta:-1, next:"gossip_escape" },
    ]
  },

  gossip_confront: {
    id:"gossip_confront",
    bg:"hallway",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`你決定直接走過去。\n那兩個同學看到你，臉色瞬間變了。\n空氣凝結。`,
    choices: [
      { label:"（平靜地）「我都聽到了，但我不在乎。」", delta:+2, next:"gossip_calm_response" },
      { label:"（質問）「你們憑什麼這樣說我？」", delta:-1, next:"gossip_confrontation" },
      { label:"（冷笑）「說夠了沒？」", delta:0, next:"gossip_sarcastic" },
    ]
  },

  gossip_ignore: {
    id:"gossip_ignore",
    bg:"hallway",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`你選擇假裝沒聽到，保持步伐繼續走。\n雖然心裡不太舒服，但你知道…\n不是所有事情都值得回應。\n\n你抬頭挺胸走過轉角——`,
    choices: [
      { label:"（繼續前進）", delta:+2, next:"gossip_aftermath_strong" },
    ]
  },

  gossip_escape: {
    id:"gossip_escape",
    bg:"hallway",
    face:"sad",
    speaker:"旁白",
    text: (s)=>`你心慌地選擇繞路離開。\n那些話像刺一樣扎在心上。\n「安會理他才怪…」「自作多情…」\n\n你越走越快，眼眶有點熱。`,
    choices: [
      { label:"（找地方冷靜）", delta:-2, next:"gossip_aftermath_hurt" },
    ]
  },

  gossip_mature: {
    id:"gossip_mature",
    bg:"hallway",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`你深呼吸，選擇不理會這些閒話。\n轉身離開時，你感覺到自己成長了一點。\n\n走到走廊盡頭，你突然看到——\n安乾皓就站在那裡。\n\n他…聽到了嗎？`,
    choices: [
      { label:"（走向他）「你在這裡？」", delta:+2, next:"gossip_an_saw_mature" },
      { label:"（點頭示意後離開）", delta:0, next:"gossip_aftermath_neutral" },
      { label:"（尷尬地避開）", delta:-1, next:"gossip_aftermath_neutral" },
    ]
  },

  gossip_confrontation: {
    id:"gossip_confrontation",
    bg:"hallway",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`你忍不住衝出去質問。\n「你們憑什麼在背後說我？！」\n\n那兩個人愣住，氣氛變得很僵。\n周圍的同學也停下腳步看著這一幕。\n\n正當場面越來越難看時——\n\n「夠了。」\n\n一個聲音從身後傳來。`,
    choices: [
      { label:"（回頭）", delta:0, next:"gossip_an_intervene" },
    ]
  },

  gossip_calm_response: {
    id:"gossip_calm_response",
    bg:"hallway",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`你平靜地看著他們。\n「我都聽到了。但我不會跟你們計較。」\n\n那兩個人尷尬地低下頭。\n你轉身準備離開時——\n\n「等等。」\n\n安乾皓的聲音從身後傳來。`,
    choices: [
      { label:"（回頭）", delta:+2, next:"gossip_an_defend" },
    ]
  },

  gossip_sarcastic: {
    id:"gossip_sarcastic",
    bg:"hallway",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`你冷笑一聲。\n「說夠了沒？」\n\n那兩個人被你的氣勢嚇到，不敢說話。\n氣氛有點尷尬。`,
    choices: [
      { label:"（轉身離開）", delta:0, next:"gossip_aftermath_neutral" },
      { label:"（繼續嗆）「下次當面說。」", delta:-1, next:"gossip_aftermath_aggressive" },
    ]
  },

  gossip_an_saw_mature: {
    id:"gossip_an_saw_mature",
    bg:"hallway",
    face:"serious",
    speaker:"安乾皓",
    text: (s)=>`他看著你，眼神很深。\n「……你聽到了？」\n\n你點點頭。\n\n他沉默了幾秒，然後說：\n「那些話…別放在心上。」\n「你比他們想的，要堅強很多。」`,
    choices: [
      { label:"「謝謝你。」", delta:+3, next:"gossip_aftermath_growth" },
      { label:"「你…在乎我的感受？」", delta:+2, next:"gossip_an_care" },
      { label:"「你也覺得他們說得對嗎？」", delta:-2, next:"gossip_an_misunderstand" },
    ]
  },

  gossip_an_intervene: {
    id:"gossip_an_intervene",
    bg:"hallway",
    face:"serious",
    speaker:"安乾皓",
    text: (s)=>`安乾皓站在你身後。\n他看向那兩個同學，語氣很冷：\n「夠了。」\n\n「我不管你們說什麼，但別再讓我聽到。」\n\n說完，他看向你：\n「${s.player}，走吧。」`,
    choices: [
      { label:"（跟著他離開）", delta:+2, next:"gossip_aftermath_protected" },
      { label:"（還想說些什麼）", delta:-1, next:"gossip_aftermath_stubborn" },
    ]
  },

  gossip_an_defend: {
    id:"gossip_an_defend",
    bg:"hallway",
    face:"cool",
    speaker:"安乾皓",
    text: (s)=>`安乾皓走到你旁邊。\n他看著那兩個人，語氣平淡但帶著壓迫感：\n\n「${s.player}跟我的事，不需要你們操心。」\n\n那兩個人臉色發白，快速離開了。\n\n他轉向你：「走吧。」`,
    choices: [
      { label:"（感動）「謝謝你幫我。」", delta:+3, next:"gossip_aftermath_defended" },
      { label:"（尷尬）「你都聽到了…」", delta:+1, next:"gossip_aftermath_embarrassed" },
    ]
  },

  gossip_an_care: {
    id:"gossip_an_care",
    bg:"hallway",
    face:"blush",
    speaker:"安乾皓",
    text: (s)=>`他沉默了幾秒，耳根有點紅。\n「……算是吧。」\n\n他別過臉。\n「我不喜歡…看你被人這樣說。」\n\n說完，他快步離開了。\n但你看到，他的步伐有點慌亂。`,
    choices: [
      { label:"（心跳加速）", delta:+3, next:"gossip_aftermath_growth" },
    ]
  },

  gossip_an_misunderstand: {
    id:"gossip_an_misunderstand",
    bg:"hallway",
    face:"sad",
    speaker:"安乾皓",
    text: (s)=>`他愣了一下，表情有些受傷。\n「……你真的這樣想？」\n\n停頓。\n\n「算了。」\n他轉身離開了。`,
    choices: [
      { label:"（後悔）", delta:-3, next:"gossip_aftermath_regret" },
    ]
  },

  gossip_aftermath_strong: {
    id:"gossip_aftermath_strong",
    bg:"classroom",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`這件事過後，你發現自己變得更堅強了。\n那些閒話…已經傷不了你。\n\n而且，你注意到——\n安乾皓看你的眼神，似乎多了一點…欣賞。`,
    choices: [
      { label:"（繼續）", delta:+2, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_hurt: {
    id:"gossip_aftermath_hurt",
    bg:"classroom",
    face:"sad",
    speaker:"旁白",
    text: (s)=>`你找了個地方躲起來。\n那些話還在腦海裡迴盪。\n「自作多情…」\n\n也許…他們說得對？`,
    choices: [
      { label:"（繼續）", delta:-2, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_neutral: {
    id:"gossip_aftermath_neutral",
    bg:"classroom",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`這件事過後，你心情有點複雜。\n但生活還是要繼續。`,
    choices: [
      { label:"（繼續）", delta:0, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_growth: {
    id:"gossip_aftermath_growth",
    bg:"classroom",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`這件事讓你對自己、對安乾皓，都有了更深的認識。\n你感覺到…你們之間的距離，又近了一些。`,
    choices: [
      { label:"（繼續）", delta:+2, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_protected: {
    id:"gossip_aftermath_protected",
    bg:"hallway",
    face:"normal",
    speaker:"旁白",
    text: (s)=>`你跟著安乾皓離開。\n走了一段路，他才開口：\n「別在意那些人說的話。」\n\n你感受到他的溫柔。`,
    choices: [
      { label:"（繼續）", delta:+2, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_defended: {
    id:"gossip_aftermath_defended",
    bg:"hallway",
    face:"blush",
    speaker:"安乾皓",
    text: (s)=>`他聽到你的感謝，耳根紅了。\n「沒什麼。」\n「只是…不想看你被欺負。」\n\n說完，他快步走開了。`,
    choices: [
      { label:"（心動）", delta:+3, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_embarrassed: {
    id:"gossip_aftermath_embarrassed",
    bg:"hallway",
    face:"cool",
    speaker:"安乾皓",
    text: (s)=>`「嗯。」\n他沒有多說什麼。\n「但那不重要。」`,
    choices: [
      { label:"（繼續）", delta:+1, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_stubborn: {
    id:"gossip_aftermath_stubborn",
    bg:"hallway",
    face:"cool",
    speaker:"安乾皓",
    text: (s)=>`他回頭看你，皺起眉。\n「${s.player}，別鬧了。」\n\n語氣有點無奈。`,
    choices: [
      { label:"（乖乖跟上）", delta:0, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_aggressive: {
    id:"gossip_aftermath_aggressive",
    bg:"classroom",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`你的強硬態度讓場面變得更僵。\n事後，你感覺到其他同學看你的眼光…變了。`,
    choices: [
      { label:"（繼續）", delta:-1, next:"hallway_moment" },
    ]
  },

  gossip_aftermath_regret: {
    id:"gossip_aftermath_regret",
    bg:"classroom",
    face:"sad",
    speaker:"旁白",
    text: (s)=>`你後悔剛才說的話。\n但已經來不及了。\n安乾皓的表情…讓你心痛。`,
    choices: [
      { label:"（繼續）", delta:-3, next:"hallway_moment" },
    ]
  },

  // ========== 以下場景繼續原本的流程 ==========

  hallway_moment: {
    id:"hallway_moment",
    bg:"hallway",
    face:"cool",
    speaker:"旁白",
    text: (s)=>`放學後，走廊上只剩你們兩個。\n你正要離開，他突然叫住你。\n「${s.player}。」`,
    choices: [
      { label:"（回頭）「怎麼了？」", delta:+1, next:"hallway_talk" },
      { label:"（停下腳步）等他繼續說", delta:+1, next:"hallway_talk" },
      { label:"（裝作沒聽到）繼續走", delta:-2, next:"fail_early" },
    ]
  },
  hallway_talk: {
    id:"hallway_talk",
    bg:"hallway",
    face:"serious",
    speaker:"安乾皓",
    text: (s)=>`他走近幾步。\n夕陽從窗戶斜射進來，你們之間的距離…很近。\n\n「最近…你好像常來找我。」\n他的語氣聽不出情緒。`,
    choices: [
      { label:"（誠實）「因為我想跟你在一起。」", delta:+3, next:"hallway_reaction" },
      { label:"（試探）「你不喜歡嗎？」", delta:+1, next:"hallway_reaction" },
      { label:"（退縮）「抱歉，我是不是太煩了？」", delta:-2, next:"hallway_reaction" },
    ]
  },
 hallway_reaction: {
  id:"hallway_reaction",
  bg:"hallway",
  face:"blush",
  speaker:"安乾皓",
  text: (s)=>{
    if(s.affection >= 6) {
      return `他沉默了很久。\n「我沒說…我不喜歡。」\n\n說完，他就轉身離開了。\n但你看到，他的耳根紅了。`;
    }
    return `「沒有。」\n他的回答很簡短。\n「只是…有點意外。」`;
  },
  choices: [
    { label:"（心跳加速）追上去", delta:+2, next:"friend_advice" },
    { label:"（給彼此空間）改天再說", delta:+1, next:"friend_advice" },
    { label:"（猶豫）算了，我不懂他的意思", delta:-1, next:"friend_advice" },
  ]
},

friend_advice: {
  id:"friend_advice",
  bg:"classroom",
  face:"normal",
  speaker:"旁白",
  text: (s)=>`晚上，你的朋友傳訊息給你。\n「你跟安乾皓到底怎樣了？全校都在看你們。」\n\n你突然意識到——\n再不表白，可能就來不及了。`,
  choices: [
    { label:"（下定決心）我要跟他說清楚", delta:+2, next:"confess_courage" },
    { label:"（再等等）我還沒準備好", delta:0, next:"confess_courage" },
    { label:"（逃避）算了，維持現狀就好", delta:-2, next:"confess_courage" },
  ]
},

// 告白前的勇氣選擇
confess_courage: {
  id:"confess_courage",
  bg:"parkNight",
  face:"normal",
  speaker:"旁白",
  text: (s)=>`幾天後的夜晚。\n你站在約定的地點，等著他到來。\n\n你的手心有點出汗。\n心跳得很快。\n\n「你準備好了嗎？」\n你問自己。`,
  choices: [
    { label:"（深呼吸）我準備好了", delta:+2, next:"to_confess" },  // 🌟 勇氣獎勵
    { label:"「有點緊張...」", delta:+1, next:"to_confess" },
    { label:"「我不確定...」", delta:0, next:"to_confess" },
  ]
},

to_confess: {
  id:"to_confess",
  bg:"parkConfess",
  face:"normal",
  speaker:"旁白",
  text: (s)=>`幾天後，你約他到夜裡的樹道。\n你知道，終點到了。\n這一次，你要把話說清楚。\n（你目前好感度：${s.affection}）`,
  choices: [
    { label:"（直接告白）「安乾皓，我喜歡你。」", delta:0, next:"confess_resolve" },
    { label:"（試探）「如果我說…我很在意你呢？」", delta:+1, next:"confess_resolve" },
    { label:"（退縮）「算了…當我沒說。」", delta:-2, next:"confess_resolve" },
  ]
},

confess_resolve: {
  id:"confess_resolve",
  bg:"parkConfess",
  face:"serious",
  speaker:"安乾皓",
  text: (s)=>`你話出口後，空氣像凝住。\n他看著你，沒有立刻回答。\n你聽見自己的心跳。\n他終於開口——`,
  choices: [
    { label:"（等他回答）", delta:0, next:"ending_router" },
    { label:"（補一句）「我不是一時衝動。」", delta:+1, next:"ending_router" },
    { label:"（硬撐）「你拒絕也沒關係。」", delta:-1, next:"ending_router" },
  ]
},

ending_router: {
  id:"ending_router",
  bg:"parkConfess",
  face:"normal",
  speaker:"旁白",
  text: (s)=>`……`,
  choices: [
    { label:"（繼續）", delta:0, next:(s)=>{
      if(s.affection >= THRESHOLD_PERFECT) return "end_perfect";      // ≥22 完美
      if(s.affection >= THRESHOLD_AN_CONFESS) return "end_an_confess"; // 16-21 大成功
      if(s.affection >= THRESHOLD_ACCEPT) return "end_success";        // 10-15 普通成功
      return "end_fail";                                               // <10 失敗
    }},
  ]
},

// 完美結局（好感度 ≥ 22）
end_perfect: {
  id:"end_perfect",
  bg:"parkConfess",
  face:"smile",
  speaker:"安乾皓",
  onEnter: (s) => {
    // 角色移到中間
    charImg.classList.add('confess-center');
  },
  text: (s)=>`他沒有像往常一樣沉默很久。\n這次，他很快就開口了。\n\n「${s.player}...」\n\n他看著你，眼神比平時更溫柔。\n\n「其實...我一直在等。」\n「等你來找我說話。」\n「等你約我出來。」\n「等你...告白。」\n\n風吹過，他的髮絲輕輕飄動。\n\n「因為...」\n他深吸一口氣。\n\n「我不太會表達。」\n「但從很早以前，我就知道了。」\n\n他伸出手，輕輕握住你的手指。\n\n「我喜歡你。」\n「不是今天才開始的。」\n\n「如果可以...」\n「我想一直陪著你。」\n\n他的手很溫暖。`,
  choices: [
    { label:"【🏆 完美結局！】查看統計", delta:0, next:"stats_perfect" },
    { label:"重新開始", delta:0, next:"restart" },
    { label:"結束", delta:0, next:"close" },
  ]
},

end_an_confess: {
  id:"end_an_confess",
  bg:"parkConfess",
  face:"smile",
  speaker:"安乾皓",
  onEnter: (s) => {
    // 角色移到中間
    charImg.classList.add('confess-center');
  },
  text: (s)=>`「${s.player}。」\n他叫你的暱稱，聲音比平常更低。\n「其實我也一直在等你。」\n\n他往前一步。\n「我喜歡你。」\n「不是今天才開始。」`,
  choices: [
    { label:"【恭喜你成功攻略】查看統計", delta:0, next:"stats_success" },
    { label:"重新開始", delta:0, next:"restart" },
    { label:"結束", delta:0, next:"close" },
  ]
},

end_success: {
  id:"end_success",
  bg:"parkConfess",
  face:"blush",
  speaker:"安乾皓",
  onEnter: (s) => {
    // 角色移到中間
    charImg.classList.add('confess-center');
  },
  text: (s)=>`他沉默很久，才像是下定決心。\n「…好。」\n\n「我不太會說甜言蜜語。」\n「但我想跟你試試看。」`,
  choices: [
    { label:"【恭喜你成功攻略】查看統計", delta:0, next:"stats_success" },
    { label:"重新開始", delta:0, next:"restart" },
    { label:"結束", delta:0, next:"close" },
  ]
},

end_fail: {
  id:"end_fail",
  bg:"parkConfess",
  face:"sad",
  speaker:"安乾皓",
  text: (s)=>`他避開你的視線。\n「${s.player}…對不起。」\n「我可能…還沒辦法。」\n\n風很冷，你的手指也一樣冷。`,
  choices: [
    { label:"【你沒有成功攻略，小男孩的心總是捉摸不定～～】查看統計", delta:0, next:"stats_fail" },
    { label:"重新開始", delta:0, next:"restart" },
    { label:"結束", delta:0, next:"close" },
  ]
},

// 完美結局統計頁面
stats_perfect: {
  id:"stats_perfect",
  bg:"parkConfess",
  face:"smile",
  speaker:"旁白",
  onEnter:(s)=>recordEnding('perfect'),
  text:(s)=>makeStatsText('perfect'),
  choices: [
    { label:"重新開始", delta:0, next:"restart" },
    { label:"結束", delta:0, next:"close" },
  ]
},

stats_success: {
  id:"stats_success",
  bg:"parkConfess",
  face:"smile",
  speaker:"旁白",
  onEnter:(s)=>recordEnding(true),
  text:(s)=>makeStatsText(true),
  choices: [
    { label:"重新開始", delta:0, next:"restart" },
    { label:"結束", delta:0, next:"close" },
  ]
},

stats_fail: {
  id:"stats_fail",
  bg:"parkConfess",
  face:"cool",
  speaker:"旁白",
  onEnter:(s)=>recordEnding(false),
  text:(s)=>makeStatsText(false),
  choices: [
    { label:"重新開始", delta:0, next:"restart" },
    { label:"結束", delta:0, next:"close" },
  ]
},

restart: {
  id:"restart",
  bg:"classroom",
  face:"normal",  // 改為 normal（直視）
  speaker:"旁白",
  onEnter:(s)=>{
    s.affection = 0;
    s.unlockedSecondDate = false;
    s.approachedActively = false;  // 重置標記
    history.length = 0;
    // 角色移到中間
    charImg.classList.add('confess-center');
  },
  text:(s)=>`重新開始。\n這一次，你會做出不一樣的選擇嗎？`,
  choices: [
    { label:"開始故事", delta:0, next:"start" },
    { label:"回到暱稱輸入", delta:0, next:"back_to_modal" },
    { label:"結束", delta:0, next:"close" },
  ]
},

back_to_modal: {
  id:"back_to_modal",
  bg:"classroom",
  face:"cool",
  speaker:"旁白",
  onEnter:()=> {
    modalEl.style.display = "flex";
    renderStatsHint();
    history.length = 0;
  },
  text:()=>``,
  choices:[]
},

close: {
  id:"close",
  bg:"parkConfess",
  face:"smile",
  speaker:"旁白",
  text: ()=>`你可以直接關掉頁面，或重新整理再玩一次。`,
  choices: [
    { label:"重新開始", delta:0, next:"restart" },
    { label:"回到暱稱輸入", delta:0, next:"back_to_modal" },
    { label:"（留在這裡）", delta:0, next:"close" },
  ]
},

fail_early: {
  id:"fail_early",
  bg:"classroom",
  face:"cool",
  speaker:"旁白",
  text:(s)=>`你選擇直接離開。\n攻略在開始前就結束了。\n\n（你沒有成功攻略）`,
  choices: [
    { label:"查看統計", delta:0, next:"stats_fail" },
    { label:"重新開始", delta:0, next:"restart" },
    { label:"回到暱稱輸入", delta:0, next:"back_to_modal" },
  ]
},
};

// ====== UI Render ======
function setBg(key){
  const src = ASSETS.bg[key] || ASSETS.bg.classroom;
  bgEl.style.backgroundImage = `url("${src}")`;
}

function setFace(key, character = 'an'){
  // 支援切換不同角色：'an'（小安）或 'seong'（嚴成玹）
  const characterAssets = ASSETS[character] || ASSETS.an;
  const src = characterAssets[key] || characterAssets.normal || ASSETS.an.normal;
  charImg.src = src;
  
  // 移除所有表情 class
  charImg.className = 'character';
  
  // 根據表情添加特殊 class
  if (key === 'blush') {
    charImg.classList.add('face-blush');
  } else if (key === 'serious') {
    charImg.classList.add('face-serious');
  }
  
  // 儲存當前角色（用於後續判斷）
  charImg.dataset.currentCharacter = character;
}

function setSpeaker(name){
  speakerEl.textContent = name;
}

function updateMeters() {
  playerNameEl.textContent = state.player;
  affectionEl.textContent = state.affection;
}

// ====== 統計相關 ======
function recordEnding(result) {
  const stats = loadStats();
  stats.total++;
  if (result === 'perfect') {
    stats.perfect++;
    stats.perfectNames = addUnique(stats.perfectNames, state.player);
  } else if (result === true) {
    stats.success++;
    stats.successNames = addUnique(stats.successNames, state.player);
  } else {
    stats.fail++;
    stats.failNames = addUnique(stats.failNames, state.player);
  }
  saveStats(stats);
  
  // 📊 上傳數據到 Google Sheets
  uploadToGoogleSheets(result);
}

// 📊 上傳數據到 Google Sheets
function uploadToGoogleSheets(result) {
  // ⚠️ 請將下面的 URL 替換成你的 Google Apps Script 網頁應用程式 URL
  const SCRIPT_URL = 'https://https://script.google.com/macros/s/AKfycbzlehpI22W4yaz2VMAG0UDMYubw4XRGFtjKNF_HNmY-kyrmITfR_Gak9bP-fja1hhZifw/execscript.google.com/macros/s/AKfycbzlehpI22W4yaz2VMAG0UDMYubw4XRGFtjKNF_HNmY-kyrmITfR_Gak9bP-fja1hhZifw/exec';
  
  // 如果還沒設定 URL，就不上傳
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    console.log('📊 未設定 Google Sheets URL，跳過數據上傳');
    return;
  }
  
  // 計算遊玩時長（如果有記錄開始時間）
  const playTime = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
  
  // 判斷結局類型
  let endingType = '';
  if (result === 'perfect') {
    endingType = '完美結局';
  } else if (result === true) {
    endingType = '大成功/普通成功';
  } else {
    endingType = '失敗';
  }
  
  // 準備要上傳的數據
  const data = {
    playerName: state.player || '匿名玩家',
    endingType: endingType,
    finalAffection: state.affection,
    metSeong: state.metSeong || false,  // 是否遇到嚴成玹
    playTime: playTime
  };
  
  // 上傳到 Google Sheets
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',  // 重要：避免 CORS 錯誤
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(() => {
    console.log('📊 數據已上傳到 Google Sheets');
  })
  .catch(error => {
    console.error('📊 上傳失敗:', error);
    // 失敗也沒關係，不影響遊戲體驗
  });
}

function makeStatsText(result) {
  const stats = loadStats();
  
  // 結局標題和差異說明
  let resultTitle = "";
  let endingExplain = "";
  
  if (result === 'perfect') {
    // 完美結局
    resultTitle = "🏆✨ 完美結局 ✨🏆";
    endingExplain = `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🌟 恭喜達成最完美的結局！\n` +
      `好感度：${state.affection} 分（需要 ≥ ${THRESHOLD_PERFECT}）\n\n` +
      `💕 劇情內容：\n` +
      `小安「主動」表白，而且非常深情！\n` +
      `他說：「其實...我一直在等你來找我」\n` +
      `「我喜歡你。不是今天才開始的」\n` +
      `還會握住你的手指，說想一直陪著你。\n\n` +
      `✨ 這是需要幾乎全部選對才能達成的特殊結局！\n` +
      `代表你和小安的感情已經非常深厚～\n`;
  } else if (result === true) {
    // 大成功/普通成功
    if (state.affection >= THRESHOLD_AN_CONFESS) {
      // 大成功
      resultTitle = "🌟 大成功結局";
      endingExplain = `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💖 恭喜成功攻略！\n` +
        `好感度：${state.affection} 分（需要 ≥ ${THRESHOLD_AN_CONFESS}）\n\n` +
        `💬 劇情內容：\n` +
        `小安會說：「其實我也一直在等你」\n` +
        `然後告白：「我喜歡你。不是今天才開始」\n\n` +
        `😊 小安主動表達了喜歡，感情確定！\n` +
        `但沒有完美結局那麼深情和甜蜜。\n\n` +
        `💡 想看完美結局？好感度達到 ${THRESHOLD_PERFECT} 分即可！\n`;
    } else {
      // 普通成功
      resultTitle = "✨ 普通成功結局";
      endingExplain = `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
        `😊 成功攻略了！\n` +
        `好感度：${state.affection} 分（需要 ≥ ${THRESHOLD_ACCEPT}）\n\n` +
        `💬 劇情內容：\n` +
        `小安沉默很久後說：「…好」\n` +
        `「我不太會說甜言蜜語，但我想跟你試試看」\n\n` +
        `🙈 小安接受了告白，但比較被動和猶豫。\n` +
        `感情還不夠深，沒有主動表白。\n\n` +
        `💡 想看更甜的結局？好感度達到 ${THRESHOLD_AN_CONFESS} 分以上！\n`;
    }
  } else {
    // 失敗結局
    resultTitle = "💔 失敗結局";
    endingExplain = `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `😢 很遺憾沒有成功...\n` +
      `好感度：${state.affection} 分（需要 ≥ ${THRESHOLD_ACCEPT}）\n\n` +
      `💬 劇情內容：\n` +
      `小安避開視線說：「對不起...我可能還沒辦法」\n` +
      `風很冷，你的手指也一樣冷。\n\n` +
      `💔 告白被拒絕了，關係停留在朋友階段。\n\n` +
      `💡 攻略提示：\n` +
      `• 多選擇安靜、深入的互動選項\n` +
      `• 尊重他的個人空間，別太強勢\n` +
      `• 用行動勝過言語，展現真誠\n` +
      `• 注意細節和他的情緒反應\n`;
  }
  
  return `【${resultTitle}】` +
    endingExplain +
    `\n📊 統計資料（點擊對話框可跳過動畫）\n` +
    `━━━━━━━━━━━━━━\n` +
    `總遊玩次數：${stats.total}\n` +
    `🏆 完美結局：${stats.perfect} 次\n` +
    `✨ 大成功：${stats.success} 次\n` +
    `💔 失敗：${stats.fail} 次\n\n` +
    `🏆 完美名單：\n${stats.perfectNames.join(', ') || '（無）'}\n\n` +
    `✨ 成功名單：\n${stats.successNames.join(', ') || '（無）'}\n\n` +
    `💔 失敗名單：\n${stats.failNames.join(', ') || '（無）'}`;
}

// ====== 打字機效果系統 ======
let typewriterInterval = null;
let isTyping = false;
let currentText = '';
let typewriterSpeed = 50; // 每個字的間隔（毫秒）
let canSkip = true; // 是否允許跳過打字效果

function stopTypewriter() {
  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
  isTyping = false;
}

function typeWriter(text, callback) {
  stopTypewriter(); // 停止之前的打字效果
  
  currentText = text;
  textEl.textContent = '';
  isTyping = true;
  
  let index = 0;
  
  typewriterInterval = setInterval(() => {
    if (index < text.length) {
      textEl.textContent += text.charAt(index);
      index++;
      
      // 播放打字音效（每3個字一次，避免太吵）
      if (index % 3 === 0) {
        playClickSE();
      }
    } else {
      stopTypewriter();
      if (callback) callback();
    }
  }, typewriterSpeed);
}

function skipTypewriter() {
  if (isTyping && canSkip) {
    stopTypewriter();
    textEl.textContent = currentText;
  }
}

// 點擊對話框跳過打字效果
textEl.addEventListener('click', () => {
  skipTypewriter();
});

// ====== 遊戲核心邏輯（含返回功能 + 打字機效果）======
let currentNodeId = 'start';

function renderNode(nodeId) {
  const node = NODES[nodeId];
  if (!node) {
    console.error('找不到節點:', nodeId);
    return;
  }

  setBg(node.bg);
  
  // 支援切換角色：如果 node.character 存在，使用指定角色，否則預設為小安
  const character = node.character || 'an';
  setFace(node.face, character);
  
  setSpeaker(node.speaker);
  
  // 移除告白場景的特殊 class（除非是告白結局）
  if (nodeId !== 'end_perfect' && nodeId !== 'end_an_confess' && nodeId !== 'end_success') {
    charImg.classList.remove('confess-center');
  }
  
  // 先檢查是否有特殊節點 BGM（優先級更高）
  const hasSpecialBGM = (
    nodeId === 'end_perfect' ||
    nodeId === 'stats_perfect' ||
    nodeId === 'end_an_confess' || 
    nodeId === 'end_success' || 
    nodeId === 'stats_success' ||
    nodeId === 'end_fail' || 
    nodeId === 'stats_fail' ||
    nodeId.includes('gossip_confrontation') || 
    nodeId.includes('gossip_an_intervene')
  );
  
  console.log(`🎵 renderNode 音樂檢查: nodeId="${nodeId}"`);
  console.log(`   hasSpecialBGM: ${hasSpecialBGM}`);
  console.log(`   node.bg: ${node.bg}`);
  
  // 如果沒有特殊 BGM，才播放場景 BGM
  if (!hasSpecialBGM) {
    console.log(`   → 播放場景 BGM`);
    playBGMByBackground(node.bg);
  } else {
    console.log(`   → 跳過場景 BGM，等待特殊 BGM`);
  }
  
  // 播放特殊節點 BGM（會覆蓋場景 BGM）
  playSpecialBGM(nodeId);
  
  // onEnter 放在最後執行，避免被 setFace 覆蓋
  if (node.onEnter) {
    node.onEnter(state);
  }

  const textContent = typeof node.text === 'function' ? node.text(state) : node.text;
  
  // 使用打字機效果顯示文字
  typeWriter(textContent, () => {
    // 打字完成後的回調（可以在這裡做其他事）
  });

  // 清空並重建選項
  choicesEl.innerHTML = '';
  
  // 處理動態選項（用於支持choices可以是函數的情況）
  let choicesArray = typeof node.choices === 'function' ? node.choices(state) : node.choices;
  
  // 🎲 隨機排序選項（Fisher-Yates 洗牌算法）
  // 注意：只隨機排序遊戲選擇，不隨機排序單一的「繼續」按鈕
  if (choicesArray.length > 1 && !choicesArray[0].label.includes("繼續")) {
    choicesArray = shuffleArray([...choicesArray]);
  }
  
  // 暫時隱藏選項，等打字完成後再顯示（可選）
  choicesEl.style.opacity = '0';
  setTimeout(() => {
    choicesEl.style.opacity = '1';
  }, 300);
  
  // 遊戲選項
  choicesArray.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.label;
    btn.addEventListener('click', () => handleChoice(choice));
    choicesEl.appendChild(btn);
  });

  // 控制左上角返回按鈕的顯示/隱藏
  const backButton = document.getElementById('backButton');
  const noBackNodes = ['start', 'back_to_modal', 'close', 'stats_perfect', 'stats_success', 'stats_fail', 'restart'];
  
  if (backButton) {
    if (history.length > 0 && !noBackNodes.includes(nodeId)) {
      backButton.style.display = 'flex';
    } else {
      backButton.style.display = 'none';
    }
  }

  updateMeters();
}

// 🎲 Fisher-Yates 洗牌算法（隨機排序）
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 返回上一步
function goBack() {
  if (history.length === 0) return;
  
  playClickSE();
  
  // 取出上一個狀態
  const lastState = history.pop();
  
  // 恢復狀態
  state.affection = lastState.affection;
  currentNodeId = lastState.nodeId;
  
  // 重新渲染
  renderNode(currentNodeId);
}

function handleChoice(choice) {
  playClickSE();

  // 儲存當前狀態到歷史（在改變之前）
  history.push({
    affection: state.affection,
    nodeId: currentNodeId
  });

  // 如果選項有 onSelect 回調，先執行（用於設定標記等）
  if (choice.onSelect) {
    choice.onSelect(state);
  }

  // 更新好感度
  const delta = choice.delta;
  state.affection += delta;

  // 播放音效
  if (delta > 0) {
    playAffectionUpSE();
  } else if (delta < 0) {
    playAffectionDownSE();
  }

  // 決定下一個節點
  let nextId;
  if (typeof choice.next === 'function') {
    nextId = choice.next(state);
  } else {
    nextId = choice.next;
  }

  currentNodeId = nextId;
  renderNode(nextId);
}

// ====== 初始化 ======

// 備用方案：用戶點擊輸入框時嘗試播放音樂（如果自動播放失敗）
let musicStartAttempted = false;
nicknameInput.addEventListener('focus', () => {
  if (!musicStartAttempted || !audioContext.bgm || audioContext.bgm.paused) {
    console.log('🎵 用戶點擊輸入框，嘗試播放音樂...');
    playBGM('daily');
    musicStartAttempted = true;
  }
});

startBtn.addEventListener('click', () => {
  const name = nicknameInput.value.trim();
  if (name) {
    state.player = name;
  }
  modalEl.style.display = 'none';
  currentNodeId = 'start';
  state.affection = 0;
  state.unlockedSecondDate = false;
  state.approachedActively = false;
  state.metSeong = false;
  state.startTime = Date.now();  // 📊 記錄開始時間
  history.length = 0;
  
  // renderNode 會自動處理音樂，不需要在這裡調用
  renderNode('start');
  playClickSE();
});

// 左上角返回按鈕事件監聽
const backButton = document.getElementById('backButton');
if (backButton) {
  backButton.addEventListener('click', () => goBack());
}

// 頁面載入時初始化
console.log('📋 初始化開始...');
loadAudioSettings();
console.log('🎵 音樂設定載入完成:', {
  musicEnabled: audioContext.musicEnabled,
  bgmVolume: audioContext.bgmVolume,
  seVolume: audioContext.seVolume
});
loadTextSpeed();
renderStatsHint();

// 立即嘗試播放音樂（不使用 setTimeout）
console.log('🎵 立即嘗試播放音樂...');
console.log('   musicEnabled:', audioContext.musicEnabled);
console.log('   bgmVolume:', audioContext.bgmVolume);

if (!audioContext.musicEnabled) {
  console.warn('⚠️ 音樂被關閉了！可能是之前的設定。');
  console.warn('   解決方法：點擊右上角 🎵 按鈕開啟音樂');
}

// 立即播放
playBGM('daily');
