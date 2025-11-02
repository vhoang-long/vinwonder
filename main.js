const slider = document.querySelector(".bodySlider");
const items = document.querySelectorAll(".sliderItem");
let index = 0;

// setInterval(() => {
//   index++;
//   if (index >= items.length) {
//     index = 0;
//   }
//   const scrollAmount = items[index].offsetLeft;
//   slider.scrollTo({
//     left: scrollAmount,
//     behavior: "smooth"
//   });
// }, 1000);

// Highlight active menu item based on current page URL
function setActiveMenuItem() {
  const path = window.location.pathname.split("/").pop();
  const currentFile = path || "index.html";
  const menuMap = {
    "Trang chủ": "index.html",
    "Mua vé": "ticket.html",
    "Mua sắm": "shopping.html",
    "Tài khoản": "user.html",
  };
  document.querySelectorAll(".menuItemLink").forEach((link) => {
    const parent = link.closest(".menuItem");
    if (!parent) return;
    const contentElem = parent.querySelector(".menuItemContent");
    if (!contentElem) return;
    const menuText = contentElem.textContent.trim();
    const expectedFile = menuMap[menuText];
    if (expectedFile && currentFile === expectedFile) {
      parent.classList.add("active");
    } else {
      parent.classList.remove("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", setActiveMenuItem);

// ======== ELEMENT SELECTOR ========
const dropdownHeader = document.querySelector(".dropdown-header");
const dropdownList = document.querySelector(".dropdown-list");
const arrow = document.querySelector(".arrow");
const input = document.getElementById("calendar-input");
const calendar = document.getElementById("calendar");
const destinationSpan = dropdownHeader.querySelector("span");
const continueBtn = document.querySelector(".btn-container");

// ======== STATE ========
let currentDate = new Date();
let selectedDate = null;
let selectedDestination = null;

// ======== DROPDOWN ========
dropdownHeader.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleDropdown();
});

function toggleDropdown(show = null) {
  const shouldShow = show ?? !dropdownList.classList.contains("show");
  dropdownList.classList.toggle("show", shouldShow);
  arrow.classList.toggle("rotate", shouldShow);
}

// Click chọn điểm đến
document.querySelectorAll(".dropdown-list p").forEach((item) => {
  item.addEventListener("click", () => {
    selectedDestination = item.textContent;
    destinationSpan.textContent = selectedDestination;
    toggleDropdown(false);
    checkFormComplete();
  });
});

function renderCalendar(date) {
  calendar.innerHTML = "";
  const month = date.getMonth();
  const year = date.getFullYear();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const header = document.createElement("div");
  header.className = "calendar-header";
  header.innerHTML = `
    <button data-action="prev">◀</button>
    <span>${month + 1}/${year}</span>
    <button data-action="next">▶</button>
  `;
  calendar.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  // Tên thứ
  daysOfWeek.forEach((d) => {
    const dayName = document.createElement("div");
    dayName.textContent = d;
    dayName.className = "day-name";
    grid.appendChild(dayName);
  });

  // Ô trống đầu tháng
  [...Array(firstDay.getDay())].forEach(() =>
    grid.appendChild(document.createElement("div")),
  );

  const today = new Date(); // ngày hiện tại (so sánh)
  today.setHours(0, 0, 0, 0); // reset giờ để so chính xác

  // Ngày
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const thisDate = new Date(year, month, d);
    const day = document.createElement("div");
    day.textContent = d;

    // Nếu là hôm nay
    if (thisDate.toDateString() === new Date().toDateString()) {
      day.classList.add("today");
    }

    // Nếu là ngày được chọn
    if (
      selectedDate &&
      thisDate.toDateString() === selectedDate.toDateString()
    ) {
      day.classList.add("selected");
    }

    // ❌ Nếu ngày nhỏ hơn hôm nay → không cho click
    if (thisDate < today) {
      day.classList.add("disabled");
    } else {
      day.addEventListener("click", () => {
        const now = new Date();

        selectedDate = thisDate;
        input.value = formatDate(selectedDate);
        hideCalendar();
        renderCalendar(currentDate);
        checkFormComplete();
      });
    }

    grid.appendChild(day);
  }

  calendar.append(header, grid);

  // Chuyển tháng
  calendar.querySelectorAll("[data-action]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentDate.setMonth(
        currentDate.getMonth() + (btn.dataset.action === "next" ? 1 : -1),
      );
      renderCalendar(currentDate);
    }),
  );
}

function formatDate(date) {
  const days = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  return `${days[date.getDay()]}, ${date.getDate()}/${
    date.getMonth() + 1
  }/${date.getFullYear()}`;
}

function toggleCalendar() {
  calendar.classList.toggle("hidden");
  if (!calendar.classList.contains("hidden")) renderCalendar(currentDate);
}

function hideCalendar() {
  calendar.classList.add("hidden");
}

// Sự kiện input
input.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleCalendar();
});

// Click ngoài để ẩn cả dropdown & calendar
document.addEventListener("click", (e) => {
  if (!dropdownList.contains(e.target) && !dropdownHeader.contains(e.target))
    toggleDropdown(false);
  if (!calendar.contains(e.target) && e.target !== input) hideCalendar();
});

// ======== BUTTON STATE ========
function checkFormComplete() {
  const isComplete = selectedDestination && selectedDate;
  continueBtn.style.backgroundColor = isComplete ? "#ff6600" : "#ccc";
  continueBtn.style.cursor = isComplete ? "pointer" : "not-allowed";
  continueBtn.disabled = !isComplete;
  continueBtn.style.opacity = isComplete ? "1" : "0.6";
}

checkFormComplete();

continueBtn.addEventListener("click", () => {
  if (!selectedDestination || !selectedDate) return;

  const location = encodeURIComponent(selectedDestination);
  const date = encodeURIComponent(formatDate(selectedDate));

  // Mở trang ticket-detail.html kèm dữ liệu
  const targetUrl = `ticket-detail.html?location=${location}&date=${date}`;
  window.location.href = targetUrl;
});
