// ============ FIREWORKS ENGINE ============
class FireworksEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.rockets = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createRocket() {
        const x = Math.random() * this.canvas.width;
        const targetY = this.canvas.height * (0.08 + Math.random() * 0.35);
        // Pink-ish hue range: 300-360 (magenta/pink) and 0-20 (red-pink)
        const pinkHues = [310, 320, 330, 340, 345, 350, 355, 0, 5, 10, 15];
        const hue = pinkHues[Math.floor(Math.random() * pinkHues.length)] + (Math.random() * 15 - 7);
        this.rockets.push({
            x, y: this.canvas.height,
            targetY, speed: 4 + Math.random() * 3,
            trail: [], hue
        });
    }

    explode(x, y, hue) {
        const count = 90 + Math.floor(Math.random() * 70);
        const type = Math.floor(Math.random() * 5);

        for (let i = 0; i < count; i++) {
            let angle, speed;

            switch (type) {
                case 0: // Circle
                    angle = (Math.PI * 2 / count) * i;
                    speed = 2 + Math.random() * 4;
                    break;
                case 1: // Star burst
                    angle = Math.random() * Math.PI * 2;
                    speed = 1 + Math.random() * 6;
                    break;
                case 2: // Heart
                    const t = (Math.PI * 2 / count) * i;
                    const hx = 16 * Math.pow(Math.sin(t), 3);
                    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                    angle = Math.atan2(hy, hx);
                    speed = Math.sqrt(hx*hx + hy*hy) * 0.22;
                    break;
                case 3: // Double ring
                    angle = (Math.PI * 2 / count) * i;
                    speed = i % 2 === 0 ? 3 : 5.5;
                    break;
                case 4: // Chrysanthemum
                    angle = (Math.PI * 2 / count) * i;
                    speed = 1.5 + Math.random() * 5;
                    break;
            }

            const cv = (Math.random() - 0.5) * 40;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, decay: 0.006 + Math.random() * 0.012,
                color: `hsl(${hue + cv}, 100%, ${50 + Math.random() * 30}%)`,
                size: 2 + Math.random() * 2.5,
                gravity: 0.025 + Math.random() * 0.02,
                trail: [], sparkle: Math.random() > 0.4,
                glitter: false
            });
        }

        // Glitter
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, decay: 0.004 + Math.random() * 0.008,
                color: `hsl(${hue}, 80%, 90%)`,
                size: 1 + Math.random(),
                gravity: 0.008,
                trail: [], sparkle: true, glitter: true
            });
        }
    }

    update() {
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            r.trail.push({ x: r.x, y: r.y, alpha: 1 });
            if (r.trail.length > 12) r.trail.shift();
            r.trail.forEach(t => t.alpha *= 0.88);
            r.y -= r.speed;
            r.x += Math.sin(r.y * 0.02) * 0.5;
            if (r.y <= r.targetY) {
                this.explode(r.x, r.y, r.hue);
                this.rockets.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.trail.push({ x: p.x, y: p.y, alpha: p.life });
            if (p.trail.length > 6) p.trail.shift();
            p.vx *= 0.99;
            p.vy *= 0.99;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'rgba(45, 27, 51, 0.14)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'lighter';

        // Rocket trails
        for (const r of this.rockets) {
            for (const t of r.trail) {
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = `hsla(${r.hue}, 100%, 75%, ${t.alpha})`;
                this.ctx.fill();
            }
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsl(${r.hue}, 100%, 92%)`;
            this.ctx.fill();
        }

        // Particles
        for (const p of this.particles) {
            for (const t of p.trail) {
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, p.size * 0.4 * t.alpha, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color.replace(')', `, ${t.alpha * 0.25})`).replace('hsl', 'hsla');
                this.ctx.fill();
            }

            const alpha = p.life;
            let size = p.size * p.life;
            if (p.sparkle && p.glitter) size *= (0.5 + Math.random() * 1.5);

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            this.ctx.fill();

            if (alpha > 0.4) {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color.replace(')', `, ${alpha * 0.1})`).replace('hsl', 'hsla');
                this.ctx.fill();
            }
        }
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    startAuto() {
        this.animate();
        this.launchInterval = setInterval(() => {
            const count = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.createRocket(), i * 350);
            }
        }, 1400);
    }

    burstMode() {
        clearInterval(this.launchInterval);
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.createRocket();
                this.createRocket();
            }, i * 180);
        }
        setTimeout(() => {
            this.launchInterval = setInterval(() => {
                const count = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < count; i++) {
                    setTimeout(() => this.createRocket(), i * 200);
                }
            }, 700);
        }, 3500);
    }
}

// ============ SPARKLE & PETAL GENERATOR ============
class ParticleGenerator {
    constructor(container) {
        this.container = container;
        this.sparkleColors = ['#ff69b4', '#ffb6c1', '#ff85a2', '#ffc0cb',
                              '#ff1493', '#fd79a8', '#ffd1dc', '#ff9eb5'];
    }

    start() {
        // Sparkles
        setInterval(() => this.createSparkle(), 400);
        // Cherry blossom petals
        setInterval(() => this.createPetal(), 1200);
    }

    createSparkle() {
        const el = document.createElement('div');
        el.className = 'sparkle';
        const color = this.sparkleColors[Math.floor(Math.random() * this.sparkleColors.length)];
        const size = 2 + Math.random() * 4;
        el.style.cssText = `
            left: ${Math.random() * 100}%;
            top: -10px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            animation-duration: ${5 + Math.random() * 7}s;
            box-shadow: 0 0 ${4 + Math.random() * 8}px ${color};
        `;
        this.container.appendChild(el);
        setTimeout(() => el.remove(), 12000);
    }

    createPetal() {
        const el = document.createElement('div');
        el.className = 'petal';
        const size = 8 + Math.random() * 8;
        el.style.cssText = `
            left: ${Math.random() * 100}%;
            top: -20px;
            width: ${size}px;
            height: ${size * 1.1}px;
            animation-duration: ${8 + Math.random() * 8}s;
            animation-delay: ${Math.random() * 2}s;
        `;
        this.container.appendChild(el);
        setTimeout(() => el.remove(), 18000);
    }
}

// ============ FLOATING HEARTS ============
class FloatingHearts {
    constructor(container) {
        this.container = container;
        this.items = ['❤️', '💕', '💗', '💖', '💝', '🌸', '🥰', '✨', '💋'];
    }

    start() {
        setInterval(() => this.create(), 900);
    }

    create() {
        if (!this.container || !this.container.offsetParent) return;
        const el = document.createElement('span');
        el.className = 'mini-heart';
        el.textContent = this.items[Math.floor(Math.random() * this.items.length)];
        el.style.cssText = `
            left: ${Math.random() * 100}%;
            animation-duration: ${2.5 + Math.random() * 3}s;
            font-size: ${0.8 + Math.random() * 0.8}rem;
        `;
        this.container.appendChild(el);
        setTimeout(() => el.remove(), 6000);
    }
}

// ============ MAIN APP ============
class NewYearApp {
    constructor() {
        this.targetDate = new Date('2026-02-17T00:00:00');
        this.isReady = false;
        this.letterOpened = false;
        this.init();
    }

    init() {
        // Fireworks
        const canvas = document.getElementById('fireworks');
        this.fireworks = new FireworksEngine(canvas);
        this.fireworks.startAuto();

        // Particles (sparkles + petals)
        const sparkleContainer = document.getElementById('sparkles');
        this.particles = new ParticleGenerator(sparkleContainer);
        this.particles.start();

        // Countdown
        this.updateCountdown();
        this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);

        // Button
        document.getElementById('open-letter-btn')
            .addEventListener('click', () => this.openLetter());
    }

    updateCountdown() {
        const now = new Date();
        const diff = this.targetDate - now;

        if (diff <= 0) {
            this.isReady = true;
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';

            const btn = document.getElementById('open-letter-btn');
            btn.disabled = false;
            btn.classList.add('ready');

            const notice = document.getElementById('btn-notice');
            notice.textContent = '✨ Đã đến lúc rồi! Nhấn nút để mở thư yêu thương nhé~ 🥰 ✨';
            notice.classList.add('ready-notice');

            document.querySelector('.subtitle').textContent = 'Khoảnh khắc giao thừa đã đến rồi~ 🌸💕';

            clearInterval(this.countdownInterval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    openLetter() {
        if (!this.isReady || this.letterOpened) return;
        this.letterOpened = true;

        // Burst fireworks
        this.fireworks.burstMode();

        // Transition
        const countdownSection = document.getElementById('countdown-section');
        countdownSection.style.animation = 'fadeOut 0.8s ease forwards';

        setTimeout(() => {
            countdownSection.classList.add('hidden');
            const letterSection = document.getElementById('letter-section');
            letterSection.classList.remove('hidden');
            letterSection.style.animation = 'fadeInUp 1.2s ease-out';

            // Floating hearts
            setTimeout(() => {
                const heartsContainer = document.getElementById('floating-hearts');
                this.floatingHearts = new FloatingHearts(heartsContainer);
                this.floatingHearts.start();
            }, 2000);

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 900);
    }
}

// ============ START ============
document.addEventListener('DOMContentLoaded', () => {
    new NewYearApp();
});
