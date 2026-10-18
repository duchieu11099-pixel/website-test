/* 日本語マスター N2・N1 — app logic
   - Từ vựng / ngữ pháp / đọc hiểu, furigana, dịch ẩn, mẹo nhớ
   - Flashcard SRS (SM-2), trắc nghiệm có giải thích, tự chọn từ / theo bài
   - Chụp ảnh nạp dữ liệu (OCR), kiểm tra trùng
   - Đồng bộ tiến trình lên Firebase, gia sư AI (DeepSeek) dùng "mã gia sư" */
(function(){
'use strict';

/* ======================= i18n ======================= */
var T = {
 vi:{
  tabVocab:'Từ vựng',tabGrammar:'Ngữ pháp',tabReading:'Đọc hiểu',tabPractice:'Luyện tập',tabTutor:'Gia sư',
  email:'Email (tên đăng nhập)',password:'Mật khẩu',login:'Đăng nhập',signup:'Tạo tài khoản mới',forgot:'Quên mật khẩu',skipLogin:'Dùng không đăng nhập',
  gateSub:'Đăng nhập để lưu tiến trình học lên Firebase và dùng trên mọi thiết bị.',
  allLessons:'Tất cả bài',myWords:'Từ tôi nạp',marked:'Đã đánh dấu ★',selectedW:'Đã chọn để kiểm tra',search:'Tìm từ, cách đọc, nghĩa…',
  showTrans:'👁 Hiện bản dịch',hideTrans:'Ẩn bản dịch',tip:'Mẹo nhớ',example:'Ví dụ',form:'Cấu trúc',usage:'Cách dùng',
  speak:'🔊 Đọc',mark:'★ Đánh dấu',unmark:'★ Bỏ dấu',select:'☐ Chọn kiểm tra',selected:'☑ Đã chọn',askTutor:'💬 Hỏi gia sư',
  selectAll:'Chọn cả bài',clearSel:'Bỏ chọn hết',nSelected:'{n} từ đã chọn',importData:'📷 Nạp dữ liệu',testLesson:'Kiểm tra bài này',
  words:'từ',points:'mẫu',dueToday:'Cần ôn',learned:'Đã thuộc',todayDone:'Hôm nay',streak:'Chuỗi ngày',
  pType:'Nội dung',pVocab:'Từ vựng',pGrammar:'Ngữ pháp',pSource:'Chọn từ/mẫu để kiểm tra',srcLessons:'Theo bài học',srcSelected:'Những từ tôi đã chọn',srcDue:'Đến hạn ôn (SRS)',srcMarked:'Đã đánh dấu ★',srcWrong:'Hay làm sai',srcNew:'Chưa học',
  pMode:'Cách kiểm tra',mFlash:'Thẻ flashcard (lặp lại ngắt quãng)',mMeaning:'Trắc nghiệm nghĩa',mReading:'Trắc nghiệm cách đọc',mType:'Gõ cách đọc (hiragana)',mGrammar:'Điền ngữ pháp vào chỗ trống',mGMean:'Trắc nghiệm nghĩa ngữ pháp',
  pCount:'Số câu',pDir:'Chiều thẻ',dirJa:'Nhật → Nghĩa',dirMean:'Nghĩa → Nhật',pick:'Chọn bài',start:'Bắt đầu',poolSize:'Có {n} mục phù hợp',
  tapFlip:'Chạm để lật thẻ',again:'Quên',hard:'Khó',good:'Nhớ',easy:'Dễ',
  correct:'Chính xác!',wrongA:'Chưa đúng',answerIs:'Đáp án đúng',youChose:'Bạn đã chọn',why:'Vì sao?',next:'Câu tiếp →',finish:'Xem kết quả',
  result:'Kết quả',score:'Đúng {a}/{b}',reviewWrong:'Ôn lại câu sai',backHome:'Về trang luyện tập',quit:'Dừng',
  typeHere:'Gõ cách đọc bằng hiragana…',check:'Kiểm tra',
  readingList:'Bài đọc',question:'Câu hỏi',
  tutorTitle:'Gia sư AI',tutorNoKey:'Bạn chưa nhập mã gia sư. Vào ⚙ Cài đặt → Mã gia sư để nhập.',tutorHello:'Chào bạn! Mình là gia sư tiếng Nhật. Hỏi mình bất cứ chỗ nào bạn thắc mắc — từ vựng, ngữ pháp, bài đọc, hay vì sao chọn đáp án.',
  tutorPh:'Nhập câu hỏi…',send:'Gửi',clearChat:'Xóa cuộc trò chuyện',thinking:'Gia sư đang trả lời',context:'Đang hỏi về',
  settings:'Cài đặt',language:'Ngôn ngữ',furigana:'Hiện furigana trên kanji',dailyGoal:'Mục tiêu mỗi ngày (thẻ)',
  tutorCode:'Mã gia sư',tutorCodeHelp:'Nhập mã gia sư để dùng tính năng hỏi gia sư. Mã chỉ lưu trên máy này. Xóa mã thì gia sư sẽ khóa cho đến khi bạn nhập lại.',
  save:'Lưu',del:'Xóa mã',codeSaved:'Đã lưu mã gia sư',codeDeleted:'Đã xóa mã gia sư',codeOn:'Gia sư: đang bật',codeOff:'Gia sư: chưa có mã',
  account:'Tài khoản',loggedAs:'Đang đăng nhập: {e}',notLogged:'Chưa đăng nhập — tiến trình chỉ lưu trên máy này',logout:'Đăng xuất',loginNow:'Đăng nhập',
  syncOk:'Đã lưu lên Firebase',syncing:'Đang lưu…',syncErr:'Không lưu được lên Firebase: {e}',
  backup:'Sao lưu',exportJ:'Tải file sao lưu',importJ:'Khôi phục từ file',resetP:'Xóa toàn bộ tiến trình',confirmReset:'Xóa toàn bộ tiến trình học? Không thể hoàn tác.',
  methods:'Phương pháp học trong app',
  imp:'Nạp dữ liệu',impHelp:'Chụp trang sách/vở hoặc chọn ảnh. App sẽ đọc chữ, bạn kiểm tra lại rồi thêm vào. Dữ liệu chỉ lưu trong tài khoản của bạn.',
  camera:'📷 Chụp ảnh',gallery:'🖼 Chọn ảnh',pasteText:'📋 Dán văn bản',ocrRunning:'Đang đọc chữ trong ảnh… {p}%',ocrDone:'Đã đọc xong. Kiểm tra và sửa bên dưới.',
  rawText:'Văn bản đọc được (có thể sửa)',parse:'Tách thành danh sách từ',lessonName:'Tên bài (nhóm)',
  colWord:'Từ',colRead:'Cách đọc',colVi:'Nghĩa VI',colMy:'Nghĩa MY',addRow:'+ Thêm dòng',autoRead:'Tự điền cách đọc',autoFill:'Gia sư điền nghĩa & cách đọc',
  addToApp:'Thêm vào app',dupTitle:'Có từ bị trùng',dupMsg:'{n} từ đã có trong app:',dupAddAll:'Vẫn thêm cả từ trùng',dupSkip:'Bỏ từ trùng, chỉ thêm {m} từ mới',cancel:'Hủy',
  added:'Đã thêm {n} từ vào "{l}"',nothing:'Không có từ nào để thêm',dupMark:'trùng',
  manual:'Thêm từ thủ công',noItems:'Không có mục nào.',deleteWord:'🗑 Xóa',confirmDel:'Xóa từ này?',
  loadingDict:'Đang tải bộ tách từ (lần đầu hơi lâu)…',
  ofLesson:'Bài',showMeaning:'Hiện nghĩa',
  explainCorrect:'Đáp án đúng là {x}',chosenMeans:'"{x}" có nghĩa là: {m}',
  needLogin:'Đăng nhập để đồng bộ',
  ttsNone:'Máy không hỗ trợ đọc tiếng Nhật'
 },
 my:{
  tabVocab:'ဝေါဟာရ',tabGrammar:'သဒ္ဒါ',tabReading:'စာဖတ်',tabPractice:'လေ့ကျင့်',tabTutor:'ဆရာ',
  email:'အီးမေးလ် (ဝင်ရောက်အမည်)',password:'စကားဝှက်',login:'ဝင်ရောက်မည်',signup:'အကောင့်အသစ် ဖွင့်မည်',forgot:'စကားဝှက် မေ့နေသည်',skipLogin:'မဝင်ဘဲ သုံးမည်',
  gateSub:'လေ့လာမှုတိုးတက်မှုကို Firebase တွင် သိမ်းပြီး စက်တိုင်းတွင် သုံးရန် ဝင်ရောက်ပါ။',
  allLessons:'သင်ခန်းစာအားလုံး',myWords:'ကိုယ်တိုင်ထည့်သော စကားလုံး',marked:'မှတ်ထားသော ★',selectedW:'စစ်ဆေးရန် ရွေးထားသော',search:'စကားလုံး၊ အသံထွက်၊ အဓိပ္ပာယ် ရှာရန်…',
  showTrans:'👁 ဘာသာပြန် ပြရန်',hideTrans:'ဘာသာပြန် ဖုံးရန်',tip:'မှတ်မိရန် နည်းလမ်း',example:'ဥပမာ',form:'ဖွဲ့စည်းပုံ',usage:'အသုံးပြုပုံ',
  speak:'🔊 ဖတ်ရန်',mark:'★ မှတ်ရန်',unmark:'★ မှတ်ချက်ဖြုတ်',select:'☐ စစ်ရန်ရွေး',selected:'☑ ရွေးပြီး',askTutor:'💬 ဆရာကို မေးရန်',
  selectAll:'သင်ခန်းစာတစ်ခုလုံး ရွေး',clearSel:'ရွေးထားသမျှ ဖြုတ်',nSelected:'{n} လုံး ရွေးထား',importData:'📷 ဒေတာထည့်ရန်',testLesson:'ဒီသင်ခန်းစာ စစ်ဆေးရန်',
  words:'လုံး',points:'ပုံစံ',dueToday:'ပြန်လေ့လာရန်',learned:'မှတ်မိပြီး',todayDone:'ယနေ့',streak:'ဆက်တိုက်ရက်',
  pType:'အကြောင်းအရာ',pVocab:'ဝေါဟာရ',pGrammar:'သဒ္ဒါ',pSource:'စစ်ဆေးမည့် စကားလုံး/ပုံစံ ရွေးရန်',srcLessons:'သင်ခန်းစာအလိုက်',srcSelected:'ကိုယ်ရွေးထားသော စကားလုံး',srcDue:'ပြန်လေ့လာရမည့်အချိန် (SRS)',srcMarked:'မှတ်ထားသော ★',srcWrong:'မကြာခဏ မှားသော',srcNew:'မလေ့လာရသေး',
  pMode:'စစ်ဆေးပုံ',mFlash:'ဖလက်ရှ်ကတ် (အချိန်ခြား ပြန်လေ့လာ)',mMeaning:'အဓိပ္ပာယ် ရွေးချယ်',mReading:'အသံထွက် ရွေးချယ်',mType:'အသံထွက် ရိုက်ထည့် (hiragana)',mGrammar:'သဒ္ဒါ ကွက်လပ်ဖြည့်',mGMean:'သဒ္ဒါ အဓိပ္ပာယ် ရွေးချယ်',
  pCount:'မေးခွန်းအရေအတွက်',pDir:'ကတ်ဦးတည်ချက်',dirJa:'ဂျပန် → အဓိပ္ပာယ်',dirMean:'အဓိပ္ပာယ် → ဂျပန်',pick:'သင်ခန်းစာ ရွေး',start:'စတင်မည်',poolSize:'ကိုက်ညီသော အရာ {n} ခု',
  tapFlip:'ကတ်လှန်ရန် နှိပ်ပါ',again:'မေ့',hard:'ခက်',good:'မှတ်မိ',easy:'လွယ်',
  correct:'မှန်တယ်!',wrongA:'မမှန်သေးဘူး',answerIs:'အဖြေမှန်',youChose:'သင်ရွေးခဲ့တာ',why:'ဘာကြောင့်လဲ?',next:'နောက်တစ်ခု →',finish:'ရလဒ်ကြည့်ရန်',
  result:'ရလဒ်',score:'မှန် {a}/{b}',reviewWrong:'မှားတာ ပြန်လေ့ကျင့်',backHome:'လေ့ကျင့်မှု စာမျက်နှာသို့',quit:'ရပ်မည်',
  typeHere:'အသံထွက်ကို hiragana ဖြင့် ရိုက်ပါ…',check:'စစ်မည်',
  readingList:'စာဖတ်ခန်း',question:'မေးခွန်း',
  tutorTitle:'AI ဆရာ',tutorNoKey:'ဆရာ ကုဒ် မထည့်ရသေးပါ။ ⚙ ဆက်တင် → ဆရာ ကုဒ် တွင် ထည့်ပါ။',tutorHello:'မင်္ဂလာပါ! ကျွန်တော်က ဂျပန်စာ ဆရာပါ။ ဝေါဟာရ၊ သဒ္ဒါ၊ စာဖတ်၊ အဖြေဘာကြောင့်မှန်လဲ — သိချင်တာ မေးပါ။',
  tutorPh:'မေးခွန်း ရိုက်ပါ…',send:'ပို့',clearChat:'စကားဝိုင်း ဖျက်ရန်',thinking:'ဆရာ ဖြေနေသည်',context:'မေးနေသည့်အကြောင်း',
  settings:'ဆက်တင်',language:'ဘာသာစကား',furigana:'ခန်းဂျီးပေါ်တွင် furigana ပြရန်',dailyGoal:'နေ့စဉ်ပန်းတိုင် (ကတ်)',
  tutorCode:'ဆရာ ကုဒ်',tutorCodeHelp:'ဆရာကို မေးရန် ဆရာ ကုဒ်ကို ထည့်ပါ။ ကုဒ်ကို ဒီစက်ထဲမှာသာ သိမ်းသည်။ ဖျက်လိုက်ရင် ပြန်မထည့်မချင်း ဆရာကို သုံး၍မရပါ။',
  save:'သိမ်းမည်',del:'ကုဒ် ဖျက်မည်',codeSaved:'ဆရာ ကုဒ် သိမ်းပြီး',codeDeleted:'ဆရာ ကုဒ် ဖျက်ပြီး',codeOn:'ဆရာ: ဖွင့်ထား',codeOff:'ဆရာ: ကုဒ်မရှိ',
  account:'အကောင့်',loggedAs:'ဝင်ထားသည်: {e}',notLogged:'မဝင်ရသေး — ဒီစက်ထဲမှာသာ သိမ်းသည်',logout:'ထွက်မည်',loginNow:'ဝင်ရောက်မည်',
  syncOk:'Firebase တွင် သိမ်းပြီး',syncing:'သိမ်းနေသည်…',syncErr:'Firebase တွင် မသိမ်းနိုင်ပါ: {e}',
  backup:'အရန်သိမ်း',exportJ:'အရန်ဖိုင် ဒေါင်းရန်',importJ:'ဖိုင်မှ ပြန်ယူရန်',resetP:'တိုးတက်မှုအားလုံး ဖျက်ရန်',confirmReset:'တိုးတက်မှုအားလုံး ဖျက်မလား? ပြန်ယူ၍ မရပါ။',
  methods:'အက်ပ်ရှိ လေ့လာနည်းများ',
  imp:'ဒေတာထည့်ရန်',impHelp:'စာအုပ်စာမျက်နှာကို ဓာတ်ပုံရိုက် သို့မဟုတ် ပုံရွေးပါ။ အက်ပ်က စာကို ဖတ်ပြီး သင်စစ်ဆေးကာ ထည့်နိုင်သည်။',
  camera:'📷 ဓာတ်ပုံရိုက်',gallery:'🖼 ပုံရွေး',pasteText:'📋 စာသားကူးထည့်',ocrRunning:'ပုံထဲက စာကို ဖတ်နေသည်… {p}%',ocrDone:'ဖတ်ပြီးပါပြီ။ အောက်တွင် စစ်ဆေးပြင်ဆင်ပါ။',
  rawText:'ဖတ်ရသော စာသား (ပြင်နိုင်)',parse:'စကားလုံးစာရင်းအဖြစ် ခွဲရန်',lessonName:'သင်ခန်းစာအမည် (အုပ်စု)',
  colWord:'စကားလုံး',colRead:'အသံထွက်',colVi:'VI အဓိပ္ပာယ်',colMy:'MY အဓိပ္ပာယ်',addRow:'+ အတန်းထည့်',autoRead:'အသံထွက် အလိုအလျောက်ဖြည့်',autoFill:'ဆရာက အဓိပ္ပာယ်နှင့် အသံထွက် ဖြည့်',
  addToApp:'အက်ပ်ထဲ ထည့်မည်',dupTitle:'ထပ်နေသော စကားလုံးရှိ',dupMsg:'{n} လုံး အက်ပ်ထဲ ရှိပြီး:',dupAddAll:'ထပ်နေတာပါ ထည့်မည်',dupSkip:'ထပ်တာ ချန်ပြီး အသစ် {m} လုံးသာ ထည့်မည်',cancel:'မလုပ်တော့',
  added:'"{l}" ထဲသို့ {n} လုံး ထည့်ပြီး',nothing:'ထည့်စရာ မရှိပါ',dupMark:'ထပ်',
  manual:'ကိုယ်တိုင် ထည့်ရန်',noItems:'ဘာမှ မရှိပါ။',deleteWord:'🗑 ဖျက်',confirmDel:'ဒီစကားလုံး ဖျက်မလား?',
  loadingDict:'စကားလုံးခွဲစနစ် ဒေါင်းနေသည် (ပထမဆုံးအကြိမ် ကြာနိုင်)…',
  ofLesson:'သင်ခန်းစာ',showMeaning:'အဓိပ္ပာယ်ပြ',
  explainCorrect:'အဖြေမှန်က {x} ဖြစ်သည်',chosenMeans:'"{x}" ၏ အဓိပ္ပာယ်: {m}',
  needLogin:'ချိန်ကိုက်ရန် ဝင်ရောက်ပါ',
  ttsNone:'ဒီစက်က ဂျပန်အသံ မဖတ်နိုင်ပါ'
 }
};

/* ======================= state ======================= */
var KEY = 'nihongo_state_v1', KEY_CODE = 'nihongo_tutor_code', KEY_CHAT = 'nihongo_chat_v1';
var defaults = { lang:'vi', furi:true, goal:20, srs:{}, marked:{}, selected:{}, wrong:{}, custom:[], days:{}, log:[], reading:{}, updatedAt:0 };
var S = load();
function load(){
  var s; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
  s = s && typeof s === 'object' ? s : {};
  for (var k in defaults) if (!(k in s)) s[k] = JSON.parse(JSON.stringify(defaults[k]));
  return s;
}
function t(k, vars){
  var s = (T[S.lang] && T[S.lang][k]) || T.vi[k] || k;
  if (vars) for (var v in vars) s = s.split('{' + v + '}').join(vars[v]);
  return s;
}
function L(o, base){ // pick vi/my field
  if (!o) return '';
  var v = o[base + (S.lang === 'my' ? 'My' : 'Vi')];
  if (v === undefined) v = o[S.lang];
  return v || o[base + 'Vi'] || o.vi || '';
}

/* ======================= data ======================= */
function parseData(src, kind){
  var lessons = [], cur = null;
  (src || '').split('\n').forEach(function(line){
    line = line.trim(); if (!line) return;
    var f = line.split('|');
    if (f[0] === 'L'){ cur = { id:f[1], title:f[2], kind:kind, items:[] }; lessons.push(cur); return; }
    if (!cur) return;
    var it;
    if (kind === 'v') it = { kind:'v', w:f[0], r:f[1], vi:f[2], my:f[3], exJa:f[4], exVi:f[5], exMy:f[6], tipVi:f[7], tipMy:f[8] };
    else it = { kind:'g', p:f[0], form:f[1], vi:f[2], my:f[3], useVi:f[4], useMy:f[5], exJa:f[6], exVi:f[7], exMy:f[8], tipVi:f[9], tipMy:f[10] };
    it.lesson = cur.id;
    it.id = kind === 'v' ? ('v_' + it.w + '_' + it.r) : ('g_' + cur.id + '_' + it.p);
    cur.items.push(it);
  });
  return lessons;
}
var VL = parseData(window.DATA_GOI, 'v');
var GL = parseData(window.DATA_BUN, 'g');
var DOK = window.DATA_DOK || [];
var ITEMS = {};  // id -> item
function rebuildIndex(){
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
function lessonById(id){
  var all = allVocabLessons().concat(GL);
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

/* ======================= text helpers ======================= */
var KANJI = '\u3400-\u9fff\uf900-\ufaff々〆ヶ';
var reKanjiRun = new RegExp('([' + KANJI + ']+)\\{([^}]+)\\}', 'g');
var reHasKanji = new RegExp('[' + KANJI + ']');
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function ruby(s){
  return esc(s).replace(reKanjiRun, '<ruby>$1<rt>$2</rt></ruby>')
               .replace(/【/g, '<mark class="g">').replace(/】/g, '</mark>')
               .replace(/\n/g, '<br>');
}
function plain(s){ return String(s || '').replace(/\{[^}]*\}/g, '').replace(/[【】]/g, ''); }
function kana(s){ return String(s || '').replace(/\{([^}]*)\}/g, '').replace(/[【】]/g, ''); }
function toHira(s){ return String(s || '').replace(/[\u30a1-\u30f6]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 0x60); }); }
function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function wordRuby(w, r){
  if (!w) return '';
  if (!r || !reHasKanji.test(w) || w === r) return esc(w);
  var segs = w.match(new RegExp('[' + KANJI + ']+|[^' + KANJI + ']+', 'g'));
  var pat = '^' + segs.map(function(sg){ return reHasKanji.test(sg) ? '(.+?)' : reEsc(toHira(sg)); }).join('') + '$';
  var m = toHira(r).match(new RegExp(pat));
  if (!m) return '<ruby>' + esc(w) + '<rt>' + esc(r) + '</rt></ruby>';
  var k = 1;
  return segs.map(function(sg){ return reHasKanji.test(sg) ? '<ruby>' + esc(sg) + '<rt>' + esc(m[k++]) + '</rt></ruby>' : esc(sg); }).join('');
}
function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
function today(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function $(id){ return document.getElementById(id); }
function h(html){ var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

var toastTimer;
function toast(msg, bad){
  var el = $('toast'); el.textContent = msg; el.className = 'toast' + (bad ? ' bad' : ''); el.style.display = 'block';
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ el.style.display = 'none'; }, 2600);
}
function speak(text){
  if (!('speechSynthesis' in window)){ toast(t('ttsNone'), true); return; }
  speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(plain(text)); u.lang = 'ja-JP'; u.rate = 0.9;
  var v = speechSynthesis.getVoices().filter(function(x){ return /ja/i.test(x.lang); })[0];
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function hideBox(textHtml){
  return '<div class="hidebox"><button class="reveal" data-act="reveal">' + t('showTrans') + '</button><div class="content">' + textHtml + '</div></div>';
}
function tipBox(it){
  var tp = L(it, 'tip'); if (!tp) return '';
  return '<div class="tip"><b>💡 ' + t('tip') + ':</b> ' + esc(tp) + '</div>';
}

/* ======================= save & sync ======================= */
var saveTimer = null;
function save(){
  S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
  clearTimeout(saveTimer); saveTimer = setTimeout(cloudPush, 1200);
}
function logDay(ok){
  var d = today(); var o = S.days[d] || (S.days[d] = { n:0, ok:0 });
  o.n++; if (ok) o.ok++;
}
function streak(){
  var n = 0, d = new Date();
  if (!S.days[today()]) d.setDate(d.getDate() - 1);
  while (true){
    var k = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    if (S.days[k] && S.days[k].n > 0){ n++; d.setDate(d.getDate() - 1); } else break;
  }
  return n;
}

/* SM-2 */
function srsOf(id){ return S.srs[id]; }
function isDue(id){ var s = S.srs[id]; return s && s.due <= Date.now(); }
function isLearned(id){ var s = S.srs[id]; return s && s.int >= 21; }
function grade(id, q){ // q: 0 again, 3 hard, 4 good, 5 easy
  var s = S.srs[id] || { ef:2.5, int:0, reps:0, lapses:0, due:0 };
  if (q < 3){ s.reps = 0; s.int = 0; s.lapses++; s.due = Date.now() + 10 * 60 * 1000; }
  else {
    if (s.reps === 0) s.int = q === 5 ? 3 : 1;
    else if (s.reps === 1) s.int = q === 3 ? 3 : (q === 5 ? 8 : 6);
    else s.int = Math.max(1, Math.round(s.int * (q === 3 ? 1.2 : s.ef) * (q === 5 ? 1.3 : 1)));
    s.reps++;
    s.due = Date.now() + s.int * 86400000;
  }
  s.ef = Math.max(1.3, s.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  S.srs[id] = s;
  if (q < 3) S.wrong[id] = (S.wrong[id] || 0) + 1; else if (S.wrong[id]){ S.wrong[id]--; if (!S.wrong[id]) delete S.wrong[id]; }
  logDay(q >= 3);
  save();
}
function recordAnswer(id, ok, extra){
  // trắc nghiệm: đúng → như "Nhớ", sai → như "Quên"
  grade(id, ok ? 4 : 0);
  S.log.push({ id:id, ok:ok, at:Date.now(), x:extra || '' });
  if (S.log.length > 300) S.log = S.log.slice(-300);
  save();
}
function nextLabel(id, q){
  var s = S.srs[id] || { ef:2.5, int:0, reps:0 };
  if (q < 3) return '10m';
  var d;
  if (s.reps === 0) d = q === 5 ? 3 : 1;
  else if (s.reps === 1) d = q === 3 ? 3 : (q === 5 ? 8 : 6);
  else d = Math.max(1, Math.round(s.int * (q === 3 ? 1.2 : s.ef) * (q === 5 ? 1.3 : 1)));
  return d + 'd';
}

/* ---- Firebase ---- */
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
  var left = list.length;
  list.forEach(function(src){
    var sc = document.createElement('script'); sc.async = false; sc.src = src;
    sc.onload = function(){ if (--left === 0) cb(null); };
    sc.onerror = function(){ cb(new Error('load ' + src)); };
    document.head.appendChild(sc);
  });
}
function startCloud(){
  var base = 'https://www.gstatic.com/firebasejs/10.12.0/';
  loadScripts([base + 'firebase-app-compat.js', base + 'firebase-auth-compat.js', base + 'firebase-firestore-compat.js'], function(err){
    if (err || !window.firebase){ $('lgErr').textContent = 'Firebase: offline'; return; }
    try { firebase.initializeApp(FIREBASE_CONFIG); } catch(e){}
    cloud.auth = firebase.auth(); cloud.db = firebase.firestore(); cloud.ready = true;
    cloud.auth.onAuthStateChanged(function(u){
      cloud.user = u;
      if (u){ $('gate').classList.remove('show'); cloudPull(); }
      else if (!sessionStorage.getItem('nh_skip')) $('gate').classList.add('show');
      if (curTab === 'settings') openSettings();
    });
  });
}
function docRef(){ return cloud.db.collection('nihongo').doc(cloud.user.uid); }
function cloudPull(){
  docRef().get().then(function(snap){
    if (snap.exists){
      var d = snap.data() || {};
      var remote = d.state ? JSON.parse(d.state) : null;
      if (remote && (remote.updatedAt || 0) > (S.updatedAt || 0)){
        var lang = S.lang;
        S = remote; for (var k in defaults) if (!(k in S)) S[k] = JSON.parse(JSON.stringify(defaults[k]));
        S.lang = S.lang || lang;
        try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
        rebuildIndex(); applyPrefs(); render();
        return;
      }
    }
    cloudPush();
  }).catch(function(e){ cloud.lastErr = e.code || e.message; toast(t('syncErr', { e:cloud.lastErr }), true); });
}
function cloudPush(){
  if (!cloud.ready || !cloud.user) return;
  docRef().set({ state: JSON.stringify(S), updatedAt: S.updatedAt, email: cloud.user.email || '' })
    .then(function(){ cloud.lastErr = ''; })
    .catch(function(e){ cloud.lastErr = e.code || e.message; toast(t('syncErr', { e:cloud.lastErr }), true); });
}
function authErr(e){
  var m = { 'auth/wrong-password':'Sai mật khẩu / စကားဝှက် မှား', 'auth/invalid-credential':'Sai email hoặc mật khẩu / အီးမေးလ် သို့ စကားဝှက် မှား', 'auth/user-not-found':'Chưa có tài khoản — bấm "Tạo tài khoản mới"', 'auth/email-already-in-use':'Email đã có tài khoản — hãy đăng nhập', 'auth/weak-password':'Mật khẩu tối thiểu 6 ký tự', 'auth/invalid-email':'Email không hợp lệ', 'auth/too-many-requests':'Thử quá nhiều lần, đợi một lúc', 'auth/operation-not-allowed':'Firebase chưa bật đăng nhập email/mật khẩu' };
  return m[e.code] || (e.code || e.message);
}
function bindGate(){
  $('lgLogin').onclick = function(){
    if (!cloud.ready) return;
    $('lgErr').textContent = '';
    cloud.auth.signInWithEmailAndPassword($('lgEmail').value.trim(), $('lgPass').value).catch(function(e){ $('lgErr').textContent = authErr(e); });
  };
  $('lgSignup').onclick = function(){
    if (!cloud.ready) return;
    $('lgErr').textContent = '';
    cloud.auth.createUserWithEmailAndPassword($('lgEmail').value.trim(), $('lgPass').value).catch(function(e){ $('lgErr').textContent = authErr(e); });
  };
  $('lgReset').onclick = function(){
    if (!cloud.ready) return;
    cloud.auth.sendPasswordResetEmail($('lgEmail').value.trim()).then(function(){ $('lgErr').textContent = '✓ Đã gửi email đặt lại mật khẩu / စကားဝှက်ပြန်သတ်မှတ်ရန် အီးမေးလ် ပို့ပြီး'; }).catch(function(e){ $('lgErr').textContent = authErr(e); });
  };
  $('lgSkip').onclick = function(){ sessionStorage.setItem('nh_skip', '1'); $('gate').classList.remove('show'); };
  $('lgPass').addEventListener('keydown', function(e){ if (e.key === 'Enter') $('lgLogin').click(); });
  document.querySelectorAll('[data-setlang]').forEach(function(b){ b.onclick = function(){ S.lang = b.getAttribute('data-setlang'); save(); applyPrefs(); render(); }; });
}

/* ======================= tutor (DeepSeek) ======================= */
function tutorCode(){ try { return localStorage.getItem(KEY_CODE) || ''; } catch(e){ return ''; } }
var chat = (function(){ try { return JSON.parse(localStorage.getItem(KEY_CHAT) || '[]'); } catch(e){ return []; } })();
var pendingCtx = '';
function saveChat(){ try { localStorage.setItem(KEY_CHAT, JSON.stringify(chat.slice(-40))); } catch(e){} }
function askTutor(ctx, q){
  pendingCtx = ctx; switchTab('tutor');
  var ta = $('chatInput'); if (ta){ ta.value = q || ''; ta.focus(); }
}
function ctxOfItem(it){
  if (it.kind === 'v') return '[Từ vựng N2] ' + it.w + '（' + it.r + '） = ' + it.vi + ' / ' + it.my + (it.exJa ? '\nVí dụ: ' + plain(it.exJa) + ' — ' + it.exVi : '');
  return '[Ngữ pháp N2] ' + it.p + ' | Cấu trúc: ' + it.form + ' | Nghĩa: ' + it.vi + '\nCách dùng: ' + it.useVi + (it.exJa ? '\nVí dụ: ' + plain(it.exJa) + ' — ' + it.exVi : '');
}
function defaultQ(kind){
  var vi = { v:'Giải thích kỹ từ này giúp mình: sắc thái, từ dễ nhầm, cách nhớ và thêm 2 câu ví dụ.', g:'Giải thích kỹ mẫu ngữ pháp này: khi nào dùng, phân biệt với mẫu giống nó, và thêm 2 câu ví dụ.', q:'Vì sao đáp án này đúng và các đáp án kia sai? Giải thích dễ hiểu giúp mình.', d:'Giải thích giúp mình đoạn này và cách tìm ra đáp án.' };
  var my = { v:'ဒီစကားလုံးကို အသေးစိတ် ရှင်းပြပေးပါ: အနက်သွယ်ပုံ၊ ရောထွေးလွယ်တဲ့စကားလုံး၊ မှတ်နည်းနဲ့ ဥပမာ ၂ ကြောင်း။', g:'ဒီသဒ္ဒါကို အသေးစိတ် ရှင်းပြပေးပါ: ဘယ်အချိန်သုံးလဲ၊ ဆင်တူပုံစံနဲ့ ကွာခြားချက်၊ ဥပမာ ၂ ကြောင်း။', q:'ဒီအဖြေက ဘာကြောင့်မှန်ပြီး တခြားဟာတွေ ဘာကြောင့်မှားလဲ ရှင်းပြပေးပါ။', d:'ဒီစာပိုဒ်နဲ့ အဖြေရှာပုံကို ရှင်းပြပေးပါ။' };
  return (S.lang === 'my' ? my : vi)[kind];
}
function callTutor(userText, ctx){
  var code = tutorCode();
  var langName = S.lang === 'my' ? 'tiếng Myanmar (Burmese)' : 'tiếng Việt';
  var sys = 'Bạn là gia sư tiếng Nhật tận tâm cho người học JLPT N2/N1. Luôn trả lời bằng ' + langName + '. ' +
    'Khi viết tiếng Nhật có kanji, ghi cách đọc hiragana trong ngoặc ngay sau, ví dụ: 経済（けいざい）. ' +
    'Giải thích ngắn gọn, rõ ràng, có ví dụ, có mẹo nhớ nếu hữu ích. Khi giải thích đáp án, nói vì sao đáp án đúng và vì sao từng đáp án khác sai. Không dùng bảng markdown.';
  var msgs = [{ role:'system', content:sys }];
  chat.slice(-10).forEach(function(m){ if (m.role === 'user' || m.role === 'assistant') msgs.push({ role:m.role, content:m.content }); });
  msgs.push({ role:'user', content:(ctx ? ('Ngữ cảnh mình đang học:\n' + ctx + '\n\nCâu hỏi: ') : '') + userText });
  return fetch('https://api.deepseek.com/chat/completions', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + code },
    body: JSON.stringify({ model:'deepseek-chat', messages:msgs, temperature:0.4, max_tokens:1200 })
  }).then(function(r){
    if (!r.ok) return r.text().then(function(x){ throw new Error(r.status === 401 ? (S.lang === 'my' ? 'ဆရာ ကုဒ် မမှန်ပါ' : 'Mã gia sư không đúng') : (r.status === 402 ? (S.lang === 'my' ? 'ကုဒ်ထဲ ငွေမလုံလောက်' : 'Mã gia sư hết số dư') : ('HTTP ' + r.status + ' ' + x.slice(0, 120)))); });
    return r.json();
  }).then(function(j){ return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || ''; });
}
function mdLite(s){
  return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/^#{1,4}\s*(.+)$/gm, '<b>$1</b>');
}

