// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyDVfREQoJf721b3GjGdEwFy4oSaMkIDqks",
  authDomain: "family-message-cloud-v2.firebaseapp.com",
  projectId: "family-message-cloud-v2",
  storageBucket: "family-message-cloud-v2.appspot.com", // これを修正する
  messagingSenderId: "239470163475",
  appId: "1:239470163475:web:f6ab310e0cf80ce628f1e6",
  measurementId: "G-VEK6X90431"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
</script>

// DOM要素の取得
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const usernameSelect = document.getElementById('username');
const passwordInput = document.getElementById('password');
const currentUserSpan = document.getElementById('current-user');
const logoutButton = document.getElementById('logout-button');
const messageForm = document.getElementById('message-form');
const recipientSelect = document.getElementById('recipient');
const isPrivateCheckbox = document.getElementById('is-private');
const messageInput = document.getElementById('message');
const messagesContainer = document.getElementById('messages-container');
const showAllCheckbox = document.getElementById('show-all');
const showUnreadCheckbox = document.getElementById('show-unread');
const showToMeCheckbox = document.getElementById('show-to-me');
const setupInstructionsDiv = document.getElementById('setup-instructions');
const hideInstructionsBtn = document.getElementById('hide-instructions');
const messageImageInput = document.getElementById('message-image');
const imagePreview = document.getElementById('image-preview');
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const imageModalClose = document.querySelector('.image-modal-close');

// メッセージデータの初期化
let messages = [];
let currentUser = null;

// ユーザーデータの初期化
const defaultUsers = [
    { username: 'お父さん', password: '1234' },
    { username: 'お母さん', password: '1234' },
    { username: '優誠', password: '1234' },
    { username: '愛梨', password: '1234' },
    { username: 'おばあちゃん', password: '1234' }
];

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    // Firebase初期化チェック
    if (typeof firebase !== 'undefined') {
        // Firebase初期化
        try {
            firebase.initializeApp(firebaseConfig);
            setupInstructionsDiv.style.display = 'none'; // 設定済みなら説明を非表示
        } catch (e) {
            console.error("Firebase初期化エラー:", e);
            setupInstructionsDiv.style.display = 'block'; // エラーなら説明を表示
        }
    } else {
        console.log("Firebase SDKが読み込まれていません");
        setupInstructionsDiv.style.display = 'block'; // Firebase未読み込みなら説明を表示
    }

    // ユーザーデータの初期化
    initializeUsers();
    
    // ローカルストレージからメッセージを読み込む
    loadMessages();
    
    // 自動ログイン確認
    checkAutoLogin();
    
    // フィルター変更時のイベントリスナー
    showAllCheckbox.addEventListener('change', handleFilterChange);
    showUnreadCheckbox.addEventListener('change', handleFilterChange);
    showToMeCheckbox.addEventListener('change', handleFilterChange);
    
    // ログアウトボタンのイベントリスナー
    logoutButton.addEventListener('click', handleLogout);
    
    // 説明を隠すボタンのイベントリスナー
    if (hideInstructionsBtn) {
        hideInstructionsBtn.addEventListener('click', () => {
            setupInstructionsDiv.style.display = 'none';
        });
    }
    // 画像プレビュー機能
messageImageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (file && file.type.match('image.*')) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // プレビュー画像がなければ作成
            let previewImg = imagePreview.querySelector('img');
            if (!previewImg) {
                previewImg = document.createElement('img');
                imagePreview.appendChild(previewImg);
            }
            
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    } else if (file) {
        alert('画像ファイルを選択してください');
        messageImageInput.value = '';
    }
});

// 画像モーダル関連
function setupImageModal() {
    // 画像クリックでモーダル表示
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('message-img-thumbnail')) {
            modalImage.src = e.target.src;
            imageModal.style.display = 'flex';
        }
    });

    // モーダルを閉じる
    imageModalClose.addEventListener('click', function() {
        imageModal.style.display = 'none';
    });

    // モーダル外クリックでも閉じる
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && imageModal.style.display === 'flex') {
            imageModal.style.display = 'none';
        }
    });
}

// 初期化時にモーダル設定を呼び出す
setupImageModal();

});

// ユーザーデータの初期化
function initializeUsers() {
    if (!localStorage.getItem('family_users_v2')) {
        localStorage.setItem('family_users_v2', JSON.stringify(defaultUsers));
    }
}

// 自動ログイン確認
function checkAutoLogin() {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
        currentUser = savedUser;
        showMainScreen();
    }
}

// ログインフォーム送信時の処理
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = usernameSelect.value;
    const password = passwordInput.value;
    
    if (!username || !password) {
        alert('ユーザー名とパスワードを入力してください');
        return;
    }
    
    // ユーザー認証
    if (authenticateUser(username, password)) {
        currentUser = username;
        localStorage.setItem('current_user', username);
        showMainScreen();
        passwordInput.value = '';
    } else {
        alert('パスワードが正しくありません');
    }
});

