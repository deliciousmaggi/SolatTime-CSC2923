'use strict';

/* ===================== 1. CONFIGURATION ===================== */
// JAKIM prayer time zones grouped by Malaysian state.

const STATE_ZONES = {
  'Johor': [
    ['JHR01', 'Pulau Aur, Pulau Pemanggil'],
    ['JHR02', 'Johor Bahru, Kota Tinggi, Mersing'],
    ['JHR03', 'Kluang, Pontian'],
    ['JHR04', 'Batu Pahat, Muar, Segamat, Gemas']
  ],

  'Kedah': [
    ['KDH01', 'Kota Setar, Kubang Pasu, Pokok Sena'],
    ['KDH02', 'Kuala Muda, Yan, Pendang'],
    ['KDH03', 'Padang Terap, Sik'],
    ['KDH04', 'Baling'],
    ['KDH05', 'Bandar Baharu, Kulim'],
    ['KDH06', 'Langkawi'],
    ['KDH07', 'Puncak Gunung Jerai']
  ],

  'Kelantan': [
    ['KTN01', 'Kota Bharu, Bachok, Pasir Mas and surrounding areas'],
    ['KTN02', 'Other Kelantan districts']
  ],

  'Melaka': [
    ['MLK01', 'All Melaka']
  ],

  'Negeri Sembilan': [
    ['NGS01', 'Tampin, Jempol'],
    ['NGS02', 'Seremban, Rembau, Port Dickson'],
    ['NGS03', 'Other Negeri Sembilan districts']
  ],

  'Pahang': [
    ['PHG01', 'Pulau Tioman'],
    ['PHG02', 'Kuantan, Pekan, Rompin'],
    ['PHG03', 'Temerloh, Maran, Jerantut'],
    ['PHG04', 'Bentong, Lipis, Raub'],
    ['PHG05', 'Genting Sempah, Janda Baik, Bukit Tinggi'],
    ['PHG06', 'Cameron Highlands, Genting Highlands, Bukit Fraser'],
    ['PHG07', 'Other Pahang areas']
  ],

  'Perak': [
    ['PRK01', 'Tapah, Slim River, Tanjung Malim'],
    ['PRK02', 'Ipoh, Kuala Kangsar, Kampar'],
    ['PRK03', 'Lenggong, Pengkalan Hulu, Gerik'],
    ['PRK04', 'Temengor, Belum'],
    ['PRK05', 'Teluk Intan, Lumut, Sitiawan, Pangkor'],
    ['PRK06', 'Taiping, Selama, Parit Buntar'],
    ['PRK07', 'Bukit Larut']
  ],

  'Perlis': [
    ['PLS01', 'All Perlis']
  ],

  'Pulau Pinang': [
    ['PNG01', 'All Pulau Pinang']
  ],

  'Sabah': [
    ['SBH01', 'Sandakan East'],
    ['SBH02', 'Beluran, Telupid, Sandakan West'],
    ['SBH03', 'Lahad Datu, Kunak, Semporna'],
    ['SBH04', 'Tawau, Kalabakan'],
    ['SBH05', 'Kudat, Kota Marudu, Pitas'],
    ['SBH06', 'Gunung Kinabalu'],
    ['SBH07', 'Kota Kinabalu, Ranau, Tuaran, Papar'],
    ['SBH08', 'Keningau, Tambunan, Nabawan'],
    ['SBH09', 'Beaufort, Sipitang, Tenom']
  ],

  'Sarawak': [
    ['SWK01', 'Limbang, Lawas'],
    ['SWK02', 'Miri, Marudi'],
    ['SWK03', 'Bintulu, Belaga'],
    ['SWK04', 'Sibu, Mukah, Kapit'],
    ['SWK05', 'Sarikei, Julau, Daro'],
    ['SWK06', 'Sri Aman, Betong, Lubok Antu'],
    ['SWK07', 'Serian, Samarahan'],
    ['SWK08', 'Kuching, Bau, Lundu'],
    ['SWK09', 'Kampung Patarikan']
  ],

  'Selangor': [
    ['SGR01', 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor'],
    ['SGR02', 'Kuala Selangor, Sabak Bernam'],
    ['SGR03', 'Klang, Kuala Langat']
  ],

  'Terengganu': [
    ['TRG01', 'Kuala Terengganu, Marang, Kuala Nerus'],
    ['TRG02', 'Besut, Setiu'],
    ['TRG03', 'Hulu Terengganu'],
    ['TRG04', 'Dungun, Kemaman']
  ],

  'Wilayah Persekutuan': [
    ['WLY01', 'Kuala Lumpur, Putrajaya'],
    ['WLY02', 'Labuan']
  ]
};

// Convert state zones into the format used by your original code
const ZONES = {};

for (const [stateName, zones] of Object.entries(STATE_ZONES)) {
  for (const [code, district] of zones) {
    ZONES[code] = {
      label: `${district} (${code})`,
      state: stateName
    };
  }
}


const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jamadilawal',
  'Jamadilakhir', 'Rejab', 'Syaaban', 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'];

// Local Storage keys (shared with reminders.js)
const KEYS = {
  zone: 'solat.zone',
  reminders: 'solat.reminders',
  suggestions: 'solat.suggestions'
};

/* ===================== 2. STATE AND ELEMENTS ===================== */
const state = {
  zone: '',
  today: null,            // today's prayer object from the API
  tomorrowFajr: null,     // used for the countdown after Isyak
  hijriMonth: 0,
  hijriDay: 0,
  dayOfMonth: 0,
  loadId: 0,              // ignores answers from an older request
  ayahLoaded: false,
  ayahLoading: false,
  highlightKey: '',
  lastSuggestionText: ''
};

const monthCache = new Map();   // avoids downloading the same month twice
let messageTimer = null;

const $ = (id) => document.getElementById(id);
const zoneSelect = $('zoneSelect');
const refreshBtn = $('refreshBtn');
const loadingEl = $('loading');
const messageEl = $('message');
const clockEl = $('clock');
const nextNameEl = $('nextName');
const countdownEl = $('countdown');
const suggestionMainEl = $('suggestionMain');
const suggestionExtraEl = $('suggestionExtra');
const saveSuggestionBtn = $('saveSuggestionBtn');
const timesBody = $('timesBody');
const gregorianText = $('gregorianText');
const hijriText = $('hijriText');
const locationText = $('locationText');
const ayahArabic = $('ayahArabic');
const ayahEnglish = $('ayahEnglish');
const ayahRef = $('ayahRef');

/* ===================== 3. LOCAL STORAGE HELPERS ===================== */
function loadList(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];   // empty or damaged data: start with an empty list
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

/* ===================== 4. API AND JSON PROCESSING ===================== */
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Server error: ' + res.status);
  return res.json();
}