/* ======================= views ======================= */
var curTab = 'vocab';
var view = $('view');
var ui = { vLesson:'g1-1-1', vSearch:'', gLesson:'b01', readId:null, practice:null };
function applyPrefs(){
  document.body.classList.toggle('nofuri', !S.furi);
  document.body.classList.toggle('lang-my', S.lang === 'my');
  document.documentElement.lang = S.lang === 'my' ? 'my' : 'vi';
  $('btnLang').textContent = S.lang === 'my' ? 'MY' : 'VI';
  $('btnFuri').classList.toggle('on', !!S.furi);
  document.querySelectorAll('[data-t]').forEach(function(el){ el.textContent = t(el.getAttribute('data-t')); });
  $('gateSub').textContent = t('gateSub');
  document.querySelectorAll('[data-setlang]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-setlang') === S.lang); });
}
function switchTab(tab){
  curTab = tab;
  document.querySelectorAll('#tabs button').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
  render(); window.scrollTo(0, 0);
}
function render(){
  var fn = { vocab:renderVocab, grammar:renderGrammar, reading:renderReading, practice:renderPractice, tutor:renderTutor }[curTab];
  removeChatbar();
  if (fn) fn();
}

/* ---------- vocab ---------- */
function vocabPool(lessonId){
  if (lessonId === '__marked') return Object.keys(S.marked).map(function(id){ return ITEMS[id]; }).filter(function(i){ return i && i.kind === 'v'; });
  if (lessonId === '__sel') return Object.keys(S.selected).map(function(id){ return ITEMS[id]; }).filter(function(i){ return i && i.kind === 'v'; });
  if (lessonId === '__all') { var a = []; allVocabLessons().forEach(function(l){ a = a.concat(l.items); }); return a; }
  var l = lessonById(lessonId); return l ? l.items : [];
}
function lessonOptions(lessons, cur, extra){
  var html = (extra || []).map(function(e){ return '<option value="' + e[0] + '"' + (e[0] === cur ? ' selected' : '') + '>' + esc(e[1]) + '</option>'; }).join('');
  html += lessons.map(function(l){ return '<option value="' + esc(l.id) + '"' + (l.id === cur ? ' selected' : '') + '>' + esc(l.title) + ' (' + l.items.length + ')</option>'; }).join('');
  return html;
}
function vocabCard(it){
  var st = isLearned(it.id) ? '<span class="tag ok">' + t('learned') + '</span>' : (isDue(it.id) ? '<span class="tag due">' + t('dueToday') + '</span>' : '');
  return '<div class="card listitem" data-id="' + esc(it.id) + '">' +
    '<div class="head"><input type="checkbox" class="sel" data-act="sel"' + (S.selected[it.id] ? ' checked' : '') + '>' +
    '<div class="grow"><div class="word">' + wordRuby(it.w, it.r) + (S.marked[it.id] ? ' <span style="color:var(--warn);font-size:.9rem">★</span>' : '') + '</div>' +
    '<div class="muted small">' + esc(it.r) + ' ' + st + '</div>' +
    '<div>' + esc(L(it, '')) + '</div></div></div>' +
    '<div class="more">' +
      (it.exJa ? '<div class="small muted">' + t('example') + '</div><div class="jp">' + ruby(it.exJa) + '</div>' + hideBox(esc(L(it, 'ex'))) : '') +
      tipBox(it) +
      '<div class="actions">' +
        '<button data-act="speak">' + t('speak') + '</button>' +
        '<button data-act="mark" class="' + (S.marked[it.id] ? 'on' : '') + '">' + (S.marked[it.id] ? t('unmark') : t('mark')) + '</button>' +
        '<button data-act="tutor">' + t('askTutor') + '</button>' +
        (it.custom ? '<button data-act="delw">' + t('deleteWord') + '</button>' : '') +
      '</div>' +
    '</div></div>';
}
function renderVocab(){
  var lessons = allVocabLessons();
  var pool = vocabPool(ui.vLesson);
  var q = ui.vSearch.trim().toLowerCase();
  if (q){ var base = vocabPool('__all'); pool = base.filter(function(i){ return (i.w + ' ' + i.r + ' ' + i.vi + ' ' + i.my).toLowerCase().indexOf(q) >= 0; }); }
  var nSel = Object.keys(S.selected).length;
  view.innerHTML =
    statsBar() +
    '<div class="row" style="margin-bottom:8px"><select id="vLesson" class="grow">' +
      lessonOptions(lessons, ui.vLesson, [['__all', t('allLessons')], ['__marked', t('marked')], ['__sel', t('selectedW')]]) +
    '</select></div>' +
    '<input type="text" id="vSearch" placeholder="' + esc(t('search')) + '" value="' + esc(ui.vSearch) + '">' +
    '<div class="row" style="margin:10px 0">' +
      '<button class="pill" id="vSelAll">' + t('selectAll') + '</button>' +
      '<button class="pill" id="vClear">' + t('clearSel') + '</button>' +
      '<span class="small muted grow" style="white-space:nowrap">' + t('nSelected', { n:nSel }) + '</span>' +
      '<button class="pill on" id="vImport">' + t('importData') + '</button>' +
    '</div>' +
    '<div class="row" style="margin-bottom:10px"><button class="btn primary grow" id="vTest">▶ ' + t('testLesson') + ' (' + pool.length + ')</button></div>' +
    '<div id="vList">' + (pool.length ? pool.map(vocabCard).join('') : '<div class="empty">' + t('noItems') + '</div>') + '</div>';
  $('vLesson').onchange = function(){ ui.vLesson = this.value; ui.vSearch = ''; renderVocab(); };
  var stimer; $('vSearch').oninput = function(){ var v = this.value; clearTimeout(stimer); stimer = setTimeout(function(){ ui.vSearch = v; renderVocab(); var el = $('vSearch'); el.focus(); el.setSelectionRange(v.length, v.length); }, 250); };
  $('vSelAll').onclick = function(){ pool.forEach(function(i){ S.selected[i.id] = 1; }); save(); renderVocab(); };
  $('vClear').onclick = function(){ S.selected = {}; save(); renderVocab(); };
  $('vImport').onclick = openImport;
  $('vTest').onclick = function(){ if (!pool.length) return; startSession({ type:'v', mode:'flash', dir:'ja', items:shuffle(pool) }); };
  bindItemList($('vList'));
}
function bindItemList(root){
  root.addEventListener('click', function(e){
    var card = e.target.closest('.listitem'); if (!card) return;
    var id = card.getAttribute('data-id'), it = ITEMS[id];
    var act = e.target.getAttribute('data-act');
    if (act === 'sel'){ if (e.target.checked) S.selected[id] = 1; else delete S.selected[id]; save(); e.stopPropagation(); return; }
    if (act === 'reveal'){ revealToggle(e.target); return; }
    if (act === 'speak'){ speak(it.kind === 'v' ? it.w : it.exJa); return; }
    if (act === 'speakEx'){ speak(it.exJa); return; }
    if (act === 'mark'){ if (S.marked[id]) delete S.marked[id]; else S.marked[id] = 1; save(); card.outerHTML = (it.kind === 'v' ? vocabCard(it) : grammarCard(it)); var nc = root.querySelector('[data-id="' + CSS.escape(id) + '"]'); if (nc) nc.classList.add('open'); return; }
    if (act === 'tutor'){ askTutor(ctxOfItem(it), defaultQ(it.kind)); return; }
    if (act === 'delw'){ if (confirm(t('confirmDel'))){ S.custom = S.custom.filter(function(x){ return x.id !== id; }); delete S.selected[id]; delete S.marked[id]; save(); rebuildIndex(); render(); } return; }
    if (e.target.closest('.more')) return;
    card.classList.toggle('open');
  });
}
function revealToggle(btn){
  var box = btn.closest('.hidebox'); box.classList.toggle('open');
  btn.textContent = box.classList.contains('open') ? t('hideTrans') : t('showTrans');
}
function statsBar(){
  var due = 0, learned = 0;
  for (var id in S.srs){ if (!ITEMS[id]) continue; if (S.srs[id].due <= Date.now()) due++; if (S.srs[id].int >= 21) learned++; }
  var d = S.days[today()] || { n:0 };
  return '<div class="stats">' +
    '<div class="stat"><b>' + d.n + '/' + S.goal + '</b><span>' + t('todayDone') + '</span></div>' +
    '<div class="stat"><b>' + due + '</b><span>' + t('dueToday') + '</span></div>' +
    '<div class="stat"><b>' + learned + '</b><span>' + t('learned') + '</span></div>' +
    '<div class="stat"><b>🔥' + streak() + '</b><span>' + t('streak') + '</span></div></div>';
}

