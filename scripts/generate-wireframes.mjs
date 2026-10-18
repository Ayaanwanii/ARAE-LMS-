import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir, writeFile } from 'fs/promises';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'wireframes');

const C = {
  bg: '#f8fafc',
  panel: '#ffffff',
  panel2: '#f1f5f9',
  ink: '#0f172a',
  text: '#1f2937',
  muted: '#64748b',
  stroke: '#94a3b8',
  stroke2: '#cbd5e1',
  accent: '#4f46e5',
  accent2: '#7c3aed',
  good: '#059669',
  warn: '#d97706',
  danger: '#dc2626',
  dark: '#111827',
};

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

class Board {
  constructor({ width = 1440, height = 1000, code, title, route, source }) {
    this.width = width;
    this.height = height;
    this.parts = [];
    this.code = code;
    this.title = title;
    this.route = route;
    this.source = source;
  }

  rect(x, y, w, h, opts = {}) {
    const {
      fill = C.panel,
      stroke = C.stroke2,
      sw = 1,
      r = 12,
      opacity = 1,
      dash = '',
    } = opts;
    this.parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
    );
  }

  line(x1, y1, x2, y2, opts = {}) {
    const { stroke = C.stroke, sw = 1.5, dash = '', opacity = 1 } = opts;
    this.parts.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
    );
  }

  circle(cx, cy, r, opts = {}) {
    const {
      fill = C.panel2,
      stroke = C.stroke2,
      sw = 1,
      opacity = 1,
      dash = '',
    } = opts;
    this.parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
    );
  }

  path(d, opts = {}) {
    const { fill = 'none', stroke = C.stroke, sw = 1.5, opacity = 1, dash = '' } = opts;
    this.parts.push(
      `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
    );
  }

  text(x, y, value, opts = {}) {
    const {
      size = 16,
      weight = 600,
      fill = C.text,
      anchor = 'start',
      family = 'Arial, Helvetica, sans-serif',
      opacity = 1,
    } = opts;
    this.parts.push(
      `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}">${esc(value)}</text>`
    );
  }

  multiline(x, y, lines, opts = {}) {
    const { size = 14, lineHeight = 20, weight = 500, fill = C.muted } = opts;
    lines.forEach((line, i) => this.text(x, y + i * lineHeight, line, { size, weight, fill }));
  }

  skeleton(x, y, w, widths = [1, 0.75, 0.55], opts = {}) {
    const { gap = 12, h = 9, fill = C.stroke2, r = 5, opacity = 0.8 } = opts;
    widths.forEach((pct, i) => {
      this.rect(x, y + i * gap, Math.round(w * pct), h, {
        fill,
        stroke: fill,
        r,
        opacity,
      });
    });
  }

  render() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e2e8f0" stroke-width="1"/>
    </pattern>
    <linearGradient id="hero" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${C.accent}"/>
      <stop offset="100%" stop-color="${C.accent2}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${C.bg}"/>
  ${caption(this)}
  ${this.parts.join('\n  ')}
