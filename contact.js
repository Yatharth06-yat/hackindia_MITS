// ===== 3D tilt that follows the cursor =====
const card = document.getElementById('card');
const stage = document.querySelector('.stage');

let targetX = 0, targetY = 0, curX = 0, curY = 0;
const maxTilt = 6;

stage.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;   // 0..1
  const py = (e.clientY - rect.top) / rect.height;    // 0..1
  targetY = (px - 0.5) * maxTilt * 2;   // rotateY
  targetX = -(py - 0.5) * maxTilt * 2;  // rotateX
});

stage.addEventListener('mouseleave', () => {
  targetX = 0;
  targetY = 0;
});

function animateTilt() {
  curX += (targetX - curX) * 0.08;
  curY += (targetY - curY) * 0.08;
  card.style.transform = `rotateX(${curX}deg) rotateY(${curY}deg)`;
  requestAnimationFrame(animateTilt);
}
animateTilt();

// ===== form submit handling =====
const form = document.getElementById('contactForm');
const statusMsg = document.getElementById('statusMsg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  statusMsg.classList.add('show');

  const btn = form.querySelector('.send-btn .btn-label');
  const original = btn.textContent;
  btn.textContent = 'Transmitting…';

  setTimeout(() => {
    btn.textContent = 'Sent ✓';
    setTimeout(() => {
      btn.textContent = original;
      form.reset();
      statusMsg.classList.remove('show');
    }, 1800);
  }, 900);
});
