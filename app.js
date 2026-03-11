// ─── Data ───────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { id: 'rent',        name: 'Rent',           icon: '🏠', type: 'Essential',     custom: false },
  { id: 'mortgage',    name: 'Mortgage',        icon: '🏡', type: 'Essential',     custom: false },
  { id: 'power',       name: 'Electric / Power',icon: '⚡', type: 'Essential',     custom: false },
  { id: 'water',       name: 'Water',           icon: '💧', type: 'Essential',     custom: false },
  { id: 'internet',    name: 'Internet',        icon: '📶', type: 'Essential',     custom: false },
  { id: 'phone',       name: 'Phone',           icon: '📱', type: 'Essential',     custom: false },
  { id: 'groceries',   name: 'Groceries',       icon: '🛒', type: 'Essential',     custom: false },
  { id: 'gas',         name: 'Gas / Fuel',      icon: '⛽', type: 'Essential',     custom: false },
  { id: 'car',         name: 'Car Payment',     icon: '🚗', type: 'Debt',          custom: false },
  { id: 'insurance',   name: 'Insurance',       icon: '🛡️', type: 'Essential',     custom: false },
  { id: 'credit',      name: 'Credit Cards',    icon: '💳', type: 'Debt',          custom: false },
  { id: 'dining',      name: 'Dining Out',      icon: '🍽️', type: 'Lifestyle',     custom: false },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', type: 'Entertainment', custom: false },
  { id: 'clothing',    name: 'Clothing',        icon: '👗', type: 'Lifestyle',     custom: false },
  { id: 'health',      name: 'Healthcare',      icon: '🏥', type: 'Essential',     custom: false },
  { id: 'savings',     name: 'Savings',         icon: '💰', type: 'Savings',       custom: false },
  { id: 'subscriptions', name: 'Subscriptions',icon: '📺', type: 'Lifestyle',     custom: false },
];

const EMOJI_OPTIONS = [
  '🏠','🏡','🚗','🚌','✈️','🛒','🍽️','☕','🎬','🎮',
  '📱','💻','📚','🎵','🏋️','⚽','🧘','💊','🐾','🌿',
  '💡','🔧','🧹','🎁','💍','🌐','📊','🏦','💰','💳',
  '🎓','✂️','🛋️','🧺','🎨','🐶','🐱','🚀','🍕','🏖️',
];

// ─── State ───────────────────────────────────────────────────────────────────

const today = new Date();
let currentYear  = today.getFullYear();
let currentMonth = today.getMonth(); // 0-indexed

function monthKey(y, m) { return `budget_${y}_${String(m+1).padStart(2,'0')}`; }

function loadMonthData(y, m) {
  const raw = localStorage.getItem(monthKey(y, m));
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  // Fresh month: build default categories with 0 amounts
  return {
    income: 0,
    categories: DEFAULT_CATEGORIES.map(c => ({ ...c, amount: 0 })),
  };
}

function saveMonthData(data) {
  localStorage.setItem(monthKey(currentYear, currentMonth), JSON.stringify(data));
}

let data = loadMonthData(currentYear, currentMonth);

// ─── Month Navigation ─────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function updateMonthLabel() {
  document.getElementById('month-label').textContent = `${MONTHS[currentMonth]} ${currentYear}`;
}

document.getElementById('prev-month').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  data = loadMonthData(currentYear, currentMonth);
  renderAll();
});

document.getElementById('next-month').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  data = loadMonthData(currentYear, currentMonth);
  renderAll();
});

// ─── Income ──────────────────────────────────────────────────────────────────

document.getElementById('income-input').addEventListener('input', e => {
  data.income = parseFloat(e.target.value) || 0;
  saveMonthData(data);
  updateSummary();
});

// ─── Summary / Progress ──────────────────────────────────────────────────────

