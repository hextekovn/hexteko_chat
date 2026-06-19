import "./style.css";

const API_URL = "https://keyauth-udk4.onrender.com";

let USER_KEY = "";
let USER_NAME = "";
let lastMessageId = null;

document.querySelector("#app").innerHTML = `

<div id="loginPage" class="login-page">
  <div class="login-card">
    <h1 class="logo">
      Tkhoi♡Mtue
    </h1>

    <input
      id="keyInput"
      class="input"
      placeholder="Nhập key..."
      type="text"
    >

    <button
      id="loginBtn"
      class="btn"
    >
      Đăng nhập
    </button>

    <p id="status"></p>
  </div>
</div>

<div
  id="chatPage"
  class="chat-page"
  style="display:none"
>
  <div class="topbar">
    <div class="user-box">
      <div class="avatar" id="avatar">
        ?
      </div>
      <div>
        <div id="username">
          Unknown
        </div>
        <div id="onlineText">
          Global Chat
        </div>
      </div>
    </div>

    <div class="topbar-right">
      <input type="color" id="bgPicker" title="Đổi màu nền chat" style="width: 30px; height: 30px; border: none; border-radius: 50%; cursor: pointer; margin-right: 10px;">
      <button id="clearBtn" class="logout-btn">
        🗑
      </button>
      <button id="logoutBtn" class="logout-btn">
        Đăng xuất
      </button>
    </div>
  </div>

  <div
    id="messages"
    class="messages"
  >
  </div>

  <div class="sendbar">
    <div class="input-box">
      <button id="imgBtn" class="send-btn">
        📷
      </button>
      <input
        id="msgInput"
        class="msg-input"
        type="text"
        placeholder="Nhập tin nhắn..."
      >
      <button id="sendBtn" class="send-btn">
        ➤
      </button>
    </div>
    <input
      type="file"
      id="imgInput"
      accept="image/*"
      hidden
    >
  </div>
</div>
`;

const loginPage = document.getElementById("loginPage");
const chatPage = document.getElementById("chatPage");
const keyInput = document.getElementById("keyInput");
const loginBtn = document.getElementById("loginBtn");
const statusText = document.getElementById("status");
const username = document.getElementById("username");
const avatar = document.getElementById("avatar");
const messages = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");
const imgBtn = document.getElementById("imgBtn");
const imgInput = document.getElementById("imgInput");
const clearBtn = document.getElementById("clearBtn");
const bgPicker = document.getElementById("bgPicker");

// Hàm thêm tin nhắn mới với hỗ trợ nhận diện hình ảnh
function addMessage(username, message, mine = false) {
    const msg = document.createElement("div");
    msg.className = `msg ${mine ? "mine" : ""}`;

    const name = document.createElement("div");
    name.className = "msg-name";
    name.textContent = username;

    if (message.startsWith("/uploads/")) {
        const imageUrl = API_URL + message;

        const text = document.createElement("div");
        text.className = "msg-text";
        
        const img = document.createElement("img");
        img.src = imageUrl;
        img.className = "chat-image";
        img.style.maxWidth = "200px";
        img.style.borderRadius = "8px";
        img.style.cursor = "pointer";
        img.onclick = () => window.open(imageUrl);
        
        text.appendChild(img);
        msg.appendChild(name);
        msg.appendChild(text);
    } else {
        const text = document.createElement("div");
        text.className = "msg-text";
        text.textContent = message;
        
        msg.appendChild(name);
        msg.appendChild(text);
    }

    messages.appendChild(msg);
}

// Hàm thông báo tin nhắn mới
function notifyNewMessage(username, message) {
    if (Notification.permission === "granted") {
        new Notification("Bạn có tin nhắn mới", {
            body: `${username}: ${
                message.startsWith("/uploads/")
                    ? "📷 Đã gửi một ảnh"
                    : message
            }`,
            icon: "/logo.png"
        });
    }
}

// Yêu cầu quyền thông báo khi trang load
async function requestNotificationPermission() {
    if (Notification.permission === "default") {
        await Notification.requestPermission();
    }
}

// Đổi màu nền chat
function setChatBackground(color) {
    messages.style.background = color;
    localStorage.setItem("chat_bg", color);
}

// Khôi phục màu nền chat
function loadChatBackground() {
    const savedColor = localStorage.getItem("chat_bg");
    if (savedColor) {
        messages.style.background = savedColor;
        if (bgPicker) {
            bgPicker.value = savedColor;
        }
    }
}

