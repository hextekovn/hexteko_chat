import "./style.css";

const API = "https://keyauth-udk4.onrender.com";

let USER_KEY = "";
let USER_NAME = "";

document.querySelector("#app").innerHTML = `

<div id="loginPage" class="login-page">
  <div class="login-card">
    <h1 class="logo">
      HEXTEKO CHAT
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

async function login() {
  const key = keyInput.value.trim();

  if (!key) {
    statusText.textContent = "Nhập key";
    return;
  }

  statusText.textContent = "Đang đăng nhập...";

  try {
    const res = await fetch(
      `${API}/profile?key=${encodeURIComponent(key)}`
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

function createMessage(msg) {
  const div = document.createElement("div");
  const mine = msg.sender === USER_NAME;

  div.className = mine ? "msg mine" : "msg";

  const name = document.createElement("div");
  name.className = "msg-name";
  name.textContent = msg.sender;

  const text = document.createElement("div");
  text.className = "msg-text";
  text.textContent = msg.message;

  div.appendChild(name);
  div.appendChild(text);

  messages.appendChild(div);
}

async function loadMessages() {
  try {
    const res = await fetch(
      `${API}/?action=get_messages&key=${encodeURIComponent(USER_KEY)}`
    );

    const data = await res.json();
    messages.innerHTML = "";

    if (!data.success) return;

    data.data.forEach(msg => {
      createMessage(msg);
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
      `${API}/?action=send_message&key=${encodeURIComponent(USER_KEY)}&message=${encodeURIComponent(text)}`
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

  const res = await fetch(
    `${API}/upload?key=${USER_KEY}`,
    {
      method: "POST",
      body: form
    }
  );

  const data = await res.json();
  console.log(data);
  loadMessages();
};

// Xoá toàn bộ tin nhắn
clearBtn.onclick = async () => {
  const admin = prompt("Nhập admin key");

  if (!admin) return;

  await fetch(
    `${API}/?action=clear_messages&keyadmin=${admin}`
  );

  loadMessages();
};

loginBtn.addEventListener("click", login);
sendBtn.addEventListener("click", sendMessage);
logoutBtn.addEventListener("click", logout);

msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

window.addEventListener("load", async () => {
  const savedKey = localStorage.getItem("chat_key");

  if (!savedKey) return;

  keyInput.value = savedKey;
  await login();
});