// API 1: prayer times for a whole month (waktusolat.app, JAKIM data).
// Times are Unix timestamps in seconds.
async function fetchMonthTimes(zone, year, month) {
  const key = `${zone}-${year}-${month}`;
  if (monthCache.has(key)) return monthCache.get(key);
  const json = await getJSON(`https://api.waktusolat.app/v2/solat/${zone}?year=${year}&month=${month}`);
  if (!json.prayers || json.prayers.length === 0) return null;   // empty result
  monthCache.set(key, json);
  return json;
}

// Finds one day inside the month data. Works for next month too.
async function getDayEntry(zone, date) {
  const json = await fetchMonthTimes(zone, date.getFullYear(), date.getMonth() + 1);
  if (!json) return null;
  return json.prayers.find((p) => p.day === date.getDate()) || null;
}


// API 2: verse of the day, Arabic and English (Al-Quran Cloud)
async function fetchAyah(number) {
  const json = await getJSON(`https://api.alquran.cloud/v1/ayah/${number}/editions/quran-uthmani,en.asad`);
  const list = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);
  if (list.length === 0) return null;
  const english = list[list.length - 1];
  return {
    arabic: list.length > 1 ? list[0].text : '',
    english: english.text,
    surah: english.surah ? english.surah.englishName : '',
    number: english.numberInSurah
  };
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

// Same verse all day, a different one each day (the Quran has 6236 verses)
function dailyAyahNumber(date) {
  return ((dayOfYear(date) * 97 + date.getFullYear()) % 6236) + 1;
}