/* ---------- grammar ---------- */
function grammarCard(it){
  var st = isLearned(it.id) ? '<span class="tag ok">' + t('learned') + '</span>' : (isDue(it.id) ? '<span class="tag due">' + t('dueToday') + '</span>' : '');
  return '<div class="card listitem" data-id="' + esc(it.id) + '">' +
    '<div class="head"><input type="checkbox" class="sel" data-act="sel"' + (S.selected[it.id] ? ' checked' : '') + '>' +
    '<div class="grow"><div class="word" style="font-size:1.25rem">' + esc(it.p) + (S.marked[it.id] ? ' <span style="color:var(--warn);font-size:.9rem">★</span>' : '') + ' ' + st + '</div>' +
    '<div>' + esc(L(it, '')) + '</div></div></div>' +
    '<div class="more">' +
      '<div class="small muted">' + t('form') + '</div><div>' + esc(it.form) + '</div>' +
      '<div class="small muted" style="margin-top:6px">' + t('usage') + '</div><div>' + esc(L(it, 'use')) + '</div>' +
      '<div class="small muted" style="margin-top:6px">' + t('example') + '</div><div class="jp">' + ruby(it.exJa) + '</div>' + hideBox(esc(L(it, 'ex'))) +
      tipBox(it) +
      '<div class="actions">' +
        '<button data-act="speakEx">' + t('speak') + '</button>' +
        '<button data-act="mark" class="' + (S.marked[it.id] ? 'on' : '') + '">' + (S.marked[it.id] ? t('unmark') : t('mark')) + '</button>' +
        '<button data-act="tutor">' + t('askTutor') + '</button>' +
      '</div>' +
    '</div></div>';
}
function renderGrammar(){
  var l = lessonById(ui.gLesson) || GL[0];
  view.innerHTML = statsBar() +
    '<select id="gLesson">' + lessonOptions(GL, l.id) + '</select>' +
    '<div class="row" style="margin:10px 0"><button class="btn primary grow" id="gTest">▶ ' + t('mGrammar') + '</button><button class="btn grow" id="gFlash">' + t('mFlash').split(' (')[0] + '</button></div>' +
    '<div id="gList">' + l.items.map(grammarCard).join('') + '</div>';
  $('gLesson').onchange = function(){ ui.gLesson = this.value; renderGrammar(); };
  $('gTest').onclick = function(){ startSession({ type:'g', mode:'gfill', items:shuffle(l.items) }); };
  $('gFlash').onclick = function(){ startSession({ type:'g', mode:'flash', dir:'ja', items:shuffle(l.items) }); };
  bindItemList($('gList'));
}

