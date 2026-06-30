interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

export function triggerConfetti(startX?: number, startY?: number) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };
  resize();

  const colors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Rose
    '#06b6d4', // Cyan
    '#a855f7', // Purple
  ];

  const particles: Particle[] = [];
  const x = startX !== undefined ? startX : window.innerWidth / 2;
  const y = startY !== undefined ? startY : window.innerHeight / 2;

  // Create particles
  const count = 75;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 2 + Math.random() * 8;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 3, // Initial upward burst
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: -0.15 + Math.random() * 0.3,
    });
  }

  const gravity = 0.18;
  const drag = 0.97;

  function update() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let active = false;

    for (const p of particles) {
      if (p.alpha <= 0) continue;
      active = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= drag;
      p.vy *= drag;
      p.vy += gravity;
      p.alpha -= 0.012; // slowly fade out
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      
      // Draw standard confetti rectangles
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
      ctx.restore();
    }

    if (active) {
      requestAnimationFrame(update);
    } else {
      if (canvas.parentNode) {
        document.body.removeChild(canvas);
      }
    }
  }

  requestAnimationFrame(update);
}
