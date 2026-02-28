// ═══════════════════════════════════════════════════════════════
//  index.js  –  Firebase verze počítadla dní
// ═══════════════════════════════════════════════════════════════

import { initializeApp }                       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
                                               from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ┌─────────────────────────────────────────────────────────────┐
// │  ⚠️  SEM VLOŽ SVŮJ FIREBASE CONFIG  (krok 4 v návodu)      │
// └─────────────────────────────────────────────────────────────┘
const firebaseConfig = {
    apiKey: "AIzaSyDmLglWV6W0Na1etTMXSxuvBjwuEdryN7U",
    authDomain: "ghbztraty-4b463.firebaseapp.com",
    databaseURL: "https://ghbztraty-4b463-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ghbztraty-4b463",
    storageBucket: "ghbztraty-4b463.firebasestorage.app",
    messagingSenderId: "689052739083",
    appId: "1:689052739083:web:b638173f8ec0bb3fbd490e",
    measurementId: "G-WN5L694ZM9"
};
// ─────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ── DOM ──────────────────────────────────────────────────────
const $daysNum    = document.getElementById('days-number');
const $sinceText  = document.getElementById('since-text');
const $msgText    = document.getElementById('message-text');
const $stage      = document.getElementById('stage');
const $drawer     = document.getElementById('drawer');
const $gearBtn    = document.getElementById('gear-btn');
const $closeBtn   = document.getElementById('close-btn');

const $viewLogin  = document.getElementById('view-login');
const $viewEdit   = document.getElementById('view-edit');
const $inpEmail   = document.getElementById('inp-email');
const $inpPass    = document.getElementById('inp-pass');
const $btnLogin   = document.getElementById('btn-login');
const $loginErr   = document.getElementById('login-err');
const $loggedEmail= document.getElementById('logged-email');

const $inpText    = document.getElementById('inp-text');
const $btnSaveTxt = document.getElementById('btn-save-text');
const $inpDate    = document.getElementById('inp-date');
const $btnSaveDt  = document.getElementById('btn-save-date');
const $btnLogout  = document.getElementById('btn-logout');
const $status     = document.getElementById('status');

// ── Helpers ──────────────────────────────────────────────────
function daysRemaining(dateStr) {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.max(0, Math.floor((target - now) / 86_400_000));
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function showStatus(msg, err = false) {
  $status.textContent = msg;
  $status.style.color = err ? 'var(--danger)' : 'var(--accent)';
  clearTimeout(showStatus._t);
  showStatus._t = setTimeout(() => ($status.textContent = ''), 3500);
}

// ── Načtení dat z Firestore ───────────────────────────────────
async function loadData() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'main'));
    if (!snap.exists()) {
      // První spuštění – vytvoř výchozí dokument
      await setDoc(doc(db, 'settings', 'main'), {
        start_date: new Date().toISOString().split('T')[0],
        text: 'Sem napište svůj text. Pouze admin ho může měnit.',
      });
      return loadData();
    }
    const { start_date, text } = snap.data();
    $daysNum.textContent    = daysRemaining(start_date).toLocaleString('cs-CZ');
    $sinceText.textContent  = `do ${fmtDate(start_date)}`;
    $msgText.textContent    = text;
    $inpDate.value = start_date;
    $inpText.value = text;
  } catch (e) {
    $daysNum.textContent = 'ERR';
    console.error(e);
  }
}

// ── Panel otevření / zavření ──────────────────────────────────
function openDrawer()  { $drawer.classList.add('open'); $stage.classList.add('shifted'); }
function closeDrawer() { $drawer.classList.remove('open'); $stage.classList.remove('shifted'); }

$gearBtn.addEventListener('click', openDrawer);
$closeBtn.addEventListener('click', closeDrawer);

document.addEventListener('click', (e) => {
  if ($drawer.classList.contains('open') &&
      !$drawer.contains(e.target) && e.target !== $gearBtn) closeDrawer();
});

// ── Auth state ────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    $loggedEmail.textContent = user.email;
    $viewLogin.classList.add('hidden');
    $viewEdit.classList.remove('hidden');
    $loginErr.textContent = '';
  } else {
    $viewLogin.classList.remove('hidden');
    $viewEdit.classList.add('hidden');
  }
});

// ── Přihlášení ────────────────────────────────────────────────
$btnLogin.addEventListener('click', async () => {
  $loginErr.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, $inpEmail.value.trim(), $inpPass.value);
    showStatus('Přihlášení úspěšné ✓');
  } catch (e) {
    const msgs = {
      'auth/invalid-credential':       'Špatný e-mail nebo heslo.',
      'auth/user-not-found':           'Uživatel nenalezen.',
      'auth/wrong-password':           'Špatné heslo.',
      'auth/too-many-requests':        'Příliš mnoho pokusů. Zkus to za chvíli.',
      'auth/invalid-email':            'Neplatný formát e-mailu.',
    };
    $loginErr.textContent = msgs[e.code] || e.message;
  }
});
$inpPass.addEventListener('keydown', e => e.key === 'Enter' && $btnLogin.click());

// ── Odhlášení ─────────────────────────────────────────────────
$btnLogout.addEventListener('click', () => { signOut(auth); showStatus('Odhlášen.'); });

// ── Uložení textu ─────────────────────────────────────────────
$btnSaveTxt.addEventListener('click', async () => {
  try {
    await setDoc(doc(db, 'settings', 'main'), { text: $inpText.value }, { merge: true });
    $msgText.textContent = $inpText.value;
    showStatus('Text uložen ✓');
  } catch (e) { showStatus(e.message, true); }
});

// ── Uložení datumu ────────────────────────────────────────────
$btnSaveDt.addEventListener('click', async () => {
  if (!$inpDate.value) return showStatus('Vyber datum.', true);
  try {
    await setDoc(doc(db, 'settings', 'main'), { start_date: $inpDate.value }, { merge: true });
    $daysNum.textContent   = daysRemaining($inpDate.value).toLocaleString('cs-CZ');
    $sinceText.textContent = `do ${fmtDate($inpDate.value)}`;
    showStatus('Datum uloženo ✓');
  } catch (e) { showStatus(e.message, true); }
});

// ── Start ─────────────────────────────────────────────────────
loadData();