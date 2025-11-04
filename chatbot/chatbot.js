// ===== CHATBOT VINWONDERS - BÉ VIN (Phiên bản tối ưu local vs  OpenAI) =====

// 🔑 API key demo
let OPENAI_API_KEY = ""; // Thay bằng key thật khi deploy
let vinwondersData = null;
let openaiApiKey = OPENAI_API_KEY;

// ---------------- LOAD DỮ LIỆU cấu hình OpenAI ----------------
async function loadData() {
  try {
    const response = await fetch("./chatbot/data.json");
    vinwondersData = await response.json();
    const apiKeyResponse = await fetch("./chatbot/api.json");
    const apiKeyData = await apiKeyResponse.json();
    OPENAI_API_KEY = apiKeyData.OPENAI_API_KEY;
  } catch (error) {
    console.error("❌ Lỗi load dữ liệu:", error);
  }
}

// ---------------- KHỞI TẠO GIAO DIỆN ----------------
async function askOpenAI(userMessage) {
  if (!vinwondersData)
    return "Xin lỗi, dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.";

  // System prompt: describe assistant and provide context, but allow any question
  const systemPrompt = `
Bạn là trợ lý ảo VinWonders Nha Trang. Nếu câu hỏi liên quan đến VinWonders, hãy sử dụng dữ liệu sau để trả lời chính xác. Nếu câu hỏi không liên quan đến VinWonders, hãy trả lời như một trợ lý AI thông minh, thân thiện, và sáng tạo. Có thể trả lời bất kỳ chủ đề nào mà người dùng hỏi.

Dữ liệu VinWonders:
${JSON.stringify(vinwondersData, null, 2)}
`;

  // OpenAI API call (gpt-3.5-turbo)
  const payload = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 512,
  };

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    console.log("✅ Phản hồi OpenAI:", data);
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
    return "Xin lỗi, tôi không thể trả lời lúc này.";
  } catch (error) {
    console.error("❌ Lỗi gọi OpenAI:", error);
    return "Xin lỗi, có lỗi kết nối đến máy chủ AI.";
  }
}

function initChatbot() {
  loadData();

  const toggle = document.getElementById("chatbot-toggle");
  const closeBtn = document.getElementById("chatbot-close");
  const chatWindow = document.getElementById("chatbot-window");
  const messagesContainer = document.getElementById("chatbot-messages");
  const input = document.getElementById("chatbot-input");
  const sendBtn = document.getElementById("chatbot-send");
  const typingIndicator = document.getElementById("chatbot-typing");

  if (!toggle || !chatWindow) {
    console.error("❌ Không tìm thấy chatbot elements");
    return;
  }

  console.log("✅ Chatbot Bé Vin đã khởi động (OpenAI mode)");

  toggle.onclick = () => {
    chatWindow.classList.add("active");
    toggle.style.display = "none";
    input.focus();
  };
  if (closeBtn)
    closeBtn.onclick = () => {
      chatWindow.classList.remove("active");
      toggle.style.display = "flex";
    };

  if (sendBtn) sendBtn.onclick = sendMessage;
  if (input)
    input.onkeypress = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

  function showTyping() {
    if (typingIndicator) typingIndicator.style.display = "flex";
    setTimeout(
      () => (messagesContainer.scrollTop = messagesContainer.scrollHeight),
      50,
    );
  }
  function hideTyping() {
    if (typingIndicator) typingIndicator.style.display = "none";
  }

  function addMessage(text, isUser = false) {
    if (!messagesContainer) return;
    const msg = document.createElement("div");
    msg.className = `message ${isUser ? "user-message" : "bot-message"}`;
    if (!isUser) {
      const avatar = document.createElement("img");
      avatar.src = "./assets/Mascot VinWonders Nha Trang.png";
      avatar.alt = "Bé Vin";
      avatar.className = "message-avatar";
      avatar.onerror = function () {
        this.style.display = "none";
        const fb = document.createElement("div");
        fb.className = "message-avatar";
        fb.textContent = "🎭";
        fb.style.background = "linear-gradient(135deg,#FF6B35,#FF8C42)";
        fb.style.display = "flex";
        fb.style.alignItems = "center";
        fb.style.justifyContent = "center";
        fb.style.color = "#fff";
        fb.style.fontSize = "18px";
        fb.style.width = "36px";
        fb.style.height = "36px";
        fb.style.borderRadius = "50%";
        fb.style.flexShrink = "0";
        msg.insertBefore(fb, msg.firstChild);
      };
      msg.appendChild(avatar);
    }
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    String(text || "")
      .split("\n")
      .filter(Boolean)
      .forEach((t) => {
        const p = document.createElement("p");
        p.textContent = t;
        bubble.appendChild(p);
      });
    msg.appendChild(bubble);
    messagesContainer.appendChild(msg);
    setTimeout(
      () => (messagesContainer.scrollTop = messagesContainer.scrollHeight),
      100,
    );
  }

  async function sendMessage() {
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    addMessage(message, true);
    input.value = "";
    if (sendBtn) sendBtn.disabled = true;
    showTyping();
    let reply = await askOpenAI(message);
    // If reply is the default fallback, give a creative unrelated answer
    const fallback =
      vinwondersData?.meta?.default_response ||
      "Xin lỗi, tôi chưa có thông tin chính xác về điều đó.";
    if (reply && reply.includes(fallback)) {
      const unrelatedAnswers = [
        "Bạn có biết? Con cá vàng có thể nhớ trong 3 giây! 🐟",
        "Nếu bạn hỏi về VinWonders, tôi sẽ trả lời siêu nhanh! Còn nếu hỏi về vũ trụ, tôi chỉ biết là nó rất rộng 😄",
        "Thời tiết hôm nay ở Nha Trang rất đẹp để đi chơi! Nhưng nếu bạn hỏi về toán học, tôi chỉ biết cộng trừ thôi 😅",
        "Bạn thích ăn kem vị gì nhất? Tôi thì thích vị dâu! 🍓",
        "Nếu bạn hỏi về mèo, tôi chỉ biết là chúng rất dễ thương! 🐱",
        "Bạn có muốn nghe một câu đố không? Cái gì càng lấy ra càng lớn? (Đáp án: cái lỗ)",
        "Tôi có thể kể chuyện cười, nhưng chủ yếu là về VinWonders thôi! 😁",
        "Bạn có thể hỏi tôi về VinWonders, hoặc đơn giản là trò chuyện cho vui!",
      ];
      // Pick a random unrelated answer
      reply =
        unrelatedAnswers[Math.floor(Math.random() * unrelatedAnswers.length)];
    }
    setTimeout(() => {
      hideTyping();
      addMessage(reply);
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }, 400);
  }
}

// chạy khi DOM sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChatbot);
} else {
  initChatbot();
}

console.log("🤖 Chatbot Bé Vin – VinWonders (local-only, keywords-aware)");
