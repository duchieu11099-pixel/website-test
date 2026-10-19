/* English Master — app học tiếng Anh (giao diện tiếng Việt)
   - Từ vựng (phiên âm, loại từ, ví dụ + dịch ẩn), ngữ pháp theo chuyên đề, đọc hiểu
   - Flashcard vuốt + SRS (SM-2), trắc nghiệm có giải thích, nghe, chính tả, điền từ
   - Thi: kiểm tra tổng quát / theo bài / đề ôn tập, hẹn giờ, gia sư chấm bài
   - Nạp dữ liệu: chụp ảnh (OCR), chọn file, dán văn bản, gia sư chuyển định dạng, kiểm tra trùng
   - Đồng bộ Firebase, gia sư AI (DeepSeek) dùng "mã gia sư" */
(function(){
'use strict';

/* ======================= state ======================= */
var KEY = 'english_state_v1', KEY_CODE = 'english_tutor_code', KEY_CHAT = 'english_chat_v1', KEY_VOICE = 'english_voice', KEY_SHARE = 'english_tutor_share', KEY_EXAM = 'english_exam_live_v1';
var APP_VER = '2026-10-19b';
var defaults = { ipa:true, accent:'us', rate:0.9, goal:20, srs:{}, marked:{}, selected:{}, wrong:{}, hard:{}, custom:[], packs:[], gen:{}, days:{}, log:[], reading:{}, exams:[], bt:{}, last:null, updatedAt:0 };
var S = load();
function load(){
  var s; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
  s = s && typeof s === 'object' ? s : {};
  for (var k in defaults) if (!(k in s)) s[k] = JSON.parse(JSON.stringify(defaults[k]));
  return s;
}
function t(s, vars){ if (vars) for (var v in vars) s = s.split('{' + v + '}').join(vars[v]); return s; }

/* ======================= text helpers ======================= */
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
/* 【x】 tô sáng · [[x]] gạch chân · **x** đậm · ¶ hoặc xuống dòng */
function fmt(s){
  return esc(s).replace(/【/g, '<mark class="g">').replace(/】/g, '</mark>')
    .replace(/\[\[([^\]]+)\]\]/g, '<u>$1</u>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/¶|\n/g, '<br>');
}
function plain(s){ return String(s || '').replace(/[【】]/g, '').replace(/\[\[|\]\]/g, '').replace(/\*\*/g, '').replace(/¶/g, '\n'); }
function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
function today(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function $(id){ return document.getElementById(id); }
function h(html){ var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
function norm(s){ return String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
var toastTimer;
function toast(msg, bad){
  var el = $('toast'); el.textContent = msg; el.className = 'toast' + (bad ? ' bad' : ''); el.style.display = 'block';
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ el.style.display = 'none'; }, 2800);
}
function exLine(en, vi){ // câu ví dụ + nút dịch ẩn ngay bên cạnh
  if (!en) return '';
  return '<div class="exline"><div class="en">' + fmt(en) + '</div>' + (vi ? hideBox(fmt(vi)) : '') + '</div>';
}
function hideBox(html, label){
  return '<div class="hidebox"><button class="reveal" data-act="reveal">' + (label || '👁 Dịch') + '</button><div class="content">' + html + '</div></div>';
}
function revealToggle(btn){
  var box = btn.closest('.hidebox'); box.classList.toggle('open');
  if (!btn.getAttribute('data-l')) btn.setAttribute('data-l', btn.textContent);
  btn.textContent = box.classList.contains('open') ? 'Ẩn' : btn.getAttribute('data-l');
}
function tipBox(it){ var tp = it.tip || (S.gen[it.id] && S.gen[it.id].tip); if (!tp) return ''; return '<div class="tip"><b>💡 Mẹo nhớ:</b> ' + fmt(tp) + '</div>'; }

/* ======================= data parsing ======================= */
var POS_RE = /^(n|v|adj|adv|prep|conj|pron|det|phr|idiom|int|exc|modal|aux)(\s*[,/]\s*(n|v|adj|adv|prep|conj|pron|det|phr|idiom|int|modal|aux))*\.?$/i;
function vItem(f, id, lesson){
  return { kind:'v', id:id, w:(f[0]||'').trim(), pos:(f[1]||'').trim(), ipa:(f[2]||'').trim(), vi:(f[3]||'').trim(), ex:(f[4]||'').trim(), exVi:(f[5]||'').trim(), tip:(f[6]||'').trim(), lesson:lesson };
}
function buildVocab(){
  var rows = (window.DATA_VOCAB || '').split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l && l.indexOf('|') > 0; });
  var lessons = [], per = 50;
  for (var i = 0; i < rows.length; i += per){
    var n = lessons.length + 1, id = 'e' + (n < 10 ? '0' : '') + n;
    var items = rows.slice(i, i + per).map(function(r, k){ return vItem(r.split('|'), 'v' + (i + k + 1), id); });
    items.forEach(function(it, k){ it.no = i + k + 1; });
    lessons.push({ id:id, kind:'v', title:'Bài ' + n + ' · ' + items[0].w + ' → ' + items[items.length - 1].w + ' (' + (i + 1) + '–' + (i + items.length) + ')', items:items });
  }
  return lessons;
}
/* Ngữ pháp:  L|mã|tên chuyên đề|nhóm   O|tổng quan   mẫu|cấu trúc|nghĩa|cách dùng|ví dụ1|dịch1|ví dụ2|dịch2|mẹo */
function parseGrammar(src, prefix){
  var lessons = [], cur = null;
  (src || '').split('\n').forEach(function(line){
    line = line.trim(); if (!line || line.indexOf('|') < 0 && line.indexOf('O|') !== 0) return;
    var f = line.split('|');
    if (f[0] === 'L'){ cur = { id:prefix + f[1], title:f[2] || f[1], part:f[3] || '', kind:'g', overview:'', items:[] }; lessons.push(cur); return; }
    if (!cur){ cur = { id:prefix + 'x' + lessons.length, title:'Ngữ pháp', part:'', kind:'g', overview:'', items:[] }; lessons.push(cur); }
    if (f[0] === 'O'){ cur.overview += (cur.overview ? '¶' : '') + f.slice(1).join('|'); return; }
    var it = { kind:'g', p:f[0], form:f[1] || '', vi:f[2] || '', use:f[3] || '', ex:f[4] || '', exVi:f[5] || '', ex2:f[6] || '', ex2Vi:f[7] || '', tip:f[8] || '', lesson:cur.id };
    it.id = 'g_' + cur.id + '_' + it.p;
    it.no = cur.items.length + 1;
    cur.items.push(it);
  });
  return lessons;
}
/* Đọc hiểu:  R|mã|nhóm|dạng bài|tiêu đề   T|đoạn văn   V|bản dịch   G|mẹo   Q|câu hỏi|ĐÚNG|sai1|sai2|sai3|giải thích */
function parseReading(src, prefix){
  var out = [], cur = null;
  (src || '').split('\n').forEach(function(line){
    line = line.trim(); if (!line) return;
    var f = line.split('|');
    if (f[0] === 'R'){ cur = { id:prefix + f[1], part:f[2] || '', type:f[3] || '', title:f[4] || f[1], text:'', vi:'', tip:'', qs:[] }; out.push(cur); return; }
    if (!cur) return;
    if (f[0] === 'T') cur.text += (cur.text ? '¶' : '') + f.slice(1).join('|');
    else if (f[0] === 'V') cur.vi += (cur.vi ? '¶' : '') + f.slice(1).join('|');
    else if (f[0] === 'G') cur.tip = f.slice(1).join('|');
    else if (f[0] === 'Q') cur.qs.push({ q:f[1], opts:[f[2], f[3], f[4], f[5]].filter(function(x){ return x !== undefined && x !== ''; }), why:f[6] || '' });
  });
  return out;
}
/* Đề thi:  E|mã|tên|phút   S|pron/vocab/grammar/reading   T|hướng dẫn   P|đoạn văn|dịch   Q|câu hỏi|ĐÚNG|sai1|sai2|sai3|giải thích */
function parseExams(src, prefix){
  var out = [], cur = null, sec = 'grammar', inst = '', psg = null;
  (src || '').split('\n').forEach(function(line){
    line = line.trim(); if (!line) return;
    var f = line.split('|');
    if (f[0] === 'E'){ cur = { id:prefix + f[1], title:f[2] || f[1], min:+f[3] || 30, qs:[] }; out.push(cur); psg = null; inst = ''; sec = 'grammar'; }
    else if (f[0] === 'S'){ sec = f[1] || 'grammar'; psg = null; }
    else if (f[0] === 'T'){ inst = f[1] || ''; psg = null; }
    else if (f[0] === 'P'){ psg = { en:f[1] || '', vi:f[2] || '' }; }
    else if (f[0] === 'Q' && cur){ cur.qs.push({ sec:sec, inst:inst, psg:psg, q:f[1], opts:[f[2], f[3], f[4], f[5]].filter(function(x){ return x !== undefined && x !== ''; }), why:f[6] || '' }); }
  });
  return out.filter(function(e){ return e.qs.length; });
}

var VL = buildVocab();
var GL = [], DOC = [], EXAMS = [], ITEMS = {};
function rebuildIndex(){
  GL = parseGrammar((window.DATA_GRAMMAR || ''), '');
  DOC = parseReading(window.DATA_READING || '', '');
  EXAMS = parseExams(window.DATA_EXAM || '', '');
  (S.packs || []).forEach(function(pk){
    var pre = pk.id + ':';
    if (pk.type === 'g') GL = GL.concat(parseGrammar(pk.text, pre).map(function(l){ l.custom = pk.id; if (!l.part) l.part = '★ Tự nạp'; return l; }));
    else if (pk.type === 'r') DOC = DOC.concat(parseReading(pk.text, pre).map(function(d){ d.custom = pk.id; if (!d.part) d.part = '★ Tự nạp'; return d; }));
    else if (pk.type === 'e') EXAMS = EXAMS.concat(parseExams(pk.text, pre).map(function(e){ e.custom = pk.id; return e; }));
  });
  ITEMS = {};
  VL.forEach(function(l){ l.items.forEach(function(i){ ITEMS[i.id] = i; }); });
  GL.forEach(function(l){ l.items.forEach(function(i){ ITEMS[i.id] = i; }); });
  S.custom.forEach(function(i){ i.kind = 'v'; i.custom = true; ITEMS[i.id] = i; });
}
rebuildIndex();
function customLessons(){
  var m = {}, out = [];
  S.custom.forEach(function(i){ if (!m[i.lesson]){ m[i.lesson] = { id:i.lesson, title:'★ ' + i.lesson, kind:'v', custom:true, items:[] }; out.push(m[i.lesson]); } m[i.lesson].items.push(i); });
  return out;
}
function allVocabLessons(){ return VL.concat(customLessons()); }
function allVocab(){ var a = []; allVocabLessons().forEach(function(l){ a = a.concat(l.items); }); return a; }
function allGrammar(){ var a = []; GL.forEach(function(l){ a = a.concat(l.items); }); return a; }
function lessonById(id){
  var all = allVocabLessons().concat(GL);
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}
function exOf(it){ var g = S.gen[it.id] || {}; return { ex:it.ex || g.ex || '', exVi:it.exVi || g.exVi || '' }; }
function blankOf(it){ var e = it.kind === 'v' ? exOf(it).ex : (it.ex || ''); var m = e.match(/【([^】]*)】/); if (m) return m[1]; if (it.kind === 'g' && it.ex2){ m = it.ex2.match(/【([^】]*)】/); if (m) return m[1]; } return ''; }
function blankSentence(it){ var e = it.kind === 'v' ? exOf(it).ex : (/【/.test(it.ex) ? it.ex : it.ex2); return { en:(e || '').replace(/【[^】]*】/, '_____'), vi:it.kind === 'v' ? exOf(it).exVi : (/【/.test(it.ex) ? it.exVi : it.ex2Vi) }; }

/* ======================= phát âm (tiếng Anh) ======================= */
var enVoices = [], enVoice = null;
function loadVoices(){
  if (!('speechSynthesis' in window)) return;
  var vs = speechSynthesis.getVoices() || [];
  enVoices = vs.filter(function(v){ return /^en([-_]|$)/i.test(v.lang); });
  var want = ''; try { want = localStorage.getItem(KEY_VOICE) || ''; } catch(e){}
  var acc = S.accent === 'uk' ? /GB|UK/i : /US/i;
  var rank = function(v){ return (v.name === want ? 1000 : 0) + (acc.test(v.lang) ? 100 : 0) + (/google|enhanced|premium|natural|neural|online|samantha|daniel/i.test(v.name) ? 10 : 0) + (v.localService ? 1 : 0); };
  enVoices.sort(function(a, b){ return rank(b) - rank(a); });
  enVoice = enVoices[0] || null;
}
if ('speechSynthesis' in window){ loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speakItem(it){ if (!it) return; speak(it.kind === 'v' ? it.w : (it.ex || it.p)); }
function speak(text, rate){
  if (!('speechSynthesis' in window)){ toast('Máy không hỗ trợ đọc', true); return; }
  var say = plain(text).replace(/_+/g, ' blank ');
  var go = function(){
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(say);
    if (enVoice){ u.voice = enVoice; u.lang = enVoice.lang; } else u.lang = S.accent === 'uk' ? 'en-GB' : 'en-US';
    u.rate = rate || S.rate || 0.9;
    try { speechSynthesis.resume(); } catch(e){}
    speechSynthesis.speak(u);
  };
  if (enVoice) return go();
  var tries = 0, iv = setInterval(function(){ loadVoices(); if (enVoice || ++tries > 15){ clearInterval(iv); go(); } }, 100);
}

/* ======================= save & SRS ======================= */
var saveTimer = null;
function save(){
  S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){ toast('Bộ nhớ máy đầy, không lưu được', true); }
  clearTimeout(saveTimer); saveTimer = setTimeout(cloudPush, 1200);
}
function logDay(ok){ var d = today(); var o = S.days[d] || (S.days[d] = { n:0, ok:0 }); o.n++; if (ok) o.ok++; }
function streak(){
  var n = 0, d = new Date();
  if (!S.days[today()]) d.setDate(d.getDate() - 1);
  while (true){
    var k = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    if (S.days[k] && S.days[k].n > 0){ n++; d.setDate(d.getDate() - 1); } else break;
  }
  return n;
}
function isDue(id){ var s = S.srs[id]; return s && s.due <= Date.now(); }
function isLearned(id){ var s = S.srs[id]; return s && s.int >= 21; }
function grade(id, q){ // q: 0 quên, 3 khó, 4 nhớ, 5 dễ
  var s = S.srs[id] || { ef:2.5, int:0, reps:0, lapses:0, due:0 };
  if (q < 3){ s.reps = 0; s.int = 0; s.lapses++; s.due = Date.now() + 10 * 60 * 1000; }
  else {
    if (s.reps === 0) s.int = q === 5 ? 3 : 1;
    else if (s.reps === 1) s.int = q === 3 ? 3 : (q === 5 ? 8 : 6);
    else s.int = Math.max(1, Math.round(s.int * (q === 3 ? 1.2 : s.ef) * (q === 5 ? 1.3 : 1)));
    s.reps++; s.due = Date.now() + s.int * 86400000;
  }
  s.ef = Math.max(1.3, s.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  S.srs[id] = s;
  if (q < 3) S.wrong[id] = (S.wrong[id] || 0) + 1; else if (S.wrong[id]){ S.wrong[id]--; if (!S.wrong[id]) delete S.wrong[id]; }
  logDay(q >= 3); save();
}
function recordAnswer(id, ok, extra){
  grade(id, ok ? 4 : 0);
  S.log.push({ id:id, ok:ok, at:Date.now(), x:extra || '' });
  if (S.log.length > 300) S.log = S.log.slice(-300);
  save();
}

/* ======================= Firebase ======================= */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyCN0PLODPT_2md8C-vn9g-Iwppy4-7c_Es",
  authDomain: "takemura-zaiko.firebaseapp.com",
  projectId: "takemura-zaiko",
  storageBucket: "takemura-zaiko.firebasestorage.app",
  messagingSenderId: "75919418188",
  appId: "1:75919418188:web:8bee4cd5f9afd7e2c665e9"
};
var cloud = { ready:false, user:null, db:null, auth:null, lastErr:'' };
function loadScripts(list, cb){
  var left = list.length, failed = false;
  list.forEach(function(src){
    var sc = document.createElement('script'); sc.async = false; sc.src = src;
    sc.onload = function(){ if (--left === 0 && !failed) cb(null); };
    sc.onerror = function(){ if (!failed){ failed = true; cb(new Error('Không tải được ' + src)); } };
    document.head.appendChild(sc);
  });
}
function startCloud(){
  var base = 'https://www.gstatic.com/firebasejs/10.12.0/';
  loadScripts([base + 'firebase-app-compat.js', base + 'firebase-auth-compat.js', base + 'firebase-firestore-compat.js'], function(err){
    if (err || !window.firebase){ $('lgErr').textContent = 'Firebase: không có mạng'; return; }
    try { firebase.initializeApp(FIREBASE_CONFIG); } catch(e){}
    cloud.auth = firebase.auth(); cloud.db = firebase.firestore(); cloud.ready = true;
    cloud.auth.onAuthStateChanged(function(u){
      cloud.user = u;
      if (u){ $('gate').classList.remove('show'); cloudPull(); }
      else if (!sessionStorage.getItem('en_skip')) $('gate').classList.add('show');
    });
  });
}
function docRef(){ return cloud.db.collection('english').doc(cloud.user.uid); }
function cloudPull(){
  docRef().get().then(function(snap){
    if (snap.exists){
      var d = snap.data() || {};
      var remote = d.state ? JSON.parse(d.state) : null;
      if (remote && (remote.updatedAt || 0) > (S.updatedAt || 0)){
        S = remote; for (var k in defaults) if (!(k in S)) S[k] = JSON.parse(JSON.stringify(defaults[k]));
        try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
        rebuildIndex(); applyPrefs(); render();
        return;
      }
    }
    cloudPush();
  }).catch(function(e){ cloud.lastErr = e.code || e.message; toast('Không đọc được dữ liệu Firebase: ' + cloud.lastErr, true); });
}
function cloudPush(){
  if (!cloud.ready || !cloud.user) return;
  var str = JSON.stringify(S);
  if (str.length > 950000){ cloud.lastErr = 'dữ liệu quá lớn (' + Math.round(str.length / 1024) + ' KB, tối đa ~950 KB)'; toast('Không lưu được lên Firebase: ' + cloud.lastErr, true); return; }
  docRef().set({ state: str, updatedAt: S.updatedAt, email: cloud.user.email || '' })
    .then(function(){ cloud.lastErr = ''; })
    .catch(function(e){ cloud.lastErr = e.code || e.message; toast('Không lưu được lên Firebase: ' + cloud.lastErr, true); });
}
function authErr(e){
  var m = { 'auth/wrong-password':'Sai mật khẩu', 'auth/invalid-credential':'Sai email hoặc mật khẩu', 'auth/user-not-found':'Chưa có tài khoản — bấm "Tạo tài khoản mới"', 'auth/email-already-in-use':'Email đã có tài khoản — hãy đăng nhập', 'auth/weak-password':'Mật khẩu tối thiểu 6 ký tự', 'auth/invalid-email':'Email không hợp lệ', 'auth/too-many-requests':'Thử quá nhiều lần, đợi một lúc', 'auth/operation-not-allowed':'Firebase chưa bật đăng nhập email/mật khẩu' };
  return m[e.code] || (e.code || e.message);
}
function bindGate(){
  $('lgLogin').onclick = function(){ if (!cloud.ready) return; $('lgErr').textContent = ''; cloud.auth.signInWithEmailAndPassword($('lgEmail').value.trim(), $('lgPass').value).catch(function(e){ $('lgErr').textContent = authErr(e); }); };
  $('lgSignup').onclick = function(){ if (!cloud.ready) return; $('lgErr').textContent = ''; cloud.auth.createUserWithEmailAndPassword($('lgEmail').value.trim(), $('lgPass').value).catch(function(e){ $('lgErr').textContent = authErr(e); }); };
  $('lgReset').onclick = function(){ if (!cloud.ready) return; cloud.auth.sendPasswordResetEmail($('lgEmail').value.trim()).then(function(){ $('lgErr').textContent = '✓ Đã gửi email đặt lại mật khẩu'; }).catch(function(e){ $('lgErr').textContent = authErr(e); }); };
  $('lgSkip').onclick = function(){ sessionStorage.setItem('en_skip', '1'); $('gate').classList.remove('show'); };
  $('lgPass').addEventListener('keydown', function(e){ if (e.key === 'Enter') $('lgLogin').click(); });
}

/* ======================= gia sư (DeepSeek) ======================= */
function shareProgress(){ try { return localStorage.getItem(KEY_SHARE) !== '0'; } catch(e){ return true; } }
function tutorCode(){ try { return localStorage.getItem(KEY_CODE) || ''; } catch(e){ return ''; } }
function jpTutorCode(){ try { return localStorage.getItem('nihongo_tutor_code') || ''; } catch(e){ return ''; } }
var chat = (function(){ try { return JSON.parse(localStorage.getItem(KEY_CHAT) || '[]'); } catch(e){ return []; } })();
var pendingCtx = '';
function saveChat(){ try { localStorage.setItem(KEY_CHAT, JSON.stringify(chat.slice(-40))); } catch(e){} }
function askTutor(ctx, q){ pendingCtx = ctx; switchTab('tutor'); var ta = $('chatInput'); if (ta){ ta.value = q || ''; ta.focus(); } }
function ctxOfItem(it){
  if (it.kind === 'v'){ var e = exOf(it); return '[Từ vựng] ' + it.w + ' ' + it.ipa + ' (' + it.pos + ') = ' + it.vi + (e.ex ? '\nVí dụ: ' + plain(e.ex) + ' — ' + e.exVi : ''); }
  var l = lessonById(it.lesson);
  return '[Ngữ pháp' + (l ? ' — ' + l.title : '') + '] ' + it.p + ' | Cấu trúc: ' + plain(it.form) + ' | Nghĩa: ' + it.vi + '\nCách dùng: ' + plain(it.use) + (it.ex ? '\nVí dụ: ' + plain(it.ex) + ' — ' + it.exVi : '');
}
function defaultQ(kind){
  return { v:'Giải thích kỹ từ này giúp mình: cách phát âm, các nghĩa thường gặp, từ dễ nhầm, collocation hay đi kèm, mẹo nhớ và thêm 3 câu ví dụ (có dịch).',
    g:'Giải thích kỹ phần ngữ pháp này giúp mình thật dễ hiểu: khi nào dùng, công thức, lỗi hay sai, phân biệt với cấu trúc dễ nhầm, và cho 3 câu ví dụ có dịch.',
    q:'Vì sao đáp án này đúng và các đáp án kia sai? Giải thích dễ hiểu giúp mình.',
    d:'Giải thích giúp mình đoạn văn này (từ khó, cấu trúc câu) và cách tìm ra đáp án.' }[kind];
}
function studyContext(){
  try {
    var lab = function(id){ var i = ITEMS[id]; if (!i) return null; return i.kind === 'v' ? (i.w + ' = ' + i.vi) : (i.p + ' = ' + i.vi); };
    var lines = [];
    var studied = Object.keys(S.srs).filter(function(id){ return ITEMS[id]; });
    var learned = studied.filter(function(id){ return S.srs[id].int >= 21; });
    lines.push('- Đã học: ' + studied.length + ' mục, đã thuộc (SRS ≥ 21 ngày): ' + learned.length + ', đánh dấu khó: ' + Object.keys(S.hard).length + ', mục hay sai: ' + Object.keys(S.wrong).length + '. Chuỗi ngày học: ' + streak() + '.');
    var wrong = Object.keys(S.wrong).filter(function(id){ return ITEMS[id]; }).sort(function(a,b){ return S.wrong[b] - S.wrong[a]; }).slice(0, 25).map(lab).filter(Boolean);
    if (wrong.length) lines.push('- Các mục hay sai: ' + wrong.join('; '));
    var hard = Object.keys(S.hard).filter(function(id){ return ITEMS[id]; }).slice(0, 25).map(lab).filter(Boolean);
    if (hard.length) lines.push('- Từ/mẫu người học đánh dấu khó: ' + hard.join('; '));
    var stat = {};
    (S.log || []).forEach(function(e){ var it = ITEMS[e.id]; if (!it || !it.lesson) return; var k = (lessonById(it.lesson) || {}).title || it.lesson; stat[k] = stat[k] || { n:0, ok:0 }; stat[k].n++; if (e.ok) stat[k].ok++; });
    var weak = Object.keys(stat).filter(function(k){ return stat[k].n >= 5; }).map(function(k){ return { k:k, p:stat[k].ok / stat[k].n, n:stat[k].n }; }).sort(function(a,b){ return a.p - b.p; }).slice(0, 5);
    if (weak.length) lines.push('- Bài có tỉ lệ đúng thấp nhất: ' + weak.map(function(w){ return w.k + ' (' + Math.round(w.p * 100) + '% trên ' + w.n + ' lượt)'; }).join(', ') + '.');
    var exams = (S.exams || []).slice(-8).reverse();
    if (exams.length) lines.push('- Các bài thi gần đây: ' + exams.map(function(r){ return r.title + ': ' + r.pct + '%'; }).join('; ') + '.');
    (S.exams || []).slice(-3).reverse().forEach(function(r){
      if (!r.miss || !r.miss.length) return;
      lines.push('- Câu sai trong "' + r.title + '" (' + r.pct + '%):');
      r.miss.slice(0, 12).forEach(function(m){ lines.push('  · [' + secName(m.sec) + '] ' + m.q + ' → chọn: ' + (m.pick || '(bỏ trống)') + ' | đúng: ' + m.a); });
    });
    var rd = Object.keys(S.reading || {}).length; if (rd) lines.push('- Đã làm ' + rd + ' bài đọc hiểu.');
    var bs = {}; Object.keys(S.bt || {}).forEach(function(id){ var m = id.match(/^b_(.+?)_\d+_\d+$/); if (!m) return; var l = lessonById(m[1]); var k = l ? l.title : m[1]; bs[k] = bs[k] || { n:0, ok:0 }; bs[k].n++; if (S.bt[id].ok) bs[k].ok++; });
    var bk = Object.keys(bs); if (bk.length) lines.push('- Bài tập theo chuyên đề (đúng/đã làm): ' + bk.map(function(k){ return k + ' ' + bs[k].ok + '/' + bs[k].n; }).join('; ') + '.');
    var P = progressSummary();
    lines.push('- Chỗ dừng lần trước: ' + (placeText(S.last) || '(chưa có)') + (S.last ? ' — lúc ' + new Date(S.last.at).toLocaleString('vi-VN') : '') + '.');
    lines.push('- Từ vựng: đã học ' + P.seen + '/' + P.nv + ' từ, đã thuộc ' + P.learned + '. Theo bài: ' + P.vrow.filter(function(x){ return x.seen; }).map(function(x){ return x.l.title.split(' · ')[0] + ' ' + x.seen + '/' + x.l.items.length; }).join(', ') + (P.nextV ? '. Bài chưa xong tiếp theo: ' + P.nextV.l.title : '') + '.');
    lines.push('- Ngữ pháp theo chuyên đề (lý thuyết đã luyện / bài tập đã làm, số đúng): ' + P.grow.map(function(x){ return x.l.title.replace(/ \(.*\)$/, '') + ': ' + x.th + '/' + x.l.items.length + (x.bt.n ? ', BT ' + x.bt.done + '/' + x.bt.n + ' đúng ' + x.bt.ok : ''); }).join('; ') + '.');
    var wb = []; Object.keys(S.bt || {}).forEach(function(id){ if (!S.bt[id].ok) wb.push(id); });
    if (wb.length) lines.push('- Số câu bài tập đang sai: ' + wb.length + '.');
    var act = Object.keys(S.days).sort().slice(-14).map(function(d){ return d.slice(5) + ':' + S.days[d].n; });
    if (act.length) lines.push('- Số lượt học các ngày gần đây: ' + act.join(', ') + '.');
    return lines.join('\n').slice(0, 9000);
  } catch(e){ return ''; }
}
function deepseek(messages, opts){
  opts = opts || {};
  return fetch('https://api.deepseek.com/chat/completions', {
    method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + tutorCode() },
    body: JSON.stringify({ model:'deepseek-chat', messages:messages, temperature:opts.temp == null ? 0.4 : opts.temp, max_tokens:opts.max || 1400 })
  }).then(function(r){
    if (!r.ok) return r.text().then(function(x){ throw new Error(r.status === 401 ? 'Mã gia sư không đúng' : (r.status === 402 ? 'Mã gia sư hết số dư' : ('HTTP ' + r.status + ' ' + x.slice(0, 120)))); });
    return r.json();
  }).then(function(j){ return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || ''; })
    .catch(function(e){ if (e.message === 'Failed to fetch') throw new Error('Không kết nối được tới gia sư (kiểm tra mạng)'); throw e; });
}
function callTutor(userText, ctx){
  var sys = 'Bạn là gia sư tiếng Anh tận tâm cho người Việt. Luôn trả lời bằng tiếng Việt, ví dụ tiếng Anh thì kèm bản dịch tiếng Việt. ' +
    'Khi nhắc tới từ khó, ghi phiên âm IPA. Giải thích ngắn gọn, rõ ràng, có ví dụ, có mẹo nhớ nếu hữu ích. Khi giải thích đáp án, nói vì sao đáp án đúng và vì sao từng đáp án khác sai. Không dùng bảng markdown. ' +
    'Khi người học hỏi nhận xét, lời khuyên hoặc nên học gì, hãy dựa trên TIẾN TRÌNH HỌC bên dưới (nếu có) và nêu cụ thể các từ, chuyên đề, đề thi liên quan.';
  var prog = shareProgress() ? studyContext() : '';
  if (prog) sys += '\n\nQUAN TRỌNG: App đã tự động gửi kèm TIẾN TRÌNH HỌC thật của người học. Bạn XEM ĐƯỢC dữ liệu này, không được nói là không xem được. Nếu các con số đều bằng 0 thì người học mới bắt đầu.\n\nTIẾN TRÌNH HỌC:\n' + prog;
  else sys += '\n\n(Người học đã tắt chia sẻ tiến trình. Nếu họ hỏi về tiến trình, nói họ bật lại ở ⚙ Cài đặt → "Cho gia sư xem tiến trình học".)';
  var msgs = [{ role:'system', content:sys }];
  var hist = chat.slice(-11); if (hist.length && hist[hist.length - 1].role === 'user' && hist[hist.length - 1].content === userText) hist.pop();
  hist.slice(-10).forEach(function(m){ if (m.role === 'user' || m.role === 'assistant') msgs.push({ role:m.role, content:m.content }); });
  msgs.push({ role:'user', content:(ctx ? ('Ngữ cảnh mình đang học:\n' + ctx + '\n\nCâu hỏi: ') : '') + userText });
  return deepseek(msgs);
}
function mdLite(s){ return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/^#{1,4}\s*(.+)$/gm, '<b>$1</b>'); }
/* gia sư tạo ví dụ + mẹo nhớ cho một từ (lưu vào tài khoản) */
function genForWord(it, done){
  if (!tutorCode()){ toast('Nhập mã gia sư trong ⚙ Cài đặt để dùng tính năng này', true); return; }
  toast('Gia sư đang soạn ví dụ và mẹo nhớ…');
  var prompt = 'Từ tiếng Anh: "' + it.w + '" (' + it.pos + ') nghĩa: ' + it.vi + '.\nTrả về đúng JSON {"ex":"một câu ví dụ tiếng Anh ngắn, tự nhiên, từ đích đặt trong 【】","exVi":"dịch câu ví dụ sang tiếng Việt","tip":"mẹo nhớ ngắn bằng tiếng Việt (gốc từ, liên tưởng, từ dễ nhầm)"}. Chỉ trả JSON.';
  deepseek([{ role:'user', content:prompt }], { temp:0.5, max:400 }).then(function(txt){
    var j = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
    S.gen[it.id] = { ex:j.ex || '', exVi:j.exVi || '', tip:j.tip || '' }; save(); toast('✓ Đã thêm ví dụ và mẹo nhớ'); if (done) done();
  }).catch(function(e){ toast('✗ ' + e.message, true); });
}

/* ======================= views ======================= */
var curTab = 'vocab';
var view = $('view');
var ui = { vLesson:'e01', vSearch:'', gLesson:'', gMode:'t', gOpen:null, bt:null, btGrid:false, readId:null, practice:null, exam:null };
function applyPrefs(){
  document.body.classList.toggle('noipa', !S.ipa);
  $('btnIpa').classList.toggle('on', !!S.ipa);
}
function switchTab(tab){
  curTab = tab;
  document.querySelectorAll('#tabs button').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
  render(); window.scrollTo(0, 0);
}
function render(){
  var fn = { vocab:renderVocab, grammar:renderGrammar, reading:renderReading, practice:renderPractice, exam:renderExam, tutor:renderTutor }[curTab];
  removeChatbar();
  if (fn) fn();
  markPlace();
}
/* ---------- tự lưu chỗ đang học ---------- */
function markPlace(){
  if (!ui.started) return; // chưa thao tác gì sau khi mở app → giữ nguyên chỗ dừng cũ
  if (curTab === 'tutor' || curTab === 'exam' || curTab === 'practice' && !ui.practice) return;
  var L = { tab:curTab, at:Date.now() };
  if (curTab === 'vocab'){ if (ui.vLesson.indexOf('__') === 0 || ui.vSearch) return; L.v = ui.vLesson; }
  else if (curTab === 'grammar'){
    L.g = ui.gLesson; L.gm = ui.gMode;
    if (ui.bt){ var q = ui.bt.qs[ui.bt.idx]; if (q){ L.bt = { set:q.set.id, lesson:q.set.lesson, idx:ui.bt.idx, title:ui.bt.title, ids:ui.bt.title === q.set.no ? null : ui.bt.qs.map(function(x){ return x.id; }) }; } }
  }
  else if (curTab === 'reading'){ if (!ui.readId) return; L.r = ui.readId; }
  else if (curTab === 'practice'){ var pc = ui.practice.cfg; L.p = { type:pc.type, mode:pc.mode, n:ui.practice.queue.length, idx:ui.practice.idx, lesson:(ui.practice.queue[0] || {}).lesson }; }
  var old = S.last || {}, sig = function(o){ var c = {}; for (var k in o) if (k !== 'at') c[k] = o[k]; return JSON.stringify(c); };
  if (sig(old) === sig(L)) return;
  S.last = L;
  if (curTab === 'vocab') S.lastV = L.v; if (curTab === 'grammar') S.lastG = L.g;
  save();
}
function placeText(L){
  if (!L) return '';
  if (L.tab === 'vocab'){ var l = lessonById(L.v); return '📗 Từ vựng — ' + (l ? l.title : L.v); }
  if (L.tab === 'grammar'){
    var g = lessonById(L.g), t = g ? g.title : L.g;
    if (L.bt) return '✍ Bài tập — ' + t + ' · ' + L.bt.title + ' · câu ' + (L.bt.idx + 1);
    return '📘 Ngữ pháp — ' + t + (L.gm === 'b' ? ' (bài tập)' : '');
  }
  if (L.tab === 'reading'){ var d = DOC.filter(function(x){ return x.id === L.r; })[0]; return '📖 Đọc hiểu — ' + (d ? d.title : L.r); }
  if (L.tab === 'practice' && L.p){ var pl = lessonById(L.p.lesson); return '✎ Luyện tập — ' + (pl ? pl.title : '') + ' (câu ' + (L.p.idx + 1) + '/' + L.p.n + ')'; }
  return '';
}
function resumePlace(){
  var L = S.last; if (!L) return;
  if (L.tab === 'vocab'){ ui.vLesson = L.v; ui.vSearch = ''; }
  else if (L.tab === 'grammar'){
    ui.gLesson = L.g; ui.gMode = L.gm || 't'; ui.bt = null;
    if (L.bt){
      var qs = null, title = L.bt.title;
      if (L.bt.ids){ qs = L.bt.ids.map(function(id){ var hit = null; btSets(L.bt.lesson).forEach(function(st){ st.qs.forEach(function(q){ if (q.id === id) hit = q; }); }); return hit; }).filter(Boolean); }
      else { var st = btSets(L.bt.lesson).filter(function(x){ return x.id === L.bt.set; })[0]; if (st){ qs = st.qs; title = st.no; } }
      if (qs && qs.length) ui.bt = { qs:qs, idx:Math.min(L.bt.idx, qs.length - 1), title:title };
    }
  }
  else if (L.tab === 'reading') ui.readId = L.r;
  else if (L.tab === 'practice'){ var pl = lessonById(L.p && L.p.lesson); if (pl){ L = { tab:pl.kind === 'v' ? 'vocab' : 'grammar' }; if (pl.kind === 'v') ui.vLesson = pl.id; else ui.gLesson = pl.id; } else L = { tab:'practice' }; }
  switchTab(L.tab);
}
/* tổng hợp tiến trình để hiện trên app và gửi gia sư */
function progressSummary(){
  var vl = allVocabLessons(), seen = 0, learned = 0, vrow = [];
  vl.forEach(function(l){ var a = 0, b = 0; l.items.forEach(function(i){ if (S.srs[i.id]){ a++; if (S.srs[i.id].int >= 21) b++; } }); seen += a; learned += b; vrow.push({ l:l, seen:a, learned:b }); });
  var nv = allVocab().length;
  var grow = GL.map(function(l){
    var th = l.items.filter(function(i){ return S.srs[i.id]; }).length, all = [];
    btSets(l.id).forEach(function(st){ all = all.concat(st.qs); });
    var b = btStat(all);
    return { l:l, th:th, bt:b };
  });
  var btAll = grow.reduce(function(a, x){ a.n += x.bt.n; a.done += x.bt.done; a.ok += x.bt.ok; return a; }, { n:0, done:0, ok:0 });
  var nextV = vrow.filter(function(x){ return x.seen < x.l.items.length; })[0];
  var nextG = grow.filter(function(x){ return x.bt.n ? x.bt.done < x.bt.n : x.th < x.l.items.length; })[0];
  return { seen:seen, learned:learned, nv:nv, vrow:vrow, grow:grow, bt:btAll, nextV:nextV, nextG:nextG };
}
function homeCard(){
  var P = progressSummary(), L = S.last;
  var pct = function(a, b){ return Math.round(a / Math.max(1, b) * 100); };
  return '<div class="card flat homecard">' +
    (L && placeText(L) ? '<div class="small muted">Lần trước bạn dừng ở</div><div style="font-weight:700;margin:2px 0 8px">' + esc(placeText(L)) + '</div><button class="btn primary block" id="hResume">▶ Học tiếp từ chỗ dừng</button>' : '<div style="font-weight:700">👋 Bắt đầu học thôi! App sẽ tự nhớ bạn học tới đâu.</div>') +
    '<div class="hgrid">' +
      '<div><b>' + P.seen + '</b>/' + P.nv + '<span>từ đã học · ' + P.learned + ' đã thuộc</span><div class="progress"><i style="width:' + pct(P.seen, P.nv) + '%"></i></div></div>' +
      '<div><b>' + P.grow.filter(function(x){ return x.th || x.bt.done; }).length + '</b>/' + GL.length + '<span>chuyên đề đã học</span><div class="progress"><i style="width:' + pct(P.grow.filter(function(x){ return x.th || x.bt.done; }).length, GL.length) + '%"></i></div></div>' +
      '<div><b>' + P.bt.done + '</b>/' + P.bt.n + '<span>câu bài tập · đúng ' + pct(P.bt.ok, P.bt.done) + '%</span><div class="progress"><i style="width:' + pct(P.bt.done, P.bt.n) + '%"></i></div></div>' +
    '</div>' +
    '<div class="chips" style="margin-top:8px">' +
      (P.nextV ? '<button class="pill" id="hNextV">Từ vựng tiếp: ' + esc(P.nextV.l.title.split(' · ')[0]) + '</button>' : '') +
      (P.nextG ? '<button class="pill" id="hNextG">Ngữ pháp tiếp: ' + esc(P.nextG.l.title.split(' · ')[0]) + '</button>' : '') +
      '<button class="pill on" id="hPlan">🗺 Gia sư: tóm tắt & lộ trình</button>' +
    '</div></div>';
}
function bindHome(){
  var P = progressSummary();
  if ($('hResume')) $('hResume').onclick = resumePlace;
  if ($('hNextV')) $('hNextV').onclick = function(){ ui.vLesson = P.nextV.l.id; ui.vSearch = ''; renderVocab(); markPlace(); };
  if ($('hNextG')) $('hNextG').onclick = function(){ ui.gLesson = P.nextG.l.id; ui.gMode = 't'; ui.bt = null; switchTab('grammar'); };
  if ($('hPlan')) $('hPlan').onclick = askPlan;
}
var PLAN_Q = 'Hãy TÓM TẮT tiến trình học của mình trong app (đã học được gì ở từ vựng, ngữ pháp, bài tập; điểm mạnh; phần còn yếu dựa trên câu sai) rồi lập LỘ TRÌNH học cụ thể cho 7 ngày tới: mỗi ngày học bài từ vựng nào, chuyên đề nào, làm bài tập nào, ôn lại gì — dựa đúng vào dữ liệu app, nêu tên bài/chuyên đề cụ thể.';
function askPlan(){ if (!tutorCode()){ toast('Nhập mã gia sư trong ⚙ Cài đặt để dùng gia sư', true); openSettings(); return; } switchTab('tutor'); var ta = $('chatInput'); if (ta){ ta.value = PLAN_Q; sendChat(); } }
function statsBar(){
  var due = 0, learned = 0;
  for (var id in S.srs){ if (!ITEMS[id]) continue; if (S.srs[id].due <= Date.now()) due++; if (S.srs[id].int >= 21) learned++; }
  var d = S.days[today()] || { n:0 };
  return '<div class="stats">' +
    '<div class="stat"><b>' + d.n + '/' + S.goal + '</b><span>Hôm nay</span></div>' +
    '<div class="stat"><b>' + due + '</b><span>Cần ôn</span></div>' +
    '<div class="stat"><b>' + learned + '</b><span>Đã thuộc</span></div>' +
    '<div class="stat"><b>🔥' + streak() + '</b><span>Chuỗi ngày</span></div></div>';
}
function lessonOptions(lessons, cur, extra){
  var html = (extra || []).map(function(e){ return '<option value="' + e[0] + '"' + (e[0] === cur ? ' selected' : '') + '>' + esc(e[1]) + '</option>'; }).join('');
  html += lessons.map(function(l){ return '<option value="' + esc(l.id) + '"' + (l.id === cur ? ' selected' : '') + '>' + esc(l.title) + ' (' + l.items.length + ')</option>'; }).join('');
  return html;
}

/* ---------- từ vựng ---------- */
function vocabPool(lessonId){
  var pick = function(map){ return Object.keys(map).map(function(id){ return ITEMS[id]; }).filter(function(i){ return i && i.kind === 'v'; }); };
  if (lessonId === '__marked') return pick(S.marked);
  if (lessonId === '__hard') return pick(S.hard);
  if (lessonId === '__sel') return pick(S.selected);
  if (lessonId === '__all') return allVocab();
  var l = lessonById(lessonId); return l ? l.items : [];
}
function stTags(it){ return (S.hard[it.id] ? '<span class="tag due">Từ khó</span>' : '') + (isLearned(it.id) ? '<span class="tag ok">Đã thuộc</span>' : (isDue(it.id) ? '<span class="tag due">Cần ôn</span>' : '')); }
function vocabCard(it){
  var e = exOf(it);
  return '<div class="card listitem" data-id="' + esc(it.id) + '">' +
    '<div class="head"><input type="checkbox" class="sel" data-act="sel"' + (S.selected[it.id] ? ' checked' : '') + '>' +
    '<div class="grow"><div class="word">' + esc(it.w) + (it.pos ? '<span class="pos">' + esc(it.pos) + '</span>' : '') + (S.marked[it.id] ? ' <span style="color:var(--warn);font-size:.9rem">★</span>' : '') + '</div>' +
    '<div class="small"><span class="ipa">' + esc(it.ipa) + '</span> ' + stTags(it) + '</div>' +
    '<div>' + esc(it.vi) + '</div></div>' + (it.no ? '<span class="small muted">#' + it.no + '</span>' : '') + '</div>' +
    '<div class="more">' +
      (e.ex ? '<div class="small muted">Ví dụ</div>' + exLine(e.ex, e.exVi) : '') +
      tipBox(it) +
      '<div class="actions">' +
        '<button data-act="speak">🔊 Đọc từ</button>' + (e.ex ? '<button data-act="speakEx">🔊 Đọc câu</button>' : '') +
        '<button data-act="mark" class="' + (S.marked[it.id] ? 'on' : '') + '">' + (S.marked[it.id] ? '★ Bỏ dấu' : '★ Đánh dấu') + '</button>' +
        '<button data-act="tutor">💬 Hỏi gia sư</button>' +
        (!tipBox(it) || !e.ex ? '<button data-act="gen">🎓 Thêm ví dụ & mẹo</button>' : '') +
        (it.custom ? '<button data-act="delw">🗑 Xóa</button>' : '') +
      '</div>' +
    '</div></div>';
}
function renderVocab(){ renderVocab0(); markPlace(); }
function renderVocab0(){
  var lessons = allVocabLessons();
  var pool = vocabPool(ui.vLesson);
  var q = norm(ui.vSearch);
  if (q){ pool = allVocab().filter(function(i){ return norm(i.w).indexOf(q) >= 0 || String(i.vi).toLowerCase().indexOf(ui.vSearch.trim().toLowerCase()) >= 0; }); }
  var nSel = Object.keys(S.selected).filter(function(k){ return ITEMS[k] && ITEMS[k].kind === 'v'; }).length;
  view.innerHTML = statsBar() + homeCard() +
    '<div class="row" style="margin-bottom:8px"><select id="vLesson" class="grow">' +
      lessonOptions(lessons, ui.vLesson, [['__all', 'Tất cả từ'], ['__hard', 'Từ khó'], ['__marked', 'Đã đánh dấu ★'], ['__sel', 'Đã chọn để kiểm tra']]) +
    '</select></div>' +
    '<input type="text" id="vSearch" placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt…" value="' + esc(ui.vSearch) + '" autocapitalize="off">' +
    '<div class="row" style="margin:10px 0">' +
      '<button class="pill" id="vSelAll">Chọn cả bài</button><button class="pill" id="vClear">Bỏ chọn hết</button>' +
      '<span class="small muted grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:60px">' + nSel + ' từ đã chọn</span>' +
      '<button class="pill on" id="vImport">📥 Nạp dữ liệu</button>' +
    '</div>' +
    '<div class="row" style="margin-bottom:10px"><button class="btn primary grow" id="vTest">▶ Học thẻ bài này (' + pool.length + ')</button><button class="btn grow" id="vQuiz">✎ Kiểm tra nhanh</button></div>' +
    '<div id="vList">' + (pool.length ? pool.map(vocabCard).join('') : '<div class="empty">Không có từ nào.</div>') + '</div>';
  $('vLesson').onchange = function(){ ui.vLesson = this.value; ui.vSearch = ''; renderVocab(); };
  var stimer; $('vSearch').oninput = function(){ var v = this.value; clearTimeout(stimer); stimer = setTimeout(function(){ ui.vSearch = v; renderVocab(); var el = $('vSearch'); el.focus(); el.setSelectionRange(v.length, v.length); }, 250); };
  $('vSelAll').onclick = function(){ pool.forEach(function(i){ S.selected[i.id] = 1; }); save(); renderVocab(); };
  $('vClear').onclick = function(){ Object.keys(S.selected).forEach(function(k){ if (!ITEMS[k] || ITEMS[k].kind === 'v') delete S.selected[k]; }); save(); renderVocab(); };
  $('vImport').onclick = function(){ openImport('v'); };
  $('vTest').onclick = function(){ if (!pool.length) return; startSession({ type:'v', mode:'flash', dir:'en', items:pool.slice() }); };
  $('vQuiz').onclick = function(){ if (!pool.length) return; startSession({ type:'v', mode:'meaning', items:shuffle(pool).slice(0, 20) }); };
  bindItemList($('vList'));
  bindHome();
}
function bindItemList(root){
  root.addEventListener('click', function(e){
    var card = e.target.closest('.listitem'); if (!card) return;
    var id = card.getAttribute('data-id'), it = ITEMS[id];
    var act = e.target.getAttribute('data-act');
    if (act === 'sel'){ if (e.target.checked) S.selected[id] = 1; else delete S.selected[id]; save(); e.stopPropagation(); return; }
    if (act === 'reveal'){ revealToggle(e.target); return; }
    if (act === 'speak'){ speakItem(it); return; }
    if (act === 'speakEx'){ speak(it.kind === 'v' ? exOf(it).ex : it.ex); return; }
    if (act === 'speakEx2'){ speak(it.ex2); return; }
    if (act === 'mark'){ if (S.marked[id]) delete S.marked[id]; else S.marked[id] = 1; save(); rerenderCard(root, card, it); return; }
    if (act === 'tutor'){ askTutor(ctxOfItem(it), defaultQ(it.kind)); return; }
    if (act === 'gen'){ genForWord(it, function(){ var c = root.querySelector('[data-id="' + CSS.escape(id) + '"]'); if (c) rerenderCard(root, c, it); }); return; }
    if (act === 'delw'){ if (confirm('Xóa từ này?')){ S.custom = S.custom.filter(function(x){ return x.id !== id; }); delete S.selected[id]; delete S.marked[id]; save(); rebuildIndex(); render(); } return; }
    if (e.target.closest('.more')) return;
    card.classList.toggle('open');
  });
}
function rerenderCard(root, card, it){
  card.outerHTML = it.kind === 'v' ? vocabCard(it) : grammarCard(it);
  var nc = root.querySelector('[data-id="' + CSS.escape(it.id) + '"]'); if (nc) nc.classList.add('open');
}

/* ---------- ngữ pháp ---------- */
function grammarCard(it){
  var st = isLearned(it.id) ? '<span class="tag ok">Đã thuộc</span>' : (isDue(it.id) ? '<span class="tag due">Cần ôn</span>' : '');
  return '<div class="card listitem" data-id="' + esc(it.id) + '">' +
    '<div class="head"><span class="num">' + it.no + '</span><div class="grow"><div class="word" style="font-size:1.12rem;line-height:1.45">' + fmt(it.p) + (S.marked[it.id] ? ' <span style="color:var(--warn);font-size:.9rem">★</span>' : '') + ' ' + st + '</div>' +
    '<div class="small muted">' + fmt(it.vi) + '</div></div>' +
    '<input type="checkbox" class="sel" data-act="sel"' + (S.selected[it.id] ? ' checked' : '') + '></div>' +
    '<div class="more">' +
      (it.form ? '<div class="small muted">Cấu trúc</div><div class="card flat" style="margin:4px 0 8px;padding:9px 12px;font-weight:600">' + fmt(it.form) + '</div>' : '') +
      (it.use ? '<div class="small muted">Cách dùng</div><div>' + fmt(it.use) + '</div>' : '') +
      (it.ex ? '<div class="small muted" style="margin-top:8px">Ví dụ</div>' + exLine(it.ex, it.exVi) : '') +
      (it.ex2 ? exLine(it.ex2, it.ex2Vi) : '') +
      tipBox(it) +
      '<div class="actions">' +
        (it.ex ? '<button data-act="speakEx">🔊 Đọc ví dụ</button>' : '') + (it.ex2 ? '<button data-act="speakEx2">🔊 Ví dụ 2</button>' : '') +
        '<button data-act="mark" class="' + (S.marked[it.id] ? 'on' : '') + '">' + (S.marked[it.id] ? '★ Bỏ dấu' : '★ Đánh dấu') + '</button>' +
        '<button data-act="tutor">💬 Hỏi gia sư</button>' +
      '</div>' +
    '</div></div>';
}
function overviewHtml(txt){
  return String(txt || '').split('¶').map(function(line){
    var m = line.match(/^#\s*(.+)$/);
    if (m) return '<div class="ovh">' + fmt(m[1]) + '</div>';
    return '<div>' + fmt(line) + '</div>';
  }).join('');
}
function renderGrammar(){ renderGrammar0(); markPlace(); }
function renderGrammar0(){
  if (!GL.length){
    view.innerHTML = statsBar() + '<div class="card empty"><div style="font-size:2rem">📘</div><b>Chưa có dữ liệu ngữ pháp</b><p class="small">Bấm nút dưới để nạp: chụp ảnh sách, chọn file hoặc dán văn bản. Gia sư có thể tự chuyển văn bản sang đúng định dạng.</p><button class="btn primary" id="gImp">📥 Nạp ngữ pháp</button></div>';
    $('gImp').onclick = function(){ openImport('g'); };
    return;
  }
  var l = lessonById(ui.gLesson) || GL[0]; ui.gLesson = l.id;
  if (ui.bt) return renderBtQ(l);
  var groups = {}, order = [];
  GL.forEach(function(x){ var p = x.part || 'Khác'; if (!groups[p]){ groups[p] = []; order.push(p); } groups[p].push(x); });
  var opts = order.map(function(p){ return '<optgroup label="' + esc(p) + '">' + groups[p].map(function(x){ return '<option value="' + esc(x.id) + '"' + (x.id === l.id ? ' selected' : '') + '>' + esc(x.title) + ' (' + x.items.length + ' mục' + (btCount(x.id) ? ' · ' + btCount(x.id) + ' bài tập' : '') + ')</option>'; }).join('') + '</optgroup>'; }).join('');
  var idx = GL.indexOf(l);
  var done = l.items.filter(function(i){ return S.srs[i.id]; }).length;
  var nb = btCount(l.id), gm = ui.gMode === 'b' ? 'b' : 't';
  var head = statsBar() +
    '<div class="row" style="margin-bottom:8px"><select id="gLesson" class="grow">' + opts + '</select><button class="pill on" id="gImp">📥 Nạp</button></div>' +
    '<div class="row small muted" style="margin-bottom:6px"><span class="grow">' + esc(l.part) + ' · ' + l.items.length + ' mục · đã luyện ' + done + '</span>' +
      '<button class="pill" id="gPrev"' + (idx > 0 ? '' : ' disabled') + '>← Trước</button><button class="pill" id="gNext"' + (idx < GL.length - 1 ? '' : ' disabled') + '>Sau →</button></div>' +
    '<h2 style="margin-top:4px">' + esc(l.title) + '</h2>' +
    '<div class="seg"><button data-gm="t" class="' + (gm === 't' ? 'on' : '') + '">📘 Lý thuyết</button><button data-gm="b" class="' + (gm === 'b' ? 'on' : '') + '">✍ Bài tập' + (nb ? ' · ' + nb + ' câu' : '') + '</button></div>';
  var bindHead = function(){
    $('gLesson').onchange = function(){ ui.gLesson = this.value; renderGrammar(); window.scrollTo(0, 0); };
    $('gImp').onclick = function(){ openImport('g'); };
    $('gPrev').onclick = function(){ if (idx > 0){ ui.gLesson = GL[idx - 1].id; renderGrammar(); window.scrollTo(0, 0); } };
    $('gNext').onclick = function(){ if (idx < GL.length - 1){ ui.gLesson = GL[idx + 1].id; renderGrammar(); window.scrollTo(0, 0); } };
    view.querySelectorAll('[data-gm]').forEach(function(b){ b.onclick = function(){ ui.gMode = b.getAttribute('data-gm'); renderGrammar(); }; });
  };
  if (gm === 'b'){ view.innerHTML = head + renderBtList(l); bindHead(); bindBtList(l); return; }
  view.innerHTML = head +
    (l.overview ? '<div class="card flat"><h3 style="margin-top:0">📘 Tổng quan — đọc trước khi học</h3><div class="overview">' + overviewHtml(l.overview) + '</div></div>' : '') +
    '<div class="row" style="margin:10px 0"><button class="btn primary grow" id="gTest">▶ Điền chỗ trống</button><button class="btn grow" id="gMean">✎ Ý nghĩa</button><button class="btn grow" id="gFlash">🃏 Thẻ</button></div>' +
    '<div class="row" style="margin-bottom:8px"><button class="pill" id="gOpenAll">Mở tất cả</button><span class="small muted">Bấm vào từng mục để xem cấu trúc, cách dùng, ví dụ (bấm 👁 Dịch để xem nghĩa)</span></div>' +
    '<div id="gList">' + l.items.map(grammarCard).join('') + '</div>' +
    '<button class="btn block" id="gChap" style="margin-top:6px">📝 Kiểm tra cả chuyên đề (tính giờ)</button>' +
    (nb ? '<button class="btn primary block" id="gToBt" style="margin-top:8px">✍ Làm ' + nb + ' câu bài tập của chuyên đề này →</button>' : '');
  bindHead();
  if ($('gToBt')) $('gToBt').onclick = function(){ ui.gMode = 'b'; renderGrammar(); window.scrollTo(0, 0); };
  if (ui.gOpen){ var oc = view.querySelector('[data-id="' + CSS.escape(ui.gOpen) + '"]'); ui.gOpen = null; if (oc){ oc.classList.add('open'); setTimeout(function(){ oc.scrollIntoView({ block:'start' }); }, 50); } }
  var fillable = l.items.filter(function(i){ return blankOf(i); });
  $('gTest').onclick = function(){ if (!fillable.length){ toast('Chuyên đề này chưa có câu để điền', true); return; } startSession({ type:'g', mode:'gfill', items:shuffle(fillable) }); };
  $('gMean').onclick = function(){ startSession({ type:'g', mode:'gmean', items:shuffle(l.items) }); };
  $('gFlash').onclick = function(){ startSession({ type:'g', mode:'flash', dir:'en', items:l.items.slice() }); };
  $('gOpenAll').onclick = function(){ var all = view.querySelectorAll('#gList .listitem'); var open = !all[0] || !all[0].classList.contains('open'); all.forEach(function(c){ c.classList.toggle('open', open); }); this.textContent = open ? 'Thu gọn' : 'Mở tất cả'; };
  $('gChap').onclick = function(){ var n = Math.min(20, l.items.length * 2); startExam('chapter', 'ch:' + l.id, 'Kiểm tra: ' + l.title, buildChapterQs(l.items, n), Math.max(5, n)); };
  bindItemList($('gList'));
}

/* ---------- bài tập theo chuyên đề ----------
   X|mã chuyên đề|số bài|đề bài|dịch đề bài
   P|đoạn văn (nếu bài có đoạn văn)|dịch đoạn văn
   Q|câu hỏi|A~B~C~D|chữ cái đáp án|giải thích|gợi ý|kiến thức (số mục, vd 3,5)|dịch câu
   W|câu hỏi (tự gõ đáp án)|đáp án 1/đáp án 2|giải thích|gợi ý|kiến thức|dịch câu */
var BT = {};
function parseBT(src){
  var out = {}, cur = null, psg = null;
  (src || '').split('\n').forEach(function(line){
    line = line.trim(); if (!line) return;
    var f = line.split('|');
    if (f[0] === 'X'){ var lid = f[1]; out[lid] = out[lid] || []; cur = { lesson:lid, no:f[2] || ('Bài ' + (out[lid].length + 1)), id:lid + '_' + (out[lid].length + 1), inst:f[3] || '', instVi:f[4] || '', qs:[] }; out[lid].push(cur); psg = null; return; }
    if (!cur) return;
    if (f[0] === 'P'){ psg = { en:f[1] || '', vi:f[2] || '' }; return; }
    if (f[0] === 'Q') cur.qs.push({ t:'mc', q:f[1] || '', opts:(f[2] || '').split('~'), a:'ABCDEF'.indexOf((f[3] || 'A').trim().toUpperCase()), why:f[4] || '', hint:f[5] || '', kn:f[6] || '', vi:f[7] || '', psg:psg });
    else if (f[0] === 'W') cur.qs.push({ t:'w', q:f[1] || '', ans:(f[2] || '').split('/').map(function(x){ return x.trim(); }).filter(Boolean), why:f[3] || '', hint:f[4] || '', kn:f[5] || '', vi:f[6] || '', psg:psg });
  });
  for (var k in out) out[k].forEach(function(s){ s.qs.forEach(function(q, i){ q.id = 'b_' + s.id + '_' + (i + 1); q.n = i + 1; q.set = s; if (q.t === 'mc' && !/\[\[/.test(q.q)) btMix(q); }); });
  return out;
}
/* xáo vị trí đáp án cố định theo mã câu (mỗi lần mở vẫn giữ nguyên thứ tự) */
function btMix(q){
  var h = 2166136261; for (var i = 0; i < q.id.length; i++){ h ^= q.id.charCodeAt(i); h = Math.imul(h, 16777619); }
  var idx = q.opts.map(function(_, i){ return i; });
  for (var j = idx.length - 1; j > 0; j--){ h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; var r = h % (j + 1); var t = idx[j]; idx[j] = idx[r]; idx[r] = t; }
  q.opts = idx.map(function(i){ return q.opts[i]; }); q.a = idx.indexOf(q.a);
}
BT = parseBT(window.DATA_BT || '');
function btSets(lid){ return BT[lid] || []; }
function btCount(lid){ return btSets(lid).reduce(function(n, s){ return n + s.qs.length; }, 0); }
function btRes(q){ return (S.bt || {})[q.id]; }
function btStat(qs){ var d = 0, ok = 0; qs.forEach(function(q){ var r = btRes(q); if (r){ d++; if (r.ok) ok++; } }); return { done:d, ok:ok, n:qs.length }; }
function knItems(q){
  var l = lessonById(q.set.lesson); if (!l || !q.kn) return [];
  return String(q.kn).split(/[,; ]+/).map(function(x){ return l.items[(+x) - 1]; }).filter(Boolean);
}
function knChips(q){
  var ks = knItems(q); if (!ks.length) return '';
  return '<div class="kn"><span class="small muted">📌 Kiến thức:</span> ' + ks.map(function(it){ return '<button class="knchip" data-kn="' + esc(it.id) + '">' + fmt(it.p) + '</button>'; }).join('') + '</div>';
}
function openKnowledge(id){
  var it = ITEMS[id]; if (!it) return;
  var l = lessonById(it.lesson);
  openSheet('<div class="row"><div class="small muted grow">' + esc(l ? l.title : '') + ' · mục ' + it.no + '</div><button class="pill" id="kClose">✕ Đóng</button></div>' +
    '<h2 style="margin-top:6px">' + fmt(it.p) + '</h2><div class="muted">' + fmt(it.vi) + '</div>' +
    (it.form ? '<div class="small muted" style="margin-top:8px">Cấu trúc</div><div class="card flat" style="margin:4px 0 8px;padding:9px 12px;font-weight:600">' + fmt(it.form) + '</div>' : '') +
    (it.use ? '<div class="small muted">Cách dùng</div><div>' + fmt(it.use) + '</div>' : '') +
    (it.ex ? '<div class="small muted" style="margin-top:8px">Ví dụ</div>' + exLine(it.ex, it.exVi) : '') + (it.ex2 ? exLine(it.ex2, it.ex2Vi) : '') + tipBox(it) +
    '<div class="actions"><button id="kTheory">📘 Mở cả chuyên đề</button></div>');
  $('kClose').onclick = closeSheet;
  $('kTheory').onclick = function(){ closeSheet(); ui.bt = null; ui.gMode = 't'; ui.gLesson = it.lesson; ui.gOpen = it.id; switchTab('grammar'); };
}
function btCtx(q, r){
  var s = q.set, l = lessonById(s.lesson);
  var lines = ['[Bài tập — ' + (l ? l.title : s.lesson) + ' — ' + s.no + ', câu ' + q.n + ']', 'Đề bài: ' + plain(s.inst)];
  if (q.psg) lines.push('Đoạn văn: ' + plain(q.psg.en));
  if (q.q) lines.push('Câu hỏi: ' + plain(q.q));
  if (q.t === 'mc') lines.push('Các lựa chọn: ' + q.opts.map(function(o, i){ return String.fromCharCode(65 + i) + '. ' + plain(o).replace(/\[\[|\]\]/g, '') + (/\[\[/.test(o) ? ' (phần gạch chân: ' + (o.match(/\[\[([^\]]+)\]\]/) || [, ''])[1] + ')' : ''); }).join(' | '));
  var ks = knItems(q); if (ks.length) lines.push('Kiến thức liên quan: ' + ks.map(function(it){ return plain(it.p) + ' (' + plain(it.form) + ')'; }).join('; '));
  if (r){
    var right = q.t === 'mc' ? String.fromCharCode(65 + q.a) + '. ' + plain(q.opts[q.a]) : q.ans.join(' / ');
    lines.push('Đáp án đúng: ' + right + '. Mình đã ' + (q.t === 'mc' ? 'chọn: ' + (r.pick >= 0 ? String.fromCharCode(65 + r.pick) + '. ' + plain(q.opts[r.pick]) : '(chưa chọn)') : 'viết: ' + (r.pick || '')) + ' → ' + (r.ok ? 'ĐÚNG' : 'SAI') + '.');
    if (q.why) lines.push('Lời giải trong sách: ' + plain(q.why));
  } else lines.push('(Mình CHƯA làm câu này — đừng nói thẳng đáp án, chỉ gợi ý hướng suy nghĩ.)');
  return lines.join('\n');
}
var btChat = {};
function btAsk(q, text){
  if (!tutorCode()){ toast('Nhập mã gia sư trong ⚙ Cài đặt để hỏi gia sư', true); openSettings(); return; }
  var th = btChat[q.id] = btChat[q.id] || [];
  th.push({ me:1, t:text }); th.push({ wait:1 }); drawBtChat(q);
  callTutor(text, btCtx(q, btRes(q))).then(function(a){ th.pop(); th.push({ t:a || '…' }); drawBtChat(q); })
    .catch(function(e){ th.pop(); th.push({ t:'⚠ ' + e.message }); drawBtChat(q); });
}
function drawBtChat(q){
  var box = $('btChatLog'); if (!box || box.getAttribute('data-q') !== q.id) return;
  var th = btChat[q.id] || [];
  box.innerHTML = th.map(function(m){ return m.wait ? '<div class="msg ai"><span class="spinner"></span> Gia sư đang trả lời…</div>' : '<div class="msg ' + (m.me ? 'me' : 'ai') + '">' + (m.me ? esc(m.t) : mdLite(m.t)) + '</div>'; }).join('');
  if (th.length) box.lastElementChild.scrollIntoView({ behavior:'smooth', block:'nearest' });
}
function renderBtList(l){
  var sets = btSets(l.id), all = [];
  sets.forEach(function(s){ all = all.concat(s.qs); });
  var st = btStat(all), wrong = all.filter(function(q){ var r = btRes(q); return r && !r.ok; });
  if (!sets.length) return '<div class="card empty">Chuyên đề này chưa có bài tập.</div>';
  return '<div class="card flat"><div class="row"><div class="grow"><b>' + all.length + ' câu bài tập</b> · đã làm ' + st.done + ' · đúng ' + st.ok + '</div>' +
      (wrong.length ? '<button class="pill on" id="btWrongAll">↻ Làm lại ' + wrong.length + ' câu sai</button>' : '') + '</div>' +
      '<div class="progress" style="margin-bottom:2px"><i style="width:' + Math.round(st.done / Math.max(1, all.length) * 100) + '%"></i></div>' +
      '<div class="small muted">Mỗi câu ghi rõ kiến thức đang dùng (📌), có 💡 gợi ý ẩn, 👁 dịch ẩn và ✦ hỏi gia sư ngay trong câu.</div></div>' +
    sets.map(function(s, si){
      var t = btStat(s.qs), kn = {}, kl = [];
      s.qs.forEach(function(q){ knItems(q).forEach(function(it){ if (!kn[it.id]){ kn[it.id] = 1; kl.push(it); } }); });
      var pct = t.done ? Math.round(t.ok / t.done * 100) : 0;
      return '<div class="card btset" data-set="' + si + '">' +
        '<div class="row"><b class="grow">' + esc(s.no) + ' <span class="small muted">· ' + s.qs.length + ' câu</span></b>' +
          (t.done ? '<span class="tag ' + (pct >= 80 ? 'ok' : 'due') + '">' + t.ok + '/' + t.done + ' đúng</span>' : '') + '</div>' +
        '<div class="small" style="margin:4px 0">' + fmt(s.inst) + '</div>' +
        (kl.length ? '<div class="small muted">📌 ' + kl.slice(0, 6).map(function(it){ return plain(it.p); }).map(esc).join(' · ') + (kl.length > 6 ? ' …' : '') + '</div>' : '') +
        '<div class="progress" style="margin:8px 0"><i style="width:' + Math.round(t.done / s.qs.length * 100) + '%"></i></div>' +
        '<div class="row"><button class="btn primary grow" data-go="' + si + '">' + (t.done === 0 ? '▶ Làm bài' : (t.done < s.qs.length ? '▶ Làm tiếp' : '↻ Xem lại')) + '</button>' +
          (t.done ? '<button class="btn grow" data-reset="' + si + '">Làm lại từ đầu</button>' : '') + '</div></div>';
    }).join('');
}
function bindBtList(l){
  var sets = btSets(l.id);
  view.querySelectorAll('[data-go]').forEach(function(b){ b.onclick = function(){
    var s = sets[+b.getAttribute('data-go')], i = 0;
    for (; i < s.qs.length; i++) if (!btRes(s.qs[i])) break;
    if (i >= s.qs.length) i = 0;
    ui.bt = { qs:s.qs, idx:i, title:s.no }; renderGrammar(); window.scrollTo(0, 0);
  }; });
  view.querySelectorAll('[data-reset]').forEach(function(b){ b.onclick = function(){
    var s = sets[+b.getAttribute('data-reset')];
    if (!confirm('Xóa kết quả và làm lại ' + s.no + '?')) return;
    s.qs.forEach(function(q){ delete S.bt[q.id]; }); save();
    ui.bt = { qs:s.qs, idx:0, title:s.no }; renderGrammar(); window.scrollTo(0, 0);
  }; });
  if ($('btWrongAll')) $('btWrongAll').onclick = function(){
    var w = []; sets.forEach(function(s){ s.qs.forEach(function(q){ var r = btRes(q); if (r && !r.ok) w.push(q); }); });
    w.forEach(function(q){ delete S.bt[q.id]; }); save();
    ui.bt = { qs:w, idx:0, title:'Làm lại câu sai' }; renderGrammar(); window.scrollTo(0, 0);
  };
}
function btGrid(b){
  return '<div class="exgrid" style="margin:8px 0 12px">' + b.qs.map(function(q, i){ var r = btRes(q); return '<button data-j="' + i + '" class="' + (r ? (r.ok ? 'bok' : 'bng') : '') + (i === b.idx ? ' cur' : '') + '">' + (i + 1) + '</button>'; }).join('') + '</div>';
}
function renderBtQ(l){
  var b = ui.bt, q = b.qs[b.idx], s = q.set, r = btRes(q);
  if (s.lesson !== l.id){ ui.gLesson = s.lesson; l = lessonById(s.lesson) || l; }
  var st = btStat(b.qs);
  var html = '<div class="exbar"><button class="pill" id="btBack">← Danh sách</button><div class="grow small"><b>' + esc(b.title) + '</b> · Câu ' + (b.idx + 1) + '/' + b.qs.length + '</div><span class="small muted">✓ ' + st.ok + '/' + st.done + '</span><button class="pill" id="btGridT">☷</button></div>' +
    '<div id="btGridBox"' + (ui.btGrid ? '' : ' class="hidden"') + '>' + btGrid(b) + '</div>' +
    '<div class="small muted" style="margin-top:6px">' + esc(l.title) + ' · ' + esc(s.no) + ' · câu ' + q.n + '</div>' +
    '<div class="card flat" style="padding:10px 13px"><div style="font-weight:600">' + fmt(s.inst) + '</div>' + (s.instVi ? hideBox(fmt(s.instVi), '👁 Dịch đề') : '') + '</div>' +
    (q.psg ? '<div class="card"><div class="small muted">Đoạn văn</div><div class="en" style="font-size:.98rem">' + fmt(q.psg.en) + '</div>' + (q.psg.vi ? hideBox(fmt(q.psg.vi), '👁 Dịch đoạn văn') : '') + '</div>' : '') +
    knChips(q) +
    '<div class="card">' + (q.q ? '<div class="en" style="font-size:1.12rem">' + fmt(q.q) + '</div>' : '') + (q.vi ? hideBox(fmt(q.vi), q.q ? '👁 Dịch câu' : '👁 Nghĩa các từ') : '') +
    '<div id="btAns" style="margin-top:' + (q.q ? 10 : 0) + 'px">';
  if (q.t === 'mc') html += q.opts.map(function(o, i){
    var cls = r ? (i === q.a ? ' right' : (i === r.pick ? ' wrong' : '')) : '';
    return '<button class="opt' + cls + '" data-o="' + i + '">' + String.fromCharCode(65 + i) + '. ' + fmt(o) + '</button>'; }).join('');
  else html += (q.ans[0].split(';').length > 1 ? '<div class="small muted" style="margin-bottom:6px">Câu có ' + q.ans[0].split(';').length + ' chỗ trống — gõ lần lượt, cách nhau bằng dấu phẩy.</div>' : '') + '<div class="row"><input type="text" id="btIn" class="grow" placeholder="Gõ đáp án…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" value="' + esc(r ? r.pick : '') + '"' + (r ? ' disabled' : '') + '>' + (r ? '' : '<button class="btn primary" id="btGo">Kiểm tra</button>') + '</div>';
  html += '</div>' +
    (q.hint && !r ? '<div class="hidebox hintbox"><button class="reveal">💡 Gợi ý (bấm khi bế tắc)</button><div class="content">' + fmt(q.hint) + '</div></div>' : '') +
    '<div id="btExp">' + (r ? btExplain(q, r) : '') + '</div></div>' +
    '<div class="card tutorbox"><div class="row"><b class="grow">✦ Hỏi gia sư về câu này</b></div>' +
      '<div class="chips" style="margin:8px 0">' + (r ?
        '<button class="pill" data-qa="Vì sao đáp án đúng là như vậy và vì sao các lựa chọn khác sai?">Vì sao đáp án đúng?</button>' + (r.ok ? '' : '<button class="pill" data-qa="Mình chọn sai, lỗi tư duy của mình ở đâu? Lần sau làm câu dạng này thế nào để không sai?">Vì sao mình sai?</button>') +
        '<button class="pill" data-qa="Cho mình 3 câu tương tự (có đáp án và dịch ở cuối) để luyện thêm kiến thức này.">3 câu tương tự</button>'
      : '<button class="pill" data-qa="Gợi ý giúp mình hướng làm câu này, nhưng ĐỪNG nói đáp án.">🤔 Gợi ý thêm (không lộ đáp án)</button>' +
        '<button class="pill" data-qa="Câu này dùng kiến thức gì? Giải thích ngắn gọn kiến thức đó giúp mình.">📘 Câu này dùng kiến thức gì?</button>' +
        '<button class="pill" data-qa="Dịch giúp mình câu hỏi và các lựa chọn sang tiếng Việt (không nói đáp án).">Dịch giúp mình</button>') + '</div>' +
      '<div class="chat" id="btChatLog" data-q="' + esc(q.id) + '"></div>' +
      '<div class="row" style="margin-top:8px"><input type="text" id="btQ" class="grow" placeholder="Hoặc tự gõ câu hỏi…"><button class="btn" id="btSend">Gửi</button></div></div>' +
    '<div class="navbtns" style="grid-template-columns:1fr 1fr"><button class="btn" id="btPrev"' + (b.idx > 0 ? '' : ' disabled') + '>← Câu trước</button>' +
      '<button class="btn primary" id="btNext">' + (b.idx + 1 < b.qs.length ? 'Câu tiếp →' : 'Xem kết quả') + '</button></div>';
  view.innerHTML = html;
  drawBtChat(q);
  $('btBack').onclick = function(){ ui.bt = null; renderGrammar(); window.scrollTo(0, 0); };
  $('btGridT').onclick = function(){ ui.btGrid = !ui.btGrid; $('btGridBox').classList.toggle('hidden', !ui.btGrid); };
  view.querySelectorAll('#btGridBox [data-j]').forEach(function(x){ x.onclick = function(){ b.idx = +x.getAttribute('data-j'); renderGrammar(); }; });
  view.querySelectorAll('[data-kn]').forEach(function(x){ x.onclick = function(){ openKnowledge(x.getAttribute('data-kn')); }; });
  view.querySelectorAll('[data-qa]').forEach(function(x){ x.onclick = function(){ btAsk(q, x.getAttribute('data-qa')); }; });
  var send = function(){ var v = $('btQ').value.trim(); if (!v) return; $('btQ').value = ''; btAsk(q, v); };
  $('btSend').onclick = send;
  $('btQ').addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.isComposing) send(); });
  $('btPrev').onclick = function(){ if (b.idx > 0){ b.idx--; renderGrammar(); window.scrollTo(0, 0); } };
  $('btNext').onclick = function(){ if (b.idx + 1 < b.qs.length){ b.idx++; renderGrammar(); window.scrollTo(0, 0); } else renderBtDone(l); };
  if (r) return;
  if (q.t === 'mc') view.querySelectorAll('#btAns .opt').forEach(function(x){ x.onclick = function(){ btAnswer(q, +x.getAttribute('data-o'), q.a === +x.getAttribute('data-o')); }; });
  else {
    var go = function(){ var v = $('btIn').value.trim(); if (!v) return; btAnswer(q, v, btCheckW(q, v)); };
    $('btGo').onclick = go;
    $('btIn').addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.isComposing) go(); });
  }
}
function btNorm(s){
  s = String(s || '').toLowerCase().replace(/[’‘`]/g, "'");
  s = s.replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not').replace(/\bshan't\b/g, 'shall not')
    .replace(/n't\b/g, ' not').replace(/'m\b/g, ' am').replace(/'re\b/g, ' are').replace(/'ve\b/g, ' have').replace(/'ll\b/g, ' will');
  return s.replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function btCheckW(q, v){ var n = btNorm(v); return q.ans.some(function(a){ return btNorm(plain(a)) === n; }); }
function btAnswer(q, pick, ok){
  S.bt = S.bt || {};
  S.bt[q.id] = { ok:ok, pick:pick, at:Date.now() };
  logDay(ok); S.log.push({ id:q.id, ok:ok, at:Date.now() });
  knItems(q).forEach(function(it){ if (!ok) S.wrong[it.id] = (S.wrong[it.id] || 0) + 1; });
  save(); renderGrammar();
  var e = $('btExp'); if (e) e.scrollIntoView({ behavior:'smooth', block:'nearest' });
}
function btExplain(q, r){
  var right = q.t === 'mc' ? String.fromCharCode(65 + q.a) + '. ' + fmt(q.opts[q.a]) : q.ans.map(fmt).join(' <span class="muted">hoặc</span> ');
  return '<div class="explain"><div class="verdict ' + (r.ok ? 'ok' : 'ng') + '">' + (r.ok ? '✓ Chính xác!' : '✗ Chưa đúng') + '</div>' +
    (q.t === 'w' && !r.ok ? '<div>Bạn viết: <b style="color:var(--bad)">' + esc(r.pick) + '</b></div>' : '') +
    '<div><b>Đáp án:</b> ' + right + '</div>' +
    (q.why ? '<div style="margin-top:6px"><b>Giải thích:</b> ' + fmt(q.why) + '</div>' : '') +
    (q.hint ? hideBox(fmt(q.hint), '💡 Gợi ý') : '') +
    (q.t === 'w' && !r.ok ? '<div class="actions"><button id="btSelfOk">Mình viết đúng ý — tính là đúng</button></div>' : '') +
    '<div class="actions"><button id="btRedo">↻ Làm lại câu này</button></div></div>';
}
document.addEventListener('click', function(e){
  var t = e.target; if (!t || !t.id || !ui.bt) return;
  var q = ui.bt.qs[ui.bt.idx]; if (!q) return;
  if (t.id === 'btSelfOk'){ var r = btRes(q); if (r){ r.ok = true; save(); renderGrammar(); } }
  else if (t.id === 'btRedo'){ delete S.bt[q.id]; save(); renderGrammar(); }
});
function renderBtDone(l){
  var b = ui.bt, st = btStat(b.qs), wrong = b.qs.filter(function(q){ var r = btRes(q); return r && !r.ok; });
  var weak = {}, wl = [];
  wrong.forEach(function(q){ knItems(q).forEach(function(it){ if (!weak[it.id]){ weak[it.id] = 0; wl.push(it); } weak[it.id]++; }); });
  wl.sort(function(a, c){ return weak[c.id] - weak[a.id]; });
  view.innerHTML = '<div class="card" style="text-align:center"><h2>Kết quả · ' + esc(b.title) + '</h2><div style="font-size:2.2rem;font-weight:800">' + st.ok + '/' + b.qs.length + '</div>' +
    '<div class="progress"><i style="width:' + Math.round(st.ok / Math.max(1, b.qs.length) * 100) + '%"></i></div>' +
    (st.done < b.qs.length ? '<div class="small muted">Còn ' + (b.qs.length - st.done) + ' câu chưa làm</div>' : '') + '</div>' +
    (wl.length ? '<h3>📌 Kiến thức cần ôn lại</h3>' + wl.map(function(it){ return '<button class="opt" data-kn="' + esc(it.id) + '"><b>' + fmt(it.p) + '</b> <span class="small muted">— sai ' + weak[it.id] + ' câu</span><div class="small muted">' + fmt(it.vi) + '</div></button>'; }).join('') : '') +
    '<div class="row" style="margin-top:8px">' + (wrong.length ? '<button class="btn warn grow" id="btRetry">↻ Làm lại ' + wrong.length + ' câu sai</button>' : '') + '<button class="btn grow" id="btHome">← Danh sách bài tập</button></div>' +
    (wrong.length && tutorCode() ? '<button class="btn block" id="btAI" style="margin-top:8px">✦ Nhờ gia sư nhận xét các câu sai</button>' : '');
  view.querySelectorAll('[data-kn]').forEach(function(x){ x.onclick = function(){ openKnowledge(x.getAttribute('data-kn')); }; });
  if ($('btRetry')) $('btRetry').onclick = function(){ wrong.forEach(function(q){ delete S.bt[q.id]; }); save(); ui.bt = { qs:wrong, idx:0, title:'Làm lại câu sai' }; renderGrammar(); window.scrollTo(0, 0); };
  $('btHome').onclick = function(){ ui.bt = null; renderGrammar(); window.scrollTo(0, 0); };
  if ($('btAI')) $('btAI').onclick = function(){
    askTutor('[Kết quả bài tập] ' + l.title + ' — ' + b.title + ': đúng ' + st.ok + '/' + b.qs.length + '\nCác câu sai:\n' + wrong.slice(0, 15).map(function(q){ var r = btRes(q); return '· ' + plain(q.q || '') + (q.t === 'mc' ? ' [' + q.opts.map(plain).join(' / ') + '] chọn ' + String.fromCharCode(65 + r.pick) + ', đúng ' + String.fromCharCode(65 + q.a) : ' viết "' + r.pick + '", đúng: ' + q.ans.join(' / ')); }).join('\n'),
      'Nhận xét giúp mình các lỗi sai này: mình đang hổng kiến thức gì, giải thích lại ngắn gọn phần đó và cho mình vài câu luyện thêm.');
  };
  cloudPush();
}

/* ---------- đọc hiểu ---------- */
var readOrder = {};
function renderReading(){ renderReading0(); markPlace(); }
function renderReading0(){
  if (ui.readId){ return renderPassage(DOC.filter(function(d){ return d.id === ui.readId; })[0]); }
  var html = '<div class="row"><h2 class="grow">📖 Bài đọc</h2><button class="pill on" id="rImp">📥 Nạp bài đọc</button></div>';
  if (!DOC.length) html += '<div class="card empty"><div style="font-size:2rem">📖</div><b>Chưa có bài đọc</b><p class="small">Nạp bài đọc bằng cách chụp ảnh, chọn file hoặc dán văn bản. Mỗi bài gồm đoạn văn, bản dịch (ẩn) và câu hỏi trắc nghiệm có giải thích.</p></div>';
  var lastPart = '';
  DOC.forEach(function(d){
    if (d.part !== lastPart){ html += '<h3 class="muted">' + esc(d.part) + '</h3>'; lastPart = d.part; }
    var done = S.reading[d.id];
    html += '<div class="card listitem" data-open="' + esc(d.id) + '"><div class="small muted">' + esc(d.type) + '</div><div style="font-weight:700">' + esc(d.title) + '</div>' +
      '<span class="small muted">' + d.qs.length + ' câu hỏi</span> ' + (done ? '<span class="tag ok">' + done.ok + '/' + done.n + '</span>' : '') + '</div>';
  });
  view.innerHTML = html;
  $('rImp').onclick = function(){ openImport('r'); };
  view.querySelectorAll('[data-open]').forEach(function(c){ c.onclick = function(){ ui.readId = c.getAttribute('data-open'); renderReading(); window.scrollTo(0, 0); }; });
}
function renderPassage(d){
  if (!d){ ui.readId = null; return renderReading(); }
  var ans = {};
  readOrder[d.id] = readOrder[d.id] || d.qs.map(function(q){ return shuffle(q.opts.map(function(_, i){ return i; })); });
  var ord = readOrder[d.id];
  var html = '<button class="pill" id="rBack">← Danh sách bài đọc</button>' +
    '<div class="small muted" style="margin-top:10px">' + esc(d.part) + ' · ' + esc(d.type) + '</div>' +
    '<h2 style="margin-top:2px">' + esc(d.title) + '</h2>' +
    '<div class="card"><div class="en">' + fmt(d.text) + '</div>' + (d.vi ? hideBox(fmt(d.vi), '👁 Xem bản dịch') : '') +
    '<div class="actions"><button id="rSpeak">🔊 Đọc bài</button><button id="rTutor">💬 Hỏi gia sư</button></div></div>' +
    (d.tip ? '<div class="tip"><b>💡 Mẹo:</b> ' + fmt(d.tip) + '</div>' : '');
  d.qs.forEach(function(q, qi){
    html += '<div class="card" data-q="' + qi + '"><div class="small muted">Câu ' + (qi + 1) + '</div><div class="en" style="margin-bottom:8px">' + fmt(q.q) + '</div>' +
      ord[qi].map(function(oi, k){ return '<button class="opt" data-o="' + oi + '">' + String.fromCharCode(65 + k) + '. ' + fmt(q.opts[oi]) + '</button>'; }).join('') +
      '<div class="exp"></div></div>';
  });
  view.innerHTML = html;
  $('rBack').onclick = function(){ ui.readId = null; renderReading(); };
  $('rSpeak').onclick = function(){ speak(d.text); };
  $('rTutor').onclick = function(){ askTutor('[Bài đọc] ' + d.title + '\n' + plain(d.text), defaultQ('d')); };
  view.querySelectorAll('.reveal').forEach(function(b){ b.onclick = function(){ revealToggle(b); }; });
  view.querySelectorAll('[data-q]').forEach(function(card){
    var qi = +card.getAttribute('data-q'), q = d.qs[qi];
    card.querySelectorAll('.opt').forEach(function(b){
      b.onclick = function(){
        if (ans[qi] !== undefined) return;
        var oi = +b.getAttribute('data-o'); ans[qi] = oi;
        var ok = oi === 0;
        card.querySelectorAll('.opt').forEach(function(x){ var k = +x.getAttribute('data-o'); if (k === 0) x.classList.add('right'); else if (k === oi) x.classList.add('wrong'); });
        card.querySelector('.exp').innerHTML = '<div class="explain"><div class="verdict ' + (ok ? 'ok' : 'ng') + '">' + (ok ? '✓ Chính xác!' : '✗ Chưa đúng') + '</div>' +
          (q.why ? '<b>Vì sao?</b> ' + fmt(q.why) : '') + '<div class="actions"><button data-act="qt">💬 Hỏi gia sư</button></div></div>';
        card.querySelector('[data-act="qt"]').onclick = function(){
          askTutor('[Câu hỏi đọc hiểu] Bài: ' + d.title + '\n' + plain(d.text) + '\nCâu hỏi: ' + plain(q.q) + '\nĐáp án đúng: ' + plain(q.opts[0]) + '. Mình đã chọn: ' + plain(q.opts[oi]), defaultQ('q'));
        };
        var r = S.reading[d.id] || { n:0, ok:0 }; r.n++; if (ok) r.ok++; S.reading[d.id] = r;
        logDay(ok); S.log.push({ id:'d_' + d.id + '_' + qi, ok:ok, at:Date.now() }); save();
      };
    });
  });
}

/* ---------- luyện tập: cấu hình ---------- */
var P = { type:'v', src:'lessons', mode:'flash', count:20, dir:'en', order:'shuffle', lessons:{} };
var VMODES = [['flash', '🃏 Thẻ flashcard (vuốt, lặp lại ngắt quãng)'], ['meaning', 'Trắc nghiệm: chọn nghĩa tiếng Việt'], ['word', 'Trắc nghiệm: nghĩa → chọn từ tiếng Anh'], ['listen', '🎧 Nghe và chọn từ đúng'], ['spell', '⌨ Chính tả: nghe/xem nghĩa rồi gõ từ'], ['fill', 'Điền từ vào câu ví dụ']];
var GMODES = [['gfill', 'Điền cấu trúc vào chỗ trống'], ['gmean', 'Trắc nghiệm ý nghĩa / cách dùng'], ['flash', '🃏 Thẻ flashcard']];
function orderItems(list, order){ if (order === 'lesson') return list.slice(); if (order === 'reverse') return list.slice().reverse(); return shuffle(list); }
function practicePool(){
  var lessons = P.type === 'v' ? allVocabLessons() : GL;
  var all = []; lessons.forEach(function(l){ all = all.concat(l.items); });
  var pool;
  if (P.src === 'lessons'){ pool = []; lessons.forEach(function(l){ if (P.lessons[l.id]) pool = pool.concat(l.items); }); }
  else if (P.src === 'selected') pool = all.filter(function(i){ return S.selected[i.id]; });
  else if (P.src === 'due') pool = all.filter(function(i){ return isDue(i.id); });
  else if (P.src === 'marked') pool = all.filter(function(i){ return S.marked[i.id]; });
  else if (P.src === 'wrong') pool = all.filter(function(i){ return S.wrong[i.id]; }).sort(function(a, b){ return S.wrong[b.id] - S.wrong[a.id]; });
  else if (P.src === 'hard') pool = all.filter(function(i){ return S.hard[i.id]; });
  else if (P.src === 'new') pool = all.filter(function(i){ return !S.srs[i.id]; });
  pool = pool || [];
  if (P.mode === 'fill' || P.mode === 'gfill') pool = pool.filter(function(i){ return blankOf(i); });
  return pool;
}
function renderPractice(){
  if (ui.practice) return renderSession();
  var lessons = P.type === 'v' ? allVocabLessons() : GL;
  if (!Object.keys(P.lessons).some(function(k){ return P.lessons[k]; }) && lessons[0]) P.lessons[lessons[0].id] = true;
  var modes = P.type === 'v' ? VMODES : GMODES;
  if (!modes.some(function(m){ return m[0] === P.mode; })) P.mode = modes[0][0];
  var nsel = Object.keys(S.selected).filter(function(k){ return ITEMS[k] && ITEMS[k].kind === P.type; }).length;
  var srcs = [['lessons', 'Theo bài học'], ['selected', 'Những mục tôi đã chọn (' + nsel + ')'], ['due', 'Đến hạn ôn (SRS)'], ['marked', 'Đã đánh dấu ★'], ['hard', 'Từ khó (đã vuốt xuống)'], ['wrong', 'Hay làm sai'], ['new', 'Chưa học']];
  var pool = practicePool();
  view.innerHTML = statsBar() +
    '<div class="card"><h3 style="margin-top:0">Nội dung</h3><div class="chips">' +
      '<button class="pill' + (P.type === 'v' ? ' on' : '') + '" data-type="v">Từ vựng</button>' +
      '<button class="pill' + (P.type === 'g' ? ' on' : '') + '" data-type="g">Ngữ pháp</button></div>' +
    '<h3>Chọn mục để luyện</h3><div class="chips">' + srcs.map(function(s){ return '<button class="pill' + (P.src === s[0] ? ' on' : '') + '" data-src="' + s[0] + '">' + esc(s[1]) + '</button>'; }).join('') + '</div>' +
    (P.src === 'lessons' ? '<div class="row" style="margin-top:8px"><button class="pill" id="pAllL">Chọn tất cả</button><button class="pill" id="pNoL">Bỏ chọn</button></div><div style="margin-top:6px" class="lessonlist">' + lessons.map(function(l){ return '<label class="chk"><input type="checkbox" data-les="' + esc(l.id) + '"' + (P.lessons[l.id] ? ' checked' : '') + '> ' + esc(l.title) + ' <span class="muted">(' + l.items.length + ')</span></label>'; }).join('') + '</div>' : '') +
    (P.src === 'selected' ? '<p class="small muted">☑ Tích chọn những từ/mẫu bạn muốn kiểm tra ở tab Từ vựng hoặc Ngữ pháp.</p>' : '') +
    '<h3>Cách luyện</h3>' + modes.map(function(m){ return '<label class="chk"><input type="radio" name="mode" value="' + m[0] + '"' + (P.mode === m[0] ? ' checked' : '') + '> ' + esc(m[1]) + '</label>'; }).join('') +
    (P.mode === 'flash' ? '<h3>Chiều thẻ</h3><div class="chips"><button class="pill' + (P.dir === 'en' ? ' on' : '') + '" data-dir="en">Anh → Việt</button><button class="pill' + (P.dir === 'vi' ? ' on' : '') + '" data-dir="vi">Việt → Anh</button></div>' : '') +
    '<h3>Số câu</h3><div class="row"><input type="number" id="pCount" min="1" max="' + Math.max(1, pool.length) + '" value="' + Math.min(P.count, Math.max(1, pool.length)) + '" style="max-width:110px">' +
      '<span class="small muted">Có ' + pool.length + ' mục phù hợp</span></div>' +
    '<h3>Thứ tự</h3><div class="chips">' + [['lesson', 'Theo bài'], ['shuffle', 'Xáo trộn'], ['reverse', 'Đảo ngược']].map(function(o){ return '<button class="pill' + (P.order === o[0] ? ' on' : '') + '" data-order="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
    '<div style="height:12px"></div><button class="btn primary block" id="pStart"' + (pool.length ? '' : ' disabled') + '>▶ Bắt đầu</button></div>' +
    methodsCard();
  view.querySelectorAll('[data-type]').forEach(function(b){ b.onclick = function(){ P.type = b.getAttribute('data-type'); P.lessons = {}; renderPractice(); }; });
  view.querySelectorAll('[data-src]').forEach(function(b){ b.onclick = function(){ P.src = b.getAttribute('data-src'); renderPractice(); }; });
  view.querySelectorAll('[data-order]').forEach(function(b){ b.onclick = function(){ P.order = b.getAttribute('data-order'); renderPractice(); }; });
  view.querySelectorAll('[data-dir]').forEach(function(b){ b.onclick = function(){ P.dir = b.getAttribute('data-dir'); renderPractice(); }; });
  view.querySelectorAll('[data-les]').forEach(function(c){ c.onchange = function(){ P.lessons[c.getAttribute('data-les')] = c.checked; renderPractice(); }; });
  if ($('pAllL')){ $('pAllL').onclick = function(){ lessons.forEach(function(l){ P.lessons[l.id] = true; }); renderPractice(); }; $('pNoL').onclick = function(){ P.lessons = {}; P.lessons['__none'] = true; renderPractice(); }; }
  view.querySelectorAll('input[name=mode]').forEach(function(r){ r.onchange = function(){ P.mode = r.value; renderPractice(); }; });
  $('pCount').onchange = function(){ P.count = Math.max(1, parseInt(this.value, 10) || 1); };
  $('pStart').onclick = function(){
    P.count = Math.max(1, parseInt($('pCount').value, 10) || 1);
    var items = (P.src === 'wrong' || P.order !== 'shuffle') ? pool.slice(0, P.count) : shuffle(pool).slice(0, P.count);
    startSession({ type:P.type, mode:P.mode, dir:P.dir, items:orderItems(items, P.order) });
  };
}
function methodsCard(){
  var m = [
    ['Lặp lại ngắt quãng (SRS)', 'Thẻ bạn nhớ tốt sẽ hiện lại thưa dần (1 → 6 → 15 ngày…), thẻ quên sẽ hiện lại sớm. Mỗi ngày chỉ cần ôn mục "Đến hạn ôn".'],
    ['Chủ động nhớ lại', 'Tự nhớ nghĩa trước khi lật thẻ. Bản dịch luôn ẩn để bạn đoán trước — cách ghi nhớ hiệu quả nhất.'],
    ['Nghe – nói – viết', 'Luyện nghe chọn từ và gõ chính tả để nhớ cả âm lẫn mặt chữ. Bấm 🔊 và đọc to theo.'],
    ['Học qua ngữ cảnh', 'Mỗi từ có câu ví dụ; dạng "Điền từ vào câu" giúp nhớ cách dùng thật.'],
    ['Ngữ pháp theo chuyên đề', 'Đọc phần Tổng quan trước, rồi xem từng mẫu từ dễ đến khó, cuối cùng làm bài điền chỗ trống và đề ôn tập.'],
    ['Ôn câu sai', '"Hay làm sai" gom lại các câu bạn sai nhiều nhất để luyện riêng.'],
    ['Thói quen mỗi ngày', 'Đặt mục tiêu số thẻ/ngày và giữ chuỗi 🔥 — học ngắn mỗi ngày tốt hơn học dồn.']
  ];
  return '<div class="card flat"><h3 style="margin-top:0">📚 Phương pháp học trong app</h3>' + m.map(function(x){ return '<div style="margin-bottom:6px"><b>' + esc(x[0]) + '</b><div class="small muted">' + esc(x[1]) + '</div></div>'; }).join('') + '</div>';
}

/* ---------- luyện tập: phiên học ---------- */
function startSession(cfg){
  ui.practice = { cfg:cfg, queue:cfg.items.slice(), idx:0, done:0, ok:0, wrongs:[], flipped:false, answered:false, total:cfg.items.length, marks:{}, graded:{} };
  if (curTab !== 'practice') switchTab('practice'); else { renderSession(); window.scrollTo(0, 0); }
}
function curItem(){ var p = ui.practice; return p.queue[p.idx]; }
function distractors(it, n, keyFn){
  var same = (lessonById(it.lesson) || { items:[] }).items.filter(function(x){ return x.id !== it.id; });
  var pool = it.kind === 'v' ? allVocab() : allGrammar();
  var cand = shuffle(same).concat(shuffle(pool.filter(function(x){ return x.id !== it.id; })));
  var out = [], seen = {}; seen[norm(keyFn(it))] = 1;
  for (var i = 0; i < cand.length && out.length < n; i++){ var k = keyFn(cand[i]); if (!k || seen[norm(k)]) continue; seen[norm(k)] = 1; out.push(cand[i]); }
  return out;
}
function renderSession(){ renderSession0(); markPlace(); }
function renderSession0(){
  var p = ui.practice;
  if (p.idx >= p.queue.length) return renderSummary();
  var it = curItem(), cfg = p.cfg;
  var pct = Math.round(p.done / Math.max(1, p.total) * 100);
  var head = '<div class="row"><span class="small muted grow">' + Math.min(p.done + 1, p.total) + ' / ' + p.total + '</span><button class="pill" id="sQuit">Dừng</button></div><div class="progress"><i style="width:' + pct + '%"></i></div>';
  if (cfg.mode === 'flash') return renderFlash(it, cfg);
  if (cfg.mode === 'gfill' || cfg.mode === 'fill') return renderFill(head, it);
  if (cfg.mode === 'spell') return renderSpell(head, it);
  return renderMC(head, it, cfg.mode);
}
function bindQuit(){ $('sQuit').onclick = function(){ ui.practice = null; renderPractice(); }; }
function backSide(it){
  if (it.kind === 'v'){
    var e = exOf(it);
    return '<div class="word">' + esc(it.w) + (it.pos ? '<span class="pos">' + esc(it.pos) + '</span>' : '') + '</div><div class="ipa">' + esc(it.ipa) + '</div>' +
      '<div style="font-size:1.12rem;margin:6px 0">' + esc(it.vi) + '</div>' +
      (e.ex ? '<div style="text-align:left">' + exLine(e.ex, e.exVi) + '</div>' : '') + '<div style="text-align:left">' + tipBox(it) + '</div>';
  }
  return '<div class="word" style="font-size:1.25rem">' + fmt(it.p) + '</div><div style="font-size:1.02rem;margin:6px 0">' + fmt(it.vi) + '</div>' +
    '<div style="text-align:left">' + (it.form ? '<div class="small muted">Cấu trúc: <b style="color:var(--text)">' + fmt(it.form) + '</b></div>' : '') +
    (it.use ? '<div class="small" style="margin-top:4px">' + fmt(it.use) + '</div>' : '') + exLine(it.ex, it.exVi) + tipBox(it) + '</div>';
}
function flashFront(it, cfg){
  if (it.kind === 'v') return cfg.dir === 'en' ? '<div class="front">' + esc(it.w) + '</div><div class="ipa">' + esc(it.ipa) + '</div>' : '<div class="front" style="font-size:1.35rem">' + esc(it.vi) + '</div>';
  return cfg.dir === 'en' ? '<div class="front" style="font-size:1.45rem">' + fmt(it.p) + '</div>' : '<div class="front" style="font-size:1.2rem">' + fmt(it.vi) + '</div>';
}
function renderFlash(it, cfg){
  var p = ui.practice, n = p.queue.length;
  var hardNow = !!S.hard[it.id];
  view.innerHTML =
    '<div class="row"><span class="small muted grow">' + (p.idx + 1) + ' / ' + n + '</span>' +
      '<button class="pill" id="fShuf">🔀 Xáo trộn</button><button class="pill" id="fRev">⇅ Đảo ngược</button><button class="pill" id="sQuit">Dừng</button></div>' +
    '<div class="progress"><i style="width:' + Math.round(p.idx / Math.max(1, n) * 100) + '%"></i></div>' +
    '<div class="swipewrap"><div class="swipelabel" id="fLab"></div>' +
    '<div class="card flash swipe' + (hardNow ? ' ishard' : '') + '" id="fCard">' +
      (hardNow ? '<span class="tag due hardtag">Từ khó</span>' : '') +
      (p.flipped ? '<div style="width:100%">' + backSide(it) + '</div>' : flashFront(it, cfg) + '<div class="hint">Chạm để lật thẻ</div>') +
    '</div></div>' +
    '<div class="small muted" style="text-align:center;margin:8px 0">Vuốt sang phải: thẻ tiếp · Vuốt sang trái: lùi lại · Vuốt xuống: đánh dấu khó · Chạm: lật thẻ</div>' +
    '<div class="navbtns"><button class="btn" id="fPrev"' + (p.idx ? '' : ' disabled') + '>← Lùi</button>' +
      '<button class="btn warn" id="fHard">' + (hardNow ? 'Bỏ đánh dấu khó' : '↓ Từ khó') + '</button>' +
      '<button class="btn primary" id="fNext">Tiếp →</button></div>' +
    '<div class="actions" style="justify-content:center"><button id="fSpeak">🔊 Đọc</button><button id="fTutor">💬 Hỏi gia sư</button></div>';
  bindQuit();
  if (!p.flipped && it.kind === 'v' && cfg.dir === 'en' && p.spokeIdx !== p.idx){ p.spokeIdx = p.idx; speakItem(it); }
  var card = $('fCard'), lab = $('fLab');
  function flip(){ p.flipped = !p.flipped; renderSession(); if (p.flipped && it.kind === 'v' && cfg.dir === 'vi') speakItem(it); }
  function fly(dx, dy, then){ card.style.transition = 'transform .18s ease-out, opacity .18s'; card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 25) + 'deg)'; card.style.opacity = '0'; setTimeout(then, 170); }
  card.addEventListener('pointerdown', function(e){
    if (e.target.closest('.hidebox') || e.target.closest('button')) return;
    var x0 = e.clientX, y0 = e.clientY, dx = 0, dy = 0, moved = false;
    card.setPointerCapture(e.pointerId); card.style.transition = 'none';
    function mv(ev){
      dx = ev.clientX - x0; dy = ev.clientY - y0;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
      if (!moved) return;
      var down = dy > 0 && dy > Math.abs(dx);
      card.style.transform = down ? 'translate(0,' + dy + 'px)' : 'translate(' + dx + 'px,0) rotate(' + (dx / 25) + 'deg)';
      var txt = '', cls = '';
      if (down && dy > 40){ txt = hardNow ? 'Bỏ đánh dấu khó' : '↓ Từ khó'; cls = 'warn'; }
      else if (dx > 40){ txt = 'Tiếp →'; cls = 'good'; }
      else if (dx < -40){ txt = '← Lùi'; cls = 'muted'; }
      lab.textContent = txt; lab.className = 'swipelabel ' + cls + (txt ? ' show' : '');
    }
    function up(){
      card.removeEventListener('pointermove', mv); card.removeEventListener('pointerup', up); card.removeEventListener('pointercancel', up);
      lab.className = 'swipelabel';
      if (!moved) return flip();
      if (dy > 90 && dy > Math.abs(dx)) return fly(0, 600, flashHard);
      if (dx > 80) return fly(500, 0, flashNext);
      if (dx < -80){ if (p.idx === 0) toast('Đây là thẻ đầu tiên'); else return fly(-500, 0, flashPrev); }
      card.style.transition = 'transform .2s'; card.style.transform = '';
    }
    card.addEventListener('pointermove', mv); card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
  });
  card.addEventListener('click', function(e){ if (e.target.getAttribute('data-act') === 'reveal') revealToggle(e.target); });
  $('fNext').onclick = function(){ fly(500, 0, flashNext); };
  $('fPrev').onclick = function(){ if (p.idx) fly(-500, 0, flashPrev); };
  $('fHard').onclick = function(){ fly(0, 600, flashHard); };
  $('fShuf').onclick = function(){ var done = p.queue.slice(0, p.idx + 1), rest = p.queue.slice(p.idx + 1); p.queue = done.concat(shuffle(rest)); toast('Đã xáo trộn thứ tự'); };
  $('fRev').onclick = function(){ var done = p.queue.slice(0, p.idx + 1), rest = p.queue.slice(p.idx + 1); p.queue = done.concat(rest.reverse()); toast('Đã đảo ngược thứ tự'); };
  $('fSpeak').onclick = function(){ speakItem(it); };
  $('fTutor').onclick = function(){ askTutor(ctxOfItem(it), defaultQ(it.kind)); };
}
function flashNext(){ var p = ui.practice, it = curItem(); if (!p.marks[it.id]){ p.marks[it.id] = 'ok'; if (!p.graded[it.id]){ p.graded[it.id] = 1; grade(it.id, 4); } } p.idx++; p.flipped = false; renderSession(); }
function flashPrev(){ var p = ui.practice; if (p.idx > 0) p.idx--; p.flipped = false; renderSession(); }
function flashHard(){
  var p = ui.practice, it = curItem();
  if (S.hard[it.id]){ delete S.hard[it.id]; delete p.marks[it.id]; save(); p.flipped = false; renderSession(); return; }
  S.hard[it.id] = 1; p.marks[it.id] = 'hard'; grade(it.id, 0); p.graded[it.id] = 1;
  p.idx++; p.flipped = false; renderSession();
}
document.addEventListener('keydown', function(e){
  if (curTab !== 'practice' || !ui.practice || ui.practice.cfg.mode !== 'flash' || ui.practice.idx >= ui.practice.queue.length) return;
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) return;
  if (e.key === 'ArrowRight'){ e.preventDefault(); flashNext(); }
  else if (e.key === 'ArrowLeft'){ e.preventDefault(); flashPrev(); }
  else if (e.key === 'ArrowDown'){ e.preventDefault(); flashHard(); }
  else if (e.key === ' '){ e.preventDefault(); ui.practice.flipped = !ui.practice.flipped; renderSession(); }
});
function finishAnswer(it, ok, explainHtml, ctx){
  var p = ui.practice;
  p.answered = true; p.done++;
  if (ok) p.ok++; else p.wrongs.push(it);
  recordAnswer(it.id, ok);
  $('sExp').innerHTML = '<div class="explain"><div class="verdict ' + (ok ? 'ok' : 'ng') + '">' + (ok ? '✓ Chính xác!' : '✗ Chưa đúng') + '</div>' + explainHtml +
    '<div class="actions"><button id="sTutor">💬 Hỏi gia sư</button>' + (it.kind === 'v' ? '<button id="sSpeak">🔊 Đọc</button>' : '') + '</div></div>' +
    '<button class="btn primary block" style="margin-top:10px" id="sNext">' + (p.idx + 1 >= p.queue.length ? 'Xem kết quả' : 'Câu tiếp →') + '</button>';
  $('sExp').querySelectorAll('.reveal').forEach(function(b){ b.onclick = function(){ revealToggle(b); }; });
  $('sTutor').onclick = function(){ askTutor(ctx, defaultQ('q')); };
  if ($('sSpeak')) $('sSpeak').onclick = function(){ speakItem(it); };
  $('sNext').onclick = function(){ p.idx++; p.answered = false; renderSession(); window.scrollTo(0, 0); };
  $('sNext').scrollIntoView({ behavior:'smooth', block:'nearest' });
  if (it.kind === 'v') speakItem(it);
}
function vName(x){ return x.kind === 'v' ? x.w : plain(x.p); }
function explainItem(it, noEx){
  if (it.kind === 'v'){ var e = exOf(it); return '<div><b>' + esc(it.w) + '</b> <span class="ipa">' + esc(it.ipa) + '</span> <span class="pos">' + esc(it.pos) + '</span> = ' + esc(it.vi) + '</div>' + (e.ex && !noEx ? exLine(e.ex, e.exVi) : '') + tipBox(it); }
  return '<div><b>' + fmt(it.p) + '</b> — ' + fmt(it.vi) + '</div>' + (it.form ? '<div class="small muted">Cấu trúc: ' + fmt(it.form) + '</div>' : '') + (it.use ? '<div class="small">' + fmt(it.use) + '</div>' : '') + (noEx ? '' : exLine(it.ex, it.exVi)) + tipBox(it);
}
function renderMC(head, it, mode){
  var key, prompt, show, inst;
  if (mode === 'meaning'){ key = function(x){ return x.vi; }; inst = 'Chọn nghĩa đúng của từ:'; prompt = '<div class="front" style="text-align:center;font-size:2rem;font-weight:700">' + esc(it.w) + '</div><div class="ipa" style="text-align:center">' + esc(it.ipa) + '</div>'; show = function(x){ return esc(x.vi); }; }
  else if (mode === 'word'){ key = function(x){ return x.w; }; inst = 'Chọn từ tiếng Anh có nghĩa:'; prompt = '<div style="text-align:center;font-size:1.25rem;font-weight:700">' + esc(it.vi) + '</div>' + (it.pos ? '<div style="text-align:center"><span class="pos">' + esc(it.pos) + '</span></div>' : ''); show = function(x){ return esc(x.w); }; }
  else if (mode === 'listen'){ key = function(x){ return x.w; }; inst = 'Nghe và chọn từ bạn nghe được:'; prompt = '<div style="text-align:center"><button class="bigspeak" id="lsPlay">🔊</button><div class="small muted" style="margin-top:6px"><button class="pill" id="lsSlow">🐢 Nghe chậm</button></div></div>'; show = function(x){ return esc(x.w); }; }
  else { key = function(x){ return x.vi; }; inst = 'Chọn ý nghĩa / cách dùng đúng của cấu trúc:'; prompt = '<div class="front" style="text-align:center;font-size:1.3rem;font-weight:700">' + fmt(it.p) + '</div>' + (it.form ? '<div class="small muted" style="text-align:center">' + fmt(it.form) + '</div>' : ''); show = function(x){ return fmt(x.vi); }; }
  var opts = shuffle([it].concat(distractors(it, 3, key)));
  view.innerHTML = head + '<div class="small muted">' + inst + '</div><div class="card">' + prompt + '</div><div id="sOpts">' +
    opts.map(function(o, i){ return '<button class="opt" data-i="' + i + '">' + String.fromCharCode(65 + i) + '. ' + show(o) + '</button>'; }).join('') + '</div><div id="sExp"></div>';
  bindQuit();
  if (mode === 'listen'){ $('lsPlay').onclick = function(){ speak(it.w); }; $('lsSlow').onclick = function(){ speak(it.w, 0.55); }; setTimeout(function(){ speak(it.w); }, 250); }
  view.querySelectorAll('#sOpts .opt').forEach(function(b){ b.onclick = function(){
    if (ui.practice.answered) return;
    var ch = opts[+b.getAttribute('data-i')], ok = ch.id === it.id;
    view.querySelectorAll('#sOpts .opt').forEach(function(x){ var o = opts[+x.getAttribute('data-i')]; if (o.id === it.id) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
    var exp = '<b>Đáp án đúng:</b> ' + explainItem(it);
    if (!ok) exp += '<div style="margin-top:8px"><b>Bạn đã chọn:</b> ' + fmt(vName(ch)) + ' = ' + fmt(ch.vi) + '</div>';
    var ctx = ctxOfItem(it) + '\nDạng câu hỏi: ' + inst + ' Các lựa chọn: ' + opts.map(function(o){ return vName(o) + ' (' + plain(o.vi) + ')'; }).join(' / ') + '. Mình đã chọn: ' + vName(ch);
    finishAnswer(it, ok, exp, ctx);
  }; });
}
function renderFill(head, it){
  var ans = blankOf(it), bs = blankSentence(it);
  var others = distractors(it, 8, function(x){ return blankOf(x); }).filter(function(x){ return norm(blankOf(x)) !== norm(ans); }).slice(0, 3);
  var opts = shuffle([it].concat(others));
  view.innerHTML = head + '<div class="small muted">' + (it.kind === 'v' ? 'Chọn từ thích hợp điền vào chỗ trống:' : 'Chọn đáp án đúng điền vào chỗ trống:') + '</div>' +
    '<div class="card"><div class="en" style="font-size:1.15rem">' + fmt(bs.en) + '</div>' + (bs.vi ? hideBox(fmt(bs.vi), '👁 Gợi ý: xem dịch') : '') + '</div>' +
    '<div id="sOpts">' + opts.map(function(o, i){ return '<button class="opt" data-i="' + i + '">' + String.fromCharCode(65 + i) + '. ' + esc(blankOf(o)) + '</button>'; }).join('') + '</div><div id="sExp"></div>';
  bindQuit();
  view.querySelectorAll('.card .reveal').forEach(function(b){ b.onclick = function(){ revealToggle(b); }; });
  view.querySelectorAll('#sOpts .opt').forEach(function(b){ b.onclick = function(){
    if (ui.practice.answered) return;
    var ch = opts[+b.getAttribute('data-i')], ok = ch.id === it.id || norm(blankOf(ch)) === norm(ans);
    view.querySelectorAll('#sOpts .opt').forEach(function(x){ var o = opts[+x.getAttribute('data-i')]; if (o.id === it.id) x.classList.add('right'); else if (x === b && !ok) x.classList.add('wrong'); });
    var exp = '<div class="en">' + fmt(bs.en.replace('_____', '【' + ans + '】')) + '</div>' + (bs.vi ? '<div class="small muted">' + fmt(bs.vi) + '</div>' : '') +
      '<div style="margin-top:6px"><b>Đáp án:</b> ' + explainItem(it, true) + '</div>';
    if (!ok) exp += '<div style="margin-top:8px"><b>Bạn chọn "' + esc(blankOf(ch)) + '":</b> ' + fmt(vName(ch)) + ' — ' + fmt(ch.vi) + '</div>';
    var ctx = '[Câu điền vào chỗ trống] ' + plain(bs.en) + '\nCác lựa chọn: ' + opts.map(function(o){ return blankOf(o); }).join(' / ') + '\nĐáp án đúng: ' + ans + ' (' + vName(it) + '). Mình đã chọn: ' + blankOf(ch);
    finishAnswer(it, ok, exp, ctx);
  }; });
}
function renderSpell(head, it){
  view.innerHTML = head + '<div class="small muted">Nghe hoặc xem nghĩa rồi gõ từ tiếng Anh:</div>' +
    '<div class="card" style="text-align:center"><button class="bigspeak" id="spPlay" style="width:80px;height:80px;font-size:2rem">🔊</button>' +
    '<div style="font-size:1.2rem;font-weight:700;margin-top:8px">' + esc(it.vi) + '</div>' + (it.pos ? '<span class="pos">' + esc(it.pos) + '</span>' : '') +
    '<div class="small muted" style="margin-top:6px">Gợi ý: ' + it.w.length + ' ký tự, bắt đầu bằng "' + esc(it.w.charAt(0)) + '"</div></div>' +
    '<div class="row"><input type="text" id="tIn" class="grow" placeholder="Gõ từ tiếng Anh…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"><button class="btn primary" id="tGo">Kiểm tra</button></div><div id="sExp"></div>';
  bindQuit();
  $('spPlay').onclick = function(){ speak(it.w); };
  setTimeout(function(){ speak(it.w); }, 250);
  var go = function(){
    if (ui.practice.answered) return;
    var v = $('tIn').value.trim(); if (!v) return;
    var ok = norm(v).replace(/[ -]/g, '') === norm(it.w).replace(/[ -]/g, '');
    var exp = (ok ? '' : '<div>Bạn gõ: <b style="color:var(--bad)">' + esc(v) + '</b></div>') + '<b>Đáp án:</b> ' + explainItem(it);
    finishAnswer(it, ok, exp, ctxOfItem(it) + '\nMình gõ chính tả là: ' + v);
  };
  $('tGo').onclick = go;
  $('tIn').addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.isComposing) go(); });
  $('tIn').focus();
}
function renderSummary(){
  var p = ui.practice;
  if (p.cfg.mode === 'flash'){
    p.total = p.queue.length; p.ok = 0; p.wrongs = [];
    p.queue.forEach(function(it){ if (p.marks[it.id] === 'hard') p.wrongs.push(it); else if (p.marks[it.id] === 'ok') p.ok++; });
  }
  var uniq = [], seen = {};
  p.wrongs.forEach(function(w){ if (!seen[w.id]){ seen[w.id] = 1; uniq.push(w); } });
  view.innerHTML = '<div class="card" style="text-align:center"><h2>Kết quả</h2><div style="font-size:' + (p.cfg.mode === 'flash' ? '1.4rem' : '2.2rem') + ';font-weight:800">' + (p.cfg.mode === 'flash' ? 'Đã thuộc: ' + p.ok + ' · Từ khó: ' + p.wrongs.length : 'Đúng ' + p.ok + '/' + p.total) + '</div>' +
    '<div class="progress"><i style="width:' + Math.round(p.ok / Math.max(1, p.total) * 100) + '%"></i></div>' +
    '<div class="small muted">' + (cloud.user ? '☁ Đã lưu lên Firebase' : 'Chưa đăng nhập — tiến trình chỉ lưu trên máy này') + '</div></div>' +
    (uniq.length ? '<h3>✗ Cần ôn lại (' + uniq.length + ')</h3>' + uniq.map(function(w){ return '<div class="card small"><b>' + fmt(vName(w)) + '</b> — ' + fmt(w.vi) + '</div>'; }).join('') : '') +
    '<div class="row">' + (uniq.length ? '<button class="btn warn grow" id="sRetry">Ôn lại câu sai</button>' : '') + '<button class="btn grow" id="sHome">Về trang luyện tập</button></div>';
  if (uniq.length) $('sRetry').onclick = function(){ startSession({ type:p.cfg.type, mode:p.cfg.mode, dir:p.cfg.dir, items:shuffle(uniq) }); };
  $('sHome').onclick = function(){ ui.practice = null; renderPractice(); };
  cloudPush();
}

/* ---------- gia sư ---------- */
function removeChatbar(){ var b = $('chatbar'); if (b) b.remove(); }
function renderTutor(){
  removeChatbar();
  var code = tutorCode();
  var html = (ui.exam && !ui.exam.submitted ? '<button class="btn warn block" id="exBackBtn" style="margin-bottom:8px">↩ Quay lại bài thi</button>' : '') +
    '<div class="row"><h2 class="grow" style="margin:6px 0">🎓 Gia sư AI</h2>' + (chat.length ? '<button class="pill" id="cClear">Xóa cuộc trò chuyện</button>' : '') + '</div>' +
    (code ? '<div class="chips" style="margin:4px 0 8px"><button class="pill on" id="cPlan">🗺 Tóm tắt & lộ trình</button><button class="pill" id="cProg">📊 Phân tích điểm mạnh/yếu</button><button class="pill" id="cTalk">🗣 Luyện hội thoại</button></div>' : '');
  if (!code){
    html += '<div class="card">Bạn chưa nhập mã gia sư. Vào ⚙ Cài đặt → Mã gia sư để nhập.<div style="height:10px"></div><button class="btn primary" id="cGo">⚙ Mã gia sư</button></div>';
    view.innerHTML = html;
    $('cGo').onclick = openSettings;
    if ($('exBackBtn')) $('exBackBtn').onclick = function(){ switchTab('exam'); };
    if ($('cClear')) $('cClear').onclick = function(){ chat = []; saveChat(); renderTutor(); };
    return;
  }
  html += '<div class="chat" id="chatBox"><div class="msg ai">Chào bạn! Mình là gia sư tiếng Anh. Hỏi mình bất cứ điều gì — nghĩa từ, cách phát âm, ngữ pháp, bài đọc, vì sao chọn đáp án, hoặc nhờ mình sửa câu bạn viết.</div>' +
    chat.map(function(m){ return m.role === 'ctx' ? '<div class="msg ctx">📎 ' + esc(m.content) + '</div>' : '<div class="msg ' + (m.role === 'user' ? 'me' : 'ai') + '">' + (m.role === 'user' ? esc(m.content) : mdLite(m.content)) + '</div>'; }).join('') +
    '</div>' + (pendingCtx ? '<div class="msg ctx" style="margin-top:8px">📎 Đang hỏi về:<br>' + esc(pendingCtx).replace(/\n/g, '<br>') + ' <button class="pill" id="cCtxX">✕</button></div>' : '') +
    '<div style="height:140px"></div>';
  view.innerHTML = html;
  if ($('cClear')) $('cClear').onclick = function(){ chat = []; saveChat(); renderTutor(); };
  if ($('exBackBtn')) $('exBackBtn').onclick = function(){ switchTab('exam'); };
  if ($('cCtxX')) $('cCtxX').onclick = function(){ pendingCtx = ''; renderTutor(); };
  var bar = h('<div class="chatbar" id="chatbar"><div class="inner"><textarea id="chatInput" class="grow" rows="1" placeholder="Nhập câu hỏi…"></textarea><button class="btn primary" id="cSend">Gửi</button></div></div>');
  document.body.appendChild(bar);
  $('cSend').onclick = sendChat;
  if ($('cPlan')) $('cPlan').onclick = function(){ $('chatInput').value = PLAN_Q; sendChat(); };
  if ($('cProg')) $('cProg').onclick = function(){ $('chatInput').value = 'Dựa trên tiến trình học của mình trong app, hãy nhận xét điểm mạnh, điểm yếu và lập kế hoạch ôn tập cụ thể cho mấy ngày tới.'; sendChat(); };
  if ($('cTalk')) $('cTalk').onclick = function(){ $('chatInput').value = 'Hãy luyện hội thoại tiếng Anh với mình về chủ đề hằng ngày. Bạn hỏi 1 câu bằng tiếng Anh (kèm dịch), mình trả lời, rồi bạn sửa lỗi câu của mình và hỏi tiếp.'; sendChat(); };
  window.scrollTo(0, document.body.scrollHeight);
}
function sendChat(){
  var ta = $('chatInput'), txt = ta.value.trim();
  if (!txt) return;
  if (!tutorCode()){ toast('Bạn chưa nhập mã gia sư', true); return; }
  var ctx = pendingCtx; pendingCtx = '';
  if (ctx) chat.push({ role:'ctx', content:ctx });
  chat.push({ role:'user', content:txt });
  saveChat(); renderTutor();
  var wait = h('<div class="msg ai"><span class="spinner"></span> Gia sư đang trả lời…</div>'); $('chatBox').appendChild(wait);
  window.scrollTo(0, document.body.scrollHeight);
  $('cSend').disabled = true;
  callTutor(txt, ctx).then(function(ans){ chat.push({ role:'assistant', content:ans || '…' }); saveChat(); if (curTab === 'tutor') renderTutor(); })
    .catch(function(e){ chat.push({ role:'assistant', content:'⚠ ' + e.message }); saveChat(); if (curTab === 'tutor') renderTutor(); });
}

/* ---------- cài đặt ---------- */
function openSheet(html){ $('sheet').innerHTML = html; $('overlay').classList.add('show'); }
function closeSheet(){ $('overlay').classList.remove('show'); }
$('overlay').addEventListener('click', function(e){ if (e.target === this) closeSheet(); });
function packList(){
  var rows = [];
  customLessons().forEach(function(l){ rows.push({ kind:'v', id:l.id, name:l.title, n:l.items.length + ' từ' }); });
  (S.packs || []).forEach(function(pk){
    var n = pk.type === 'g' ? parseGrammar(pk.text, '').reduce(function(a, l){ return a + l.items.length; }, 0) + ' mục ngữ pháp' : (pk.type === 'r' ? parseReading(pk.text, '').length + ' bài đọc' : parseExams(pk.text, '').length + ' đề');
    rows.push({ kind:pk.type, id:pk.id, name:pk.name, n:n });
  });
  return rows;
}
function openSettings(){
  var code = tutorCode(), packs = packList();
  openSheet('<div class="row"><h2 class="grow" style="margin:0">⚙ Cài đặt</h2><button class="iconbtn" id="xClose">✕</button></div>' +
    '<h3>Hiển thị</h3><label class="chk"><input type="checkbox" id="xIpa"' + (S.ipa ? ' checked' : '') + '> Hiện phiên âm IPA (tắt để tự kiểm tra cách đọc)</label>' +
    '<h3>Mục tiêu mỗi ngày (thẻ)</h3><input type="number" id="xGoal" min="5" max="500" value="' + S.goal + '" style="max-width:120px">' +
    '<h3>🔊 Giọng đọc tiếng Anh</h3><div class="chips"><button class="pill' + (S.accent !== 'uk' ? ' on' : '') + '" data-acc="us">Giọng Mỹ (US)</button><button class="pill' + (S.accent === 'uk' ? ' on' : '') + '" data-acc="uk">Giọng Anh (UK)</button></div>' +
    (enVoices.length ? '<div class="row" style="margin-top:8px"><select id="xVoice" class="grow">' + enVoices.map(function(v){ return '<option value="' + esc(v.name) + '"' + (enVoice && v.name === enVoice.name ? ' selected' : '') + '>' + esc(v.name) + ' (' + esc(v.lang) + ')</option>'; }).join('') + '</select></div>' : '<div class="small" style="margin-top:6px">Dùng giọng tiếng Anh mặc định của máy.</div>') +
    '<div class="row" style="margin-top:8px"><span class="small">Tốc độ</span><input type="range" id="xRate" min="0.5" max="1.2" step="0.05" value="' + (S.rate || 0.9) + '" class="grow"><button class="btn" id="xVoiceTest">🔊 Nghe thử</button></div>' +
    '<h3>🎓 Mã gia sư</h3><div class="small muted">Nhập mã gia sư để dùng tính năng hỏi gia sư, chấm bài, tự điền dữ liệu. Mã chỉ lưu trên máy này. Xóa mã thì gia sư sẽ khóa cho đến khi bạn nhập lại.</div>' +
    '<div class="small" style="margin:6px 0;color:' + (code ? 'var(--good)' : 'var(--warn)') + '">' + (code ? '● Gia sư: đang bật (••••' + esc(code.slice(-4)) + ')' : '○ Gia sư: chưa có mã') + '</div>' +
    '<div class="row"><input type="password" id="xCode" class="grow" placeholder="Mã gia sư" autocomplete="off"><button class="btn primary" id="xCodeSave">Lưu</button></div>' +
    (!code && jpTutorCode() ? '<button class="btn" style="margin-top:8px" id="xCodeJp">Dùng mã gia sư của app tiếng Nhật</button>' : '') +
    (code ? '<button class="btn bad" style="margin-top:8px" id="xCodeDel">Xóa mã</button>' : '') +
    '<label class="chk" style="margin-top:10px"><input type="checkbox" id="xShare"' + (shareProgress() ? ' checked' : '') + '> Cho gia sư xem tiến trình học</label><div class="small muted">Gửi kèm từ hay sai, từ khó, bài yếu, điểm thi để gia sư nhận xét đúng với bạn.</div>' +
    '<h3>📥 Nạp dữ liệu</h3><div class="chips"><button class="pill on" data-imp="v">Từ vựng</button><button class="pill on" data-imp="g">Ngữ pháp</button><button class="pill on" data-imp="r">Đọc hiểu</button><button class="pill on" data-imp="e">Đề thi</button></div>' +
    '<h3>📦 Dữ liệu đã nạp</h3>' + (packs.length ? packs.map(function(p){ return '<div class="card small row" style="padding:9px 12px;margin-bottom:6px"><div class="grow"><b>' + esc(p.name) + '</b><div class="muted">' + esc(p.n) + '</div></div><button class="pill" data-delpack="' + esc(p.kind + '|' + p.id) + '">🗑 Xóa</button></div>'; }).join('') : '<div class="small muted">Chưa nạp thêm dữ liệu nào.</div>') +
    '<h3>☁ Tài khoản</h3><div class="small">' + (cloud.user ? 'Đang đăng nhập: ' + esc(cloud.user.email) : 'Chưa đăng nhập — tiến trình chỉ lưu trên máy này') + '</div>' +
    (cloud.lastErr ? '<div class="small" style="color:var(--bad)">Lỗi đồng bộ: ' + esc(cloud.lastErr) + '</div>' : '') +
    '<div style="margin-top:6px">' + (cloud.user ? '<button class="btn" id="xLogout">Đăng xuất</button>' : '<button class="btn primary" id="xLogin">Đăng nhập</button>') + '</div>' +
    '<h3>💾 Sao lưu</h3><div class="row"><button class="btn" id="xExport">Tải file sao lưu</button><label class="btn" style="cursor:pointer">Khôi phục từ file<input type="file" id="xImport" accept=".json,application/json" class="hidden"></label></div>' +
    '<button class="btn bad" style="margin-top:10px" id="xReset">Xóa toàn bộ tiến trình</button>' +
    '<div class="small muted" style="margin-top:12px;text-align:center">Phiên bản app: ' + APP_VER + ' · ' + allVocab().length + ' từ · ' + allGrammar().length + ' mục ngữ pháp · ' + DOC.length + ' bài đọc · ' + EXAMS.length + ' đề</div>');
  $('xClose').onclick = closeSheet;
  $('xIpa').onchange = function(){ S.ipa = this.checked; save(); applyPrefs(); };
  $('xGoal').onchange = function(){ S.goal = Math.max(5, parseInt(this.value, 10) || 20); save(); render(); };
  document.querySelectorAll('#sheet [data-acc]').forEach(function(b){ b.onclick = function(){ S.accent = b.getAttribute('data-acc'); try { localStorage.removeItem(KEY_VOICE); } catch(e){} save(); loadVoices(); openSettings(); speak('Hello! Let us start learning English.'); }; });
  if ($('xVoice')) $('xVoice').onchange = function(){ try { localStorage.setItem(KEY_VOICE, this.value); } catch(e){} loadVoices(); speak('Hello! Let us start learning English.'); };
  $('xRate').onchange = function(){ S.rate = parseFloat(this.value) || 0.9; save(); speak('This is my reading speed.'); };
  $('xVoiceTest').onclick = function(){ speak('Hello! Let us start learning English.'); };
  $('xShare').onchange = function(){ try { localStorage.setItem(KEY_SHARE, this.checked ? '1' : '0'); } catch(e){} };
  $('xCodeSave').onclick = function(){ var v = $('xCode').value.trim(); if (!v) return; try { localStorage.setItem(KEY_CODE, v); } catch(e){} toast('Đã lưu mã gia sư'); openSettings(); if (curTab === 'tutor') render(); };
  if ($('xCodeJp')) $('xCodeJp').onclick = function(){ try { localStorage.setItem(KEY_CODE, jpTutorCode()); } catch(e){} toast('Đã lưu mã gia sư'); openSettings(); if (curTab === 'tutor') render(); };
  if ($('xCodeDel')) $('xCodeDel').onclick = function(){ try { localStorage.removeItem(KEY_CODE); } catch(e){} toast('Đã xóa mã gia sư'); openSettings(); if (curTab === 'tutor') render(); };
  document.querySelectorAll('#sheet [data-imp]').forEach(function(b){ b.onclick = function(){ openImport(b.getAttribute('data-imp')); }; });
  document.querySelectorAll('#sheet [data-delpack]').forEach(function(b){ b.onclick = function(){
    var p = b.getAttribute('data-delpack').split('|'), kind = p[0], id = p.slice(1).join('|');
    if (!confirm('Xóa dữ liệu đã nạp này? Không thể hoàn tác.')) return;
    if (kind === 'v') S.custom = S.custom.filter(function(x){ return x.lesson !== id; });
    else S.packs = S.packs.filter(function(x){ return x.id !== id; });
    save(); rebuildIndex(); ui.gLesson = ''; render(); openSettings(); toast('Đã xóa');
  }; });
  if ($('xLogout')) $('xLogout').onclick = function(){ cloud.auth.signOut(); sessionStorage.removeItem('en_skip'); closeSheet(); };
  if ($('xLogin')) $('xLogin').onclick = function(){ sessionStorage.removeItem('en_skip'); closeSheet(); $('gate').classList.add('show'); };
  $('xExport').onclick = function(){ var blob = new Blob([JSON.stringify(S, null, 1)], { type:'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'english-backup-' + today() + '.json'; a.click(); };
  $('xImport').onchange = function(){
    var f = this.files[0]; if (!f) return;
    f.text().then(function(txt){ var d = JSON.parse(txt); if (!d || typeof d !== 'object') throw 0; S = d; for (var k in defaults) if (!(k in S)) S[k] = JSON.parse(JSON.stringify(defaults[k])); save(); rebuildIndex(); applyPrefs(); render(); closeSheet(); toast('✓ Đã khôi phục'); })
      .catch(function(){ toast('✗ File không hợp lệ', true); });
  };
  $('xReset').onclick = function(){
    if (!confirm('Xóa toàn bộ tiến trình học? Không thể hoàn tác. (Dữ liệu đã nạp vẫn được giữ.)')) return;
    var keep = { ipa:S.ipa, accent:S.accent, rate:S.rate, goal:S.goal, custom:S.custom, packs:S.packs, gen:S.gen };
    S = JSON.parse(JSON.stringify(defaults)); for (var k in keep) S[k] = keep[k];
    save(); render(); closeSheet();
  };
}

/* ======================= nạp dữ liệu ======================= */
var FORMATS = {
  v:{ name:'Từ vựng', help:'Mỗi dòng một từ. Có thể viết tự do: "abandon - từ bỏ", "abandon (v) /əˈbændən/ từ bỏ", hoặc đầy đủ theo mẫu dưới. Ví dụ đặt từ cần học trong 【】 để có bài điền từ.',
    sample:'abandon|v|/əˈbændən/|từ bỏ; bỏ rơi|They had to 【abandon】 the car.|Họ phải bỏ chiếc xe lại.|mẹo nhớ (không bắt buộc)\nachieve (v) đạt được\nbenefit - lợi ích' },
  g:{ name:'Ngữ pháp', help:'L| mở một chuyên đề mới (mã|tên|nhóm). O| là phần tổng quan (dòng bắt đầu bằng # là tiêu đề nhỏ). Mỗi mục: mẫu|cấu trúc|nghĩa|cách dùng|ví dụ 1|dịch 1|ví dụ 2|dịch 2|mẹo. Đặt phần ngữ pháp trong 【】 để tạo bài điền chỗ trống.',
    sample:'L|cd26|Chuyên đề 26 · Câu cầu khiến|Tự nạp\nO|# Câu cầu khiến dùng để nhờ ai đó làm gì cho mình.\nO|Hai cấu trúc chính: have sb do sth và get sb to do sth.\nhave sb do sth|S + have + O (người) + V nguyên mẫu|nhờ ai làm gì|Dùng khi nhờ/thuê người khác làm việc cho mình.|I 【had the mechanic check】 my car.|Tôi nhờ thợ kiểm tra xe.|||have + người + V (không to)' },
  r:{ name:'Đọc hiểu', help:'R|mã|nhóm|dạng bài|tiêu đề — mở bài đọc. T| đoạn văn (¶ = xuống dòng). V| bản dịch. G| mẹo (không bắt buộc). Q|câu hỏi|ĐÁP ÁN ĐÚNG|sai 1|sai 2|sai 3|giải thích — đáp án đúng luôn viết ở vị trí đầu, app tự xáo trộn.',
    sample:'R|r1|Bài đọc ngắn|Tìm ý chính|My Morning Routine\nT|I get up at six every morning. First, I drink a glass of water.¶Then I go jogging in the park for thirty minutes.\nV|Tôi dậy lúc sáu giờ mỗi sáng. Đầu tiên tôi uống một cốc nước.¶Sau đó tôi chạy bộ trong công viên ba mươi phút.\nQ|What does the writer do first?|Drinks a glass of water|Goes jogging|Eats breakfast|Reads the news|Câu "First, I drink a glass of water" cho biết việc đầu tiên.' },
  e:{ name:'Đề thi', help:'E|mã|tên đề|số phút — mở đề. S|pron / vocab / grammar / reading — phần thi. T| hướng dẫn. P|đoạn văn|bản dịch (cho câu đọc hiểu). Q|câu hỏi ([[gạch chân]])|ĐÁP ÁN ĐÚNG|sai 1|sai 2|sai 3|giải thích — app tự xáo trộn đáp án.',
    sample:'E|de1|Đề thi thử số 1|30\nS|grammar\nT|Chọn đáp án đúng.\nQ|She _____ to school every day.|goes|go|going|gone|Chủ ngữ số ít ở hiện tại đơn → động từ thêm -es.' }
};
var IMP = { type:'v', rows:[], text:'' };
function openImport(type){
  IMP = { type:type || IMP.type || 'v', rows:[], text:'' };
  var F = FORMATS[IMP.type];
  openSheet('<div class="row"><h2 class="grow" style="margin:0">📥 Nạp dữ liệu</h2><button class="iconbtn" id="iClose">✕</button></div>' +
    '<div class="chips" style="margin:8px 0">' + ['v', 'g', 'r', 'e'].map(function(k){ return '<button class="pill' + (k === IMP.type ? ' on' : '') + '" data-it="' + k + '">' + FORMATS[k].name + '</button>'; }).join('') + '</div>' +
    '<p class="small muted">Chụp trang sách/vở, chọn ảnh, chọn file (.txt, .csv, .json) hoặc dán văn bản. Kiểm tra lại rồi bấm thêm vào app. Dữ liệu lưu trong tài khoản của bạn.</p>' +
    '<div class="row">' +
      '<label class="btn primary grow" style="text-align:center;cursor:pointer">📷 Chụp ảnh<input type="file" id="iCam" accept="image/*" capture="environment" class="hidden"></label>' +
      '<label class="btn grow" style="text-align:center;cursor:pointer">🖼 Chọn ảnh<input type="file" id="iGal" accept="image/*" multiple class="hidden"></label>' +
      '<label class="btn grow" style="text-align:center;cursor:pointer">📄 Chọn file<input type="file" id="iFile" accept=".txt,.csv,.tsv,.json,.js,.md,text/*" class="hidden"></label>' +
    '</div>' +
    '<div id="iStatus" class="small muted" style="margin:8px 0"></div>' +
    '<details style="margin-bottom:6px"><summary class="small" style="cursor:pointer">📋 Định dạng ' + F.name.toLowerCase() + ' (bấm để xem mẫu)</summary><div class="small muted" style="margin:6px 0">' + esc(F.help) + '</div><div class="fmt">' + esc(F.sample) + '</div><button class="pill" id="iSample" style="margin-top:6px">Chèn mẫu vào ô dưới</button></details>' +
    '<h3>Văn bản (có thể sửa)</h3><textarea id="iText" rows="7" placeholder="Dán hoặc gõ dữ liệu vào đây…"></textarea>' +
    '<div class="row" style="margin-top:8px"><button class="btn grow" id="iParse">↓ Xem trước</button>' + (tutorCode() ? '<button class="btn primary grow" id="iAI">🎓 Gia sư chuyển sang đúng định dạng</button>' : '') + '</div>' +
    (!tutorCode() ? '<div class="small muted" style="margin-top:4px">Mẹo: nhập mã gia sư (⚙ Cài đặt) để gia sư tự chuyển văn bản chụp từ sách sang đúng định dạng.</div>' : '') +
    '<div id="iRows"></div>');
  $('iClose').onclick = closeSheet;
  document.querySelectorAll('#sheet [data-it]').forEach(function(b){ b.onclick = function(){ var keep = $('iText').value; openImport(b.getAttribute('data-it')); $('iText').value = keep; }; });
  $('iCam').onchange = function(){ ocrFiles(this.files); };
  $('iGal').onchange = function(){ ocrFiles(this.files); };
  $('iFile').onchange = function(){ var f = this.files[0]; if (!f) return; f.text().then(function(txt){ if (/\.js$/i.test(f.name)){ var m = txt.match(/`([\s\S]*)`/); if (m) txt = m[1]; } $('iText').value = ($('iText').value ? $('iText').value + '\n' : '') + txt.trim(); previewImport(); }); };
  $('iSample').onclick = function(){ $('iText').value = F.sample; previewImport(); };
  $('iParse').onclick = previewImport;
  if ($('iAI')) $('iAI').onclick = aiConvert;
}
var ocrWorker = null;
function ocrFiles(files){
  if (!files || !files.length) return;
  var list = Array.prototype.slice.call(files);
  $('iStatus').innerHTML = '<span class="spinner"></span> Đang đọc chữ trong ảnh… 0%';
  var go = function(){
    var p = ocrWorker ? Promise.resolve(ocrWorker) : Tesseract.createWorker(['eng', 'vie'], 1, {
      logger:function(m){ if (m.status === 'recognizing text' && $('iStatus')) $('iStatus').innerHTML = '<span class="spinner"></span> Đang đọc chữ trong ảnh… ' + Math.round(m.progress * 100) + '%'; }
    }).then(function(w){ ocrWorker = w; return w; });
    p.then(function(w){
      var out = [];
      var step = function(i){
        if (i >= list.length){
          $('iText').value = ($('iText').value ? $('iText').value + '\n' : '') + out.join('\n').trim();
          $('iStatus').textContent = '✓ Đã đọc xong. Kiểm tra và sửa văn bản' + (tutorCode() && IMP.type !== 'v' ? ', rồi bấm "Gia sư chuyển sang đúng định dạng".' : '.');
          previewImport(); return;
        }
        w.recognize(list[i]).then(function(r){ out.push(r.data.text); step(i + 1); }).catch(function(e){ $('iStatus').textContent = 'OCR: ' + (e.message || e); });
      };
      step(0);
    }).catch(function(e){ $('iStatus').textContent = 'OCR: ' + (e.message || e); });
  };
  if (window.Tesseract) return go();
  loadScripts(['https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'], function(err){ if (err){ $('iStatus').textContent = 'OCR: ' + err.message; return; } go(); });
}
function parseVocabLines(txt){
  var rows = [];
  txt.split(/\n+/).forEach(function(line){
    line = line.replace(/^[\s\d.)\-•*·]+(?=[A-Za-z])/, '').trim();
    if (!line || !/[A-Za-z]/.test(line) || /^L\|/.test(line)) return;
    var r = { w:'', pos:'', ipa:'', vi:'', ex:'', exVi:'', tip:'', on:true }, m;
    if (/[|\t;]/.test(line)){
      var f = line.split(/\s*[|\t;]\s*/);
      if (f.length >= 4 && (f[2] === '' || /^\/.*\/$/.test(f[2]) || f[1] === '' || POS_RE.test(f[1]))){ r.w = f[0]; r.pos = f[1]; r.ipa = f[2]; r.vi = f[3]; r.ex = f[4] || ''; r.exVi = f[5] || ''; r.tip = f[6] || ''; }
      else { r.w = f[0]; f.slice(1).forEach(function(x){ if (/^\/.*\/$/.test(x)) r.ipa = x; else if (POS_RE.test(x)) r.pos = x; else if (x) r.vi += (r.vi ? '; ' : '') + x; }); }
    } else if ((m = line.match(/^([A-Za-z][A-Za-z'’\- ]*?)\s*(\/[^\/]+\/)?\s*(?:\(([a-z., /]+)\))?\s*(\/[^\/]+\/)?\s*[:\-–=]?\s+(.+)$/))){
      r.w = m[1].trim(); r.ipa = m[2] || m[4] || ''; r.pos = m[3] || ''; r.vi = m[5].trim();
    } else { r.w = line.split(/\s{2,}/)[0]; }
    r.w = r.w.replace(/["“”:=]/g, '').trim();
    if (!r.w || r.w.length > 40) return;
    rows.push(r);
  });
  return rows;
}
function isDupWord(w){ var k = norm(w); var all = allVocab(); for (var i = 0; i < all.length; i++) if (norm(all[i].w) === k) return all[i]; return null; }
function previewImport(){
  var txt = $('iText').value;
  if (IMP.type === 'v'){ IMP.rows = parseVocabLines(txt); return renderImportRows(); }
  var box = $('iRows'), html = '', items = [];
  if (IMP.type === 'g'){
    var gl = parseGrammar(txt, 'tmp:');
    var have = {}; allGrammar().forEach(function(i){ have[norm(plain(i.p))] = 1; });
    gl.forEach(function(l){ html += '<div class="card small"><b>' + esc(l.title) + '</b> · ' + l.items.length + ' mục' + (l.overview ? ' · có tổng quan' : '') + '<div class="muted">' + l.items.map(function(i){ var d = have[norm(plain(i.p))]; if (d) items.push(i.p); return esc(plain(i.p)) + (d ? ' <span class="tag due">trùng</span>' : ''); }).join(' · ') + '</div></div>'; });
    IMP.count = gl.reduce(function(a, l){ return a + l.items.length; }, 0); IMP.dups = items;
  } else if (IMP.type === 'r'){
    var rd = parseReading(txt, 'tmp:'), titles = {}; DOC.forEach(function(d){ titles[norm(d.title)] = 1; });
    rd.forEach(function(d){ var dup = titles[norm(d.title)]; if (dup) items.push(d.title); html += '<div class="card small"><b>' + esc(d.title) + '</b>' + (dup ? ' <span class="tag due">trùng</span>' : '') + '<div class="muted">' + (d.text ? 'Có đoạn văn' : '⚠ Thiếu đoạn văn (T|)') + ' · ' + (d.vi ? 'có bản dịch' : 'chưa có bản dịch') + ' · ' + d.qs.length + ' câu hỏi</div></div>'; });
    IMP.count = rd.length; IMP.dups = items;
  } else {
    var ex = parseExams(txt, 'tmp:'), et = {}; EXAMS.forEach(function(e){ et[norm(e.title)] = 1; });
    ex.forEach(function(e){ var dup = et[norm(e.title)]; if (dup) items.push(e.title); html += '<div class="card small"><b>' + esc(e.title) + '</b>' + (dup ? ' <span class="tag due">trùng</span>' : '') + '<div class="muted">' + e.qs.length + ' câu · ' + e.min + ' phút</div></div>'; });
    IMP.count = ex.length; IMP.dups = items;
  }
  box.innerHTML = '<h3>Xem trước</h3>' + (html || '<div class="empty small">Chưa nhận ra dữ liệu đúng định dạng. Xem mẫu định dạng ở trên' + (tutorCode() ? ' hoặc bấm "Gia sư chuyển sang đúng định dạng"' : '') + '.</div>') +
    (html ? '<h3>Tên gói dữ liệu</h3><input type="text" id="iLesson" value="' + esc(IMP.lesson || (FORMATS[IMP.type].name + ' nạp ' + today())) + '"><button class="btn primary block" style="margin-top:10px" id="iCommit">✓ Thêm vào app</button>' : '');
  if ($('iCommit')){ $('iLesson').oninput = function(){ IMP.lesson = this.value; }; $('iCommit').onclick = commitText; }
}
function commitText(){
  var name = ($('iLesson').value || '').trim() || (FORMATS[IMP.type].name + ' nạp ' + today());
  var txt = $('iText').value;
  var doAdd = function(text){
    S.packs.push({ id:'p' + Date.now().toString(36), type:IMP.type, name:name, text:text, at:Date.now() });
    save(); rebuildIndex(); closeSheet();
    toast('Đã thêm "' + name + '"');
    var tab = { g:'grammar', r:'reading', e:'exam' }[IMP.type];
    if (IMP.type === 'g'){ var last = GL[GL.length - 1]; if (last) ui.gLesson = last.id; }
    switchTab(tab);
  };
  if (!IMP.dups || !IMP.dups.length) return doAdd(txt);
  openSheet('<h2 style="margin-top:0">⚠ Có mục bị trùng</h2><p>' + IMP.dups.length + ' mục đã có trong app:</p><div class="card small">' + IMP.dups.map(esc).join(' · ') + '</div>' +
    (IMP.type === 'g' ? '<button class="btn primary block" id="dSkip">Bỏ mục trùng, chỉ thêm mục mới</button><div style="height:8px"></div>' : '') +
    '<button class="btn warn block" id="dAll">Vẫn thêm tất cả</button><div style="height:8px"></div><button class="btn block" id="dCancel">Hủy</button>');
  if ($('dSkip')) $('dSkip').onclick = function(){
    var have = {}; allGrammar().forEach(function(i){ have[norm(plain(i.p))] = 1; });
    doAdd(txt.split('\n').filter(function(l){ var f = l.trim().split('|'); if (f.length < 3 || f[0] === 'L' || f[0] === 'O') return true; return !have[norm(plain(f[0]))]; }).join('\n'));
  };
  $('dAll').onclick = function(){ doAdd(txt); };
  $('dCancel').onclick = function(){ var keep = IMP; openImport(keep.type); $('iText').value = txt; previewImport(); };
}
function renderImportRows(){
  var box = $('iRows'); if (!box) return;
  box.innerHTML = (IMP.rows.length ? '' : '<div class="empty small">Chưa có từ nào.</div>') +
    '<h3>Tên bài (nhóm)</h3><input type="text" id="iLesson" value="' + esc(IMP.lesson || ('Nạp ' + today())) + '">' +
    '<div style="overflow:auto;margin-top:8px"><table class="imp"><tr class="small muted"><td></td><td>Từ</td><td>Loại</td><td>Phiên âm</td><td>Nghĩa</td></tr>' +
    IMP.rows.map(function(rw, i){ var d = isDupWord(rw.w);
      return '<tr class="' + (d ? 'dup' : '') + '"><td><input type="checkbox" data-i="' + i + '" data-f="on"' + (rw.on ? ' checked' : '') + '></td>' +
        '<td><input data-i="' + i + '" data-f="w" value="' + esc(rw.w) + '" style="min-width:90px">' + (d ? '<span class="tag due">trùng</span>' : '') + '</td>' +
        '<td><input data-i="' + i + '" data-f="pos" value="' + esc(rw.pos) + '" style="min-width:40px"></td>' +
        '<td><input data-i="' + i + '" data-f="ipa" value="' + esc(rw.ipa) + '" style="min-width:80px"></td>' +
        '<td><input data-i="' + i + '" data-f="vi" value="' + esc(rw.vi) + '" style="min-width:120px"></td></tr>'; }).join('') +
    '</table></div>' +
    '<div class="row" style="margin-top:8px"><button class="pill" id="iAdd">+ Thêm dòng</button>' + (tutorCode() ? '<button class="pill on" id="iFill">🎓 Gia sư điền loại từ, phiên âm, nghĩa, ví dụ</button>' : '') + '</div>' +
    '<div id="iMsg" class="small muted" style="margin-top:6px"></div>' +
    '<button class="btn primary block" style="margin-top:10px" id="iCommit">✓ Thêm vào app</button>';
  box.querySelectorAll('input[data-i]').forEach(function(inp){ inp.oninput = inp.onchange = function(){ var rw = IMP.rows[+inp.getAttribute('data-i')], f = inp.getAttribute('data-f'); rw[f] = f === 'on' ? inp.checked : inp.value; }; });
  $('iLesson').oninput = function(){ IMP.lesson = this.value; };
  $('iAdd').onclick = function(){ IMP.rows.push({ w:'', pos:'', ipa:'', vi:'', ex:'', exVi:'', tip:'', on:true }); renderImportRows(); };
  if ($('iFill')) $('iFill').onclick = tutorFill;
  $('iCommit').onclick = commitVocab;
}
function tutorFill(){
  var rows = IMP.rows.filter(function(r){ return r.w; });
  if (!rows.length) return;
  $('iMsg').innerHTML = '<span class="spinner"></span> Gia sư đang điền…';
  var prompt = 'Với mỗi từ/cụm từ tiếng Anh sau, trả về JSON array, mỗi phần tử {"w":từ,"pos":"loại từ viết tắt (n, v, adj, adv…)","ipa":"phiên âm IPA trong //","vi":"nghĩa tiếng Việt ngắn gọn","ex":"một câu ví dụ ngắn, từ đích đặt trong 【】","exVi":"dịch câu ví dụ"}. Chỉ trả JSON.\n' + rows.map(function(r){ return r.w + (r.vi ? ' (' + r.vi + ')' : ''); }).join('\n');
  deepseek([{ role:'user', content:prompt }], { temp:0.2, max:4000 }).then(function(txt){
    var arr = JSON.parse(txt.slice(txt.indexOf('['), txt.lastIndexOf(']') + 1));
    arr.forEach(function(a){ IMP.rows.forEach(function(r){ if (norm(r.w) === norm(a.w)){ r.pos = r.pos || a.pos || ''; r.ipa = r.ipa || a.ipa || ''; r.vi = r.vi || a.vi || ''; r.ex = r.ex || a.ex || ''; r.exVi = r.exVi || a.exVi || ''; } }); });
    renderImportRows(); $('iMsg').textContent = '✓ Đã điền. Kiểm tra lại trước khi thêm.';
  }).catch(function(e){ $('iMsg').textContent = '✗ ' + e.message; });
}
function commitVocab(){
  var lesson = ($('iLesson').value || '').trim() || ('Nạp ' + today());
  var rows = IMP.rows.filter(function(r){ return r.on && r.w.trim(); });
  if (!rows.length){ toast('Không có từ nào để thêm', true); return; }
  var seen = {}, dups = [], fresh = [];
  rows.forEach(function(r){ var k = norm(r.w); if (isDupWord(r.w) || seen[k]) dups.push(r); else fresh.push(r); seen[k] = 1; });
  var doAdd = function(list){
    var now = Date.now();
    list.forEach(function(r, i){ S.custom.push({ id:'c_' + now + '_' + i, lesson:lesson, w:r.w.trim(), pos:(r.pos || '').trim(), ipa:(r.ipa || '').trim(), vi:(r.vi || '').trim(), ex:r.ex || '', exVi:r.exVi || '', tip:r.tip || '', added:now }); });
    save(); rebuildIndex();
    toast('Đã thêm ' + list.length + ' từ vào "' + lesson + '"');
    closeSheet(); ui.vLesson = lesson; ui.vSearch = ''; switchTab('vocab');
  };
  if (!dups.length) return doAdd(fresh);
  openSheet('<h2 style="margin-top:0">⚠ Có từ bị trùng</h2><p>' + dups.length + ' từ đã có trong app:</p>' +
    '<div class="card small">' + dups.map(function(d){ return esc(d.w); }).join(', ') + '</div>' +
    '<button class="btn primary block" id="dSkip"' + (fresh.length ? '' : ' disabled') + '>Bỏ từ trùng, chỉ thêm ' + fresh.length + ' từ mới</button><div style="height:8px"></div>' +
    '<button class="btn warn block" id="dAll">Vẫn thêm cả từ trùng</button><div style="height:8px"></div>' +
    '<button class="btn block" id="dCancel">Hủy</button>');
  $('dSkip').onclick = function(){ doAdd(fresh); };
  $('dAll').onclick = function(){ doAdd(fresh.concat(dups)); };
  $('dCancel').onclick = function(){ var keep = IMP; openImport('v'); IMP = keep; renderImportRows(); };
}
function aiConvert(){
  var txt = $('iText').value.trim();
  if (!txt){ toast('Chưa có văn bản để chuyển', true); return; }
  if (IMP.type === 'v'){ IMP.rows = parseVocabLines(txt); renderImportRows(); return tutorFill(); }
  var F = FORMATS[IMP.type];
  $('iStatus').innerHTML = '<span class="spinner"></span> Gia sư đang chuyển sang định dạng ' + F.name.toLowerCase() + '…';
  var extra = { g:'Sắp xếp từ dễ đến khó. Viết phần O| (tổng quan) bằng tiếng Việt thật dễ hiểu. Mỗi mục phải có 2 câu ví dụ tiếng Anh, phần ngữ pháp đặt trong 【】, kèm bản dịch tiếng Việt. Cách dùng và mẹo viết bằng tiếng Việt.',
    r:'Nếu văn bản chưa có bản dịch thì tự dịch sang tiếng Việt (V|). Nếu chưa có câu hỏi thì tự soạn 3–5 câu hỏi trắc nghiệm, giải thích bằng tiếng Việt.',
    e:'Giải thích đáp án bằng tiếng Việt. Đáp án đúng luôn đặt ngay sau câu hỏi. Nếu văn bản có đáp án riêng (bảng đáp án) thì ghép đúng vào từng câu.' }[IMP.type];
  var prompt = 'Chuyển văn bản sau (có thể là chữ quét OCR từ sách, có lỗi) sang đúng định dạng dữ liệu của app học tiếng Anh. Mỗi trường cách nhau bằng dấu |, không dùng dấu | trong nội dung.\n\nĐỊNH DẠNG: ' + F.help + '\nVÍ DỤ:\n' + F.sample + '\n\nYêu cầu: ' + extra + ' Chỉ trả về dữ liệu theo định dạng, không giải thích, không dùng ```.\n\nVĂN BẢN:\n' + txt.slice(0, 12000);
  deepseek([{ role:'user', content:prompt }], { temp:0.2, max:6000 }).then(function(out){
    out = out.replace(/```[a-z]*\n?/g, '').trim();
    $('iText').value = out; $('iStatus').textContent = '✓ Gia sư đã chuyển xong. Kiểm tra lại rồi bấm "Thêm vào app".'; previewImport();
  }).catch(function(e){ $('iStatus').textContent = '✗ ' + e.message; });
}

/* ======================= thi ======================= */
var SEC = { pron:'Ngữ âm', vocab:'Từ vựng', grammar:'Ngữ pháp', reading:'Đọc hiểu' };
function secName(s){ return SEC[s] || s || 'Ngữ pháp'; }
var EXU = { chapter:'', chCount:20, genCount:30, filterWrong:false, genWhat:'both' };
var exTimer = null;
function exSave(){ try { if (ui.exam && !ui.exam.submitted) localStorage.setItem(KEY_EXAM, JSON.stringify(ui.exam)); else localStorage.removeItem(KEY_EXAM); } catch(e){} }
(function(){ try { var x = JSON.parse(localStorage.getItem(KEY_EXAM) || 'null'); if (x && !x.submitted) ui.exam = x; } catch(e){} })();
function fromMock(q){
  var order = shuffle(q.opts.map(function(_, i){ return i; }));
  return { sec:q.sec, inst:q.inst, psg:q.psg, qhtml:fmt(q.q), opts:order.map(function(i){ return fmt(q.opts[i]); }), a:order.indexOf(0), why:q.why,
    ctx:(q.psg ? 'Đoạn văn: ' + plain(q.psg.en) + '\n' : '') + q.inst + '\nCâu hỏi: ' + plain(q.q) + '\nLựa chọn: ' + order.map(function(i, k){ return String.fromCharCode(65 + k) + '. ' + plain(q.opts[i]); }).join(' / ') };
}
function fromItem(it){
  var types;
  if (it.kind === 'v'){ types = ['meaning', 'word']; if (blankOf(it)) types.push('fill', 'fill'); }
  else types = blankOf(it) ? ['gfill', 'gfill', 'gmean'] : ['gmean'];
  var ty = types[Math.floor(Math.random() * types.length)];
  var key, prompt, show, inst, ans;
  if (ty === 'meaning'){ key = function(x){ return x.vi; }; inst = 'Chọn nghĩa đúng của từ:'; prompt = '<span class="word">' + esc(it.w) + '</span> <span class="ipa small">' + esc(it.ipa) + '</span>'; show = function(x){ return esc(x.vi); }; }
  else if (ty === 'word'){ key = function(x){ return x.w; }; inst = 'Chọn từ tiếng Anh đúng với nghĩa:'; prompt = '<b>' + esc(it.vi) + '</b>'; show = function(x){ return esc(x.w); }; }
  else if (ty === 'gmean'){ key = function(x){ return x.vi; }; inst = 'Chọn ý nghĩa / cách dùng đúng:'; prompt = '<b>' + fmt(it.p) + '</b>'; show = function(x){ return fmt(x.vi); }; }
  else { key = function(x){ return blankOf(x); }; inst = 'Chọn đáp án đúng điền vào chỗ trống:'; prompt = fmt(blankSentence(it).en); show = function(x){ return esc(blankOf(x)); }; ans = blankOf(it); }
  var ds = distractors(it, 3, key);
  if (ans) ds = ds.filter(function(d){ return norm(blankOf(d)) !== norm(ans); });
  var all = shuffle([it].concat(ds));
  var why = vName(it) + ' = ' + plain(it.vi);
  if (it.kind === 'g' && it.use) why += '. ' + plain(it.use) + (it.form ? ' (' + plain(it.form) + ')' : '');
  if (it.kind === 'v' && blankSentence(it).vi && ans) why += '. Câu: ' + blankSentence(it).vi;
  ds.forEach(function(d){ why += ' · ' + vName(d) + ' = ' + plain(d.vi); });
  if (it.tip) why += ' 💡 ' + plain(it.tip);
  return { sec:it.kind === 'v' ? 'vocab' : 'grammar', inst:inst, psg:null, qhtml:prompt, opts:all.map(show), a:all.indexOf(it), why:why, itemId:it.id,
    ctx:ctxOfItem(it) + '\nLựa chọn: ' + all.map(function(x, k){ return String.fromCharCode(65 + k) + '. ' + (ans ? blankOf(x) : vName(x)) + ' (' + plain(x.vi) + ')'; }).join(' / ') };
}
function buildChapterQs(items, n){ var pool = shuffle(items), out = []; while (out.length < n && pool.length){ out = out.concat(pool.slice(0, n - out.length)); } return out.map(fromItem); }
function chapters(){
  var out = [];
  allVocabLessons().forEach(function(l){ if (l.items.length >= 2) out.push({ key:'v:' + l.id, group:'Từ vựng', title:l.title, items:l.items }); });
  GL.forEach(function(l){ if (l.items.length >= 2) out.push({ key:'g:' + l.id, group:'Ngữ pháp', title:l.title, items:l.items }); });
  return out;
}
function startExam(kind, id, title, qs, minutes){
  if (!qs.length){ toast('Không có câu hỏi', true); return; }
  ui.exam = { kind:kind, id:id, title:title, qs:qs, ans:qs.map(function(){ return -1; }), flags:{}, cur:0, startAt:Date.now(), endAt:Date.now() + minutes * 60000, minutes:minutes, submitted:false };
  exSave(); runTimer();
  if (curTab !== 'exam') switchTab('exam'); else { renderExam(); window.scrollTo(0, 0); }
}
function fmtTime(ms){ ms = Math.max(0, ms); var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s = s % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
function runTimer(){
  clearInterval(exTimer);
  if (!ui.exam || ui.exam.submitted) return;
  exTimer = setInterval(function(){
    if (!ui.exam || ui.exam.submitted){ clearInterval(exTimer); return; }
    var left = ui.exam.endAt - Date.now();
    var el = $('exTimer'); if (el){ el.textContent = '⏱ ' + fmtTime(left); el.classList.toggle('low', left < 5 * 60000); }
    var bt = $('exBackBtn'); if (bt) bt.textContent = '↩ Quay lại bài thi ⏱ ' + fmtTime(left);
    if (left <= 0){ toast('Hết giờ! Bài đã được nộp tự động.', true); submitExam(true); }
  }, 1000);
}
function renderExam(){ var ex = ui.exam; if (ex && !ex.submitted) return renderExamQ(); if (ex && ex.submitted) return renderExamResult(); renderExamHome(); }
function bestOf(id){ var b = null, n = 0; (S.exams || []).forEach(function(r){ if (r.id === id){ n++; if (b === null || r.pct > b) b = r.pct; } }); return { best:b, n:n }; }
function renderExamHome(){
  var chs = chapters();
  if (!EXU.chapter || !chs.some(function(c){ return c.key === EXU.chapter; })) EXU.chapter = chs[0] ? chs[0].key : '';
  var ch = chs.filter(function(c){ return c.key === EXU.chapter; })[0];
  var hist = (S.exams || []).slice(-8).reverse();
  var grp = function(g){ return chs.filter(function(c){ return c.group === g; }).map(function(c){ return '<option value="' + esc(c.key) + '"' + (ch && c.key === ch.key ? ' selected' : '') + '>' + esc(c.title) + ' (' + c.items.length + ')</option>'; }).join(''); };
  var exGroups = {}, exOrder = [];
  EXAMS.forEach(function(e){ var g = e.custom ? '★ Đề tự nạp' : 'Đề ôn tập theo sách'; if (!exGroups[g]){ exGroups[g] = []; exOrder.push(g); } exGroups[g].push(e); });
  view.innerHTML = '<div class="row"><h2 class="grow">📝 Thi & kiểm tra</h2><button class="pill on" id="eImp">📥 Nạp đề</button></div>' +
    '<div class="card"><h3 style="margin-top:0">🌐 Kiểm tra tổng quát</h3><div class="small muted">Trộn ngẫu nhiên câu hỏi từ tất cả các bài.</div>' +
      '<div class="chips" style="margin-top:8px">' + [['both', 'Từ vựng + Ngữ pháp'], ['v', 'Chỉ từ vựng'], ['g', 'Chỉ ngữ pháp']].map(function(o){ return '<button class="pill' + (EXU.genWhat === o[0] ? ' on' : '') + '" data-gw="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row" style="margin-top:8px"><span class="small">Số câu</span><input type="number" id="gCount" min="5" max="100" value="' + EXU.genCount + '" style="max-width:90px"><span class="small muted">⏱ ' + EXU.genCount + ' phút</span></div>' +
      '<button class="btn primary block" style="margin-top:10px" id="gGo">▶ Bắt đầu làm bài</button></div>' +
    (ch ? '<div class="card"><h3 style="margin-top:0">📚 Kiểm tra theo bài / chuyên đề</h3>' +
      '<select id="chSel" style="margin-top:4px"><optgroup label="Từ vựng">' + grp('Từ vựng') + '</optgroup>' + (GL.length ? '<optgroup label="Ngữ pháp">' + grp('Ngữ pháp') + '</optgroup>' : '') + '</select>' +
      '<div class="row" style="margin-top:8px"><span class="small">Số câu</span><input type="number" id="chCount" min="5" max="100" value="' + EXU.chCount + '" style="max-width:90px"><span class="small muted">⏱ ' + EXU.chCount + ' phút</span></div>' +
      '<button class="btn primary block" style="margin-top:10px" id="chGo">▶ Bắt đầu làm bài</button></div>' : '') +
    exOrder.map(function(g){ return '<h3>🎯 ' + esc(g) + '</h3>' + exGroups[g].map(function(e){ var b = bestOf(e.id);
      return '<div class="card row"><div class="grow"><b>' + esc(e.title) + '</b><div class="small muted">' + e.qs.length + ' câu · ' + e.min + ' phút · ' + (b.n ? 'Đã làm ' + b.n + ' lần · Cao nhất ' + b.best + '%' : 'Chưa làm') + '</div></div><button class="btn primary" data-exam="' + esc(e.id) + '">▶</button></div>'; }).join(''); }).join('') +
    (!EXAMS.length ? '<div class="card small muted">Chưa có đề thi thử. Bấm "📥 Nạp đề" để thêm đề của bạn.</div>' : '') +
    (hist.length ? '<h3>🕘 Lịch sử làm bài</h3>' + hist.map(function(r){ return '<div class="card small row"><div class="grow"><b>' + esc(r.title) + '</b><div class="muted">' + new Date(r.at).toLocaleString('vi-VN') + ' · ' + fmtTime(r.dur) + '</div></div><b style="font-size:1.1rem;color:' + (r.pct >= 60 ? 'var(--good)' : 'var(--warn)') + '">' + r.pct + '%</b></div>'; }).join('') : '');
  $('eImp').onclick = function(){ openImport('e'); };
  view.querySelectorAll('[data-gw]').forEach(function(b){ b.onclick = function(){ EXU.genWhat = b.getAttribute('data-gw'); renderExamHome(); }; });
  $('gCount').onchange = function(){ EXU.genCount = Math.max(5, Math.min(100, parseInt(this.value, 10) || 30)); renderExamHome(); };
  if ($('chSel')){
    $('chSel').onchange = function(){ EXU.chapter = this.value; renderExamHome(); };
    $('chCount').onchange = function(){ EXU.chCount = Math.max(5, Math.min(100, parseInt(this.value, 10) || 20)); renderExamHome(); };
    $('chGo').onclick = function(){ startExam('chapter', 'ch:' + ch.key, 'Kiểm tra: ' + ch.title, buildChapterQs(ch.items, EXU.chCount), EXU.chCount); };
  }
  $('gGo').onclick = function(){
    var all = (EXU.genWhat !== 'g' ? allVocab() : []).concat(EXU.genWhat !== 'v' ? allGrammar() : []);
    var qs = shuffle(all).slice(0, EXU.genCount).map(fromItem).sort(function(a, b){ return a.sec === b.sec ? 0 : (a.sec === 'vocab' ? -1 : 1); });
    startExam('general', 'general', 'Kiểm tra tổng quát', qs, EXU.genCount);
  };
  view.querySelectorAll('[data-exam]').forEach(function(b){ b.onclick = function(){
    var e = EXAMS.filter(function(x){ return x.id === b.getAttribute('data-exam'); })[0];
    startExam('mock', e.id, e.title, e.qs.map(fromMock), e.min);
  }; });
}
function renderExamQ(){
  var ex = ui.exam, i = ex.cur, q = ex.qs[i], n = ex.qs.length;
  var answered = ex.ans.filter(function(a){ return a >= 0; }).length;
  view.innerHTML =
    '<div class="exbar"><span id="exTimer" class="extimer">⏱ ' + fmtTime(ex.endAt - Date.now()) + '</span><span class="small muted grow">' + (i + 1) + ' / ' + n + ' · ✓' + answered + '</span><button class="btn primary" id="exSubmit">Nộp bài</button></div>' +
    '<div class="progress"><i style="width:' + Math.round(answered / n * 100) + '%"></i></div>' +
    '<div class="small muted">' + esc(ex.title) + ' · <b>' + secName(q.sec) + '</b></div>' +
    '<div class="small" style="margin:6px 0 8px">' + esc(q.inst) + '</div>' +
    (q.psg ? '<div class="card"><div class="en" style="font-size:1rem">' + fmt(q.psg.en) + '</div></div>' : '') +
    '<div class="card"><div class="small muted">Câu ' + (i + 1) + (ex.flags[i] ? ' <span style="color:var(--warn)">⚑</span>' : '') + '</div><div class="en" style="font-size:1.1rem">' + q.qhtml + '</div></div>' +
    '<div id="exOpts">' + q.opts.map(function(o, k){ return '<button class="opt' + (ex.ans[i] === k ? ' picked' : '') + '" data-k="' + k + '">' + String.fromCharCode(65 + k) + '. ' + o + '</button>'; }).join('') + '</div>' +
    '<div class="navbtns" style="margin-top:6px"><button class="btn" id="exPrev"' + (i ? '' : ' disabled') + '>← Câu trước</button><button class="btn warn" id="exFlag">' + (ex.flags[i] ? '⚑ Bỏ dấu' : '⚑ Đánh dấu') + '</button><button class="btn" id="exNext"' + (i < n - 1 ? '' : ' disabled') + '>Câu sau →</button></div>' +
    '<div class="actions" style="justify-content:center"><button id="exHint">💬 Hỏi gia sư (gợi ý)</button><button id="exQuit">Hủy bài</button></div>' +
    '<h3>Danh sách câu</h3><div class="exgrid">' + ex.qs.map(function(x, k){ return '<button data-go="' + k + '" class="' + (k === i ? 'cur ' : '') + (ex.ans[k] >= 0 ? 'done ' : '') + (ex.flags[k] ? 'flag' : '') + '">' + (k + 1) + '</button>'; }).join('') + '</div>';
  view.querySelectorAll('#exOpts .opt').forEach(function(b){ b.onclick = function(){ ex.ans[i] = +b.getAttribute('data-k'); if (i < n - 1) ex.cur++; exSave(); renderExamQ(); window.scrollTo(0, 0); }; });
  $('exPrev').onclick = function(){ ex.cur--; exSave(); renderExamQ(); };
  $('exNext').onclick = function(){ ex.cur++; exSave(); renderExamQ(); };
  $('exFlag').onclick = function(){ if (ex.flags[i]) delete ex.flags[i]; else ex.flags[i] = 1; exSave(); renderExamQ(); };
  view.querySelectorAll('[data-go]').forEach(function(b){ b.onclick = function(){ ex.cur = +b.getAttribute('data-go'); exSave(); renderExamQ(); window.scrollTo(0, 0); }; });
  $('exSubmit').onclick = function(){ var left = n - ex.ans.filter(function(a){ return a >= 0; }).length; if (confirm(left ? 'Còn ' + left + ' câu chưa làm. Vẫn nộp bài?' : 'Nộp bài và chấm điểm?')) submitExam(false); };
  $('exQuit').onclick = function(){ if (confirm('Thoát bài thi? Bài làm sẽ bị hủy.')){ ui.exam = null; exSave(); clearInterval(exTimer); renderExamHome(); } };
  $('exHint').onclick = function(){ askTutor('[Đang làm bài thi — CHỈ GỢI Ý, KHÔNG nói đáp án] ' + ex.title + '\n' + q.ctx, 'Mình đang làm bài thi. Đừng nói thẳng đáp án, chỉ gợi ý cách suy nghĩ (nghĩa của từ khóa, cấu trúc liên quan) để mình tự chọn.'); };
  runTimer();
}
function stripHtml(h){ return String(h || '').replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim(); }
function submitExam(){
  var ex = ui.exam; if (!ex || ex.submitted) return;
  ex.submitted = true; clearInterval(exTimer);
  var dur = Math.min(Date.now(), ex.endAt) - ex.startAt;
  var sec = {}, ok = 0;
  ex.qs.forEach(function(q, k){
    var right = ex.ans[k] === q.a; if (right) ok++;
    sec[q.sec] = sec[q.sec] || [0, 0]; sec[q.sec][1]++; if (right) sec[q.sec][0]++;
    if (q.itemId && ex.ans[k] >= 0) recordAnswer(q.itemId, right, 'exam'); else logDay(right);
  });
  var res = { ok:ok, total:ex.qs.length, pct:Math.round(ok / ex.qs.length * 100), dur:dur, sec:sec };
  res.pass = res.pct >= 60;
  ex.result = res; ex.ai = '';
  var miss = [];
  ex.qs.forEach(function(q, k){ if (ex.ans[k] === q.a) return; miss.push({ sec:q.sec, q:stripHtml(q.qhtml).slice(0, 160), pick:ex.ans[k] >= 0 ? stripHtml(q.opts[ex.ans[k]]).slice(0, 60) : '', a:stripHtml(q.opts[q.a]).slice(0, 60) }); });
  S.exams.push({ id:ex.id, title:ex.title, kind:ex.kind, pct:res.pct, ok:ok, total:res.total, dur:dur, at:Date.now(), miss:miss.slice(0, 20) });
  if (S.exams.length > 60) S.exams = S.exams.slice(-60);
  save(); exSave();
  if (curTab !== 'exam') switchTab('exam'); else { renderExamResult(); window.scrollTo(0, 0); }
  if (tutorCode()) aiGrade();
}
function aiGrade(){
  var ex = ui.exam; if (!ex || !ex.result) return;
  ex.ai = '…'; if (curTab === 'exam') renderExamResult();
  var r = ex.result, wrong = [];
  ex.qs.forEach(function(q, k){ if (ex.ans[k] !== q.a) wrong.push('- [' + secName(q.sec) + '] ' + q.ctx.split('\n').slice(-2).join(' ').slice(0, 220) + ' | Chọn: ' + (ex.ans[k] >= 0 ? String.fromCharCode(65 + ex.ans[k]) : 'bỏ trống') + ' | Đúng: ' + String.fromCharCode(65 + q.a)); });
  var prompt = 'Hãy đóng vai giáo viên chấm bài thi tiếng Anh cho mình.\nBài: ' + ex.title + '\nĐiểm: ' + r.ok + '/' + r.total + ' (' + r.pct + '%). Thời gian làm: ' + fmtTime(r.dur) + ' / ' + ex.minutes + ' phút.\n' +
    'Theo phần: ' + Object.keys(r.sec).map(function(k){ return secName(k) + ' ' + r.sec[k][0] + '/' + r.sec[k][1]; }).join(', ') + '.\nCác câu sai:\n' + (wrong.slice(0, 25).join('\n') || '(không có)') +
    '\n\nYêu cầu: 1) Nhận xét tổng quát. 2) Điểm mạnh, điểm yếu theo từng phần. 3) Phân tích lỗi sai hay gặp (nhóm theo loại, nêu kiến thức cần nhớ). 4) Kế hoạch ôn tập cụ thể 3–5 bước. Ngắn gọn, rõ ràng.';
  callTutor(prompt, '').then(function(ans){
    ex.ai = ans || ''; var last = S.exams[S.exams.length - 1]; if (last) last.ai = (ans || '').slice(0, 2500); save();
    if (curTab === 'exam' && ui.exam === ex) renderExamResult();
  }).catch(function(e){ ex.ai = '⚠ ' + e.message; if (curTab === 'exam' && ui.exam === ex) renderExamResult(); });
}
function renderExamResult(){
  var ex = ui.exam, r = ex.result;
  var aiBox = ex.ai === '…' ? '<span class="spinner"></span> Gia sư đang chấm bài…' : (ex.ai ? mdLite(ex.ai).replace(/\n/g, '<br>') : (tutorCode() ? '<button class="btn" id="exAIgo">Nhờ gia sư nhận xét</button>' : 'Nhập mã gia sư trong ⚙ Cài đặt để gia sư nhận xét bài làm.'));
  var list = ex.qs.map(function(q, k){
    var right = ex.ans[k] === q.a;
    if (EXU.filterWrong && right) return '';
    return '<div class="card"><div class="small muted">' + (k + 1) + ' · ' + secName(q.sec) + ' · ' + esc(q.inst) + '</div>' +
      (q.psg ? '<div class="small" style="margin:6px 0">' + fmt(q.psg.en) + '</div>' + (q.psg.vi ? hideBox(fmt(q.psg.vi), '👁 Xem dịch') : '') : '') +
      '<div class="en">' + q.qhtml + '</div>' +
      q.opts.map(function(o, j){ return '<div class="opt' + (j === q.a ? ' right' : (j === ex.ans[k] ? ' wrong' : '')) + '" style="cursor:default">' + String.fromCharCode(65 + j) + '. ' + o + '</div>'; }).join('') +
      (ex.ans[k] < 0 ? '<div class="small" style="color:var(--warn)">Bạn chưa làm câu này</div>' : '') +
      '<div class="explain"><div class="verdict ' + (right ? 'ok' : 'ng') + '">' + (right ? '✓ Chính xác!' : '✗ Chưa đúng') + '</div>' + (q.why ? '<b>Vì sao?</b> ' + fmt(q.why) : '') +
      '<div class="actions"><button data-ask="' + k + '">💬 Hỏi gia sư</button></div></div></div>';
  }).join('');
  view.innerHTML = '<div class="card" style="text-align:center"><h2 style="margin-top:0">Kết quả bài thi</h2><div class="small muted">' + esc(ex.title) + '</div>' +
    '<div style="font-size:2.6rem;font-weight:800;color:' + (r.pct >= 60 ? 'var(--good)' : 'var(--warn)') + '">' + r.pct + '%</div>' +
    '<div>Đúng ' + r.ok + '/' + r.total + ' câu · Thời gian: ' + fmtTime(r.dur) + '</div>' +
    '<div style="margin-top:6px;font-weight:700;color:' + (r.pass ? 'var(--good)' : 'var(--bad)') + '">' + (r.pass ? 'ĐẠT ✓ (≥ 60%)' : 'CHƯA ĐẠT (cần ≥ 60%)') + '</div>' +
    '<div style="text-align:left;margin-top:10px">' + Object.keys(r.sec).map(function(k){ return '<div class="row small"><span class="grow">' + secName(k) + '</span><b>' + r.sec[k][0] + '/' + r.sec[k][1] + '</b></div>'; }).join('') + '</div></div>' +
    '<div class="card"><h3 style="margin-top:0">🎓 Gia sư chấm điểm & nhận xét</h3><div style="line-height:1.7">' + aiBox + '</div></div>' +
    '<div class="row"><button class="btn grow" id="exHome">← Về trang Thi</button>' + (ex.kind === 'mock' ? '<button class="btn primary grow" id="exAgain">Làm lại đề này</button>' : '') + '</div>' +
    '<div class="row" style="margin:14px 0 8px"><h3 class="grow" style="margin:0">Xem lại từng câu</h3><button class="pill' + (EXU.filterWrong ? '' : ' on') + '" id="fAll">Tất cả</button><button class="pill' + (EXU.filterWrong ? ' on' : '') + '" id="fWrong">Chỉ câu sai</button></div>' + list;
  if ($('exAIgo')) $('exAIgo').onclick = aiGrade;
  $('exHome').onclick = function(){ ui.exam = null; exSave(); renderExamHome(); };
  if ($('exAgain')) $('exAgain').onclick = function(){ var e = EXAMS.filter(function(x){ return x.id === ex.id; })[0]; if (e) startExam('mock', e.id, e.title, e.qs.map(fromMock), e.min); };
  $('fAll').onclick = function(){ EXU.filterWrong = false; renderExamResult(); };
  $('fWrong').onclick = function(){ EXU.filterWrong = true; renderExamResult(); };
  view.querySelectorAll('.reveal').forEach(function(b){ b.onclick = function(){ revealToggle(b); }; });
  view.querySelectorAll('[data-ask]').forEach(function(b){ b.onclick = function(){
    var k = +b.getAttribute('data-ask'), q = ex.qs[k];
    askTutor('[Bài thi đã nộp] ' + ex.title + '\n' + q.ctx + '\nĐáp án đúng: ' + String.fromCharCode(65 + q.a) + '. Mình chọn: ' + (ex.ans[k] >= 0 ? String.fromCharCode(65 + ex.ans[k]) : 'bỏ trống') + '\nGiải thích có sẵn: ' + plain(q.why), defaultQ('q'));
  }; });
}
if (ui.exam && !ui.exam.submitted) runTimer();

/* ======================= khởi động ======================= */
document.querySelectorAll('#tabs button').forEach(function(b){ b.onclick = function(){ switchTab(b.getAttribute('data-tab')); }; });
$('btnIpa').onclick = function(){ S.ipa = !S.ipa; save(); applyPrefs(); };
$('btnSettings').onclick = openSettings;
document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.reveal'); if (b && !b.onclick && !e.defaultPrevented && !b.closest('.listitem') && !b.closest('#fCard')){ revealToggle(b); } });
document.addEventListener('click', function(){ ui.started = true; }, true);
document.addEventListener('touchstart', function(){ ui.started = true; }, { capture:true, passive:true });
bindGate();
applyPrefs();
switchTab('vocab');
if (location.protocol !== 'file:' || /firebase=1/.test(location.search)) startCloud();
window.__en = { S:function(){ return S; }, ITEMS:function(){ return ITEMS; }, VL:VL, GL:function(){ return GL; }, DOC:function(){ return DOC; }, EXAMS:function(){ return EXAMS; }, parseVocabLines:parseVocabLines, startSession:startSession, cloud:cloud };
})();
