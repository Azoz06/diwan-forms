
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

// غير البيانات هنا عبر حسابك في firebase
const firebaseConfig = {
  apiKey: "AIzaSyBItTOKidSGgcg5X-hh1WkySnKW-YKJRkE",
  authDomain: "hackathon-ziyarat.firebaseapp.com",
  databaseURL: "https://hackathon-ziyarat-default-rtdb.firebaseio.com",
  projectId: "hackathon-ziyarat",
  storageBucket: "hackathon-ziyarat.firebasestorage.app",
  messagingSenderId: "1035224549916",
  appId: "1:1035224549916:web:428da91a81de988977add9",
  measurementId: "G-VNG3VDYBY6"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// مسار حفظ البيانات في firebase

const submissionsRef = ref(db, "eid-visit");




// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function () {
  const form = document.getElementById('diwanForm');
  if (!form) return;

  const btn             = form.querySelector('.btn-submit');
  const successModal    = document.getElementById('successModal');
  const closedModal     = document.getElementById('closedModal');
  const reRegisterModal = document.getElementById('reRegisterModal');
  const toast           = document.getElementById('formStatus');
  const statusIcon      = document.getElementById('statusIcon');
  const statusText      = document.getElementById('statusText');
  const statusSpan      = document.querySelector('.change-status');

  const nameInput      = document.getElementById('name');
  const emailInput     = document.getElementById('email');
  const phoneInput     = document.getElementById('phone');
  const committeeInput = document.getElementById('committee');
  const confirmBox     = document.getElementById('confirm');

  // ─── قراءة حالة التسجيل من Firebase ───
  // الـ badge يظهر فوراً بالحالة الافتراضية (متاح) ثم يتغير حسب رد Firebase
  let REGISTRATION_OPEN = true;
  try {
    const snap = await get(regStatusRef);
    REGISTRATION_OPEN = snap.exists() ? snap.val() : true;
  } catch (e) {
    console.warn("Could not read registration status, defaulting to open:", e);
  }

  // ─── الآن طبّق الحالة دفعة واحدة بعد ورود الجواب ───
  if (statusSpan) {
    statusSpan.classList.remove('close', 'ready');
    statusSpan.classList.add(REGISTRATION_OPEN ? 'ready' : 'close');
    statusSpan.textContent    = REGISTRATION_OPEN ? 'التسجيل متاح' : 'التسجيل مغلق';
    statusSpan.style.visibility = 'visible';
  }


  // ─── Toast ───
  function showToast(icon, message, color = "#0F6694") {
    if (!toast) return;
    statusIcon.innerHTML   = icon;
    statusText.textContent = message;
    toast.style.display    = "flex";
    toast.style.borderRightColor = color;
    setTimeout(() => { toast.style.display = "none"; }, 3500);
  }

  // ─── إغلاق المودالات ───
  [
    [document.getElementById('closeSuccess'),    successModal],
    [document.getElementById('closeClosed'),     closedModal],
    [document.getElementById('closeReRegister'), reRegisterModal]
  ].forEach(([btnEl, modal]) => {
    if (!btnEl || !modal) return;
    btnEl.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
  });

  function showReRegisterModal() {
    reRegisterModal
      ? (reRegisterModal.style.display = 'flex')
      : showToast(`<span style='font-size:20px;color:#C64C28;'>✖</span>`, "تظهر سجلاتنا أنك مسجل مسبقاً.", "#C64C28");
  }

  // ─── التحقق من الحقول ───
  function setError(fieldId, errorId, message) {
    const field   = document.getElementById(fieldId);
    const errorEl = document.getElementById(errorId);
    if (!field || !errorEl) return;
    if (message) { field.classList.add('invalid'); errorEl.textContent = message; }
    else { field.classList.remove('invalid'); errorEl.textContent = ''; }
  }

  function validateName() {
    const v = nameInput.value.trim();
    if (!v) { setError('nameField','nameError','الرجاء إدخال الاسم الكامل'); return false; }
    if (v.split(/\s+/).filter(Boolean).length < 3) {
      setError('nameField','nameError','الرجاء إدخال الاسم الثلاثي كاملاً'); return false;
    }
    setError('nameField','nameError',''); return true;
  }

  function validateEmail() {
    const v = emailInput.value.trim().toLowerCase();
    if (!v) { setError('emailField','emailError','الرجاء إدخال البريد الإلكتروني'); return false; }
    if (!emailInput.checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError('emailField','emailError','صيغة البريد الإلكتروني غير صحيحة.'); return false;
    }
    if (['edu.sa','.edu.sa'].some(d => v.endsWith(d))) {
      setError('emailField','emailError','البريد الجامعي غير مقبول. الرجاء استخدام بريد شخصي (Gmail, Outlook, ...).'); return false;
    }
    setError('emailField','emailError',''); return true;
  }

  function validatePhone() {
    const v = phoneInput.value.trim();
    if (!v)                  { setError('phoneField','phoneError','رقم الجوال مطلوب'); return false; }
    if (/[^\d]/.test(v))     { setError('phoneField','phoneError','رقم الجوال يجب أن يحتوي على أرقام فقط'); return false; }
    if (!v.startsWith('05')) { setError('phoneField','phoneError','رقم الجوال يجب أن يبدأ بـ 05'); return false; }
    if (v.length !== 10)     { setError('phoneField','phoneError','رقم الجوال يجب أن يكون 10 أرقام'); return false; }
    setError('phoneField','phoneError',''); return true;
  }

  function validateCommittee() {
    if (!committeeInput.value) { setError('committeeField','committeeError','الرجاء اختيار اللجنة أو المبادرة'); return false; }
    setError('committeeField','committeeError',''); return true;
  }

  function validateAttendance() {
    const sel = document.querySelector('input[name="attendance"]:checked');
    if (!sel) { setError('attendanceField','attendanceError','الرجاء تحديد تأكيد حضورك'); return false; }
    setError('attendanceField','attendanceError',''); return true;
  }

  function validateCaptcha() {
    const errEl = document.getElementById('err-captcha');
    const box   = document.getElementById('recaptchaBox');
    if (!window.captchaPassed) {
      if (errEl) errEl.style.display = 'block';
      if (box)   box.classList.add('invalid-captcha');
      return false;
    }
    if (errEl) errEl.style.display = 'none';
    if (box)   box.classList.remove('invalid-captcha');
    return true;
  }

  function validateConfirm() {
    if (!confirmBox.checked) { setError('confirmField','confirmError','يجب الموافقة على التعهد'); return false; }
    setError('confirmField','confirmError',''); return true;
  }

  function validateForm() {
    return [
      validateName(), validateEmail(), validatePhone(),
      validateCommittee(), validateAttendance(),
      validateCaptcha(), validateConfirm()
    ].every(Boolean);
  }

  // أحداث فورية
  nameInput.addEventListener('blur', validateName);
  emailInput.addEventListener('blur', validateEmail);
  phoneInput.addEventListener('input', validatePhone);
  committeeInput.addEventListener('change', validateCommittee);
  document.querySelectorAll('input[name="attendance"]').forEach(r => r.addEventListener('change', validateAttendance));
  confirmBox.addEventListener('change', validateConfirm);

  // ─── إرسال الفورم ───
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // إعادة قراءة الحالة لحظة الإرسال
    try {
      const snap = await get(regStatusRef);
      REGISTRATION_OPEN = snap.exists() ? snap.val() : true;
    } catch (_) {}

    if (!REGISTRATION_OPEN) {
      closedModal
        ? (closedModal.style.display = 'flex')
        : showToast(`<span style='font-size:20px;color:#C64C28;'>✖</span>`, "نشكر اهتمامك، لكن التسجيل مغلق حالياً.", "#C64C28");
      return;
    }

    if (!validateForm()) {
      const first = document.querySelector('.field.invalid input, .field.invalid select');
      if (first) { first.scrollIntoView({ behavior:'smooth', block:'center' }); first.focus(); }
      return;
    }

    try {
      if (await hasPreviousSubmission(emailInput.value, phoneInput.value)) {
        showReRegisterModal(); return;
      }
    } catch (err) { console.error("Check error:", err); }

    showToast(
      `<div style="border:3px solid #eee;border-top:3px solid var(--diwan-3);border-radius:50%;width:20px;height:20px;animation:spin .8s linear infinite;"></div>`,
      "جاري حفظ التسجيل...", "#0F6694"
    );
    btn.disabled = true; btn.style.opacity = ".6";

    const submissionData = {
      name:       nameInput.value.trim(),
      email:      emailInput.value.trim(),
      phone:      phoneInput.value.trim(),
      committee:  committeeInput.value,
      attendance: document.querySelector('input[name="attendance"]:checked')?.value || '',
      createdAt:  new Date().toISOString()
    };

    try {
      // ─── 1. حفظ Firebase ───
      await set(push(submissionsRef), submissionData);

 
      showToast(`<span style='font-size:20px;color:#33b774;'>✔</span>`, "تم تسجيل حضورك بنجاح! ستصلك تفاصيل قريباً.", "#33b774");
      form.reset();
      if (successModal) successModal.style.display = "flex";

    } catch (error) {
      console.error("Firebase save error:", error);
      showToast(`<span style='font-size:20px;color:#C64C28;'>✖</span>`, "تعذّر حفظ التسجيل. حاول مرة أخرى.", "#C64C28");
    }

    btn.disabled = false; btn.style.opacity = "1";
  });

  // spinner keyframes
  const s = document.createElement('style');
  s.innerHTML = `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`;
  document.head.appendChild(s);
});

// ─── التحقق من التسجيل المسبق ───
function normalizeEmail(e) { return (e||"").toString().trim().toLowerCase(); }
function normalizePhone(p) { return (p||"").toString().replace(/\D/g,""); }

async function hasPreviousSubmission(email, phone) {
  const snap = await get(submissionsRef);
  if (!snap.exists()) return false;
  const all = snap.val();
  const te  = normalizeEmail(email);
  const tp  = normalizePhone(phone);
  for (const key in all) {
    const s = all[key] || {};
    if (te && normalizeEmail(s.email) === te) return true;
    if (tp && normalizePhone(s.phone) === tp) return true;
  }
  return false;
}