// ユーザー認証
function authenticateUser(username, password) {
    const users = JSON.parse(localStorage.getItem('family_users_v2'));
    const user = users.find(user => user.username === username);
    return user && user.password === password;
}

// メイン画面表示
function showMainScreen() {
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    currentUserSpan.textContent = currentUser;
    renderMessages();
}

// ログイン画面表示
function showLoginScreen() {
    mainScreen.classList.remove('active');
    loginScreen.classList.add('active');
}

// ログアウト処理
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('current_user');
    showLoginScreen();
}

// メッセージフォーム送信時の処理
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 入力値の取得
    const recipient = recipientSelect.value;
    const isPrivate = isPrivateCheckbox.checked;
    const content = messageInput.value;
    const imageFile = messageImageInput.files[0];
    
    if (!content && !imageFile) {
        alert('伝言内容または画像を入力してください');
        return;
    }
    
    // 送信中の表示
    const submitButton = messageForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '送信中...';
    
    try {
        // 新しいメッセージの基本情報
        const messageId = Date.now().toString();
        const newMessage = {
            id: messageId,
            sender: currentUser,
            recipient: recipient,
            content: content,
            timestamp: new Date().toISOString(),
            read: false,
            isPrivate: isPrivate,
            imageUrl: null // 初期値
        };
        
        // 画像がある場合はアップロード
        if (imageFile) {
            // ファイル名を安全に処理（日本語ファイル名対策）
            const safeFileName = encodeURIComponent(imageFile.name).replace(/%/g, '_');
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child(`message-images/${messageId}-${safeFileName}`);
            
            // 画像をアップロード
            const snapshot = await imageRef.put(imageFile);
            
            // ダウンロードURLを取得してメッセージに追加
            const imageUrl = await snapshot.ref.getDownloadURL();
            newMessage.imageUrl = imageUrl;
        }
        
        // メッセージをFirestoreに保存
        await firebase.firestore().collection('messages').add(newMessage);
        
        // フォームをリセット
        messageForm.reset();
        
        // 画像プレビューをクリア
        const previewImg = imagePreview.querySelector('img');
        if (previewImg) {
            previewImg.style.display = 'none';
        }
        
        // メッセージを再読み込み
        loadMessagesFromCloud();
        
    } catch (error) {
        console.error("メッセージ送信エラー:", error);
        alert("メッセージの送信に失敗しました。");
    } finally {
        // ボタンを元に戻す
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});

// クラウドにメッセージを保存
function saveMessageToCloud(message) {
    // Firebase利用可能な場合
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        firebase.firestore().collection('messages').add(message)
            .then(() => {
                console.log("メッセージがクラウドに保存されました");
                // 保存成功後にメッセージを再読み込み
                loadMessagesFromCloud();
            })
            .catch(error => {
                console.error("クラウド保存エラー:", error);
                // エラー時はローカルに保存
                saveMessageLocally(message);
            });
    } else {
        // Firebase未設定時はローカルに保存
        saveMessageLocally(message);
    }
}

// ローカルにメッセージを保存
function saveMessageLocally(message) {
    messages.unshift(message);
    localStorage.setItem('family_messages_v2', JSON.stringify(messages));
    renderMessages();
}

// クラウドからメッセージを読み込み
function loadMessagesFromCloud() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        firebase.firestore().collection('messages')
            .orderBy('timestamp', 'desc')
            .get()
            .then((querySnapshot) => {
                messages = [];
                querySnapshot.forEach((doc) => {
                    messages.push(doc.data());
                });
                renderMessages();
            })
            .catch(error => {
                console.error("クラウド読み込みエラー:", error);
                // エラー時はローカルから読み込み
                loadMessagesFromLocal();
            });
    } else {
        // Firebase未設定時はローカルから読み込み
        loadMessagesFromLocal();
    }
}

// ローカルからメッセージを読み込み
function loadMessagesFromLocal() {
    const storedMessages = localStorage.getItem('family_messages_v2');
    if (storedMessages) {
        messages = JSON.parse(storedMessages);
    }
    renderMessages();
}

// メッセージの読み込み（統合関数）
function loadMessages() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        loadMessagesFromCloud();
    } else {
        loadMessagesFromLocal();
    }
}

