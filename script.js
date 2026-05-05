// DOM elements
const levelSpan = document.getElementById('levelValue');
const itemsSpan = document.getElementById('itemsCount');
const statusDiv = document.getElementById('statusMessage');
const startBtn = document.getElementById('startBtn');
const replayBtn = document.getElementById('replayBtn');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const buttonPanel = document.getElementById('buttonPanel');

// Game variables
let currentLevel = 1;
let currentSequence = [];       // সিকোয়েন্স অব ইনডেক্স (0-5 বোতাম নম্বর)
let playerInput = [];
let isShowing = false;          // ক্রম দেখানোর সময়
let isWaitingInput = false;     // প্লেয়ার ইনপুট নেওয়ার সময়
let gameActive = false;         // গেম সক্রিয় কিনা (শেষ বা ভুল হলে false)
let showTimeouts = [];          // টাইমআউট ট্র্যাকিং

// বাটন রেফারেন্স
let memoryBtns = [];

// বোতামের সংখ্যা (১-৬)
const TOTAL_BUTTONS = 6;
const BUTTON_VALUES = [1, 2, 3, 4, 5, 6];

// গেম কনফিগ
const SHOW_DELAY = 700;        // প্রতিটি হাইলাইটের ব্যবধান (মিলিসেকেন্ড)

// ----- ইউটিলিটি ফাংশন -----
function clearAllTimeouts() {
    for (let t of showTimeouts) {
        clearTimeout(t);
    }
    showTimeouts = [];
}

// বোতাম তৈরি করা
function createButtons() {
    buttonPanel.innerHTML = '';
    for (let i = 0; i < TOTAL_BUTTONS; i++) {
        const btn = document.createElement('button');
        btn.className = 'memory-btn';
        btn.textContent = BUTTON_VALUES[i];
        btn.dataset.index = i;
        btn.dataset.value = BUTTON_VALUES[i];
        btn.addEventListener('click', () => onButtonClick(i));
        buttonPanel.appendChild(btn);
        memoryBtns.push(btn);
    }
}

// হাইলাইট রিমুভ
function removeHighlightFromAll() {
    memoryBtns.forEach(btn => btn.classList.remove('highlight'));
}

// নির্দিষ্ট বোতাম হাইলাইট (ইন্ডেক্স অনুযায়ী)
function highlightButton(index, duration = 400) {
    if (!memoryBtns[index]) return;
    memoryBtns[index].classList.add('highlight');
    setTimeout(() => {
        if (memoryBtns[index]) memoryBtns[index].classList.remove('highlight');
    }, duration);
}

// সিকোয়েন্স দেখানো (অ্যানিমেশন)
async function showSequence() {
    if (!gameActive) return;
    isShowing = true;
    isWaitingInput = false;
    disableInputButtons(true);
    updateReplayAndNextState(false); // replay, next disable
    
    statusDiv.textContent = `✨ লেভেল ${currentLevel} : ক্রম মনে রাখুন ✨`;
    
    for (let i = 0; i < currentSequence.length; i++) {
        const btnIndex = currentSequence[i];
        if (!gameActive) break;
        highlightButton(btnIndex, 300);
        await delay(SHOW_DELAY);
    }
    
    if (!gameActive) return;
    
    // ক্রম দেখানো শেষ
    isShowing = false;
    isWaitingInput = true;
    statusDiv.textContent = `🎯 এখন আপনার পালা! সঠিক ক্রমে ক্লিক করুন (${currentSequence.length}টি আইটেম)`;
    disableInputButtons(false);
    updateReplayAndNextState(true);  // replay active, next না
    replayBtn.disabled = false;
    nextBtn.disabled = true;
}

// ডিলে ফাংশন
function delay(ms) {
    return new Promise(resolve => {
        const tid = setTimeout(resolve, ms);
        showTimeouts.push(tid);
    });
}

