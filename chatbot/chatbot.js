// ===== CHATBOT VINWONDERS - BÉ VIN (Phiên bản tối ưu local vs  OpenAI) =====


// 🔑 API key demo
const OPENAI_API_KEY = "sk-...DlcA";

let vinwondersData = null;
let openaiApiKey = OPENAI_API_KEY;


// ---------------- LOAD DỮ LIỆU cấu hình OpenAI ----------------
async function loadData() {
  try {
    const response = await fetch('./chatbot/data.json');
    vinwondersData = await response.json();
    console.log('✅ Dữ liệu VinWonders đã load (local)');
  } catch (error) {
    console.error('❌ Lỗi load dữ liệu:', error);
  }
}

// ---------------- KHỞI TẠO GIAO DIỆN ----------------
function initChatbot() {
  loadData();

  const toggle = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
  const chatWindow = document.getElementById('chatbot-window');
  const messagesContainer = document.getElementById('chatbot-messages');
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const typingIndicator = document.getElementById('chatbot-typing');

  if (!toggle || !chatWindow) {
    console.error('❌ Không tìm thấy chatbot elements');
    return;
  }

  console.log('✅ Chatbot Bé Vin đã khởi động (local-only mode)');

  // mở/đóng
  toggle.onclick = () => { chatWindow.classList.add('active'); toggle.style.display = 'none'; input.focus(); };
  if (closeBtn) closeBtn.onclick = () => { chatWindow.classList.remove('active'); toggle.style.display = 'flex'; };

  // gửi tin nhắn
  if (sendBtn) sendBtn.onclick = sendMessage;
  if (input) input.onkeypress = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  function showTyping() { if (typingIndicator) typingIndicator.style.display = 'flex'; setTimeout(() => messagesContainer.scrollTop = messagesContainer.scrollHeight, 50); }
  function hideTyping() { if (typingIndicator) typingIndicator.style.display = 'none'; }

  function addMessage(text, isUser = false) {
    if (!messagesContainer) return;
    const msg = document.createElement('div');
    msg.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    if (!isUser) {
      const avatar = document.createElement('img');
      avatar.src = './assets/Mascot VinWonders Nha Trang.png';
      avatar.alt = 'Bé Vin';
      avatar.className = 'message-avatar';
      avatar.onerror = function () {
        this.style.display = 'none';
        const fb = document.createElement('div');
        fb.className = 'message-avatar';
        fb.textContent = '🎭';
        fb.style.background = 'linear-gradient(135deg,#FF6B35,#FF8C42)';
        fb.style.display = 'flex';
        fb.style.alignItems = 'center';
        fb.style.justifyContent = 'center';
        fb.style.color = '#fff';
        fb.style.fontSize = '18px';
        fb.style.width = '36px';
        fb.style.height = '36px';
        fb.style.borderRadius = '50%';
        fb.style.flexShrink = '0';
        msg.insertBefore(fb, msg.firstChild);
      };
      msg.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    String(text || '').split('\n').filter(Boolean).forEach(t => {
      const p = document.createElement('p'); p.textContent = t; bubble.appendChild(p);
    });
    msg.appendChild(bubble);
    messagesContainer.appendChild(msg);
    setTimeout(() => messagesContainer.scrollTop = messagesContainer.scrollHeight, 100);
  }

  async function sendMessage() {
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    addMessage(message, true);
    input.value = ''; if (sendBtn) sendBtn.disabled = true;
    showTyping();
    const reply = await findAnswer(message);
    setTimeout(() => {
      hideTyping();
      addMessage(reply || 'Xin lỗi, mình chưa có thông tin đó. Bạn có thể gọi hotline: 1900 6677.');
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }, 400);
  }

  async function findAnswer(q) {
    return searchInData(q) || null;
  }

  // ---------------- HỔ TRỢ HÀM TIỆN ÍCH ----------------
  function includesAny(text, arr) {
    if (!text || !arr) return false;
    const t = text.toLowerCase();
    return arr.some(a => a && t.includes(a.toLowerCase()));
  }

  function matchKeywordsEntity(q, entity) {
    // entity may have .keywords (array) or name/title fields to match
    if (!entity) return false;
    if (entity.keywords && includesAny(q, entity.keywords)) return true;
    // check common name fields
    const nameFields = ['ten', 'name', 'title', 'question'];
    for (const f of nameFields) {
      if (entity[f] && q.includes(String(entity[f]).toLowerCase())) return true;
    }
    return false;
  }

  // ---------------- TÌM TRONG DỮ LIỆU LOCAL (PRIORITY MATCH) ----------------
  function searchInData(query) {
    if (!vinwondersData || !query) return null;
    const q = query.toLowerCase().trim();

    // 1) FAQ exact/keywords first
    if (vinwondersData.faq) {
      for (const f of vinwondersData.faq) {
        if (matchKeywordsEntity(q, f)) return f.answer;
        // also try question contains query (short queries)
        if (f.question && f.question.toLowerCase().includes(q)) return f.answer;
      }
    }

    // 2) Hàng chờ ảo explicit
    if ((q.includes('hàng chờ ảo') || (q.includes('hàng chờ') && q.includes('ảo') || q === 'hàng chờ')) && vinwondersData.hang_cho_ao) {
      return `📱 Hàng chờ ảo\n\n${vinwondersData.hang_cho_ao}`;
    }

    // 3) VÉ - first try specific then fallback to list
    if (vinwondersData.loai_ve && q.includes('vé')) {
      // try specific keyword matches
      for (const ve of vinwondersData.loai_ve) {
        if (ve.keywords && includesAny(q, ve.keywords)) {
          return formatTicket(ve);
        }
        // match by name (loose)
        if (ve.ten && q.includes(ve.ten.toLowerCase())) return formatTicket(ve);
      }

      // additional heuristics (common phrases)
      if (q.includes('16h') || q.includes('sau 16') || q.includes('sau 16h') || q.includes('chiều')) {
        const found = vinwondersData.loai_ve.find(v => v.ten.toLowerCase().includes('sau') || v.ten.toLowerCase().includes('16'));
        if (found) return formatTicket(found);
      }
      if (q.includes('buffet')) {
        const found = vinwondersData.loai_ve.find(v => v.ten.toLowerCase().includes('buffet'));
        if (found) return formatTicket(found);
      }
      if (q.includes('2 ngày') || q.includes('2 ngay') || q.includes('hai ngày')) {
        const found = vinwondersData.loai_ve.find(v => v.ten.toLowerCase().includes('2 ngày') || v.ten.toLowerCase().includes('2 ngay') || v.ten.toLowerCase().includes('2'));
        if (found) return formatTicket(found);
      }

      // fallback: list all tickets
      return vinwondersData.loai_ve.map((v, i) => `🎫 ${i+1}. ${v.ten}\n👤 Người lớn: ${v.gia_nguoi_lon}\n👶 Trẻ em: ${v.gia_tre_em_nguoi_gia}`).join('\n\n');
    }

    // 4) THÔNG TIN CƠ BẢN
    const info = vinwondersData.thong_tin_co_ban;
    if (info) {
      if (q.includes('mở cửa') || q.includes('giờ') || q.includes('mấy giờ')) return `⏰ Giờ mở cửa: ${info.gio_mo_cua}`;
      if (q.includes('địa chỉ') || q.includes('ở đâu') || q.includes('chỗ nào')) return `📍 Địa chỉ: ${info.dia_chi}`;
      if (q.includes('quy định') || q.includes('quy tắc')) return `📋 Quy định: ${info.quy_dinh}`;
    }

    // 5) GAMES - specific matches first
    if (vinwondersData.games) {
      for (const g of vinwondersData.games) {
        if (g.keywords && includesAny(q, g.keywords)) return formatGame(g);
        if (g.name && q.includes(g.name.toLowerCase())) return formatGame(g);
      }
      // ask for list
      if (q.includes('trò chơi') || q.includes('game') || q.includes('chơi gì')) {
        return vinwondersData.games.slice(0, 6).map(g => `🎢 ${g.name} — ${g.description}`).join('\n\n');
      }
    }

    // 6) DYNAMIC INFO (wait times, maintenance)
    const di = vinwondersData.dynamic_info?.tro_choi;
    if (di) {
      if ((q.includes('giải mã') || q.includes('giai ma') || q.includes('mê cung')) && di.giai_ma_me_cung) return di.giai_ma_me_cung;
      if ((q.includes('rạp phim') || q.includes('rap phim') || q.includes('rạp')) && di.rap_phim_bay) return di.rap_phim_bay;
      if (q.includes('bảo trì') || q.includes('bảo tri') || q.includes('đang bảo trì')) {
        return di.bao_tri || (vinwondersData.thong_bao && vinwondersData.thong_bao.bao_tri?.join('\n')) || 'Hiện không có thông tin bảo trì.';
      }
    }

    // 7) CHỈ ĐƯỜNG - match both from/to or parse "từ ... đến ..."
    const routes = vinwondersData.dynamic_info?.tro_choi?.chi_duong || [];
    if (routes.length > 0) {
      // direct from->to
      for (const r of routes) {
        if (q.includes(r.tu.toLowerCase()) && q.includes(r.den.toLowerCase())) {
          return `🗺️ Từ ${r.tu} đến ${r.den}:\n📏 ${r.khoang_cach}\n⏱ ${r.thoi_gian_di_bo}${r.mo_ta ? '\n' + r.mo_ta : ''}`;
        }
      }
      // parse "từ X đến Y" pattern (loose)
      if (q.includes('từ') && q.includes('đến')) {
        // extract tokens
        const afterTu = q.split('từ')[1];
        if (afterTu) {
          const parts = afterTu.split('đến');
          if (parts.length >= 2) {
            const from = parts[0].trim();
            const to = parts[1].trim().split(' ')[0]; // take first word of rest (loose)
            for (const r of routes) {
              if (r.tu.toLowerCase().includes(from) && r.den.toLowerCase().includes(to)) {
                return `🗺️ Từ ${r.tu} đến ${r.den}:\n📏 ${r.khoang_cach}\n⏱ ${r.thoi_gian_di_bo}${r.mo_ta ? '\n' + r.mo_ta : ''}`;
              }
            }
          }
        }
      }
      // if query mentions "bao xa" or "đi bộ" and contains any route endpoints, give nearest matches
      if (q.includes('bao xa') || q.includes('đi bộ') || q.includes('khoảng')) {
        const matches = routes.filter(r => q.includes(r.tu.toLowerCase()) || q.includes(r.den.toLowerCase()));
        if (matches.length) {
          return matches.map(r => `🗺️ ${r.tu} → ${r.den}: ${r.khoang_cach} (${r.thoi_gian_di_bo})`).join('\n');
        }
      }
    }

    // 8) ẨM THỰC (nhà hàng)
    const food = vinwondersData.khu_vuc?.am_thuc?.nha_hang || [];
    if (food.length && (q.includes('nhà hàng') || q.includes('ăn') || q.includes('buffet') || q.includes('food'))) {
      for (const n of food) {
        if (n.keywords && includesAny(q, n.keywords)) return formatRestaurant(n);
        if (n.ten && q.includes(n.ten.toLowerCase())) return formatRestaurant(n);
      }
      return food.map(n => `🍴 ${n.ten} — khu ${n.khu_vuc}\n⏰ ${n.gio_hoat_dong || '—'}`).join('\n\n');
    }

    // 9) MUA SẮM (shops)
    const shops = vinwondersData.khu_vuc?.mua_sam?.cua_hang || [];
    if (shops.length && (q.includes('shop') || q.includes('cửa hàng') || q.includes('mua sắm') || q.includes('quà'))) {
      for (const s of shops) {
        if (s.keywords && includesAny(q, s.keywords)) return formatShop(s);
        if (s.ten && q.includes(s.ten.toLowerCase())) return formatShop(s);
      }
      return shops.map(s => `🛍️ ${s.ten} — khu ${s.khu_vuc}\n⏰ ${s.gio_hoat_dong || '—'}`).join('\n\n');
    }

    // 10) LỊCH BIỂU DIỄN / SHOW
    const shows = vinwondersData.khu_vuc?.lich_bieu_dien?.su_kien || [];
    if (shows.length && (q.includes('show') || q.includes('biểu diễn') || q.includes('tata') || q.includes('biểu'))) {
      for (const s of shows) {
        if (s.keywords && includesAny(q, s.keywords)) return formatShow(s);
        if (s.ten && q.includes(s.ten.toLowerCase())) return formatShow(s);
      }
      return shows.map(s => `🎭 ${s.ten} — khu ${s.khu_vuc}\n⏰ ${s.gio}`).join('\n\n');
    }

    // 11) LIÊN HỆ
    const lh = vinwondersData.lien_he;
    if (lh && (q.includes('liên hệ') || q.includes('hotline') || q.includes('email') || q.includes('số điện thoại'))) {
      return `📞 Thông tin liên hệ:\n\n☎️ Hotline: ${lh.hotline}\n📧 Email: ${lh.email}\n🌐 Website: ${lh.website}\n📱 App: ${lh.app}`;
    }

    // 12) THÔNG BÁO / CHÀO MỪNG
    const tb = vinwondersData.thong_bao;
    if (tb) {
      if (q.includes('chào') || q.includes('hello') || q.includes('hi')) return tb.chao_mung || 'Chào bạn!';
      if (q.includes('bảo trì')) return tb.bao_tri ? tb.bao_tri.join('\n') : 'Không có thông tin bảo trì hiện tại.';
    }

    // not found locally
    return null;
  }

  // ---------------- HELPERS (FORMATTERS) ----------------
  function formatTicket(ve) {
    return `🎟️ ${ve.ten}\n\n👤 Người lớn: ${ve.gia_nguoi_lon}\n👶 Trẻ em/Người già: ${ve.gia_tre_em_nguoi_gia}\n\n💬 ${ve.mo_ta || ''}`;
  }
  function formatGame(g) {
    return `🎢 ${g.name}\n\n${g.description}\n\n⏱ Thời gian chờ: ${g.waitTime || '—'}\n📍 Vị trí: ${g.location || '—'}\n👤 Độ tuổi: ${g.ageLimit || '—'}\n📏 Chiều cao: ${g.heightLimit || '—'}\n⚡ Độ mạnh: ${g.intensity || '—'}`;
  }
  function formatRestaurant(n) {
    return `🍽️ ${n.ten}\n📍 Khu: ${n.khu_vuc || '—'}\n⏰ Giờ phục vụ: ${n.gio_hoat_dong || '—'}`;
  }
  function formatShop(s) {
    return `🛍️ ${s.ten}\n📍 Khu: ${s.khu_vuc || '—'}\n⏰ Giờ: ${s.gio_hoat_dong || '—'}`;
  }
  function formatShow(s) {
    return `🎭 ${s.ten}\n📍 Khu: ${s.khu_vuc || '—'}\n⏰ ${s.gio || '—'}`;
  }
}

// chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}

console.log('🤖 Chatbot Bé Vin – VinWonders (local-only, keywords-aware)');