/* ---------- reading ---------- */
function renderReading(){
  if (ui.readId){ return renderPassage(DOK.filter(function(d){ return d.id === ui.readId; })[0]); }
  var html = '<h2>' + t('readingList') + '</h2>', lastPart = '';
  DOK.forEach(function(d){
    if (d.part !== lastPart){ html += '<h3 class="muted">' + esc(d.part) + '</h3>'; lastPart = d.part; }
    var done = S.reading[d.id];
    html += '<div class="card listitem" data-open="' + d.id + '"><div class="small muted">' + esc(d.type) + '</div><div style="font-weight:700;line-height:2">' + ruby(d.title) + '</div>' +
      (done ? '<span class="tag ok">' + done.ok + '/' + done.n + '</span>' : '') + '</div>';
  });
  view.innerHTML = html;
  view.querySelectorAll('[data-open]').forEach(function(c){ c.onclick = function(){ ui.readId = c.getAttribute('data-open'); renderReading(); window.scrollTo(0, 0); }; });
}
function renderPassage(d){
  if (!d){ ui.readId = null; return renderReading(); }
  var ans = {};
  var html = '<button class="pill" id="rBack">← ' + t('readingList') + '</button>' +
    '<div class="small muted" style="margin-top:10px">' + esc(d.part) + ' · ' + esc(d.type) + '</div>' +
    '<h2 class="jp" style="margin-top:2px">' + ruby(d.title) + '</h2>' +
    '<div class="card"><div class="jp">' + ruby(d.ja) + '</div>' + hideBox(esc(d[S.lang] || d.vi).replace(/\n/g, '<br>')) +
    '<div class="actions"><button id="rSpeak">' + t('speak') + '</button><button id="rTutor">' + t('askTutor') + '</button></div></div>' +
    (d.tip ? '<div class="tip"><b>💡 ' + t('tip') + ':</b> ' + esc(d.tip[S.lang] || d.tip.vi) + '</div>' : '');
  d.qs.forEach(function(q, qi){
    html += '<div class="card" data-q="' + qi + '"><div class="small muted">' + t('question') + ' ' + (qi + 1) + '</div><div class="jp" style="margin-bottom:8px">' + ruby(q.q) + '</div>' +
      q.opts.map(function(o, oi){ return '<button class="opt" data-o="' + oi + '">' + (oi + 1) + '. ' + ruby(o) + '</button>'; }).join('') +
      '<div class="exp"></div></div>';
  });
  view.innerHTML = html;
  $('rBack').onclick = function(){ ui.readId = null; renderReading(); };
  $('rSpeak').onclick = function(){ speak(d.ja); };
  $('rTutor').onclick = function(){ askTutor('[Bài đọc N1] ' + plain(d.title) + '\n' + plain(d.ja), defaultQ('d')); };
  view.querySelector('.hidebox .reveal').onclick = function(){ revealToggle(this); };
  view.querySelectorAll('[data-q]').forEach(function(card){
    var qi = +card.getAttribute('data-q'), q = d.qs[qi];
    card.querySelectorAll('.opt').forEach(function(b){
      b.onclick = function(){
        if (ans[qi] !== undefined) return;
        var oi = +b.getAttribute('data-o'); ans[qi] = oi;
        var ok = oi === q.a;
        card.querySelectorAll('.opt').forEach(function(x){ var k = +x.getAttribute('data-o'); if (k === q.a) x.classList.add('right'); else if (k === oi) x.classList.add('wrong'); });
        card.querySelector('.exp').innerHTML = '<div class="explain"><div class="verdict ' + (ok ? 'ok' : 'ng') + '">' + (ok ? '✓ ' + t('correct') : '✗ ' + t('wrongA')) + '</div>' +
          '<b>' + t('why') + '</b> ' + esc(q.why[S.lang] || q.why.vi) +
          '<div class="actions"><button data-act="qt">' + t('askTutor') + '</button></div></div>';
        card.querySelector('[data-act="qt"]').onclick = function(){
          askTutor('[Câu hỏi đọc hiểu] Bài: ' + plain(d.title) + '\n' + plain(d.ja) + '\nCâu hỏi: ' + plain(q.q) + '\nLựa chọn: ' + q.opts.map(function(o, i){ return (i + 1) + '. ' + plain(o); }).join(' / ') + '\nĐáp án đúng: ' + (q.a + 1) + '. Mình đã chọn: ' + (oi + 1), defaultQ('q'));
        };
        var r = S.reading[d.id] || { n:0, ok:0 }; r.n++; if (ok) r.ok++; S.reading[d.id] = r;
        logDay(ok); S.log.push({ id:'d_' + d.id + '_' + qi, ok:ok, at:Date.now() }); save();
      };
    });
  });
}