// প্লেয়ার ইনপুট হ্যান্ডলার
function onButtonClick(btnIndex) {
    if (!gameActive || isShowing || !isWaitingInput) return;
    
    const expectedIndex = currentSequence[playerInput.length];
    if (btnIndex === expectedIndex) {
        // সঠিক উত্তর
        playerInput.push(btnIndex);
        // তাত্ক্ষণিক ফিডব্যাক
        highlightButton(btnIndex, 150);
        
        if (playerInput.length === currentSequence.length) {
            // সম্পূর্ণ সিকোয়েন্স সঠিক হয়েছে
            isWaitingInput = false;
            disableInputButtons(true);
            statusDiv.textContent = `✅ লেভেল ${currentLevel} সম্পন্ন! "পরবর্তী লেভেল" এ ক্লিক করুন ✅`;
            gameActive = true;
            replayBtn.disabled = true;
            nextBtn.disabled = false;
            // সিকোয়েন্স শেষে পুরস্কার
        } else {
            statusDiv.textContent = `🎯 ঠিক আছে! আরও ${currentSequence.length - playerInput.length}টি বাকি`;
        }
    } else {
        // ভুল হয়েছে
        gameActive = false;
        isWaitingInput = false;
        isShowing = false;
        disableInputButtons(true);
        clearAllTimeouts();
        
        statusDiv.innerHTML = `❌ ভুল! ক্রমটি ছিল: ${formatSequenceForDisplay(currentSequence)} ❌ <br> "স্টার্ট গেম" দিয়ে আবার চেষ্টা করুন`;
        replayBtn.disabled = true;
        nextBtn.disabled = true;
        startBtn.disabled = false;
        resetBtn.disabled = false;
        // বোতামে রেড ইফেক্ট
        highlightButton(btnIndex, 300);
        memoryBtns[btnIndex].style.transition = 'background 0.1s';
        setTimeout(() => {
            if (memoryBtns[btnIndex]) memoryBtns[btnIndex].style.transition = '';
        }, 300);
    }
}

// সিকোয়েন্স ফরম্যাট করে দেখানো (মেসেজের জন্য)
function formatSequenceForDisplay(seq) {
    return seq.map(idx => BUTTON_VALUES[idx]).join(' → ');
}

// নতুন লেভেলের জন্য সিকোয়েন্স জেনারেট
function generateSequenceForLevel(level) {
    // লেভেল 1 = 2 আইটেম, লেভেল 2 = 3 আইটেম, লেভেল 3 = 4 আইটেম ...
    const length = level + 1;   // level 1 -> 2 items, level 2->3, level 5->6 etc.
    itemsSpan.textContent = length;
    const newSeq = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * TOTAL_BUTTONS);
        newSeq.push(randomIndex);
    }
    return newSeq;
}

// UI বাটন ডিজেবল/ইনেবল
function disableInputButtons(disable) {
    memoryBtns.forEach(btn => {
        if (disable) {
            btn.disabled = true;
            btn.classList.add('disabled-btn');
        } else {
            btn.disabled = false;
            btn.classList.remove('disabled-btn');
        }
    });
}

// রিপ্লে এবং নেক্সট বাটন স্টেট
function updateReplayAndNextState(playingPhase) {
    // playingPhase = true মানে ইনপুট নেওয়ার সময়, replay বাটন এনাবল থাকবে
    if (playingPhase && gameActive && !isShowing && isWaitingInput) {
        replayBtn.disabled = false;
    } else {
        replayBtn.disabled = true;
    }
    if (!gameActive || isShowing) nextBtn.disabled = true;
}

// রিপ্লে ফাংশন: বর্তমান সিকোয়েন্স আবার দেখাবে (শুধু দেখার সময় ইনপুট অক্ষম)
async function replayCurrentSequence() {
    if (!gameActive || isShowing) return;
    if (isWaitingInput) {
        // চলমান ইনপুট ফেজ বাদ দিয়ে আবার ক্রম দেখান
        isWaitingInput = false;
        disableInputButtons(true);
        clearAllTimeouts();
        statusDiv.textContent = `🔄 ক্রম পুনরায় দেখানো হচ্ছে...`;
        await showSequence();
    }
}