</svg>`;
  }
}

function caption(b) {
  return `<rect x="0" y="0" width="${b.width}" height="62" fill="${C.ink}"/>
  <text x="32" y="38" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" fill="#ffffff">${esc(`${b.code} ${b.title}`)}</text>
  <text x="${b.width - 32}" y="25" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" fill="#c7d2fe" text-anchor="end">${esc(b.route)}</text>
  <text x="${b.width - 32}" y="45" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="500" fill="#94a3b8" text-anchor="end">${esc(b.source)}</text>`;
}

function button(b, x, y, w, h, label, opts = {}) {
  const { fill = C.panel2, stroke = C.stroke, textFill = C.text, active = false } = opts;
  b.rect(x, y, w, h, {
    fill: active ? C.accent : fill,
    stroke: active ? C.accent : stroke,
    r: 10,
  });
  b.text(x + w / 2, y + h / 2 + 5, label, {
    size: 13,
    weight: 700,
    fill: active ? '#ffffff' : textFill,
    anchor: 'middle',
  });
}

function pill(b, x, y, w, h, label, active = false) {
  b.rect(x, y, w, h, {
    fill: active ? '#eef2ff' : C.panel,
    stroke: active ? C.accent : C.stroke2,
    r: h / 2,
  });
  b.text(x + w / 2, y + h / 2 + 4, label, {
    size: 12,
    weight: 700,
    fill: active ? C.accent : C.muted,
    anchor: 'middle',
  });
}

function input(b, x, y, w, h, label, placeholder = '') {
  b.text(x, y - 8, label, { size: 12, weight: 700, fill: C.text });
  b.rect(x, y, w, h, { fill: C.panel, stroke: C.stroke2, r: 10 });
  if (placeholder) b.text(x + 14, y + h / 2 + 4, placeholder, { size: 12, weight: 500, fill: C.muted });
}

function imageBox(b, x, y, w, h, label = 'image / media') {
  b.rect(x, y, w, h, { fill: '#e5e7eb', stroke: C.stroke, r: 12 });
  b.line(x + 12, y + h - 12, x + w / 2, y + h / 2, { stroke: C.stroke, sw: 1 });
  b.line(x + w / 2, y + h / 2, x + w - 12, y + h - 12, { stroke: C.stroke, sw: 1 });
  b.circle(x + w - 38, y + 34, 12, { fill: C.panel, stroke: C.stroke });
  b.text(x + w / 2, y + h / 2 + 5, label, { size: 13, weight: 700, fill: C.muted, anchor: 'middle' });
}

function tabBar(b, x, y, labels, active = 0, widths = []) {
  let cursor = x;
  labels.forEach((label, i) => {
    const w = widths[i] || Math.max(120, label.length * 9 + 34);
    b.rect(cursor, y, w, 44, {
      fill: i === active ? '#eef2ff' : C.panel,
      stroke: C.stroke2,
      r: 0,
    });
    b.text(cursor + w / 2, y + 28, label, {
      size: 13,
      weight: 800,
      fill: i === active ? C.accent : C.muted,
      anchor: 'middle',
    });
    if (i === active) b.line(cursor, y + 43, cursor + w, y + 43, { stroke: C.accent, sw: 3 });
    cursor += w;
  });
}

function dashboardNav(b, active = 'Programs', y = 84) {
  const x = 100;
  const w = 1240;
  b.rect(x, y, w, 64, { fill: '#ffffff', stroke: '#dbe4f0', r: 28 });
  b.rect(x + 24, y + 17, 30, 30, { fill: C.ink, stroke: C.ink, r: 8 });
  b.text(x + 64, y + 39, 'ARAE LMS', { size: 18, weight: 900, fill: C.ink });
  const links = ['Programs', 'News', 'Rewards', 'Calendar'];
  let lx = x + 300;
  links.forEach((label) => {
    const isActive = label === active;
    b.rect(lx, y + 15, 116, 34, {
      fill: isActive ? '#eef2ff' : '#ffffff',
      stroke: isActive ? '#c7d2fe' : '#ffffff',
      r: 17,
    });
    b.circle(lx + 19, y + 32, 5, { fill: isActive ? C.accent : C.stroke, stroke: 'none' });
    b.text(lx + 34, y + 37, label, { size: 13, weight: 700, fill: isActive ? C.accent : C.muted });
    lx += 130;
  });
  b.circle(x + w - 88, y + 32, 16, { fill: C.panel2, stroke: C.stroke2 });
  b.text(x + w - 88, y + 37, 'bell', { size: 9, weight: 700, fill: C.muted, anchor: 'middle' });
  b.circle(x + w - 38, y + 32, 17, { fill: C.accent, stroke: C.accent });
  b.text(x + w - 38, y + 38, 'U', { size: 14, weight: 800, fill: '#fff', anchor: 'middle' });
}

function landingNav(b, y = 84) {
  const x = 100;
  b.rect(x, y, 1240, 62, { fill: '#ffffff', stroke: '#dbe4f0', r: 24 });
  b.rect(x + 24, y + 16, 30, 30, { fill: C.ink, stroke: C.ink, r: 8 });
  b.text(x + 64, y + 38, 'ARAE LMS', { size: 18, weight: 900, fill: C.ink });
  ['Home', 'About', 'Contacts', 'Dashboard'].forEach((label, i) => {
    b.text(x + 720 + i * 100, y + 38, label, { size: 13, weight: 700, fill: C.muted });
  });
  button(b, x + 1120, y + 14, 92, 34, 'Sign In', { active: true });
}

function statCard(b, x, y, w, h, title, value, accent = C.accent) {
  b.rect(x, y, w, h, { fill: C.panel, stroke: C.stroke2, r: 16 });
  b.rect(x + 18, y + 18, 42, 42, { fill: `${accent}22`, stroke: `${accent}44`, r: 12 });
  b.circle(x + 39, y + 39, 8, { fill: accent, stroke: 'none' });
  b.text(x + 74, y + 35, title, { size: 11, weight: 800, fill: C.muted });
  b.text(x + 74, y + 62, value, { size: 26, weight: 900, fill: C.ink });
}

function programCard(b, x, y, w = 380, h = 286, opts = {}) {
  const { joined = false, locked = false } = opts;
  b.rect(x, y, w, h, { fill: C.panel, stroke: C.stroke2, r: 20 });
  imageBox(b, x, y, w, 126, 'programme cover');
  pill(b, x + w - 118, y + 14, 96, 24, 'Category', true);
  if (locked) pill(b, x + 16, y + 90, 72, 24, 'Locked', false);
  if (joined) {
    b.rect(x, y + 121, w, 5, { fill: C.stroke2, stroke: 'none', r: 0 });
    b.rect(x, y + 121, w * 0.58, 5, { fill: C.accent, stroke: 'none', r: 0 });
  }
  b.text(x + 20, y + 160, 'Programme title', { size: 17, weight: 800, fill: C.ink });
  b.skeleton(x + 20, y + 182, w - 40, [0.92, 0.68], { h: 8, gap: 13 });
  b.line(x + 20, y + 236, x + w - 20, y + 236, { stroke: C.stroke2 });
  b.text(x + 20, y + 260, 'participants', { size: 11, weight: 700, fill: C.muted });
  b.text(x + 122, y + 260, 'duration', { size: 11, weight: 700, fill: C.muted });
  pill(b, x + w - 170, y + 245, 68, 24, 'Online');
  pill(b, x + w - 92, y + 245, 68, 24, 'Public');
}

function table(b, x, y, w, h, headers, rowCount = 5) {
  b.rect(x, y, w, h, { fill: C.panel, stroke: C.stroke2, r: 14 });
  const headH = 40;
  b.rect(x, y, w, headH, { fill: C.panel2, stroke: 'none', r: 14 });
  const colW = w / headers.length;
  headers.forEach((header, i) => {
    b.text(x + 18 + i * colW, y + 26, header, { size: 11, weight: 800, fill: C.muted });
  });
  const rowH = (h - headH) / rowCount;
  for (let r = 0; r < rowCount; r += 1) {
    const yy = y + headH + r * rowH;
    b.line(x, yy, x + w, yy, { stroke: C.stroke2, sw: 1 });
    headers.forEach((_, i) => {
      b.skeleton(x + 18 + i * colW, yy + rowH / 2 - 4, colW - 34, [0.78], { h: 7, gap: 0, opacity: 0.75 });
    });
  }
}

function barList(b, x, y, w, h, title, labels) {
  b.rect(x, y, w, h, { fill: C.panel, stroke: C.stroke2, r: 16 });
  b.text(x + 22, y + 32, title, { size: 17, weight: 800, fill: C.ink });
  labels.forEach((label, i) => {
    const yy = y + 64 + i * 42;
    const pct = [0.84, 0.68, 0.51, 0.39, 0.25][i % 5];
    b.text(x + 22, yy, label, { size: 12, weight: 700, fill: C.text });
    b.rect(x + 22, yy + 10, w - 44, 8, { fill: C.panel2, stroke: 'none', r: 4 });
    b.rect(x + 22, yy + 10, (w - 44) * pct, 8, { fill: C.accent, stroke: 'none', r: 4 });
  });
}

function buildLanding() {
  const b = new Board({
    code: '4.4.3.1',
    title: 'Landing Page Wireframe',
    route: 'Route: /',
    source: 'app/page.tsx, components/layout/LandingNavbar.tsx',
  });
  landingNav(b);
  b.rect(0, 166, 1440, 332, { fill: 'url(#hero)', stroke: 'none', r: 0 });
  b.rect(0, 166, 1440, 332, { fill: 'url(#grid)', stroke: 'none', r: 0, opacity: 0.18 });
  b.text(110, 230, 'Hero: Master Life Skills with ARAE LMS', { size: 31, weight: 900, fill: '#ffffff' });
  b.skeleton(110, 260, 520, [0.95, 0.88, 0.64], { h: 26, gap: 36, fill: '#dbeafe', opacity: 0.8 });
  b.skeleton(110, 382, 560, [0.9, 0.68], { h: 10, gap: 18, fill: '#cbd5e1', opacity: 0.8 });
  button(b, 110, 432, 150, 42, 'Explore Programs', { fill: '#ffffff', stroke: '#ffffff', textFill: C.ink });
  button(b, 278, 432, 112, 42, 'Sign In', { fill: '#1f2937', stroke: '#94a3b8', textFill: '#ffffff' });
  b.rect(820, 218, 430, 230, { fill: '#ffffff22', stroke: '#cbd5e1', r: 22 });
  imageBox(b, 848, 246, 374, 122, 'featured programme preview');
  b.skeleton(848, 392, 300, [1, 0.7], { h: 10, gap: 17, fill: '#e2e8f0', opacity: 0.75 });

  b.text(620, 550, 'Featured Programs', { size: 24, weight: 900, fill: C.ink, anchor: 'middle' });
  b.skeleton(510, 575, 420, [1, 0.72], { h: 9, gap: 15, fill: C.stroke2 });
  [100, 530, 960].forEach((x) => programCard(b, x, 625, 330, 218));

  b.rect(0, 880, 1440, 120, { fill: '#eef2ff', stroke: 'none', r: 0 });
  ['Interactive Learning', 'Real Experiences', 'Corporate & School Events'].forEach((label, i) => {
    const x = 115 + i * 430;
    b.rect(x, 805, 350, 118, { fill: C.panel, stroke: C.stroke2, r: 16 });
    b.rect(x + 22, 830, 42, 42, { fill: '#eef2ff', stroke: '#c7d2fe', r: 12 });
    b.text(x + 82, 850, label, { size: 15, weight: 900, fill: C.ink });
    b.skeleton(x + 82, 870, 220, [1, 0.7], { h: 7, gap: 12 });
  });
  b.text(720, 950, 'CTA Footer: Ready to Start Learning?', { size: 20, weight: 900, fill: C.accent, anchor: 'middle' });
  return b;
}

function buildAuth() {
  const b = new Board({
    code: '4.4.3.2',
    title: 'Authentication Wireframe',
    route: 'Routes: /login, /signup, /forgot-password',
    source: 'app/(auth)/login/page.tsx, app/(auth)/signup/page.tsx',
  });
  b.rect(0, 62, 1440, 938, { fill: '#111827', stroke: 'none', r: 0 });
  b.circle(360, 260, 150, { fill: 'none', stroke: '#818cf8', sw: 2, opacity: 0.55, dash: '10 10' });
  b.circle(1040, 730, 170, { fill: 'none', stroke: '#a78bfa', sw: 2, opacity: 0.55, dash: '10 10' });
  authCard(b, 280, 150, 'Login', ['Email', 'Password'], 'Sign In', 'Sign in with Google');
  authCard(b, 770, 150, 'Sign Up', ['Full Name', 'Email', 'Password', 'Confirm Password'], 'Create Account', 'Sign up with Google');
  b.text(720, 910, 'Shared dark glassmorphism shell, centered card, logo header, form validation, Google auth, route cross-links', {
    size: 15,
    weight: 700,
    fill: '#dbeafe',
    anchor: 'middle',
  });
  return b;
}

function authCard(b, x, y, title, fields, primary, social) {
  b.rect(x, y, 390, 640, { fill: '#0f172acc', stroke: '#334155', r: 26 });
  b.rect(x + 165, y + 34, 60, 44, { fill: C.panel2, stroke: C.stroke2, r: 12 });
  b.text(x + 195, y + 62, 'Logo', { size: 12, weight: 800, fill: C.ink, anchor: 'middle' });
  b.text(x + 195, y + 118, title === 'Login' ? 'Welcome Back' : 'Join ARAE LMS', {
    size: 24,
    weight: 900,
    fill: '#ffffff',
    anchor: 'middle',
  });
  b.text(x + 195, y + 146, title === 'Login' ? 'access your educational programmes' : 'create your learner account', {
    size: 12,
    weight: 600,
    fill: '#cbd5e1',
    anchor: 'middle',
  });
  let yy = y + 200;
  fields.forEach((field) => {
    input(b, x + 40, yy, 310, 46, field, field.includes('Password') ? 'password input' : 'text input');
    yy += 82;
  });
  if (title === 'Login') b.text(x + 256, y + 356, 'Forgot password?', { size: 11, weight: 700, fill: '#a5b4fc' });
  button(b, x + 40, y + 480, 310, 46, primary, { active: true });
  b.line(x + 40, y + 555, x + 350, y + 555, { stroke: '#334155' });
  button(b, x + 40, y + 586, 310, 42, social, { fill: '#1e293b', stroke: '#475569', textFill: '#e2e8f0' });
}

function buildCatalogue() {
  const b = new Board({
    code: '4.4.3.3',
    title: 'Programme Catalogue Wireframe',
    route: 'Route: /programs',
    source: 'app/(dashboard)/programs/page.tsx, ProgramFilters, ProgramCard',
  });
  dashboardNav(b, 'Programs');
  b.rect(100, 176, 1240, 102, { fill: '#ffffffcc', stroke: C.stroke2, r: 0 });
  b.text(130, 218, 'Programs', { size: 25, weight: 900, fill: C.accent });
  b.text(130, 248, 'Curated collection of educational programmes', { size: 14, weight: 600, fill: C.muted });
  button(b, 940, 204, 90, 36, 'Menu');
  ['Global Streak', 'Points', 'Rank'].forEach((label, i) => {
    b.rect(1050 + i * 88, 194, 78, 58, { fill: C.panel2, stroke: C.stroke2, r: 12 });
    b.text(1089 + i * 88, 216, label, { size: 9, weight: 800, fill: C.muted, anchor: 'middle' });
    b.text(1089 + i * 88, 240, i === 2 ? 'Novice' : '0', { size: 16, weight: 900, fill: C.ink, anchor: 'middle' });
  });
  input(b, 100, 316, 1240, 52, '', 'Search programs...');
  b.rect(100, 398, 1240, 96, { fill: '#ffffffaa', stroke: C.stroke2, r: 16 });
  b.text(126, 432, 'Filters', { size: 16, weight: 900, fill: C.ink });
  ['All', 'Technology', 'Science', 'Language', 'Business', 'Health'].forEach((label, i) => pill(b, 126 + i * 126, 452, 104, 28, label, i === 0));
  ['All', 'Online', 'Offline'].forEach((label, i) => pill(b, 1010 + i * 82, 452, 72, 28, label, i === 0));
  button(b, 1222, 448, 92, 34, 'Sort');
  tabBar(b, 100, 526, ['Active Programs', 'Private Programs', 'Archived Programs'], 0, [180, 190, 205]);
  b.rect(100, 596, 1240, 74, { fill: '#eef2ff', stroke: '#c7d2fe', r: 16 });
  b.text(126, 626, 'AI-powered recommendations for students', { size: 15, weight: 900, fill: C.accent });
  b.skeleton(126, 646, 520, [1, 0.62], { h: 8, gap: 12, fill: '#c7d2fe' });
  [100, 530, 960].forEach((x, i) => programCard(b, x, 704, 380, 245, { joined: i === 1, locked: i === 2 }));
  button(b, 650, 965, 140, 34, 'Load More');
  return b;
}

function buildProgrammeDetail() {
  const b = new Board({
    code: '4.4.3.4',
    title: 'Programme Detail Wireframe',
    route: 'Route: /programs/[id]',
    source: 'app/(dashboard)/programs/[id]/page.tsx, QuizPlayer, MassCertificateGenerator',
  });
  dashboardNav(b, 'Programs');
  b.rect(0, 166, 1440, 230, { fill: '#e0e7ff', stroke: 'none', r: 0 });
  imageBox(b, 0, 166, 1440, 230, 'programme hero cover / optional background image');
  b.rect(0, 276, 1440, 120, { fill: '#0f172aaa', stroke: 'none', r: 0 });
  b.text(112, 334, 'Programme Title', { size: 36, weight: 900, fill: '#ffffff' });
  pill(b, 112, 352, 108, 28, 'Category', true);
  pill(b, 232, 352, 92, 28, 'Online', false);
  b.rect(100, 430, 805, 92, { fill: '#eff6ff', stroke: '#93c5fd', r: 12 });
  b.text(130, 466, 'Join alert: join this programme to access episodes and progress tracking', {
    size: 15,
    weight: 700,
    fill: '#1d4ed8',
  });
  b.rect(100, 546, 805, 410, { fill: C.panel, stroke: C.stroke2, r: 16 });
  tabBar(b, 100, 546, ['About', 'Resources', 'Episodes', 'Mass Certificates'], 2, [130, 140, 140, 190]);
  b.rect(130, 620, 745, 72, { fill: C.panel2, stroke: C.stroke2, r: 12 });
  b.text(154, 648, 'Your Progress', { size: 14, weight: 800, fill: C.text });
  b.rect(154, 668, 560, 9, { fill: '#e2e8f0', stroke: 'none', r: 5 });
  b.rect(154, 668, 330, 9, { fill: C.accent, stroke: 'none', r: 5 });
  button(b, 730, 644, 120, 34, 'Claim Points');
  episodeCard(b, 130, 724, 745, 'Task 1: Video lesson', 'video / pdf / game controls', true);
  episodeCard(b, 130, 826, 745, 'Task 2: Quiz assessment', 'Start Quiz / Review Quiz / Retry Quiz', false, true);
  b.rect(945, 430, 395, 526, { fill: '#ffffffcc', stroke: C.stroke2, r: 20 });
  button(b, 980, 462, 325, 42, 'Edit Program');
  button(b, 980, 518, 325, 42, 'Manage Participants');
  button(b, 980, 574, 325, 42, 'Join / Leave Program', { active: true });
  button(b, 980, 630, 325, 42, 'Join Discussion');
  button(b, 980, 686, 325, 42, 'View Stats');
  b.line(980, 758, 1305, 758, { stroke: C.stroke2 });
  ['Participants', 'Duration', 'Reward Points', 'Start / End'].forEach((label, i) => {
    b.text(980, 798 + i * 38, label, { size: 13, weight: 700, fill: C.muted });
    b.skeleton(1185, 790 + i * 38, 92, [0.8], { h: 8, gap: 0 });
  });
  return b;
}

function episodeCard(b, x, y, w, title, footer, completed = false, quiz = false) {
  b.rect(x, y, w, 82, {
    fill: completed ? '#ecfdf5' : '#ffffff',
    stroke: completed ? '#6ee7b7' : C.stroke2,
    r: 14,
  });
  b.circle(x + 28, y + 30, 12, { fill: completed ? C.good : C.panel2, stroke: completed ? C.good : C.stroke });
  b.text(x + 56, y + 30, title, { size: 15, weight: 900, fill: C.ink });
  if (quiz) pill(b, x + 250, y + 13, 70, 24, 'Quiz', true);
  b.skeleton(x + 56, y + 45, 390, [1, 0.68], { h: 7, gap: 12 });
  b.text(x + w - 220, y + 64, footer, { size: 12, weight: 700, fill: C.accent });
}

function buildAssessmentPlayer() {
  const b = new Board({
    code: '4.4.3.5',
    title: 'Assessment Player Wireframe',
    route: 'Component: QuizPlayer inside /programs/[id]',
    source: 'components/programs/QuizPlayer.tsx',
  });
  b.rect(0, 62, 1440, 938, { fill: '#0f172acc', stroke: 'none', r: 0 });
  b.rect(280, 138, 880, 722, { fill: '#111827', stroke: '#334155', sw: 2, r: 22 });
  b.text(320, 190, 'Question 1 of 5', { size: 16, weight: 800, fill: '#cbd5e1' });
  pill(b, 456, 168, 142, 28, 'Multiple Choice', true);
  b.rect(992, 164, 96, 36, { fill: '#1e293b', stroke: '#475569', r: 18 });
  b.text(1040, 188, 'Timer 6s', { size: 13, weight: 800, fill: '#e2e8f0', anchor: 'middle' });
  b.rect(320, 222, 800, 8, { fill: '#1e293b', stroke: 'none', r: 4 });
  b.rect(320, 222, 265, 8, { fill: '#f59e0b', stroke: 'none', r: 4 });
  b.text(320, 300, 'Question text appears here with optional image support', {
    size: 24,
    weight: 900,
    fill: '#ffffff',
  });
  imageBox(b, 320, 330, 800, 190, 'optional question image');
  ['A  Answer option', 'B  Answer option', 'C  Selected answer option', 'D  Answer option'].forEach((label, i) => {
    const active = i === 2;
    b.rect(320, 552 + i * 64, 800, 48, {
      fill: active ? '#312e81' : '#1e293b',
      stroke: active ? '#6366f1' : '#475569',
      sw: active ? 2 : 1,
      r: 14,
    });
    b.circle(350, 576 + i * 64, 14, { fill: active ? C.accent : '#334155', stroke: '#64748b' });
    b.text(380, 582 + i * 64, label, { size: 15, weight: 800, fill: '#f8fafc' });
  });
  b.line(320, 816, 1120, 816, { stroke: '#334155' });
  button(b, 320, 836, 130, 42, 'Previous', { fill: '#1e293b', stroke: '#475569', textFill: '#e2e8f0' });
  button(b, 946, 836, 174, 42, 'Next / Submit', { active: true });
  b.rect(1188, 236, 180, 418, { fill: '#111827', stroke: '#334155', r: 18 });
  b.text(1278, 278, 'Results state', { size: 15, weight: 900, fill: '#e2e8f0', anchor: 'middle' });
  b.circle(1278, 346, 50, { fill: '#4f46e533', stroke: C.accent });
  b.text(1278, 354, 'points', { size: 15, weight: 900, fill: '#ffffff', anchor: 'middle' });
  b.skeleton(1218, 430, 120, [1, 0.72, 0.9, 0.55], { h: 8, gap: 18, fill: '#475569' });
  button(b, 1222, 584, 112, 36, 'Finish & Save', { active: true });
  return b;
}

function buildLearnerAnalytics() {
  const b = new Board({
    code: '4.4.3.6',
    title: 'Learner Analytics Wireframe',
    route: 'Route: /statistics',
    source: 'app/(dashboard)/statistics/page.tsx, StudentAnalyticsDashboard',
  });
  dashboardNav(b, 'Programs');
  b.text(100, 194, 'Statistics', { size: 30, weight: 900, fill: C.ink });
  b.text(100, 222, 'Platform analytics, student lookup, and personal learning journey', {
    size: 14,
    weight: 600,
    fill: C.muted,
  });
  ['Program Created', 'Total User', 'Total Teachers', 'Total Students', 'Total Parents'].forEach((label, i) => {
    statCard(b, 100 + i * 248, 250, 224, 86, label, i === 0 ? '12' : '0', C.good);
  });
  b.rect(100, 366, 1240, 146, { fill: C.panel, stroke: C.stroke2, r: 18 });
  b.text(126, 400, 'Student Lookup', { size: 20, weight: 900, fill: C.ink });
  ['Country', 'State', 'School', 'Age Group'].forEach((label, i) => input(b, 126 + i * 222, 438, 198, 42, label, 'All'));
  input(b, 1030, 438, 260, 42, 'Search', 'student by name or email');
  b.text(100, 560, 'Selected student / My Activity report', { size: 22, weight: 900, fill: C.ink });
  ['Current Rank', 'Total Points', 'Learning Time', 'Growth Score'].forEach((label, i) => {
    statCard(b, 100 + i * 310, 586, 280, 88, label, i === 0 ? 'Novice' : '0', [C.accent2, C.warn, '#0284c7', C.good][i]);
  });
  b.rect(100, 712, 380, 240, { fill: C.panel, stroke: C.stroke2, r: 16 });
  b.text(124, 746, 'Knowledge Profile', { size: 18, weight: 900, fill: C.ink });
  radar(b, 290, 840, 82);
  b.rect(520, 712, 820, 240, { fill: C.panel, stroke: C.stroke2, r: 16 });
  b.text(548, 746, 'Program Progress & Analysis', { size: 18, weight: 900, fill: C.ink });
  ['Programme A', 'Programme B', 'Programme C'].forEach((label, i) => {
    const y = 780 + i * 52;
    b.text(548, y, label, { size: 14, weight: 800, fill: C.ink });
    b.rect(548, y + 14, 240, 8, { fill: C.panel2, stroke: 'none', r: 4 });
    b.rect(548, y + 14, 120 + i * 40, 8, { fill: C.accent, stroke: 'none', r: 4 });
    ['Tasks', 'Correct', 'Points'].forEach((v, j) => b.text(850 + j * 130, y + 5, v, { size: 12, weight: 700, fill: C.muted }));
    b.line(548, y + 34, 1310, y + 34, { stroke: C.stroke2 });
  });
  return b;
}

function radar(b, cx, cy, r) {
  for (let i = 1; i <= 3; i += 1) {
    const rr = (r / 3) * i;
    b.path(
      [...Array(6)]
        .map((_, n) => {
          const a = -Math.PI / 2 + (n * Math.PI * 2) / 6;
          return `${n === 0 ? 'M' : 'L'} ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
        })
        .join(' ') + ' Z',
      { stroke: C.stroke2, fill: 'none' }
    );
  }
  const points = [0.9, 0.58, 0.74, 0.42, 0.65, 0.82]
    .map((pct, n) => {
      const a = -Math.PI / 2 + (n * Math.PI * 2) / 6;
      return `${n === 0 ? 'M' : 'L'} ${cx + Math.cos(a) * r * pct} ${cy + Math.sin(a) * r * pct}`;
    })
    .join(' ');
  b.path(points + ' Z', { stroke: C.accent, fill: '#4f46e522', sw: 2 });
}

