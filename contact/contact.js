function initContact() {
    const contactBtn = document.getElementById('contactBtn');
    const contactBox = document.getElementById('contactBox');
    if (!contactBtn || !contactBox) console.log('Contact elements not found');

    contactBtn.onclick = () => {
        if (contactBox.classList.contains('active')) {
        contactBox.classList.remove('active');
        } else {
        contactBox.classList.add('active');
        }
    };
}

// chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContact);
} else {
  initContact();
}