/* ---------- practice config ---------- */
var P = { type:'v', src:'lessons', mode:'flash', count:20, dir:'ja', lessons:{} };
function practicePool(){
  var lessons = P.type === 'v' ? allVocabLessons() : GL;
  var all = []; lessons.forEach(function(l){ all = all.concat(l.items); });
  var pool;
  if (P.src === 'lessons'){ var pick = Object.keys(P.lessons).filter(function(k){ return P.lessons[k]; }); pool = []; lessons.forEach(function(l){ if (pick.indexOf(l.id) >= 0) pool = pool.concat(l.items); }); }
  else if (P.src === 'selected') pool = all.filter(function(i){ return S.selected[i.id]; });
  else if (P.src === 'due') pool = all.filter(function(i){ return isDue(i.id); });
  else if (P.src === 'marked') pool = all.filter(function(i){ return S.marked[i.id]; });
  else if (P.src === 'wrong') pool = all.filter(function(i){ return S.wrong[i.id]; }).sort(function(a, b){ return S.wrong[b.id] - S.wrong[a.id]; });
  else if (P.src === 'new') pool = all.filter(function(i){ return !S.srs[i.id]; });
  return pool || [];
}
function renderPractice(){
  if (ui.practice) return renderSession();
  var lessons = P.type === 'v' ? allVocabLessons() : GL;
  if (!Object.keys(P.lessons).length && lessons[0]) P.lessons[lessons[0].id] = true;
  var modes = P.type === 'v' ? [['flash', t('mFlash')], ['meaning', t('mMeaning')], ['reading', t('mReading')], ['type', t('mType')]] : [['gfill', t('mGrammar')], ['gmean', t('mGMean')], ['flash', t('mFlash')]];
  if (!modes.some(function(m){ return m[0] === P.mode; })) P.mode = modes[0][0];
  var srcs = [['lessons', t('srcLessons')], ['selected', t('srcSelected') + ' (' + Object.keys(S.selected).filter(function(k){ return ITEMS[k] && ITEMS[k].kind === P.type; }).length + ')'], ['due', t('srcDue')], ['marked', t('srcMarked')], ['wrong', t('srcWrong')], ['new', t('srcNew')]];
  var pool = practicePool();
  view.innerHTML = statsBar() +
    '<div class="card"><h3 style="margin-top:0">' + t('pType') + '</h3><div class="chips">' +
      '<button class="pill' + (P.type === 'v' ? ' on' : '') + '" data-type="v">' + t('pVocab') + '</button>' +
      '<button class="pill' + (P.type === 'g' ? ' on' : '') + '" data-type="g">' + t('pGrammar') + '</button></div>' +
    '<h3>' + t('pSource') + '</h3><div class="chips">' + srcs.map(function(s){ return '<button class="pill' + (P.src === s[0] ? ' on' : '') + '" data-src="' + s[0] + '">' + esc(s[1]) + '</button>'; }).join('') + '</div>' +
    (P.src === 'lessons' ? '<div style="margin-top:8px" class="lessonlist">' + lessons.map(function(l){ return '<label class="chk"><input type="checkbox" data-les="' + esc(l.id) + '"' + (P.lessons[l.id] ? ' checked' : '') + '> ' + esc(l.title) + ' <span class="muted">(' + l.items.length + ')</span></label>'; }).join('') + '</div>' : '') +
    (P.src === 'selected' ? '<p class="small muted">☑ ' + (S.lang === 'my' ? 'ဝေါဟာရ/သဒ္ဒါ စာရင်းတွင် စစ်ချင်တဲ့ အရာကို အမှန်ခြစ်ပါ။' : 'Đánh dấu ☑ những từ/mẫu bạn muốn kiểm tra ở tab Từ vựng hoặc Ngữ pháp.') + '</p>' : '') +
    '<h3>' + t('pMode') + '</h3>' + modes.map(function(m){ return '<label class="chk"><input type="radio" name="mode" value="' + m[0] + '"' + (P.mode === m[0] ? ' checked' : '') + '> ' + esc(m[1]) + '</label>'; }).join('') +
    (P.mode === 'flash' ? '<h3>' + t('pDir') + '</h3><div class="chips"><button class="pill' + (P.dir === 'ja' ? ' on' : '') + '" data-dir="ja">' + t('dirJa') + '</button><button class="pill' + (P.dir === 'mean' ? ' on' : '') + '" data-dir="mean">' + t('dirMean') + '</button></div>' : '') +
    '<h3>' + t('pCount') + '</h3><div class="row"><input type="number" id="pCount" min="1" max="' + Math.max(1, pool.length) + '" value="' + Math.min(P.count, Math.max(1, pool.length)) + '" style="max-width:110px">' +
      '<span class="small muted">' + t('poolSize', { n:pool.length }) + '</span></div>' +
    '<div style="height:12px"></div><button class="btn primary block" id="pStart"' + (pool.length ? '' : ' disabled') + '>▶ ' + t('start') + '</button></div>' +
    methodsCard();
  view.querySelectorAll('[data-type]').forEach(function(b){ b.onclick = function(){ P.type = b.getAttribute('data-type'); P.lessons = {}; renderPractice(); }; });
  view.querySelectorAll('[data-src]').forEach(function(b){ b.onclick = function(){ P.src = b.getAttribute('data-src'); renderPractice(); }; });
  view.querySelectorAll('[data-dir]').forEach(function(b){ b.onclick = function(){ P.dir = b.getAttribute('data-dir'); renderPractice(); }; });
  view.querySelectorAll('[data-les]').forEach(function(c){ c.onchange = function(){ P.lessons[c.getAttribute('data-les')] = c.checked; renderPractice(); }; });
  view.querySelectorAll('input[name=mode]').forEach(function(r){ r.onchange = function(){ P.mode = r.value; renderPractice(); }; });
  $('pCount').onchange = function(){ P.count = Math.max(1, parseInt(this.value, 10) || 1); };
  $('pStart').onclick = function(){
    P.count = Math.max(1, parseInt($('pCount').value, 10) || 1);
    var items = P.src === 'wrong' ? pool.slice(0, P.count) : shuffle(pool).slice(0, P.count);
    startSession({ type:P.type, mode:P.mode, dir:P.dir, items:shuffle(items) });
  };
}
function methodsCard(){
  var vi = [
    ['Lặp lại ngắt quãng (SRS)', 'Thẻ bạn nhớ tốt sẽ hiện lại thưa dần (1 → 6 → 15 ngày…), thẻ quên sẽ hiện lại sớm. Mỗi ngày chỉ cần ôn mục "Cần ôn".'],
    ['Chủ động nhớ lại', 'Tự nhớ đáp án trước khi lật thẻ. Bản dịch luôn ẩn để bạn đoán trước — đây là cách ghi nhớ hiệu quả nhất.'],
    ['Học xen kẽ', 'Câu hỏi được xáo trộn giữa nhiều bài, giúp phân biệt các từ/mẫu giống nhau.'],
    ['Học qua ngữ cảnh', 'Mỗi từ đều có câu ví dụ; nghe và đọc to câu ví dụ với nút 🔊.'],
    ['Mẹo nhớ', 'Mẹo phân tích kanji, cặp trái nghĩa, từ dễ nhầm giúp nhớ lâu hơn.'],
    ['Ôn câu sai', 'Mục "Hay làm sai" gom lại các câu bạn sai nhiều nhất để luyện riêng.'],
    ['Thói quen mỗi ngày', 'Đặt mục tiêu số thẻ/ngày và giữ chuỗi 🔥 — học ngắn mỗi ngày tốt hơn học dồn.']
  ];
  var my = [
    ['အချိန်ခြား ပြန်လေ့လာ (SRS)', 'ကောင်းကောင်း မှတ်မိတဲ့ကတ်က ရက်ခြားပြီး ပြန်ပေါ်၊ မေ့တဲ့ကတ်က မကြာခင် ပြန်ပေါ်။ နေ့တိုင်း "ပြန်လေ့လာရန်" ကိုသာ လေ့လာပါ။'],
    ['တက်ကြွစွာ ပြန်သတိရ', 'ကတ်မလှန်ခင် အဖြေကို ကိုယ်တိုင် စဉ်းစားပါ။ ဘာသာပြန်က အမြဲ ဖုံးထားတယ်။'],
    ['ရောနှော လေ့လာ', 'သင်ခန်းစာများစွာက မေးခွန်းတွေကို ရောမွှေထားလို့ ဆင်တူတာတွေကို ခွဲခြားနိုင်တယ်။'],
    ['အကြောင်းအရာမှတဆင့်', 'စကားလုံးတိုင်းမှာ ဥပမာ ပါတယ်။ 🔊 ဖြင့် နားထောင်ပါ။'],
    ['မှတ်နည်း', 'ခန်းဂျီး ခွဲခြမ်းခြင်း၊ ဆန့်ကျင်ဘက်စုံ၊ ရောထွေးလွယ်တာ။'],
    ['မှားတာ ပြန်လေ့ကျင့်', '"မကြာခဏ မှားသော" မှာ အမှားများဆုံးတွေကို စုထားတယ်။'],
    ['နေ့စဉ် အလေ့အထ', 'နေ့စဉ်ပန်းတိုင် သတ်မှတ်ပြီး 🔥 ဆက်တိုက်ရက်ကို ထိန်းပါ။']
  ];
  return '<div class="card flat"><h3 style="margin-top:0">📚 ' + t('methods') + '</h3>' + (S.lang === 'my' ? my : vi).map(function(m){ return '<div style="margin-bottom:6px"><b>' + esc(m[0]) + '</b><div class="small muted">' + esc(m[1]) + '</div></div>'; }).join('') + '</div>';
}