function buildRewards() {
  const b = new Board({
    code: '4.4.3.7',
    title: 'Rewards And Redemption Wireframe',
    route: 'Route: /rewards',
    source: 'app/(dashboard)/rewards/page.tsx, RewardCard, reward modals',
  });
  dashboardNav(b, 'Rewards');
  b.rect(100, 178, 1240, 104, { fill: '#ffffffcc', stroke: C.stroke2, r: 18 });
  b.text(128, 220, 'My Vouchers', { size: 28, weight: 900, fill: C.ink });
  b.text(128, 250, 'Redeem points for exclusive rewards', { size: 14, weight: 600, fill: C.muted });
  b.rect(970, 206, 160, 42, { fill: C.panel2, stroke: C.stroke2, r: 12 });
  b.text(1050, 232, 'Balance: 0 pts', { size: 13, weight: 800, fill: C.accent, anchor: 'middle' });
  button(b, 1150, 206, 150, 42, 'Create Reward', { active: true });
  tabBar(b, 100, 324, ['Browse Rewards', 'My Vouchers'], 0, [170, 150]);
  input(b, 100, 406, 1240, 52, '', 'Search rewards / vouchers...');
  [100, 415, 730, 1045].forEach((x, i) => rewardCard(b, x, 500, 275, 330, i === 2));
  b.rect(955, 850, 385, 106, { fill: '#ffffffcc', stroke: C.stroke2, r: 18, dash: '8 7' });
  b.text(980, 884, 'Modal states', { size: 17, weight: 900, fill: C.ink });
  b.text(980, 912, 'Redeem confirmation, Create Reward, View Voucher', { size: 13, weight: 700, fill: C.muted });
  return b;
}