/* ===================== 5. SUGGESTION LOGIC ===================== */
// Compares the current time with today's API prayer times.
function getTimeSuggestion(t, now) {
  if (!t) return 'No suitable suggestion available.';

  if (now < t.imsak) {
    return 'Qiamullail time: perform night prayers and make doa.';
  } else if (now < t.fajr) {
    return 'Prepare for Subuh prayer, recite istighfar and make doa.';
  } else if (now < t.syuruk) {
    return 'Perform Subuh, then read the morning zikr before sunrise.';
  } else if (now < t.dhuha) {
    return 'Sunrise has passed: read the Quran while waiting for Dhuha time.';
  } else if (now < t.dhuhr) {
    return 'Dhuha time: perform Solat Dhuha before Zohor.';
  } else if (now < t.asr) {
    return 'Zohor time: perform Zohor, then continue with Quran reading or zikr.';
  } else if (now < t.maghrib) {
    if (t.maghrib - now <= 1800) {
      return 'Maghrib is near: prepare for Maghrib prayer and make doa.';
    }
    return 'Asar time: perform Asar, then read the evening zikr.';
  } else if (now < t.isha) {
    return 'Maghrib has entered: perform Maghrib and recite the Quran before Isyak.';
  } else {
    return 'Isyak time: perform Isyak and Witir, then read the night zikr before sleeping.';
  }
}

// Extra suggestions from the day of the week and the Hijri date.
function getDaySuggestions(date) {
    const extras = [];

  switch (date.getDay()) {
    case 5:
      extras.push('Friday: read Surah Al-Kahf, send salawat, and prepare for Jumaat prayer.');
      break;

    case 1:
      extras.push('Monday: begin the week with Quran reading, zikr and doa.');
      break;

    case 4:
      extras.push('Thursday: increase your salawat, zikr and doa.');
      break;

    default:
      extras.push('Remember to perform your daily prayers and make time for zikr.');
      break;
  }

  return extras;
}


// Saves a suggestion to Local Storage when it changes (newest first, max 50).
function storeSuggestion(text, extra, prayer) {
  const list = loadList(KEYS.suggestions);
  const last = list[0];
  const sameDay = last && new Date(last.savedAt).toDateString() === new Date().toDateString();
  if (last && sameDay && last.text === text && last.zone === state.zone) return;   // already saved
  list.unshift({
    id: Date.now(),
    text: text,
    extra: extra,
    prayer: prayer,
    zone: state.zone,
    savedAt: new Date().toISOString()
  });
  saveList(KEYS.suggestions, list.slice(0, 50));
}

/* ===================== 6. CALCULATIONS ===================== */
const nowSeconds = () => Math.floor(Date.now() / 1000);

// Time left until the next prayer. After Isyak it counts down to tomorrow's Subuh.
function getNextPrayer(t, tomorrowFajr, now) {
  const upcoming = [
    { name: 'Subuh', time: t.fajr },
    { name: 'Zohor', time: t.dhuhr },
    { name: 'Asar', time: t.asr },
    { name: 'Maghrib', time: t.maghrib },
    { name: 'Isyak', time: t.isha }
  ];
  for (const item of upcoming) {
    if (now < item.time) {
      return { name: item.name, time: item.time, secondsLeft: item.time - now, tomorrow: false };
    }
  }
  if (tomorrowFajr && tomorrowFajr > now) {
    return { name: 'Subuh', time: tomorrowFajr, secondsLeft: tomorrowFajr - now, tomorrow: true };
  }
  return null;   // data missing
}


function formatDuration(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return `${h} hr ${m} min ${s} sec`;
}


function getTimeRows(t) {
  return [
    { name: 'Imsak', time: t.imsak }, { name: 'Subuh', time: t.fajr },
    { name: 'Syuruk', time: t.syuruk }, { name: 'Dhuha', time: t.dhuha },
    { name: 'Zohor', time: t.dhuhr }, { name: 'Asar', time: t.asr },
    { name: 'Maghrib', time: t.maghrib }, { name: 'Isyak', time: t.isha }
  ];
}

/* ===================== 7. DOM RENDERING ===================== */
function formatTime(sec) {
  return new Date(sec * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kuala_Lumpur'
  });
}

function formatTime24(sec) {
  return new Date(sec * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Kuala_Lumpur'
  });
}