// গেম রিসেট (পুরোপুরি নতুন করে)
function resetGameFull() {
    clearAllTimeouts();
    gameActive = false;
    isShowing = false;
    isWaitingInput = false;
    playerInput = [];
    currentLevel = 1;
    levelSpan.textContent = currentLevel;
    
    // সিকোয়েন্স তৈরি না করে শুধু ভেরিয়েবল রিসেট
    currentSequence = [];
    itemsSpan.textContent = '?';
    statusDiv.innerHTML = '🔄 গেম রিসেট হয়েছে। "স্টার্ট গেম" এ ক্লিক করুন 🎮';
    disableInputButtons(true);
    replayBtn.disabled = true;
    nextBtn.disabled = true;
    startBtn.disabled = false;
    resetBtn.disabled = false;
    removeHighlightFromAll();
}

// নতুন গেম আরম্ভ (লেভেল 1 থেকে)
async function startNewGame() {
    clearAllTimeouts();
    resetGameFull(); // রিসেট করে সব
    gameActive = true;
    currentLevel = 1;
    levelSpan.textContent = currentLevel;
    playerInput = [];
    
    currentSequence = generateSequenceForLevel(currentLevel);
    itemsSpan.textContent = currentSequence.length;
    
    removeHighlightFromAll();
    disableInputButtons(true);
    replayBtn.disabled = true;
    nextBtn.disabled = true;
    
    statusDiv.textContent = `🎬 লেভেল ${currentLevel} শুরু হচ্ছে... মনোযোগ দিন!`;
    await delay(400);
    if (!gameActive) return;
    await showSequence();
}

// পরবর্তী লেভেলে যাওয়া
async function goToNextLevel() {
    if (!gameActive || isShowing || isWaitingInput) return;
    if (currentSequence.length === playerInput.length && playerInput.length > 0) {
        // লেভেল আপ
        currentLevel++;
        levelSpan.textContent = currentLevel;
        playerInput = [];
        
        currentSequence = generateSequenceForLevel(currentLevel);
        itemsSpan.textContent = currentSequence.length;
        
        disableInputButtons(true);
        replayBtn.disabled = true;
        nextBtn.disabled = true;
        statusDiv.textContent = `🌟 লেভেল ${currentLevel} এ উন্নীত! মনে রাখার চেষ্টা করুন 🌟`;
        
        await delay(600);
        if (gameActive) {
            await showSequence();
        }
    } else {
        statusDiv.textContent = '⚠️ আগের লেভেল সম্পন্ন করুন!';
    }
}

// ইভেন্ট লিসেনার
function bindEvents() {
    startBtn.addEventListener('click', () => {
        if (isShowing) return;
        startNewGame();
    });
    resetBtn.addEventListener('click', () => {
        if (isShowing) {
            clearAllTimeouts();
        }
        resetGameFull();
    });
    replayBtn.addEventListener('click', () => {
        if (gameActive && !isShowing && isWaitingInput) {
            replayCurrentSequence();
        }
    });
    nextBtn.addEventListener('click', () => {
        if (gameActive && !isShowing && !isWaitingInput && currentSequence.length === playerInput.length && playerInput.length > 0) {
            goToNextLevel();
        } else if (!gameActive) {
            statusDiv.textContent = 'গেম শুরু করুন প্রথমে!';
        } else {
            statusDiv.textContent = 'বর্তমান লেভেল শেষ করে পরবর্তী লেভেলে যান।';
        }
    });
}

// প্রাথমিক সেটআপ
function init() {
    createButtons();
    bindEvents();
    resetGameFull(); // প্রাথমিক অবস্থা
}

// শুরু করুন
init();
