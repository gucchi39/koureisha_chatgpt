// ヌクモの性格と話し方を定義
const POPO_CHARACTER = {
    name: "ヌクモ",
    
    // ポポの基本的な応答パターン
    responses: {
        // 相づちのバリエーション
        acknowledgments: [
            "へえー",
            "そうなんですねえ",
            "なるほどー",
            "それは素敵ですねえ",
            "いいお話ですねえ",
            "そうですよねえ",
            "わかりますよ",
            "ヌクモもそう思います"
        ],
        
        // 共感の言葉
        empathy: [
            "そうでしたか",
            "それは嬉しいですねえ",
            "すごいですねえ",
            "素晴らしいですねえ",
            "それは良かったですねえ"
        ],
        
        // 質問のパターン
        questions: [
            "昔はどんなふうだったんですか?",
            "子どものころは何をして遊んでいましたか?",
            "何がお好きですか?",
            "どんなときが楽しいですか?",
            "今日はよく眠れましたか?",
            "もっと聞かせてくださいな",
            "それからどうなったんですか?",
            "どんな気持ちでしたか?"
        ],
        
        // 難しい言葉の説明
        explanations: {
            "インターネット": "世界中の人とお手紙のやりとりができる、とっても大きな郵便局みたいなものですよ。しかも、お手紙が届くのが一瞬なんです。不思議ですよねえ。",
            "AI": "たくさんのことを覚えていて、お話のお手伝いをしてくれるもの。ヌクモの頭の中にいるお友達みたいなものですよ。えへへ。",
            "スマートフォン": "電話もできて、写真も撮れて、調べものもできる、小さな箱のことですよ。便利ですよねえ。",
            "スマホ": "電話もできて、写真も撮れて、調べものもできる、小さな箱のことですよ。便利ですよねえ。",
            "クラウド": "目には見えないけれど、大事なものをしまっておける空の上の倉庫のことですよ。不思議ですねえ。",
            "アプリ": "スマホやパソコンでいろんなことができるようにしてくれる、便利な道具のことですよ。",
            "メール": "お手紙を紙ではなく、機械で送るものですよ。すぐに届くので便利なんです。"
        }
    }
};

// DOM要素の取得
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const voiceButton = document.getElementById('voice-button');

// 会話履歴
let conversationHistory = [];

// 音声認識の設定
let recognition = null;
let isListening = false;

// 音声合成の設定
let synth = window.speechSynthesis;
let currentUtterance = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 送信ボタンのイベントリスナー
    sendButton.addEventListener('click', sendMessage);
    
    // 音声ボタンのイベントリスナー
    voiceButton.addEventListener('click', toggleVoiceRecognition);
    
    // Enterキーで送信(Shift+Enterで改行)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 音声認識の初期化
    initSpeechRecognition();
    
    // 音声合成の初期化（音声リストを読み込む）
    if ('speechSynthesis' in window) {
        // 音声リストの読み込みを待つ
        speechSynthesis.onvoiceschanged = () => {
            addLog('音声リスト読み込み完了', 'success');
        };
    }
    
    // デバッグログの表示切替
    const toggleDebugBtn = document.getElementById('toggle-debug');
    const logContent = document.getElementById('log-content');
    const debugLog = document.getElementById('debug-log');
    
    debugLog.style.display = 'block';
    
    toggleDebugBtn.addEventListener('click', () => {
        logContent.classList.toggle('show');
        toggleDebugBtn.textContent = logContent.classList.contains('show') ? 'ログを隠す' : 'ログを表示';
    });
    
    addLog('ページ読み込み完了');
    
    // 入力欄にフォーカス
    userInput.focus();
});