function showMessage(text, type, autoClear) {
  clearTimeout(messageTimer);
  messageEl.textContent = text;
  messageEl.className = text ? type : '';
  if (text && autoClear) {
    messageTimer = setTimeout(() => showMessage('', ''), 3500);
  }
}

function setLoading(on) {
  loadingEl.classList.toggle('hidden', !on);
  refreshBtn.disabled = on;
}

// Fills the prayer table (innerHTML)
function renderTimes(t) {
  timesBody.innerHTML = getTimeRows(t)
    .map((r) => `<tr id="row-${r.name}" data-time="${r.time}"><td>${r.name}</td><td>${formatTime(r.time)}</td></tr>`)
    .join('');
  state.highlightKey = '';
}

function renderDate(date, hijriYear, hijriMonth, hijriDay) {
  gregorianText.textContent = date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const monthName = HIJRI_MONTHS[hijriMonth - 1];
  hijriText.textContent = monthName ? `${hijriDay} ${monthName} ${hijriYear}H` : 'Hijri date unavailable';
}

// Marks the next prayer row (classList)
function highlightRow(next) {
  const key = next && !next.tomorrow ? next.name : '';
  if (key === state.highlightKey) return;
  state.highlightKey = key;
  document.querySelectorAll('#timesBody tr').forEach((row) => row.classList.remove('next'));
  const row = key ? document.getElementById('row-' + key) : null;
  if (row) row.classList.add('next');
}

function markPassedRows(now) {
  document.querySelectorAll('#timesBody tr[data-time]').forEach((row) => {
    row.classList.toggle('passed', now >= Number(row.dataset.time));
  });
}

function clearDashboard() {
  state.today = null;
  state.tomorrowFajr = null;
  timesBody.innerHTML = '<tr><td colspan="2" class="empty">No prayer times to show.</td></tr>';
  nextNameEl.textContent = '-';
  countdownEl.textContent = 'No data available.';
  suggestionMainEl.textContent = 'No suitable suggestion available.';
  suggestionExtraEl.textContent = '';
  gregorianText.textContent = '-';
  hijriText.textContent = '-';
}

// Runs every second: clock, countdown, highlight and suggestion
function tick() {
  const nowDate = new Date();
  clockEl.textContent = nowDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kuala_Lumpur' });
  if (!state.today) return;

  // A new day has started: download today's times again
  if (nowDate.getDate() !== state.dayOfMonth) {
    state.dayOfMonth = nowDate.getDate();
    state.ayahLoaded = false;
    loadZone();
    return;
  }

  const now = nowSeconds();
  const next = getNextPrayer(state.today, state.tomorrowFajr, now);
  if (next) {
    nextNameEl.textContent = next.tomorrow ? 'Subuh (tomorrow)' : next.name;
    countdownEl.textContent = 'Time remaining: ' + formatDuration(next.secondsLeft);
  } else {
    nextNameEl.textContent = 'Unavailable';
    countdownEl.textContent = 'The next prayer time could not be calculated.';
  }
  highlightRow(next);
  markPassedRows(now);

  const main = getTimeSuggestion(state.today, now);
const extras = getDaySuggestions(nowDate).join(' ');  suggestionMainEl.textContent = main;
  suggestionExtraEl.textContent = extras;
  if (main !== state.lastSuggestionText) {
    state.lastSuggestionText = main;
    storeSuggestion(main, extras, next ? next.name : '');
  }
}

/* ===================== 8. LOADING DATA ===================== */
function applyToday(entry, tomorrowFajr, date) {
  state.today = entry;
  state.tomorrowFajr = tomorrowFajr;
  state.dayOfMonth = date.getDate();

  const parts = String(entry.hijri || '').split('-').map(Number);   // "1448-02-17"
  state.hijriMonth = parts[1] || 0;
  state.hijriDay = parts[2] || 0;

  renderTimes(entry);
  renderDate(date, parts[0], state.hijriMonth, state.hijriDay);
  tick();
}