function rewardCard(b, x, y, w, h, redeemed = false) {
  b.rect(x, y, w, h, { fill: C.panel, stroke: C.stroke2, r: 22 });
  imageBox(b, x, y, w, 145, 'reward image');
  pill(b, x + w - 86, y + 14, 62, 24, '20%', true);
  if (redeemed) {
    b.rect(x + 18, y + 54, w - 36, 42, { fill: '#0f172acc', stroke: C.ink, r: 18 });
    b.text(x + w / 2, y + 80, 'REDEEMED', { size: 14, weight: 900, fill: '#ffffff', anchor: 'middle' });
  }
  b.text(x + 20, y + 178, 'Reward title', { size: 16, weight: 900, fill: C.ink });
  b.text(x + 20, y + 202, 'Merchant name', { size: 12, weight: 700, fill: C.muted });
  b.skeleton(x + 20, y + 232, w - 40, [1, 0.64], { h: 8, gap: 14 });
  b.line(x + 20, y + h - 64, x + w - 20, y + h - 64, { stroke: C.stroke2 });
  b.text(x + 20, y + h - 30, 'points cost', { size: 13, weight: 800, fill: C.ink });
}

function buildAuthoring() {
  const b = new Board({
    code: '4.4.3.8',
    title: 'Programme Authoring Wireframe',
    route: 'Routes: /programs/create, /programs/[id]/edit',
    source: 'create/edit pages, QuizBuilder, SortableCompactEpisodeItem',
  });
  dashboardNav(b, 'Programs');
  b.text(280, 194, 'Create / Edit Program', { size: 30, weight: 900, fill: C.ink });
  b.text(280, 222, 'Tabbed authoring form for programme details, episodes, resources, and certificate', {
    size: 14,
    weight: 600,
    fill: C.muted,
  });
  b.rect(260, 250, 920, 706, { fill: C.panel, stroke: C.stroke2, r: 20 });
  tabBar(b, 260, 250, ['Details', 'Episodes', 'Resources', 'Certificate'], 0, [145, 155, 160, 165]);
  input(b, 310, 346, 380, 44, 'Program Title', 'Introduction to Web Development');
  input(b, 720, 346, 380, 44, 'Promo Video URL', 'YouTube URL');
  b.text(310, 430, 'Description', { size: 12, weight: 800, fill: C.text });
  b.rect(310, 444, 790, 120, { fill: C.panel2, stroke: C.stroke2, r: 12 });
  b.skeleton(332, 472, 730, [1, 0.86, 0.52], { h: 8, gap: 18 });
  b.text(310, 606, 'Access Type', { size: 13, weight: 900, fill: C.text });
  b.rect(310, 620, 380, 72, { fill: '#eef2ff', stroke: '#c7d2fe', r: 14 });
  b.text(336, 650, 'Public', { size: 15, weight: 900, fill: C.accent });
  b.skeleton(336, 668, 260, [1], { h: 7, gap: 0 });
  b.rect(720, 620, 380, 72, { fill: C.panel, stroke: C.stroke2, r: 14 });
  b.text(746, 650, 'Private', { size: 15, weight: 900, fill: C.text });
  b.skeleton(746, 668, 260, [1], { h: 7, gap: 0 });
  b.text(310, 732, 'Program Mode, Cover Image, Page Background, Categories, Audience, Duration, Reward Points, Dates', {
    size: 13,
    weight: 800,
    fill: C.muted,
  });
  ['Technology', 'Science', 'Business', 'Everyone'].forEach((label, i) => pill(b, 310 + i * 118, 756, 100, 28, label, i < 2));
  b.rect(310, 812, 790, 92, { fill: '#f8fafc', stroke: C.stroke2, r: 14, dash: '7 7' });
  b.text(334, 842, 'Other tabs represented in same form shell:', { size: 14, weight: 900, fill: C.ink });
  b.text(334, 870, 'Episodes: import playlist, add episode, add quiz, arrange sequence, QuizBuilder', {
    size: 12,
    weight: 700,
    fill: C.muted,
  });
  b.text(334, 892, 'Resources: URL/PDF/photo/video entries. Certificate: opens CertificateDesigner.', {
    size: 12,
    weight: 700,
    fill: C.muted,
  });
  button(b, 840, 920, 104, 40, 'Cancel');
  button(b, 960, 920, 140, 40, 'Save/Create', { active: true });
  return b;
}