/* ---------- practice session ---------- */
function startSession(cfg){
  ui.practice = { cfg:cfg, queue:cfg.items.slice(), idx:0, done:0, ok:0, wrongs:[], flipped:false, answered:false, total:cfg.items.length };
  if (curTab !== 'practice') switchTab('practice'); else renderSession();
}
function curItem(){ var p = ui.practice; return p.queue[p.idx]; }
function distractors(it, n, keyFn){
  var same = (lessonById(it.lesson) || { items:[] }).items.filter(function(x){ return x.id !== it.id; });
  var pool = it.kind === 'v' ? vocabPool('__all') : (function(){ var a = []; GL.forEach(function(l){ a = a.concat(l.items); }); return a; })();
  var cand = shuffle(same).concat(shuffle(pool.filter(function(x){ return x.id !== it.id; })));
  var out = [], seen = {}; seen[keyFn(it)] = 1;
  for (var i = 0; i < cand.length && out.length < n; i++){ var k = keyFn(cand[i]); if (!k || seen[k]) continue; seen[k] = 1; out.push(cand[i]); }
  return out;
}
function renderSession(){
  var p = ui.practice;
  if (p.idx >= p.queue.length) return renderSummary();
  var it = curItem(), cfg = p.cfg;
  var pct = Math.round(p.done / Math.max(1, p.total) * 100);
  var head = '<div class="row"><span class="small muted grow">' + (p.done + 1 > p.total ? p.total : p.done + 1) + ' / ' + p.total + '</span><button class="pill" id="sQuit">' + t('quit') + '</button></div><div class="progress"><i style="width:' + pct + '%"></i></div>';
  if (cfg.mode === 'flash') return renderFlash(head, it, cfg);
  if (cfg.mode === 'gfill') return renderGFill(head, it);
  if (cfg.mode === 'type') return renderType(head, it);
  return renderMC(head, it, cfg.mode);
}
function bindQuit(){ $('sQuit').onclick = function(){ ui.practice = null; renderPractice(); }; }
function backSide(it){
  if (it.kind === 'v'){
    return '<div class="word">' + wordRuby(it.w, it.r) + '</div><div class="muted">' + esc(it.r) + '</div>' +
      '<div style="font-size:1.1rem;margin:6px 0">' + esc(L(it, '')) + '</div>' +
      (it.exJa ? '<div class="jp" style="text-align:left">' + ruby(it.exJa) + '</div>' + hideBox(esc(L(it, 'ex'))) : '') + tipBox(it);
  }
  return '<div class="word" style="font-size:1.3rem">' + esc(it.p) + '</div><div style="font-size:1.05rem;margin:6px 0">' + esc(L(it, '')) + '</div>' +
    '<div class="small muted" style="text-align:left">' + t('form') + ': ' + esc(it.form) + '</div>' +
    '<div class="small" style="text-align:left;margin-top:4px">' + esc(L(it, 'use')) + '</div>' +
    '<div class="jp" style="text-align:left">' + ruby(it.exJa) + '</div>' + hideBox(esc(L(it, 'ex'))) + tipBox(it);
}
function renderFlash(head, it, cfg){
  var p = ui.practice;
  var front = it.kind === 'v'
    ? (cfg.dir === 'ja' ? '<div class="front">' + wordRuby(it.w, it.r) + '</div>' : '<div class="front" style="font-size:1.4rem">' + esc(L(it, '')) + '</div>')
    : (cfg.dir === 'ja' ? '<div class="front" style="font-size:1.6rem">' + esc(it.p) + '</div>' : '<div class="front" style="font-size:1.3rem">' + esc(L(it, '')) + '</div>');
  view.innerHTML = head +
    '<div class="card flash" id="fCard">' + (p.flipped ? '<div style="width:100%">' + backSide(it) + '</div>' : front + '<div class="hint">' + t('tapFlip') + '</div>') + '</div>' +
    (p.flipped ? '<div class="srsbtns">' +
      '<button class="btn bad" data-q="0">' + t('again') + '<small>' + nextLabel(it.id, 0) + '</small></button>' +
      '<button class="btn warn" data-q="3">' + t('hard') + '<small>' + nextLabel(it.id, 3) + '</small></button>' +
      '<button class="btn good" data-q="4">' + t('good') + '<small>' + nextLabel(it.id, 4) + '</small></button>' +
      '<button class="btn primary" data-q="5">' + t('easy') + '<small>' + nextLabel(it.id, 5) + '</small></button></div>' +
      '<div class="actions"><button id="fSpeak">' + t('speak') + '</button><button id="fTutor">' + t('askTutor') + '</button></div>' : '');
  bindQuit();
  $('fCard').onclick = function(e){
    if (e.target.closest('.hidebox')){ if (e.target.getAttribute('data-act') === 'reveal') revealToggle(e.target); return; }
    if (!p.flipped){ p.flipped = true; renderSession(); if (it.kind === 'v') speak(it.w); }
  };
  if (p.flipped){
    view.querySelectorAll('[data-q]').forEach(function(b){ b.onclick = function(){
      var q = +b.getAttribute('data-q');
      grade(it.id, q);
      if (q < 3){ p.queue.push(it); p.wrongs.push(it); } else { p.ok++; p.done++; }
      p.idx++; p.flipped = false; renderSession();
    }; });
    $('fSpeak').onclick = function(){ speak(it.kind === 'v' ? it.w : it.exJa); };
    $('fTutor').onclick = function(){ askTutor(ctxOfItem(it), defaultQ(it.kind)); };
  }
}
function finishAnswer(it, ok, explainHtml, ctx){
  var p = ui.practice;
  p.answered = true; p.done++;
  if (ok) p.ok++; else p.wrongs.push(it);
  recordAnswer(it.id, ok);
  $('sExp').innerHTML = '<div class="explain"><div class="verdict ' + (ok ? 'ok' : 'ng') + '">' + (ok ? '✓ ' + t('correct') : '✗ ' + t('wrongA')) + '</div>' + explainHtml +
    '<div class="actions"><button id="sTutor">' + t('askTutor') + '</button></div></div>' +
    '<button class="btn primary block" style="margin-top:10px" id="sNext">' + (p.idx + 1 >= p.queue.length ? t('finish') : t('next')) + '</button>';
  $('sTutor').onclick = function(){ askTutor(ctx, defaultQ('q')); };
  $('sNext').onclick = function(){ p.idx++; p.answered = false; renderSession(); };
  $('sNext').scrollIntoView({ behavior:'smooth', block:'nearest' });
}
function renderMC(head, it, mode){
  var key, prompt, optHtml, opts;
  if (mode === 'meaning'){
    key = function(x){ return L(x, ''); };
    prompt = '<div class="front" style="text-align:center">' + wordRuby(it.w, it.r) + '</div>';
    opts = shuffle([it].concat(distractors(it, 3, key)));
    optHtml = function(x){ return esc(key(x)); };
  } else if (mode === 'reading'){
    key = function(x){ return x.r; };
    prompt = '<div class="front" style="text-align:center">' + esc(it.w) + '</div><div class="muted small" style="text-align:center">' + esc(L(it, '')) + '</div>';
    opts = shuffle([it].concat(distractors(it, 3, key)));
    optHtml = function(x){ return esc(x.r); };
  } else { // gmean
    key = function(x){ return L(x, ''); };
    prompt = '<div class="front" style="text-align:center;font-size:1.5rem">' + esc(it.p) + '</div>';
    opts = shuffle([it].concat(distractors(it, 3, key)));
    optHtml = function(x){ return esc(key(x)); };
  }
  view.innerHTML = head + '<div class="card">' + prompt + '</div><div id="sOpts">' +
    opts.map(function(o, i){ return '<button class="opt" data-i="' + i + '">' + optHtml(o) + '</button>'; }).join('') + '</div><div id="sExp"></div>';
  bindQuit();
  view.querySelectorAll('#sOpts .opt').forEach(function(b){ b.onclick = function(){
    if (ui.practice.answered) return;
    var ch = opts[+b.getAttribute('data-i')], ok = ch.id === it.id;
    view.querySelectorAll('#sOpts .opt').forEach(function(x){ var o = opts[+x.getAttribute('data-i')]; if (o.id === it.id) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
    var name = function(x){ return x.kind === 'v' ? x.w + '（' + x.r + '）' : x.p; };
    var exp = '<b>' + t('answerIs') + ':</b> ' + esc(name(it)) + ' = ' + esc(L(it, '')) +
      (it.kind === 'g' ? '<div class="small">' + esc(L(it, 'use')) + '</div>' : '');
    if (!ok) exp += '<div style="margin-top:6px"><b>' + t('youChose') + ':</b> ' + esc(optHtml(ch).replace(/&amp;/g, '&')) + ' → ' + esc(name(ch)) + ' = ' + esc(L(ch, '')) + '</div>';
    if (it.exJa) exp += '<div class="jp" style="margin-top:6px">' + ruby(it.exJa) + '</div>' + hideBox(esc(L(it, 'ex')));
    exp += tipBox(it);
    var ctx = ctxOfItem(it) + '\nDạng câu hỏi: ' + mode + '. Các lựa chọn: ' + opts.map(function(o){ return name(o) + ' (' + o.vi + ')'; }).join(' / ') + '. Mình đã chọn: ' + name(ch);
    finishAnswer(it, ok, exp, ctx);
  }; });
}
function gfillParts(it){
  var m = it.exJa.match(/【([^】]*)】/);
  return m ? m[1] : '';
}
function renderGFill(head, it){
  var ans = gfillParts(it);
  var sentence = ruby(it.exJa.replace(/【[^】]*】/, '【＿＿＿＿】'));
  var others = distractors(it, 6, function(x){ return gfillParts(x); }).filter(function(x){ return gfillParts(x) && gfillParts(x) !== ans; }).slice(0, 3);
  var opts = shuffle([it].concat(others));
  view.innerHTML = head + '<div class="card"><div class="small muted">' + t('mGrammar') + '</div><div class="jp" style="font-size:1.15rem">' + sentence + '</div>' + hideBox(esc(L(it, 'ex'))) + '</div>' +
    '<div id="sOpts">' + opts.map(function(o, i){ return '<button class="opt" data-i="' + i + '">' + ruby(gfillParts(o)) + '</button>'; }).join('') + '</div><div id="sExp"></div>';
  bindQuit();
  view.querySelector('.hidebox .reveal').onclick = function(){ revealToggle(this); };
  view.querySelectorAll('#sOpts .opt').forEach(function(b){ b.onclick = function(){
    if (ui.practice.answered) return;
    var ch = opts[+b.getAttribute('data-i')], ok = ch.id === it.id || plain(gfillParts(ch)) === plain(ans);
    view.querySelectorAll('#sOpts .opt').forEach(function(x){ var o = opts[+x.getAttribute('data-i')]; if (o.id === it.id) x.classList.add('right'); else if (x === b && !ok) x.classList.add('wrong'); });
    var exp = '<div class="jp">' + ruby(it.exJa) + '</div>' +
      '<b>' + t('answerIs') + ': ' + esc(it.p) + '</b> — ' + esc(L(it, '')) +
      '<div class="small">' + esc(L(it, 'use')) + '</div><div class="small muted">' + t('form') + ': ' + esc(it.form) + '</div>';
    if (!ok) exp += '<div style="margin-top:8px"><b>' + t('youChose') + ': ' + esc(ch.p) + '</b> — ' + esc(L(ch, '')) + '<div class="small">' + esc(L(ch, 'use')) + '</div></div>';
    exp += tipBox(it);
    var ctx = '[Câu điền ngữ pháp N2] ' + plain(it.exJa.replace(/【[^】]*】/, '（　　）')) + '\nCác lựa chọn: ' + opts.map(function(o){ return plain(gfillParts(o)) + ' (' + o.p + ': ' + o.vi + ')'; }).join(' / ') + '\nĐáp án đúng: ' + plain(ans) + ' (' + it.p + '). Mình đã chọn: ' + plain(gfillParts(ch));
    finishAnswer(it, ok, exp, ctx);
  }; });
}
function renderType(head, it){
  view.innerHTML = head + '<div class="card" style="text-align:center"><div class="front" style="font-size:2rem;font-weight:700">' + esc(it.w) + '</div><div class="muted">' + esc(L(it, '')) + '</div></div>' +
    '<div class="row"><input type="text" id="tIn" class="grow" placeholder="' + esc(t('typeHere')) + '" autocomplete="off" autocapitalize="off" lang="ja"><button class="btn primary" id="tGo">' + t('check') + '</button></div><div id="sExp"></div>';
  bindQuit();
  var go = function(){
    if (ui.practice.answered) return;
    var v = toHira($('tIn').value.trim()).replace(/\s/g, '');
    if (!v) return;
    var ok = v === toHira(it.r);
    var exp = '<div class="word">' + wordRuby(it.w, it.r) + '</div><b>' + t('answerIs') + ':</b> ' + esc(it.r) + (ok ? '' : '<div>' + t('youChose') + ': ' + esc(v) + '</div>') +
      (it.exJa ? '<div class="jp">' + ruby(it.exJa) + '</div>' + hideBox(esc(L(it, 'ex'))) : '') + tipBox(it);
    finishAnswer(it, ok, exp, ctxOfItem(it) + '\nMình gõ cách đọc là: ' + v);
  };
  $('tGo').onclick = go;
  $('tIn').addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.isComposing) go(); });
  $('tIn').focus();
}
function renderSummary(){
  var p = ui.practice;
  var uniqWrong = []; var seen = {};
  p.wrongs.forEach(function(w){ if (!seen[w.id]){ seen[w.id] = 1; uniqWrong.push(w); } });
  view.innerHTML = '<div class="card" style="text-align:center"><h2>' + t('result') + '</h2><div style="font-size:2.2rem;font-weight:800">' + t('score', { a:p.ok, b:p.total }) + '</div>' +
    '<div class="progress"><i style="width:' + Math.round(p.ok / Math.max(1, p.total) * 100) + '%"></i></div>' +
    '<div class="small muted">' + (cloud.user ? '☁ ' + t('syncOk') : t('notLogged')) + '</div></div>' +
    (uniqWrong.length ? '<h3>✗ (' + uniqWrong.length + ')</h3>' + uniqWrong.map(function(w){ return '<div class="card small"><b>' + (w.kind === 'v' ? wordRuby(w.w, w.r) : esc(w.p)) + '</b> — ' + esc(L(w, '')) + '</div>'; }).join('') : '') +
    '<div class="row">' + (uniqWrong.length ? '<button class="btn warn grow" id="sRetry">' + t('reviewWrong') + '</button>' : '') + '<button class="btn grow" id="sHome">' + t('backHome') + '</button></div>';
  if (uniqWrong.length) $('sRetry').onclick = function(){ startSession({ type:p.cfg.type, mode:p.cfg.mode, dir:p.cfg.dir, items:shuffle(uniqWrong) }); };
  $('sHome').onclick = function(){ ui.practice = null; renderPractice(); };
  cloudPush();
}