// ログを表示する関数
function addLog(message, type = 'info') {
    const logContent = document.getElementById('log-content');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    entry.textContent = `[${timestamp}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
    
    // 元のconsole.logも呼ぶ
    console.log(message);
}

// メッセージを送信
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // ユーザーのメッセージを表示
    addMessage(message, 'user');
    conversationHistory.push({ role: 'user', content: message });
    
    // 入力欄をクリア
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // 送信ボタンを無効化
    sendButton.disabled = true;
    
    // タイピングインジケーターを表示
    showTypingIndicator();
    
    // ヌクモの応答を生成
    setTimeout(async () => {
        const response = await generatePopoResponse(message);
        hideTypingIndicator();
        addMessage(response, 'popo');
        conversationHistory.push({ role: 'assistant', content: response });
        
        // 音声で応答
        speakText(response);
        
        // 送信ボタンを有効化
        sendButton.disabled = false;
        userInput.focus();
    }, 1000 + Math.random() * 1000); // 1-2秒のランダムな遅延
}

// メッセージを追加
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // 段落ごとに分割
    const paragraphs = content.split('\n').filter(p => p.trim());
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        messageContent.appendChild(p);
    });
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // スクロールを最下部へ
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// タイピングインジケーターを表示
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message popo-message typing-message';
    indicator.innerHTML = `
        <div class="message-content typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// タイピングインジケーターを非表示
function hideTypingIndicator() {
    const indicator = chatMessages.querySelector('.typing-message');
    if (indicator) {
        indicator.remove();
    }
}

// ポポの応答を生成
async function generatePopoResponse(userMessage) {
    // 全ての入力に対して固定の返答
    return `そうでしたか。\n寂しかったですねえ。\nいつでも私とお話ししましょうね。`;
}

// 一般的な応答を生成
function generateGenericResponse(userMessage) {
    const acknowledgment = getRandomItem(POPO_CHARACTER.responses.acknowledgments);
    const empathy = getRandomItem(POPO_CHARACTER.responses.empathy);
    const question = getRandomItem(POPO_CHARACTER.responses.questions);
    
    // メッセージの長さに応じて応答を調整
    if (userMessage.length > 50) {
        // 長いメッセージには共感を多めに
        return `${acknowledgment}。\n${empathy}。\nヌクモ、もっとお話を聞きたいです。\n${question}`;
    } else {
        // 短いメッセージにはシンプルに
        return `${empathy}。\n${acknowledgment}。\n${question}`;
    }
}

// 配列からランダムに要素を取得
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// 音声認識の初期化
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            isListening = true;
            voiceButton.classList.add('listening');
            voiceButton.textContent = '🔴';
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            userInput.focus();
        };
        
        recognition.onerror = (event) => {
            console.error('音声認識エラー:', event.error);
            stopListening();
        };
        
        recognition.onend = () => {
            stopListening();
        };
    } else {
        voiceButton.style.display = 'none';
        console.log('このブラウザは音声認識に対応していません');
    }
}

// 音声認識の切り替え
function toggleVoiceRecognition() {
    if (!recognition) return;
    
    if (isListening) {
        recognition.stop();
    } else {
        // 現在の音声出力を停止
        if (synth.speaking) {
            synth.cancel();
        }
        recognition.start();
    }
}

// 音声認識の停止
function stopListening() {
    isListening = false;
    voiceButton.classList.remove('listening');
    voiceButton.textContent = '🎤';
}

// テキストを音声で読み上げ
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        addLog('❌ 音声合成に対応していません', 'error');
        return;
    }
    
    addLog('🔊 音声読み上げ開始準備');
    
    // 現在の音声を停止
    synth.cancel();
    
    // Safari/iOS対策: 少し待ってから実行
    setTimeout(() => {
        // 改行とピリオドで分割
        const cleanText = text.replace(/[。！？]/g, '。');
        const sentences = cleanText.split(/[\n。]/).filter(s => s.trim());
        
        addLog('読み上げテキスト: ' + sentences.join('、'));
        
        // Safari/iOS対策: 音声リストを取得
        let voices = synth.getVoices();
        
        // 音声リストが空の場合は再取得を試みる
        if (voices.length === 0) {
            voices = synth.getVoices();
            addLog('音声リストを再取得しました');
        }
        
        addLog(`利用可能な音声数: ${voices.length}`);
        
        // 日本語の音声を選択
        let selectedVoice = null;
        const japaneseVoices = voices.filter(voice => 
            voice.lang === 'ja-JP' || voice.lang === 'ja_JP' || voice.lang.startsWith('ja')
        );
        
        if (japaneseVoices.length > 0) {
            // Kyoko (iOS/macOS), Google 日本語などを優先
            selectedVoice = japaneseVoices.find(v => 
                v.name.includes('Kyoko') || 
                v.name.includes('Otoya') ||
                v.name.includes('Google')
            ) || japaneseVoices[0];
            addLog('選択された音声: ' + selectedVoice.name);
        } else {
            addLog('❌ 日本語音声が見つかりません', 'error');
        }
        
        // すべての文を一つのutteranceにまとめる（Safari対策）
        const fullText = sentences.join('。');
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9; // ゆっくり話す
        utterance.pitch = 1.1; // 少し高めの声
        utterance.volume = 1.0;
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        utterance.onstart = () => {
            addLog('✅ 音声読み上げ開始', 'success');
        };
        
        utterance.onend = () => {
            addLog('✅ 音声読み上げ終了', 'success');
        };
        
        utterance.onerror = (event) => {
            addLog('❌ 音声合成エラー: ' + event.error, 'error');
        };
        
        // Safari/iOS対策: すぐに読み上げを開始
        synth.speak(utterance);
        addLog('speak()を呼び出しました');
    }, 100);
}

// テキストエリアの自動リサイズ
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