function buildCertificateDesigner() {
  const b = new Board({
    code: '4.4.3.9',
    title: 'Certificate Designer Wireframe',
    route: 'Component: CertificateDesigner in programme authoring',
    source: 'components/programs/CertificateDesigner.tsx',
  });
  dashboardNav(b, 'Programs');
  b.rect(170, 186, 1100, 770, { fill: C.panel, stroke: C.stroke2, r: 20 });
  b.text(210, 232, 'Certificate Designer', { size: 26, weight: 900, fill: C.ink });
  ['Student Name', 'School Name', 'Date'].forEach((label, i) => {
    b.rect(210 + i * 155, 260, 132, 34, { fill: C.panel2, stroke: C.stroke2, r: 12 });
    b.rect(224 + i * 155, 270, 14, 14, { fill: i === 0 ? C.accent : C.panel, stroke: C.stroke, r: 3 });
    b.text(248 + i * 155, 282, label, { size: 12, weight: 800, fill: C.text });
  });
  b.rect(210, 322, 690, 382, { fill: '#f8fafc', stroke: C.stroke, r: 16 });
  b.text(555, 354, 'Certificate template canvas', { size: 15, weight: 900, fill: C.muted, anchor: 'middle' });
  b.rect(260, 390, 590, 260, { fill: '#ffffff', stroke: C.stroke2, r: 8 });
  b.text(555, 446, 'CERTIFICATE OF COMPLETION', { size: 20, weight: 900, fill: C.ink, anchor: 'middle' });
  b.rect(360, 500, 390, 44, { fill: '#eef2ff', stroke: C.accent, r: 8, dash: '6 5' });
  b.text(555, 528, '[Student Name] draggable variable', { size: 16, weight: 800, fill: C.accent, anchor: 'middle' });
  b.line(555, 390, 555, 650, { stroke: C.stroke2, dash: '5 6' });
  b.line(260, 520, 850, 520, { stroke: C.stroke2, dash: '5 6' });
  input(b, 940, 338, 250, 44, 'Upload Template', 'PNG / JPG / PDF');
  input(b, 940, 428, 110, 44, 'Font Size', '60');
  input(b, 1080, 428, 110, 44, 'Font Color', '#000000');
  input(b, 940, 520, 250, 44, 'Font Style', 'Helvetica');
  b.rect(940, 592, 250, 110, { fill: '#eff6ff', stroke: '#bfdbfe', r: 14 });
  b.text(964, 626, 'Guidance box', { size: 14, weight: 900, fill: '#1d4ed8' });
  b.skeleton(964, 650, 194, [1, 0.8, 0.62], { h: 7, gap: 14, fill: '#bfdbfe' });
  b.rect(210, 742, 980, 82, { fill: '#f8fafc', stroke: C.stroke2, r: 16 });
  b.text(236, 778, 'Enable Mass Certificate Download', { size: 16, weight: 900, fill: C.ink });
  b.text(236, 804, 'CSV upload creates certificate ZIP for multiple student names', { size: 12, weight: 700, fill: C.muted });
  b.rect(1110, 772, 48, 26, { fill: C.accent, stroke: C.accent, r: 13 });
  b.circle(1145, 785, 10, { fill: '#ffffff', stroke: 'none' });
  button(b, 970, 876, 100, 38, 'Cancel');
  button(b, 1088, 876, 100, 38, 'Save', { active: true });
  return b;
}

