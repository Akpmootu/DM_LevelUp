import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

export function LoginPage({ onLogin, isLoggingIn }: LoginPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particle network animation for interactive background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create particles
    const particleCount = Math.min(Math.floor((width * height) / 18000), 55);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseAlpha: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        baseAlpha: Math.random() * 0.3 + 0.15,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background gradient
      const bgGradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        100,
        width * 0.5,
        height * 0.5,
        Math.max(width, height)
      );
      bgGradient.addColorStop(0, '#FFFFFF');
      bgGradient.addColorStop(0.5, '#FAF8F5');
      bgGradient.addColorStop(1, '#F3ECE7');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.baseAlpha})`;
        ctx.fill();

        // Connect particles close to mouse or each other
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < 180) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          const alpha = (1 - distMouse / 180) * 0.25;
          ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 130) * 0.12;
            ctx.strokeStyle = `rgba(180, 150, 60, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 overflow-hidden font-sans selection:bg-[#D4AF37]/20">
      {/* Dynamic Interactive Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
        aria-hidden="true"
      />

      {/* Decorative Floating Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar / Brand Badge */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <i className="fa-solid fa-chart-line-up text-base" aria-hidden="true"></i>
          </div>
          <span className="font-serif font-bold text-lg text-slate-800 tracking-tight">
            mootu <span className="text-amber-600 font-sans">LevelUp!</span>
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-amber-900/80 bg-amber-50/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-200/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Connected with Google Sheets API
        </span>
      </header>

      {/* Main Login Card Container */}
      <div className="relative z-10 my-auto w-full max-w-md py-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl shadow-amber-900/10 border border-amber-100/80 flex flex-col items-center text-center overflow-hidden"
        >
          {/* Subtle Accent Glow Ring inside Card */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-amber-300/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Badge Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-[11px] font-semibold text-amber-800 tracking-wide uppercase mb-6 shadow-2xs">
            <i className="fa-solid fa-sparkles text-amber-500" aria-hidden="true"></i>
            LevelUp & Professional Growth
          </div>

          {/* Icon Avatar Header */}
          <div className="relative mb-6 group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-18 h-18 rounded-2xl bg-gradient-to-b from-amber-50 to-white border border-amber-200/80 flex items-center justify-center shadow-md">
              <i className="fa-solid fa-address-card text-3xl text-amber-600" aria-hidden="true"></i>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 tracking-tight">
            mootu LevelUp!
          </h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed px-2">
            เข้าสู่ระบบเพื่อบันทึกและจัดการประวัติผลงานส่วนบุคคล
            <br className="hidden sm:inline" />
            พร้อมเชื่อมต่อ Google Sheets โดยตรง
          </p>

          {/* Highlights / Features list */}
          <div className="w-full grid grid-cols-3 gap-2 mb-8">
            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center">
              <i className="fa-solid fa-[#D4AF37] fa-bolt text-amber-500 text-xs mb-1" aria-hidden="true"></i>
              <span className="text-[11px] font-medium text-slate-700">Real-time</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center">
              <i className="fa-solid fa-shield-halved text-amber-500 text-xs mb-1" aria-hidden="true"></i>
              <span className="text-[11px] font-medium text-slate-700">OAuth 2.0</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center">
              <i className="fa-solid fa-chart-line text-amber-500 text-xs mb-1" aria-hidden="true"></i>
              <span className="text-[11px] font-medium text-slate-700">Career Sync</span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            aria-label="Sign in with Google"
            className="group relative w-full flex items-center justify-center gap-3 bg-white hover:bg-amber-50/50 active:scale-[0.98] border border-slate-200 hover:border-amber-300 rounded-2xl py-3.5 px-5 shadow-sm hover:shadow-md hover:shadow-amber-500/10 transition-all duration-200 ease-out disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                <i className="fa-solid fa-circle-notch fa-spin text-amber-600" aria-hidden="true"></i>
                <span>กำลังเข้าสู่ระบบ...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center w-5 h-5 transition-transform duration-200 group-hover:scale-110">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="font-medium text-slate-700 text-sm tracking-wide group-hover:text-slate-900">
                  Sign in with Google
                </span>
                <i className="fa-solid fa-arrow-right text-xs text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all ml-auto" aria-hidden="true"></i>
              </>
            )}
          </button>

          {/* Trust Element */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 leading-tight">
            <i className="fa-solid fa-bolt text-amber-500" aria-hidden="true"></i>
            <span>Securely connected with Google Sheets API. Your data is encrypted.</span>
          </div>
        </motion.div>
      </div>

      {/* Mandatory Footer with IT SSJ Satun 2569 Credit */}
      <footer className="relative z-10 w-full text-center py-3 text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
        <span>พัฒนาโดย IT SSJ Satun 2569</span>
        <i className="fa-solid fa-code text-amber-600" aria-label="code icon"></i>
      </footer>
    </div>
  );
}