function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateSummary() {
  const income   = data.income;
  const budgeted = data.categories.reduce((s, c) => s + (c.amount || 0), 0);
  const remaining = income - budgeted;
  const pct = income > 0 ? Math.min((budgeted / income) * 100, 100) : 0;

  document.getElementById('sum-income').textContent    = fmt(income);
  document.getElementById('sum-budgeted').textContent  = fmt(budgeted);

  const remEl = document.getElementById('sum-remaining');
  remEl.textContent = (remaining < 0 ? '-' : '') + fmt(remaining);
  remEl.className = 'amount remaining ' + (
    remaining < 0    ? 'negative' :
    remaining < income * 0.1 ? 'warning' : 'positive'
  );

  const fill = document.getElementById('progress-fill');
  fill.style.width = pct + '%';
  fill.className = 'progress-bar-fill' + (pct >= 100 ? ' danger' : pct >= 85 ? ' warning' : '');

  document.getElementById('progress-pct').textContent = Math.round(pct) + '% budgeted';
  document.getElementById('progress-tip').textContent =
    income === 0 ? 'Set your income to get started' :
    remaining < 0  ? `Over by ${fmt(Math.abs(remaining))}` :
    remaining === 0 ? 'Fully budgeted!' :
    `${fmt(remaining)} left to allocate`;
}

// ─── Category List ────────────────────────────────────────────────────────────

function renderCategories() {
  const list = document.getElementById('category-list');
  list.innerHTML = '';

  data.categories.forEach((cat, idx) => {
    const item = document.createElement('div');
    item.className = 'category-item';

    item.innerHTML = `
      <div class="cat-info">
        <div class="cat-icon">${cat.icon}</div>
        <div>
          <div class="cat-name">${escHtml(cat.name)}</div>
          <div class="cat-type">${escHtml(cat.type)}</div>
        </div>
      </div>
      <div class="cat-input-wrap">
        <span>$</span>
        <input
          class="cat-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value="${cat.amount > 0 ? cat.amount : ''}"
          data-idx="${idx}"
          aria-label="${escHtml(cat.name)} budget"
        />
      </div>
      ${cat.custom ? `<button class="btn btn-danger" data-del="${idx}" title="Remove">✕</button>` : '<div></div>'}
    `;

    // Budget input
    item.querySelector('.cat-input').addEventListener('input', e => {
      data.categories[idx].amount = parseFloat(e.target.value) || 0;
      saveMonthData(data);
      updateSummary();
    });

    // Delete custom
    const delBtn = item.querySelector('[data-del]');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        data.categories.splice(idx, 1);
        saveMonthData(data);
        renderAll();
        showToast(`"${cat.name}" removed`);
      });
    }

    list.appendChild(item);
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Add Category Modal ───────────────────────────────────────────────────────

const overlay    = document.getElementById('modal-overlay');
const catNameIn  = document.getElementById('cat-name-input');
const catTypeIn  = document.getElementById('cat-type-input');
const emojiPicker = document.getElementById('emoji-picker');

let selectedEmoji = EMOJI_OPTIONS[0];

function buildEmojiPicker() {
  emojiPicker.innerHTML = '';
  EMOJI_OPTIONS.forEach(e => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn' + (e === selectedEmoji ? ' selected' : '');
    btn.textContent = e;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      selectedEmoji = e;
      emojiPicker.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    emojiPicker.appendChild(btn);
  });
}

document.getElementById('add-category-btn').addEventListener('click', () => {
  catNameIn.value = '';
  catTypeIn.value = 'Other';
  selectedEmoji   = EMOJI_OPTIONS[0];
  buildEmojiPicker();
  overlay.classList.add('active');
  catNameIn.focus();
});

document.getElementById('modal-cancel').addEventListener('click', () => {
  overlay.classList.remove('active');
});

overlay.addEventListener('click', e => {
  if (e.target === overlay) overlay.classList.remove('active');
});

document.getElementById('modal-save').addEventListener('click', () => {
  const name = catNameIn.value.trim();
  if (!name) { catNameIn.focus(); return; }

  const newCat = {
    id:     'custom_' + Date.now(),
    name,
    icon:   selectedEmoji,
    type:   catTypeIn.value,
    custom: true,
    amount: 0,
  };

  data.categories.push(newCat);
  saveMonthData(data);
  overlay.classList.remove('active');
  renderAll();
  showToast(`"${name}" added!`);
});

// Allow Enter key to save
catNameIn.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('modal-save').click();
});

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ─── Render All ───────────────────────────────────────────────────────────────

function renderAll() {
  updateMonthLabel();
  document.getElementById('income-input').value = data.income > 0 ? data.income : '';
  renderCategories();
  updateSummary();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

renderAll();