function buildProgramStats() {
  const b = new Board({
    code: '4.4.3.10',
    title: 'Programme Statistics Wireframe',
    route: 'Route: /programs/[id]/stats',
    source: 'app/(dashboard)/programs/[id]/stats/page.tsx, TextResponsesViewer',
  });
  dashboardNav(b, 'Programs');
  b.text(100, 196, 'Program Statistics', { size: 30, weight: 900, fill: C.ink });
  button(b, 1198, 170, 142, 42, 'Back to Program');
  ['Total Participants', 'Completion Rate', 'Average Progress', 'Points Distributed'].forEach((label, i) => {
    statCard(b, 100 + i * 310, 248, 280, 92, label, ['128', '76%', '62%', '12,400'][i], [C.accent, C.good, '#0284c7', C.accent2][i]);
  });
  tabBar(b, 100, 380, ['Engagement & Overview', 'Leaderboards', 'Quiz Responses', 'User Feedback'], 0, [230, 150, 170, 160]);
  barList(b, 100, 456, 790, 270, 'Episode Engagement', ['Task 1 completed', 'Task 2 completed', 'Task 3 completed', 'Final Quiz completed']);
  b.rect(920, 456, 420, 270, { fill: C.panel, stroke: C.stroke2, r: 16 });
  b.text(948, 492, 'Certificate Generation Stats', { size: 18, weight: 900, fill: C.ink });
  b.rect(1180, 478, 120, 56, { fill: '#f5f3ff', stroke: '#ddd6fe', r: 12 });
  b.text(1240, 500, 'Total', { size: 10, weight: 800, fill: C.muted, anchor: 'middle' });
  b.text(1240, 524, '0', { size: 22, weight: 900, fill: C.accent2, anchor: 'middle' });
  table(b, 948, 552, 352, 132, ['User', 'Date', 'Certs'], 3);
  b.rect(100, 762, 600, 194, { fill: C.panel, stroke: C.stroke2, r: 16 });
  b.text(126, 798, 'Leaderboard tab', { size: 18, weight: 900, fill: C.ink });
  b.rect(126, 822, 548, 50, { fill: C.panel2, stroke: C.stroke2, r: 12 });
  ['Country', 'State', 'School', 'Age'].forEach((label, i) => b.text(148 + i * 120, 852, label, { size: 12, weight: 800, fill: C.muted }));
  table(b, 126, 888, 548, 52, ['Completion Leaders', 'Quiz Rankings'], 1);
  b.rect(740, 762, 600, 194, { fill: C.panel, stroke: C.stroke2, r: 16 });
  b.text(766, 798, 'Quiz Responses / Feedback tabs', { size: 18, weight: 900, fill: C.ink });
  b.skeleton(766, 826, 510, [1, 0.9, 0.7], { h: 9, gap: 18 });
  button(b, 766, 894, 128, 34, 'Export CSV');
  button(b, 912, 894, 140, 34, 'View Responses');
  return b;
}