/* ---------- tutor tab ---------- */
function removeChatbar(){ var b = $('chatbar'); if (b) b.remove(); }
function renderTutor(){
  var code = tutorCode();
  var html = '<div class="row"><h2 class="grow" style="margin:6px 0">🎓 ' + t('tutorTitle') + '</h2>' + (chat.length ? '<button class="pill" id="cClear">' + t('clearChat') + '</button>' : '') + '</div>';
  if (!code){
    html += '<div class="card">' + esc(t('tutorNoKey')) + '<div style="height:10px"></div><button class="btn primary" id="cGo">⚙ ' + t('tutorCode') + '</button></div>';
    view.innerHTML = html;
    $('cGo').onclick = openSettings;
    if ($('cClear')) $('cClear').onclick = function(){ chat = []; saveChat(); renderTutor(); };
    return;
  }
  html += '<div class="chat" id="chatBox"><div class="msg ai">' + esc(t('tutorHello')) + '</div>' +
    chat.map(function(m){ return m.role === 'ctx' ? '<div class="msg ctx">📎 ' + esc(m.content) + '</div>' : '<div class="msg ' + (m.role === 'user' ? 'me' : 'ai') + '">' + (m.role === 'user' ? esc(m.content) : mdLite(m.content)) + '</div>'; }).join('') +
    '</div>' + (pendingCtx ? '<div class="msg ctx" style="margin-top:8px">📎 ' + t('context') + ':<br>' + esc(pendingCtx).replace(/\n/g, '<br>') + ' <button class="pill" id="cCtxX">✕</button></div>' : '') +
    '<div style="height:140px"></div>';
  view.innerHTML = html;
  if ($('cClear')) $('cClear').onclick = function(){ chat = []; saveChat(); renderTutor(); };
  if ($('cCtxX')) $('cCtxX').onclick = function(){ pendingCtx = ''; renderTutor(); };
  var bar = h('<div class="chatbar" id="chatbar"><div class="inner"><textarea id="chatInput" class="grow" rows="1" placeholder="' + esc(t('tutorPh')) + '"></textarea><button class="btn primary" id="cSend">' + t('send') + '</button></div></div>');
  document.body.appendChild(bar);
  $('cSend').onclick = sendChat;
  window.scrollTo(0, document.body.scrollHeight);
}
function sendChat(){
  var ta = $('chatInput'), txt = ta.value.trim();
  if (!txt) return;
  if (!tutorCode()){ toast(t('tutorNoKey'), true); return; }
  var ctx = pendingCtx; pendingCtx = '';
  if (ctx) chat.push({ role:'ctx', content:ctx });
  chat.push({ role:'user', content:(ctx ? '' : '') + txt });
  saveChat(); renderTutor();
  var box = $('chatBox');
  var wait = h('<div class="msg ai"><span class="spinner"></span> ' + esc(t('thinking')) + '…</div>'); box.appendChild(wait);
  window.scrollTo(0, document.body.scrollHeight);
  $('cSend').disabled = true;
  callTutor(txt, ctx).then(function(ans){
    chat.push({ role:'assistant', content:ans || '…' }); saveChat();
    if (curTab === 'tutor') renderTutor();
  }).catch(function(e){
    var msg = e.message === 'Failed to fetch' ? (S.lang === 'my' ? 'ချိတ်ဆက်၍ မရပါ (အင်တာနက် စစ်ပါ)' : 'Không kết nối được tới gia sư (kiểm tra mạng)') : e.message;
    chat.push({ role:'assistant', content:'⚠ ' + msg }); saveChat();
    if (curTab === 'tutor') renderTutor();
  });
}