async function login() {
  const key = keyInput.value.trim();

  if (!key) {
    statusText.textContent = "Nhập key";
    return;
  }

  statusText.textContent = "Đang đăng nhập...";

  try {
    const res = await fetch(
      `${API_URL}/profile?key=${encodeURIComponent(key)}`
    );

    const data = await res.json();
    console.log(data);

    if (!data.success) {
      statusText.textContent = "Key không hợp lệ";
      return;
    }

    USER_KEY = key;
    USER_NAME = data.data.owner;

    localStorage.setItem("chat_key", key);
    username.textContent = USER_NAME;
    avatar.textContent = USER_NAME.charAt(0).toUpperCase();

    loginPage.style.display = "none";
    chatPage.style.display = "flex";

    // Khôi phục màu nền chat
    loadChatBackground();

    // Yêu cầu quyền thông báo
    await requestNotificationPermission();

    await loadMessages();
    scrollBottom();
  } catch (err) {
    console.error(err);
    statusText.textContent = "Không thể kết nối API";
  }
}

function scrollBottom() {
  messages.scrollTop = messages.scrollHeight;
}

async function loadMessages() {
  try {
    const res = await fetch(
      `${API_URL}/?action=get_messages&key=${encodeURIComponent(USER_KEY)}`
    );

    const data = await res.json();
    
    if (!data.success) return;

    // Kiểm tra tin nhắn mới
    if (data.data && data.data.length > 0) {
      const lastMsg = data.data[data.data.length - 1];
      const newMessageId = lastMsg.id || lastMsg.timestamp || JSON.stringify(lastMsg);
      
      if (lastMessageId !== null && lastMessageId !== newMessageId) {
        // Có tin nhắn mới
        const newMessages = data.data.filter(msg => {
          const msgId = msg.id || msg.timestamp || JSON.stringify(msg);
          return msgId !== lastMessageId;
        });
        
        newMessages.forEach(msg => {
          if (msg.sender !== USER_NAME && document.hidden) {
            notifyNewMessage(msg.sender, msg.message);
          }
        });
      }
      
      lastMessageId = newMessageId;
    }

    messages.innerHTML = "";

    data.data.forEach(msg => {
      const mine = msg.sender === USER_NAME;
      addMessage(msg.sender, msg.message, mine);
    });

    scrollBottom();
  } catch (err) {
    console.error(err);
  }
}

setInterval(() => {
  if (!USER_KEY) return;
  loadMessages();
}, 3000);

async function sendMessage() {
  const text = msgInput.value.trim();

  if (!text) return;

  try {
    const res = await fetch(
      `${API_URL}/?action=send_message&key=${encodeURIComponent(USER_KEY)}&message=${encodeURIComponent(text)}`
    );

    const data = await res.json();

    if (!data.success) return;

    msgInput.value = "";
    await loadMessages();
    scrollBottom();
  } catch (err) {
    console.error(err);
  }
}

function logout() {
  localStorage.removeItem("chat_key");
  location.reload();
}

// Upload ảnh
imgBtn.onclick = () => {
  imgInput.click();
};

imgInput.onchange = async () => {
  const file = imgInput.files[0];

  if (!file) return;

  const form = new FormData();
  form.append("image", file);

  try {
    const res = await fetch(
      `${API_URL}/upload?key=${USER_KEY}`,
      {
        method: "POST",
        body: form
      }
    );

    const data = await res.json();
    console.log(data);
    await loadMessages();
  } catch (err) {
    console.error("Upload failed:", err);
  }
};

// Xoá toàn bộ tin nhắn
clearBtn.onclick = async () => {
  const admin = prompt("Nhập admin key");

  if (!admin) return;

  await fetch(
    `${API_URL}/?action=clear_messages&keyadmin=${admin}`
  );

  loadMessages();
};

// Event listener cho đổi màu nền
bgPicker.addEventListener("input", (e) => {
    setChatBackground(e.target.value);
});

loginBtn.addEventListener("click", login);
sendBtn.addEventListener("click", sendMessage);
logoutBtn.addEventListener("click", logout);

msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Thêm event listener cho việc tab ẩn/hiện
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && USER_KEY) {
    loadMessages();
  }
});

window.addEventListener("load", async () => {
  // Khôi phục màu nền trước khi login
  loadChatBackground();
  
  const savedKey = localStorage.getItem("chat_key");

  if (!savedKey) return;

  keyInput.value = savedKey;
  await login();
});