function buildAdmin() {
  const b = new Board({
    code: '4.4.3.11',
    title: 'Administrative Dashboard Wireframe',
    route: 'Route: /admin',
    source: 'app/(dashboard)/admin/page.tsx, AttendanceDashboard, BackgroundModal',
  });
  dashboardNav(b, 'Programs');
  b.text(100, 196, 'Admin Dashboard', { size: 30, weight: 900, fill: C.ink });
  b.text(100, 224, 'Platform overview and management', { size: 14, weight: 600, fill: C.muted });
  ['Total Users', 'Total Programs', 'Students', 'Organizations'].forEach((label, i) => {
    statCard(b, 100 + i * 310, 256, 280, 92, label, '0', [C.accent, C.accent2, C.good, C.warn][i]);
  });
  b.rect(100, 386, 1240, 112, { fill: C.panel, stroke: C.stroke2, r: 18 });
  b.text(126, 424, 'Quick Actions', { size: 19, weight: 900, fill: C.ink });
  ['Create Program', 'Manage Folders', 'View Statistics', 'Manage Ads', 'Change Backgrounds'].forEach((label, i) => {
    button(b, 126 + i * 236, 446, 206, 38, label);
  });
  b.rect(100, 532, 1240, 220, { fill: C.panel, stroke: C.stroke2, r: 18 });
  b.text(126, 570, 'Attendance', { size: 19, weight: 900, fill: C.ink });
  input(b, 1060, 544, 126, 36, '', 'date');
  button(b, 1200, 544, 112, 36, 'Export CSV', { active: true });
  ['All Countries', 'All States', 'All Schools', 'All Ages'].forEach((label, i) => input(b, 126 + i * 220, 612, 190, 38, '', label));
  ['Logged In', 'Online Now', 'Total Hours'].forEach((label, i) => {
    statCard(b, 126 + i * 398, 674, 360, 58, label, '0', [C.good, '#0284c7', C.warn][i]);
  });
  b.rect(100, 790, 1240, 166, { fill: C.panel, stroke: C.stroke2, r: 18 });
  b.text(126, 828, 'User Management', { size: 19, weight: 900, fill: C.ink });
  input(b, 890, 804, 160, 38, '', 'All Users');
  input(b, 1070, 804, 230, 38, '', 'Search users...');
  table(b, 126, 860, 1174, 76, ['User', 'Role', 'Joined', 'Actions'], 2);
  b.rect(1048, 936, 252, 30, { fill: '#f8fafc', stroke: C.stroke2, r: 10, dash: '6 6' });
  b.text(1174, 956, 'New Users modal + background modal', { size: 11, weight: 800, fill: C.muted, anchor: 'middle' });
  return b;
}