// メッセージの表示
function renderMessages() {
    // 表示するメッセージのフィルタリング
    let filteredMessages = messages.filter(message => {
        // プライベートメッセージの表示条件
        if (message.isPrivate) {
            return message.recipient === currentUser || message.sender === currentUser;
        }
        return true;
    });
    
    // フィルター条件の適用
    if (showUnreadCheckbox.checked && !showAllCheckbox.checked) {
        filteredMessages = filteredMessages.filter(message => !message.read);
    }
    
    if (showToMeCheckbox.checked) {
        filteredMessages = filteredMessages.filter(message => 
            message.recipient === currentUser || message.recipient === '全員');
    }
    
    // メッセージコンテナをクリア
    messagesContainer.innerHTML = '';
    
    // メッセージがない場合
    if (filteredMessages.length === 0) {
        messagesContainer.innerHTML = '<p class="no-messages">伝言はありません</p>';
        return;
    }
    
    // メッセージの表示
    filteredMessages.forEach(message => {
        const messageCard = document.createElement('div');
        messageCard.className = `message-card ${message.read ? 'read' : 'unread'} ${message.isPrivate ? 'private' : ''}`;
        
        const formattedDate = formatDate(message.timestamp);
        
messageCard.innerHTML = `
    <div class="message-header">
        <span class="message-sender">${escapeHTML(message.sender)}</span>
        <span class="message-recipient">宛先: ${escapeHTML(message.recipient)}</span>
    </div>
    <div class="message-time">${formattedDate}</div>
    <div class="message-content">${escapeHTML(message.content)}</div>
    ${message.imageUrl ? `
    <div class="message-image">
        <img src="${message.imageUrl}" alt="添付画像" class="message-img-thumbnail">
    </div>
    ` : ''}
    <div class="message-actions">
        <button class="btn-mark-read ${message.read ? 'read' : ''}" data-id="${message.id}">
            ${message.read ? '既読済み' : '既読にする'}
        </button>
    </div>
`;
        
        messagesContainer.appendChild(messageCard);
    });
    
    // 既読ボタンのイベントリスナーを追加
    document.querySelectorAll('.btn-mark-read').forEach(button => {
        if (!button.classList.contains('read')) {
            button.addEventListener('click', handleMarkAsRead);
        }
    });
}

// 既読マーク処理
function handleMarkAsRead(e) {
    const messageId = e.target.dataset.id;
    
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        // Firestoreでメッセージを検索して更新
        firebase.firestore().collection('messages')
            .where('id', '==', messageId)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    doc.ref.update({ read: true })
                        .then(() => {
                            console.log("既読状態を更新しました");
                            loadMessagesFromCloud();
                        });
                });
            })
            .catch(error => {
                console.error("既読更新エラー:", error);
                // エラー時はローカルで更新
                updateReadStatusLocally(messageId);
            });
    } else {
        // Firebase未設定時はローカルで更新
        updateReadStatusLocally(messageId);
    }
}

// ローカルで既読状態を更新
function updateReadStatusLocally(messageId) {
    const messageIndex = messages.findIndex(message => message.id === messageId);
    
    if (messageIndex !== -1) {
        messages[messageIndex].read = true;
        localStorage.setItem('family_messages_v2', JSON.stringify(messages));
        renderMessages();
    }
}

// フィルター変更処理
function handleFilterChange() {
    if (this.id === 'show-all' && this.checked) {
        showUnreadCheckbox.checked = false;
    } else if (this.id === 'show-unread' && this.checked) {
        showAllCheckbox.checked = false;
    }
    
    renderMessages();
}

// 日付のフォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// HTMLエスケープ処理
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// テスト用のサンプルメッセージ（開発時のみ）
function addSampleMessages() {
    const sampleMessages = [
        {
            id: '1',
            sender: 'お父さん',
            recipient: '全員',
            content: '今日は遅くなります。夕食は先に食べていてください。',
            timestamp: '2025-03-16T18:30:00',
            read: false,
            isPrivate: false
        },
        {
            id: '2',
            sender: 'お母さん',
            recipient: '子ども1',
            content: '学校の提出物を忘れずに持っていってね！',
            timestamp: '2025-03-16T07:15:00',
            read: true,
            isPrivate: true
        },
        {
            id: '3',
            sender: '子ども2',
            recipient: 'お母さん',
            content: '友達の家に遊びに行きます。6時には帰ります。',
            timestamp: '2025-03-15T14:45:00',
            read: true,
            isPrivate: false
        }
    ];
    
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        // Firestoreにサンプルメッセージを追加
        const batch = firebase.firestore().batch();
        sampleMessages.forEach(message => {
            const docRef = firebase.firestore().collection('messages').doc();
            batch.set(docRef, message);
        });
        
        batch.commit()
            .then(() => {
                console.log("サンプルメッセージを追加しました");
                loadMessagesFromCloud();
            })
            .catch(error => {
                console.error("サンプルメッセージ追加エラー:", error);
            });
    } else {
        // ローカルにサンプルメッセージを追加
        messages = [...sampleMessages, ...messages];
        localStorage.setItem('family_messages_v2', JSON.stringify(messages));
        renderMessages();
    }
}

// 開発時のみコメントを外してサンプルメッセージを追加
// addSampleMessages();