async function loadZone() {
  const myId = ++state.loadId;
  const zone = zoneSelect.value;
  state.zone = zone;
  state.lastSuggestionText = '';
  try { localStorage.setItem(KEYS.zone, zone); } catch (err) { /* ignore */ }

  setLoading(true);
  showMessage('Loading prayer times...', 'info');
  try {
    const today = new Date();
    const entry = await getDayEntry(zone, today);
    if (myId !== state.loadId) return;
    if (!entry) {                                         // empty result
      clearDashboard();
      showMessage('No prayer times were found for this location today. Try another location.', 'warning');
      return;
    }

    let tomorrowFajr = null;
    try {
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const tomorrowEntry = await getDayEntry(zone, tomorrow);   // also handles month end
      tomorrowFajr = tomorrowEntry ? tomorrowEntry.fajr : null;
    } catch (err) {
      tomorrowFajr = null;   // the countdown still works until Isyak
    }
    if (myId !== state.loadId) return;

    
  applyToday(entry, tomorrowFajr, today);
  locationText.textContent = ZONES[zone].label;
  showMessage('Prayer times loaded for ' + ZONES[zone].label + '.', 'success', true);
  if (!state.ayahLoaded) loadAyah();

  } catch (err) {                                         // failed request
    console.error('LOAD ERROR:', err);
    if (myId === state.loadId) {
      clearDashboard();
      showMessage('Could not load prayer times. Check your internet connection, then press Refresh.', 'error');
    }
  } finally {
    if (myId === state.loadId) setLoading(false);
  }
}

async function loadAyah() {
  if (state.ayahLoading) return;
  state.ayahLoading = true;
  try {
    const ayah = await fetchAyah(dailyAyahNumber(new Date()));
    if (!ayah) {
      ayahArabic.textContent = '';
      ayahEnglish.textContent = 'No verse was found for today.';
      ayahRef.textContent = '';
      return;
    }
    ayahArabic.textContent = ayah.arabic;
    ayahEnglish.textContent = ayah.english;
    ayahRef.textContent = `Surah ${ayah.surah}, verse ${ayah.number}`;
    state.ayahLoaded = true;
  } catch (err) {
    console.error('AYAH ERROR:', err);
    ayahArabic.textContent = '';
    ayahEnglish.textContent = 'The verse of the day could not be loaded. Press Refresh to try again.';
    ayahRef.textContent = '';
  } finally {
    state.ayahLoading = false;
  }
}

/* ===================== 9. EVENTS AND START-UP ===================== */
// Creates a reminder (Local Storage) from the current suggestion

function saveSuggestionAsReminder() {
  if (!state.today) {
    showMessage('Please load the prayer times first.', 'warning');
    return;
  }

  const next = getNextPrayer(
    state.today,
    state.tomorrowFajr,
    nowSeconds()
  );

  if (!next) {
    showMessage('Next prayer time is unavailable.', 'warning');
    return;
  }

  const activity = suggestionMainEl.textContent.trim();

  if (!activity || activity === '-') {
    showMessage('No suggested activity available.', 'warning');
    return;
  }

  const time = new Date(next.time * 1000)
    .toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kuala_Lumpur'
    });

  const reminder = {
    title: activity.split(':')[0].trim().slice(0, 60),
    prayer: next.name,
    time: time,
    category: 'Suggestion',
    note: activity.slice(0, 200)
  };

  // Send activity to the Reminders page
  window.location.href =
    'reminders.html?newReminder=' +
    encodeURIComponent(JSON.stringify(reminder));
}

function init() {
  // Display all Malaysian prayer zones grouped by state
  for (const [stateName, zones] of Object.entries(STATE_ZONES)) {
    const group = document.createElement('optgroup');
    group.label = stateName;

    for (const [code, district] of zones) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${district} (${code})`;

      group.appendChild(option);
    }

    zoneSelect.appendChild(group);
  }
  try {
    const saved = localStorage.getItem(KEYS.zone);
    if (saved && ZONES[saved]) zoneSelect.value = saved;   // remember the last location
  } catch (err) { /* ignore */ }
  document.getElementById('saveSuggestionBtn')
    .addEventListener('click', saveSuggestionAsReminder);
  zoneSelect.addEventListener('change', loadZone);
  refreshBtn.addEventListener('click', () => {
    monthCache.clear();
    state.ayahLoaded = false;
    loadZone();
  });
  saveSuggestionBtn.addEventListener('click', saveSuggestionAsReminder);

  setInterval(tick, 1000);
  tick();
  loadZone();
}

init();