function buildMobileNavigation() {
  const b = new Board({
    width: 430,
    height: 932,
    code: '4.4.3.12',
    title: 'Mobile Navigation Wireframe',
    route: 'DashboardLayout mobile drawer',
    source: 'app/(dashboard)/layout.tsx',
  });
  b.rect(15, 82, 400, 820, { fill: C.panel2, stroke: C.ink, sw: 2, r: 36 });
  b.rect(34, 112, 362, 64, { fill: C.panel, stroke: C.stroke2, r: 28 });
  b.rect(56, 130, 30, 30, { fill: C.ink, stroke: C.ink, r: 8 });
  b.text(96, 150, 'ARAE LMS', { size: 15, weight: 900, fill: C.ink });
  b.circle(294, 144, 15, { fill: C.panel2, stroke: C.stroke2 });
  b.circle(334, 144, 15, { fill: C.accent, stroke: C.accent });
  b.rect(366, 132, 18, 4, { fill: C.ink, stroke: 'none', r: 2 });
  b.rect(366, 142, 18, 4, { fill: C.ink, stroke: 'none', r: 2 });
  b.rect(366, 152, 18, 4, { fill: C.ink, stroke: 'none', r: 2 });
  b.rect(34, 194, 362, 680, { fill: '#0f172a99', stroke: 'none', r: 0 });
  b.rect(102, 100, 294, 784, { fill: C.panel, stroke: C.stroke2, r: 28 });
  b.rect(128, 126, 34, 34, { fill: C.ink, stroke: C.ink, r: 9 });
  b.text(174, 148, 'ARAE LMS', { size: 16, weight: 900, fill: C.ink });
  b.circle(360, 143, 16, { fill: C.panel2, stroke: C.stroke2 });
  b.text(360, 149, 'X', { size: 13, weight: 900, fill: C.muted, anchor: 'middle' });
  b.line(102, 184, 396, 184, { stroke: C.stroke2 });
  ['Programs', 'News', 'Rewards', 'Calendar'].forEach((label, i) => {
    const y = 214 + i * 66;
    const active = i === 0;
    b.rect(128, y, 242, 48, {
      fill: active ? C.accent : C.panel2,
      stroke: active ? C.accent : C.stroke2,
      r: 12,
    });
    b.circle(150, y + 24, 7, { fill: active ? '#ffffff' : C.stroke, stroke: 'none' });
    b.text(170, y + 30, label, { size: 17, weight: 800, fill: active ? '#ffffff' : C.text });
  });
  b.text(249, 852, 'Drawer slides from right; overlay closes on route change or backdrop tap', {
    size: 12,
    weight: 700,
    fill: C.muted,
    anchor: 'middle',
  });
  return b;
}

const boards = [
  ['4.4.3.1-landing-page-wireframe', buildLanding],
  ['4.4.3.2-authentication-wireframe', buildAuth],
  ['4.4.3.3-programme-catalogue-wireframe', buildCatalogue],
  ['4.4.3.4-programme-detail-wireframe', buildProgrammeDetail],
  ['4.4.3.5-assessment-player-wireframe', buildAssessmentPlayer],
  ['4.4.3.6-learner-analytics-wireframe', buildLearnerAnalytics],
  ['4.4.3.7-rewards-and-redemption-wireframe', buildRewards],
  ['4.4.3.8-programme-authoring-wireframe', buildAuthoring],
  ['4.4.3.9-certificate-designer-wireframe', buildCertificateDesigner],
  ['4.4.3.10-programme-statistics-wireframe', buildProgramStats],
  ['4.4.3.11-administrative-dashboard-wireframe', buildAdmin],
  ['4.4.3.12-mobile-navigation-wireframe', buildMobileNavigation],
];

async function writeBoard(slug, board) {
  const svg = board.render();
  const svgPath = path.join(outDir, `${slug}.svg`);
  const pngPath = path.join(outDir, `${slug}.png`);
  await writeFile(svgPath, svg, 'utf8');
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  return {
    code: board.code,
    title: board.title,
    route: board.route,
    source: board.source,
    svg: `/wireframes/${slug}.svg`,
    png: `/wireframes/${slug}.png`,
    width: board.width,
    height: board.height,
  };
}

async function writeGallery(items) {
  const cards = items
    .map(
      (item) => `<article>
        <h2>${esc(`${item.code} ${item.title}`)}</h2>
        <p>${esc(item.route)}<br>${esc(item.source)}</p>
        <a href="${item.png}"><img src="${item.png}" alt="${esc(item.title)}"></a>
        <p><a href="${item.svg}">SVG</a> <a href="${item.png}">PNG</a></p>
      </article>`
    )
    .join('\n');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ARAE LMS Wireframes</title>
  <style>
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #f8fafc; color: #0f172a; }
    header { background: #0f172a; color: white; padding: 28px 32px; }
    main { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; padding: 24px; }
    article { background: white; border: 1px solid #dbe4f0; border-radius: 16px; padding: 18px; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06); }
    h1 { margin: 0; font-size: 28px; }
    h2 { margin: 0 0 8px; font-size: 18px; }
    p { color: #64748b; line-height: 1.45; }
    img { width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: white; }
    a { color: #4f46e5; font-weight: 700; margin-right: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>ARAE LMS Generated Wireframes</h1>
    <p>Static assets generated from the current Next.js route and component structure.</p>
  </header>
  <main>
    ${cards}
  </main>
</body>
</html>`;
  await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
}

async function writeContactSheet(items) {
  const thumbWidth = 420;
  const thumbHeight = 292;
  const gap = 24;
  const cols = 3;
  const rows = Math.ceil(items.length / cols);
  const sheetWidth = cols * thumbWidth + (cols + 1) * gap;
  const sheetHeight = rows * (thumbHeight + 58) + (rows + 1) * gap;
  const composites = [];
  const base = sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: '#f8fafc',
    },
  });

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = gap + col * (thumbWidth + gap);
    const top = gap + row * (thumbHeight + 58 + gap);
    const inputPath = path.join(rootDir, 'public', item.png);
    const resized = await sharp(inputPath)
      .resize({ width: thumbWidth, height: thumbHeight, fit: 'inside', background: '#ffffff' })
      .png()
      .toBuffer({ resolveWithObject: true });
    const thumb = await sharp({
      create: {
        width: thumbWidth,
        height: thumbHeight,
        channels: 4,
        background: '#ffffff',
      },
    })
      .composite([
        {
          input: resized.data,
          left: Math.round((thumbWidth - resized.info.width) / 2),
          top: Math.round((thumbHeight - resized.info.height) / 2),
        },
      ])
      .png()
      .toBuffer();
    composites.push({ input: thumb, left, top });
    const label = `<svg xmlns="http://www.w3.org/2000/svg" width="${thumbWidth}" height="44">
      <text x="0" y="18" font-family="Arial" font-size="16" font-weight="800" fill="#0f172a">${esc(item.code)}</text>
      <text x="0" y="38" font-family="Arial" font-size="13" font-weight="700" fill="#64748b">${esc(item.title)}</text>
    </svg>`;
    composites.push({ input: Buffer.from(label), left, top: top + thumbHeight + 10 });
  }

  await base.composite(composites).png().toFile(path.join(outDir, 'wireframes-contact-sheet.png'));
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const items = [];
  for (const [slug, build] of boards) {
    items.push(await writeBoard(slug, build()));
  }
  await writeGallery(items);
  await writeFile(path.join(outDir, 'wireframes-manifest.json'), `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  await writeContactSheet(items);
  console.log(`Generated ${items.length} wireframe image pairs in ${path.relative(rootDir, outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