/* ---------- settings ---------- */
function openSheet(html){ $('sheet').innerHTML = html; $('overlay').classList.add('show'); }
function closeSheet(){ $('overlay').classList.remove('show'); }
$('overlay').addEventListener('click', function(e){ if (e.target === this) closeSheet(); });
function openSettings(){
  var code = tutorCode();
  openSheet('<div class="row"><h2 class="grow" style="margin:0">⚙ ' + t('settings') + '</h2><button class="iconbtn" id="xClose">✕</button></div>' +
    '<h3>' + t('language') + '</h3><div class="chips"><button class="pill' + (S.lang === 'vi' ? ' on' : '') + '" data-l="vi">Tiếng Việt</button><button class="pill' + (S.lang === 'my' ? ' on' : '') + '" data-l="my">မြန်မာ</button></div>' +
    '<h3>ふりがな</h3><label class="chk"><input type="checkbox" id="xFuri"' + (S.furi ? ' checked' : '') + '> ' + t('furigana') + '</label>' +
    '<h3>' + t('dailyGoal') + '</h3><input type="number" id="xGoal" min="5" max="500" value="' + S.goal + '" style="max-width:120px">' +
    '<h3>🎓 ' + t('tutorCode') + '</h3><div class="small muted">' + esc(t('tutorCodeHelp')) + '</div>' +
    '<div class="small" style="margin:6px 0;color:' + (code ? 'var(--good)' : 'var(--warn)') + '">' + (code ? '● ' + t('codeOn') + ' (••••' + esc(code.slice(-4)) + ')' : '○ ' + t('codeOff')) + '</div>' +
    '<div class="row"><input type="password" id="xCode" class="grow" placeholder="' + esc(t('tutorCode')) + '" autocomplete="off"><button class="btn primary" id="xCodeSave">' + t('save') + '</button></div>' +
    (code ? '<button class="btn bad" style="margin-top:8px" id="xCodeDel">' + t('del') + '</button>' : '') +
    '<h3>☁ ' + t('account') + '</h3><div class="small">' + (cloud.user ? esc(t('loggedAs', { e:cloud.user.email })) : esc(t('notLogged'))) + '</div>' +
    (cloud.lastErr ? '<div class="small" style="color:var(--bad)">' + esc(t('syncErr', { e:cloud.lastErr })) + '</div>' : '') +
    '<div style="margin-top:6px">' + (cloud.user ? '<button class="btn" id="xLogout">' + t('logout') + '</button>' : '<button class="btn primary" id="xLogin">' + t('loginNow') + '</button>') + '</div>' +
    '<h3>💾 ' + t('backup') + '</h3><div class="row"><button class="btn" id="xExport">' + t('exportJ') + '</button><label class="btn" style="cursor:pointer">' + t('importJ') + '<input type="file" id="xImport" accept=".json,application/json" class="hidden"></label></div>' +
    '<button class="btn bad" style="margin-top:10px" id="xReset">' + t('resetP') + '</button>');
  $('xClose').onclick = closeSheet;
  document.querySelectorAll('#sheet [data-l]').forEach(function(b){ b.onclick = function(){ S.lang = b.getAttribute('data-l'); save(); applyPrefs(); render(); openSettings(); }; });
  $('xFuri').onchange = function(){ S.furi = this.checked; save(); applyPrefs(); };
  $('xGoal').onchange = function(){ S.goal = Math.max(5, parseInt(this.value, 10) || 20); save(); render(); };
  $('xCodeSave').onclick = function(){
    var v = $('xCode').value.trim(); if (!v) return;
    try { localStorage.setItem(KEY_CODE, v); } catch(e){}
    toast(t('codeSaved')); openSettings(); if (curTab === 'tutor') render();
  };
  if ($('xCodeDel')) $('xCodeDel').onclick = function(){
    try { localStorage.removeItem(KEY_CODE); } catch(e){}
    toast(t('codeDeleted')); openSettings(); if (curTab === 'tutor') render();
  };
  if ($('xLogout')) $('xLogout').onclick = function(){ cloud.auth.signOut(); sessionStorage.removeItem('nh_skip'); closeSheet(); };
  if ($('xLogin')) $('xLogin').onclick = function(){ sessionStorage.removeItem('nh_skip'); closeSheet(); $('gate').classList.add('show'); };
  $('xExport').onclick = function(){
    var blob = new Blob([JSON.stringify(S, null, 1)], { type:'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nihongo-backup-' + today() + '.json'; a.click();
  };
  $('xImport').onchange = function(){
    var f = this.files[0]; if (!f) return;
    f.text().then(function(txt){ var d = JSON.parse(txt); if (!d || typeof d !== 'object') throw 0; S = d; for (var k in defaults) if (!(k in S)) S[k] = JSON.parse(JSON.stringify(defaults[k])); save(); rebuildIndex(); applyPrefs(); render(); closeSheet(); toast('✓'); })
      .catch(function(){ toast('✗', true); });
  };
  $('xReset').onclick = function(){
    if (!confirm(t('confirmReset'))) return;
    var keep = { lang:S.lang, furi:S.furi, goal:S.goal, custom:S.custom };
    S = JSON.parse(JSON.stringify(defaults)); S.lang = keep.lang; S.furi = keep.furi; S.goal = keep.goal; S.custom = keep.custom;
    save(); render(); closeSheet();
  };
}

/* ---------- import (camera / OCR) ---------- */
var IMP = { rows:[], text:'' };
function openImport(){
  IMP = { rows:[], text:'' };
  openSheet('<div class="row"><h2 class="grow" style="margin:0">📷 ' + t('imp') + '</h2><button class="iconbtn" id="iClose">✕</button></div>' +
    '<p class="small muted">' + esc(t('impHelp')) + '</p>' +
    '<div class="row">' +
      '<label class="btn primary grow" style="text-align:center;cursor:pointer">' + t('camera') + '<input type="file" id="iCam" accept="image/*" capture="environment" class="hidden"></label>' +
      '<label class="btn grow" style="text-align:center;cursor:pointer">' + t('gallery') + '<input type="file" id="iGal" accept="image/*" multiple class="hidden"></label>' +
    '</div>' +
    '<div id="iStatus" class="small muted" style="margin:8px 0"></div>' +
    '<h3>' + t('rawText') + '</h3><textarea id="iText" rows="6" placeholder="親戚　しんせき　họ hàng&#10;祖先（そせん）tổ tiên"></textarea>' +
    '<button class="btn block" id="iParse" style="margin-top:8px">↓ ' + t('parse') + '</button>' +
    '<div id="iRows"></div>');
  $('iClose').onclick = closeSheet;
  $('iCam').onchange = function(){ ocrFiles(this.files); };
  $('iGal').onchange = function(){ ocrFiles(this.files); };
  $('iParse').onclick = function(){ IMP.rows = parseImportText($('iText').value); renderImportRows(); };
}
var ocrWorker = null;
function ensureTesseract(cb){
  if (window.Tesseract) return cb();
  loadScripts(['https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'], function(err){ if (err) { $('iStatus').textContent = 'OCR: ' + err.message; return; } cb(); });
}
function ocrFiles(files){
  if (!files || !files.length) return;
  var list = Array.prototype.slice.call(files);
  $('iStatus').innerHTML = '<span class="spinner"></span> ' + esc(t('ocrRunning', { p:0 }));
  ensureTesseract(function(){
    var p = ocrWorker ? Promise.resolve(ocrWorker) : Tesseract.createWorker(['jpn', 'eng'], 1, {
      logger:function(m){ if (m.status === 'recognizing text') $('iStatus').innerHTML = '<span class="spinner"></span> ' + esc(t('ocrRunning', { p:Math.round(m.progress * 100) })); }
    }).then(function(w){ ocrWorker = w; return w; });
    p.then(function(w){
      var out = [];
      var step = function(i){
        if (i >= list.length){
          var txt = out.join('\n').replace(/([぀-ヿ一-鿿])\s+(?=[぀-ヿ一-鿿])/g, '$1');
          $('iText').value = ($('iText').value ? $('iText').value + '\n' : '') + txt;
          $('iStatus').textContent = '✓ ' + t('ocrDone');
          IMP.rows = parseImportText($('iText').value); renderImportRows();
          return;
        }
        w.recognize(list[i]).then(function(r){ out.push(r.data.text); step(i + 1); }).catch(function(e){ $('iStatus').textContent = 'OCR: ' + (e.message || e); });
      };
      step(0);
    }).catch(function(e){ $('iStatus').textContent = 'OCR: ' + (e.message || e); });
  });
}
function parseImportText(txt){
  var rows = [];
  var reJa = /[぀-ヿ一-鿿々]/;
  txt.split(/\n+/).forEach(function(line){
    line = line.replace(/^[\s\d０-９①-⑳.．、・\-•*]+/, '').trim();
    if (!line || !reJa.test(line)) return;
    var w = '', r = '', mean = '', m;
    var parts = line.split(/\t|\s*[|｜;；]\s*|\s*,\s*(?=\S)/).filter(Boolean);
    if (parts.length >= 2 && reJa.test(parts[0])){
      w = parts[0]; var rest = parts.slice(1);
      if (rest[0] && /^[ぁ-ゖァ-ヺー]+$/.test(rest[0])){ r = rest.shift(); }
      mean = rest.join(' ');
    } else if ((m = line.match(/^(\S+?)\s*[（(]([ぁ-ゖァ-ヺー]+)[）)]\s*(.*)$/))){ w = m[1]; r = m[2]; mean = m[3]; }
    else if ((m = line.match(/^(\S+)[\s　]+([ぁ-ゖァ-ヺー]+)(?:[\s　]+(.*))?$/))){ w = m[1]; r = m[2]; mean = m[3] || ''; }
    else if ((m = line.match(/^([^\s　]+)[\s　]+(.+)$/)) && !reJa.test(m[2])){ w = m[1]; mean = m[2]; }
    else { w = line.split(/[\s　]/)[0]; }
    w = w.replace(/[「」『』:：=＝]/g, '').trim();
    if (!w || w.length > 20) return;
    if (!r && /^[ぁ-ゖー]+$/.test(w)) r = w;
    rows.push({ w:w, r:toHira(r), vi:mean.trim(), my:'', on:true });
  });
  return rows;
}
function isDup(row){
  var w = row.w.trim(), r = toHira(row.r.trim());
  for (var id in ITEMS){ var it = ITEMS[id]; if (it.kind !== 'v') continue; if (it.w === w && (!r || !it.r || toHira(it.r) === r)) return it; }
  return null;
}
function renderImportRows(){
  var box = $('iRows'); if (!box) return;
  var def = (S.lang === 'my' ? 'ထည့်သွင်း ' : 'Nạp ') + today();
  box.innerHTML = (IMP.rows.length ? '' : '<div class="empty small">' + t('noItems') + '</div>') +
    '<h3>' + t('lessonName') + '</h3><input type="text" id="iLesson" value="' + esc(IMP.lesson || def) + '">' +
    '<div style="overflow:auto;margin-top:8px"><table class="imp"><tr class="small muted"><td></td><td>' + t('colWord') + '</td><td>' + t('colRead') + '</td><td>' + t('colVi') + '</td><td>' + t('colMy') + '</td></tr>' +
    IMP.rows.map(function(rw, i){ var d = isDup(rw);
      return '<tr class="' + (d ? 'dup' : '') + '"><td><input type="checkbox" data-i="' + i + '" data-f="on"' + (rw.on ? ' checked' : '') + '></td>' +
        '<td><input data-i="' + i + '" data-f="w" value="' + esc(rw.w) + '" style="min-width:80px">' + (d ? '<span class="tag due">' + t('dupMark') + '</span>' : '') + '</td>' +
        '<td><input data-i="' + i + '" data-f="r" value="' + esc(rw.r) + '" style="min-width:80px"></td>' +
        '<td><input data-i="' + i + '" data-f="vi" value="' + esc(rw.vi) + '" style="min-width:100px"></td>' +
        '<td><input data-i="' + i + '" data-f="my" value="' + esc(rw.my) + '" style="min-width:100px"></td></tr>'; }).join('') +
    '</table></div>' +
    '<div class="row" style="margin-top:8px"><button class="pill" id="iAdd">' + t('addRow') + '</button><button class="pill" id="iRead">' + t('autoRead') + '</button>' + (tutorCode() ? '<button class="pill on" id="iFill">🎓 ' + t('autoFill') + '</button>' : '') + '</div>' +
    '<div id="iMsg" class="small muted" style="margin-top:6px"></div>' +
    '<button class="btn primary block" style="margin-top:10px" id="iCommit">✓ ' + t('addToApp') + '</button>';
  box.querySelectorAll('input[data-i]').forEach(function(inp){
    inp.oninput = inp.onchange = function(){ var rw = IMP.rows[+inp.getAttribute('data-i')], f = inp.getAttribute('data-f'); rw[f] = f === 'on' ? inp.checked : inp.value; };
  });
  $('iLesson').oninput = function(){ IMP.lesson = this.value; };
  $('iAdd').onclick = function(){ IMP.rows.push({ w:'', r:'', vi:'', my:'', on:true }); renderImportRows(); };
  $('iRead').onclick = autoReadings;
  if ($('iFill')) $('iFill').onclick = tutorFill;
  $('iCommit').onclick = commitImport;
}
var kuro = null;
function autoReadings(){
  var need = IMP.rows.filter(function(r){ return r.w && !r.r; });
  if (!need.length){ return; }
  var go = function(){
    need.forEach(function(r){ r.r = toHira(kuro.tokenize(r.w).map(function(tk){ return tk.reading || tk.surface_form; }).join('')); });
    renderImportRows();
  };
  if (kuro) return go();
  $('iMsg').innerHTML = '<span class="spinner"></span> ' + esc(t('loadingDict'));
  loadScripts(['https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js'], function(err){
    if (err || !window.kuromoji){ $('iMsg').textContent = '✗ kuromoji'; return; }
    kuromoji.builder({ dicPath:'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/' }).build(function(e, tk){
      if (e){ $('iMsg').textContent = '✗ ' + e; return; }
      kuro = tk; go();
    });
  });
}
function tutorFill(){
  var rows = IMP.rows.filter(function(r){ return r.w; });
  if (!rows.length) return;
  $('iMsg').innerHTML = '<span class="spinner"></span> ' + esc(t('thinking'));
  var prompt = 'Với mỗi từ tiếng Nhật sau, trả về JSON array, mỗi phần tử {"w":từ,"r":cách đọc hiragana,"vi":nghĩa tiếng Việt ngắn,"my":nghĩa tiếng Myanmar ngắn,"exJa":một câu ví dụ N2 ngắn,"exVi":dịch tiếng Việt,"exMy":dịch tiếng Myanmar}. Chỉ trả JSON, không giải thích.\n' + rows.map(function(r){ return r.w; }).join('\n');
  fetch('https://api.deepseek.com/chat/completions', {
    method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + tutorCode() },
    body: JSON.stringify({ model:'deepseek-chat', temperature:0.2, messages:[{ role:'user', content:prompt }] })
  }).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function(j){
    var txt = j.choices[0].message.content; var s = txt.indexOf('['), e = txt.lastIndexOf(']');
    var arr = JSON.parse(txt.slice(s, e + 1));
    arr.forEach(function(a){ IMP.rows.forEach(function(r){ if (r.w === a.w){ r.r = r.r || toHira(a.r || ''); r.vi = r.vi || a.vi || ''; r.my = r.my || a.my || ''; r.exJa = a.exJa; r.exVi = a.exVi; r.exMy = a.exMy; } }); });
    renderImportRows();
  }).catch(function(e){ $('iMsg').textContent = '✗ ' + e.message; });
}
function commitImport(){
  var lesson = ($('iLesson').value || '').trim() || ('Nạp ' + today());
  var rows = IMP.rows.filter(function(r){ return r.on && r.w.trim(); });
  if (!rows.length){ toast(t('nothing'), true); return; }
  // also detect duplicates inside the batch itself
  var seen = {}, dups = [], fresh = [];
  rows.forEach(function(r){ var k = r.w.trim() + '|' + toHira(r.r.trim()); if (isDup(r) || seen[k]) dups.push(r); else fresh.push(r); seen[k] = 1; });
  var doAdd = function(list){
    var now = Date.now();
    list.forEach(function(r, i){
      S.custom.push({ id:'c_' + now + '_' + i, lesson:lesson, w:r.w.trim(), r:toHira(r.r.trim()), vi:r.vi.trim(), my:r.my.trim(), exJa:r.exJa || '', exVi:r.exVi || '', exMy:r.exMy || '', tipVi:'', tipMy:'', added:now });
    });
    save(); rebuildIndex();
    toast(t('added', { n:list.length, l:lesson }));
    closeSheet(); ui.vLesson = lesson; ui.vSearch = ''; if (curTab === 'vocab') renderVocab();
  };
  if (!dups.length) return doAdd(fresh);
  openSheet('<h2 style="margin-top:0">⚠ ' + t('dupTitle') + '</h2><p>' + esc(t('dupMsg', { n:dups.length })) + '</p>' +
    '<div class="card small">' + dups.map(function(d){ return esc(d.w) + (d.r ? '（' + esc(d.r) + '）' : ''); }).join('、') + '</div>' +
    '<button class="btn primary block" id="dSkip"' + (fresh.length ? '' : ' disabled') + '>' + esc(t('dupSkip', { m:fresh.length })) + '</button><div style="height:8px"></div>' +
    '<button class="btn warn block" id="dAll">' + t('dupAddAll') + '</button><div style="height:8px"></div>' +
    '<button class="btn block" id="dCancel">' + t('cancel') + '</button>');
  $('dSkip').onclick = function(){ doAdd(fresh); };
  $('dAll').onclick = function(){ doAdd(fresh.concat(dups)); };
  $('dCancel').onclick = function(){ var keep = IMP; openImport(); IMP = keep; $('iText').value = ''; renderImportRows(); };
}

/* ======================= boot ======================= */
document.querySelectorAll('#tabs button').forEach(function(b){ b.onclick = function(){ if (b.getAttribute('data-tab') === 'practice' && curTab === 'practice' && ui.practice){} switchTab(b.getAttribute('data-tab')); }; });
$('btnLang').onclick = function(){ S.lang = S.lang === 'vi' ? 'my' : 'vi'; save(); applyPrefs(); render(); };
$('btnFuri').onclick = function(){ S.furi = !S.furi; save(); applyPrefs(); };
$('btnSettings').onclick = openSettings;
bindGate();
applyPrefs();
switchTab('vocab');
if (location.protocol !== 'file:' || /firebase=1/.test(location.search)) startCloud();
window.__nh = { S:function(){ return S; }, ITEMS:ITEMS, VL:VL, GL:GL, parseImportText:parseImportText, isDup:isDup, startSession:startSession, cloud:cloud };
})();
