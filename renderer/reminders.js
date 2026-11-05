// reminders.js - SolatTime Reminders (Page 2): CRUD with Local Storage
// Sections: 1 Config, 2 Storage, 3 Validation, 4 CRUD, 5 Rendering, 6 Events
'use strict';

/* ===================== 1. CONFIGURATION ===================== */
const KEYS = {
  zone: 'solat.zone',
  reminders: 'solat.reminders',
  suggestions: 'solat.suggestions'
};

const PRAYERS = ['Any time', 'Subuh', 'Syuruk', 'Dhuha', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
const CATEGORIES = ['Zikir', 'Quran', 'Sunnah Prayer', 'Fasting', 'Suggestion', 'Other'];

const $ = (id) => document.getElementById(id);
const form = $('reminderForm');
const formHeading = $('formHeading');
const formMessage = $('formMessage');
const titleInput = $('titleInput');
const prayerInput = $('prayerInput');
const timeInput = $('timeInput');
const categoryInput = $('categoryInput');
const noteInput = $('noteInput');
const submitBtn = $('submitBtn');
const cancelBtn = $('cancelBtn');
const searchInput = $('searchInput');
const filterCategory = $('filterCategory');
const reminderCount = $('reminderCount');
const reminderList = $('reminderList');

let editingId = null;       // null = creating, a number = editing that record
let messageTimer = null;

/* ===================== 2. LOCAL STORAGE HELPERS ===================== */
function loadList(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (err) {
    console.error('Storage error:', err);
    return false;
  }
}

/* ===================== 3. VALIDATION AND FEEDBACK ===================== */
function readForm() {
  return {
    title: titleInput.value.trim(),
    prayer: prayerInput.value,
    time: timeInput.value,
    category: categoryInput.value,
    note: noteInput.value.trim(),
  };
}

// Returns an error message, or an empty string when the data is valid.
function validateReminder(data, ignoreId) {
  if (data.title === '') return 'Please enter a title.';
  if (data.title.length < 3) return 'The title must have at least 3 characters.';
  if (data.time === '') return 'Please choose a reminder time.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) return 'The time must be in HH:MM format.';
  if (data.note.length > 200) return 'The note must have 200 characters or fewer.';
  const duplicate = loadList(KEYS.reminders).some((r) =>
    r.id !== ignoreId && r.title.toLowerCase() === data.title.toLowerCase() && r.time === data.time);
  if (duplicate) return 'A reminder with the same title and time already exists.';
  return '';
}

function showFormMessage(text, type, autoClear) {
  clearTimeout(messageTimer);
  formMessage.textContent = text;
  formMessage.className = text ? type : '';
  if (text && autoClear) {
    messageTimer = setTimeout(() => showFormMessage('', ''), 3500);
  }
}

/* ===================== 4. CRUD OPERATIONS ===================== */
// CREATE: add a new record
function createReminder(data) {
  const list = loadList(KEYS.reminders);
  const stamp = new Date().toISOString();
  let zone = '';
  try { zone = localStorage.getItem(KEYS.zone) || ''; } catch (err) { /* ignore */ }
  list.push({
    id: Date.now(),
    title: data.title,
    prayer: data.prayer,
    time: data.time,
    category: data.category,
    note: data.note,
    zone: zone,
    createdAt: stamp,
    updatedAt: stamp
  });
  return saveList(KEYS.reminders, list);
}

// UPDATE: replace the fields of an existing record
function updateReminder(id, data) {
  const list = loadList(KEYS.reminders);
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return false;
  list[index] = Object.assign({}, list[index], data, { updatedAt: new Date().toISOString() });
  return saveList(KEYS.reminders, list);
}

// DELETE: remove a record by id
function deleteReminder(id) {
  const list = loadList(KEYS.reminders).filter((r) => r.id !== id);
  return saveList(KEYS.reminders, list);
}

/* ===================== 5. RENDERING (READ) ===================== */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fillSelect(select, values) {
  select.replaceChildren();
  values.forEach((value) => {
    const option = el('option', '', value);
    option.value = value;
    select.appendChild(option);
  });
}

function buildReminderItem(r) {
  const item = el('li', 'record');
  const body = el('div', 'record-body');
  body.appendChild(el('p', 'record-title', r.title));
  body.appendChild(el('p', 'meta', `${r.prayer}, ${r.time}, ${r.category}`));
  if (r.note) body.appendChild(el('p', 'record-note', r.note));

  const buttons = el('div', 'record-actions');
  const editBtn = el('button', 'secondary small-btn', 'Edit');
  editBtn.type = 'button';
  editBtn.addEventListener('click', () => startEdit(r.id));
  const deleteBtn = el('button', 'danger small-btn', 'Delete');
  deleteBtn.type = 'button';
  deleteBtn.addEventListener('click', () => handleDelete(r.id));
  buttons.append(editBtn, deleteBtn);

  item.append(body, buttons);
  return item;
}

function renderReminders() {
  const all = loadList(KEYS.reminders);
  const query = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;

  const shown = all
    .filter((r) => category === 'All categories' || r.category === category)
    .filter((r) => query === '' || `${r.title} ${r.note || ''}`.toLowerCase().includes(query))    
    .sort((a, b) => a.time.localeCompare(b.time));

  reminderList.replaceChildren();
  if (all.length === 0) {
    reminderList.appendChild(el('li', 'empty', 'No reminders yet. Fill in the form to add your first one.'));
    reminderCount.textContent = '';
    return;
  }
  if (shown.length === 0) {
    reminderList.appendChild(el('li', 'empty', 'No reminders match your search or filter.'));
  }
  shown.forEach((r) => reminderList.appendChild(buildReminderItem(r)));
  reminderCount.textContent = `Showing ${shown.length} of ${all.length} reminders, sorted by time.`;
}


/* ===================== 6. EVENT HANDLERS ===================== */
function resetForm() {
  form.reset();
  editingId = null;
  formHeading.textContent = 'Add a reminder';
  submitBtn.textContent = 'Save reminder';
  cancelBtn.classList.add('hidden');
}

function startEdit(id) {
  const record = loadList(KEYS.reminders).find((r) => r.id === id);
  if (!record) {
    showFormMessage('That reminder no longer exists.', 'error');
    renderReminders();
    return;
  }
  editingId = id;
  titleInput.value = record.title;
  prayerInput.value = record.prayer;
  timeInput.value = record.time;
  categoryInput.value = record.category;
  noteInput.value = record.note;
  formHeading.textContent = 'Edit reminder';
  submitBtn.textContent = 'Update reminder';
  cancelBtn.classList.remove('hidden');
  showFormMessage('Editing "' + record.title + '". Change the details, then press Update reminder.', 'info');
  titleInput.focus();
  $('formPanel').scrollIntoView({ behavior: 'smooth' });
}

function handleDelete(id) {
  const record = loadList(KEYS.reminders).find((r) => r.id === id);
  if (!record) return;
  if (!window.confirm('Delete the reminder "' + record.title + '"?')) return;
  if (deleteReminder(id)) {
    if (editingId === id) resetForm();
    showFormMessage('Reminder deleted.', 'success', true);
    renderReminders();
  } else {
    showFormMessage('The reminder could not be deleted because Local Storage is unavailable.', 'error');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = readForm();
  const error = validateReminder(data, editingId);
  if (error) {
    showFormMessage(error, 'error');
    return;
  }

  const isEdit = editingId !== null;
  const saved = isEdit ? updateReminder(editingId, data) : createReminder(data);
  if (!saved) {
    showFormMessage('The reminder could not be saved. It may have been deleted, or Local Storage is unavailable.', 'error');
    return;
  }
  showFormMessage(isEdit ? 'Reminder updated.' : 'Reminder added.', 'success', true);
  resetForm();
  renderReminders();
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  showFormMessage('Edit cancelled.', 'info', true);
});

searchInput.addEventListener('input', renderReminders);
filterCategory.addEventListener('change', renderReminders);

// Start-up
fillSelect(prayerInput, PRAYERS);
fillSelect(categoryInput, CATEGORIES);
fillSelect(filterCategory, ['All categories'].concat(CATEGORIES));
renderReminders();

// Receive a suggested activity from the Dashboard
const params = new URLSearchParams(window.location.search);
const newReminder = params.get('newReminder');

if (newReminder) {
  try {
    const received = JSON.parse(newReminder);

    const data = {
      title: String(received.title || '').trim(),
      prayer: PRAYERS.includes(received.prayer)
        ? received.prayer : 'Any time',
      time: String(received.time || ''),
      category: 'Suggestion',
      note: String(received.note || '').slice(0, 200)
    };

    const error = validateReminder(data, null);

    if (error) {
      showFormMessage(error, 'warning');
    } else if (createReminder(data)) {
      renderReminders();
      showFormMessage(
        'Suggested activity saved as a reminder!',
        'success',
        true
      );
    } else {
      showFormMessage('Could not save reminder.', 'error');
    }

    // Remove the URL parameter after processing it
    try {
      window.history.replaceState(null, '', 'reminders.html');
    } catch (err) {
      console.error('URL cleanup error:', err);
    }

  } catch (err) {
    console.error('Reminder transfer error:', err);
    showFormMessage('Invalid reminder information.', 'error');
  }
}

