// ===== CẤU HÌNH CHATBOT VINWONDERS =====

// ⚠️ QUAN TRỌNG: BẢO MẬT API KEY
// Đây là file config tạm thời cho development
// Khi deploy lên Vercel, PHẢI dùng Environment Variables

// OpenAI API Key
const OPENAI_API_KEY = "help"; // Thay bằng key: sk-...D1cA

// ===== HƯỚNG DẪN SỬ DỤNG =====
/*
1. DEVELOPMENT (Local):
   - Thay 'YOUR_OPENAI_API_KEY' bằng key thật: sk-proj-...D1cA
   - File này KHÔNG được push lên GitHub

2. PRODUCTION (Vercel):
   - Vào Vercel Dashboard → Settings → Environment Variables
   - Thêm biến: OPENAI_API_KEY = sk-proj-...D1cA
   - Sửa chatbot.js để đọc từ process.env.OPENAI_API_KEY

3. .gitignore:
   - Thêm dòng: chatbot/config.js
   - Để không lộ API key lên GitHub
*/

// Export (nếu cần)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { OPENAI_API_KEY };
}
