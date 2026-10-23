// ============================================================
// LICC ADMIN PANEL — LOGIC
// Handles: login, sermons/events/gallery/news CRUD, image upload
// Requires: supabase-config.js loaded before this file
// ============================================================

const toast = document.getElementById('toast');
function showToast(msg, isError) {
  toast.textContent = msg;
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.style.display = 'block';
  setTimeout(function () { toast.style.display = 'none'; }, 3200);
}

function isConfigured() {
  return typeof SUPABASE_URL !== 'undefined' &&
    SUPABASE_URL.indexOf('YOUR_SUPABASE') === -1 &&
    SUPABASE_URL.length > 10;
}

// Security & Validation Constants
const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_IMAGE_SIZE = 12 * 1024 * 1024; // 12 MB

const ALLOWED_VIDEO_EXTS = ['mp4', 'webm', 'mov', 'm4v'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
const MAX_VIDEO_SIZE = 400 * 1024 * 1024; // 400 MB

// ---------- AUTH ----------
const loginWrap = document.getElementById('loginWrap');
const adminBody = document.getElementById('adminBody');
const loginError = document.getElementById('loginError');

async function checkSession() {
  if (!isConfigured()) {
    loginWrap.style.display = 'flex';
    adminBody.style.display = 'none';
    const banner = document.getElementById('setupBanner');
    if (banner) banner.style.display = 'block';
    return;
  }
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data && data.session) {
      showAdmin();
    } else {
      loginWrap.style.display = 'flex';
      adminBody.style.display = 'none';
    }
  } catch (err) {
    loginWrap.style.display = 'flex';
    adminBody.style.display = 'none';
  }
}

// Keep auth state in sync across tabs and token refreshes
if (typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
  supabaseClient.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_OUT' || !session) {
      loginWrap.style.display = 'flex';
      adminBody.style.display = 'none';
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      showAdmin();
    }
  });
}

function showAdmin() {
  loginWrap.style.display = 'none';
  adminBody.style.display = 'block';
  document.getElementById('setupBanner').style.display = 'none';
  loadSermons();
  loadEvents();
  loadGallery();
  loadNews();
  loadMessages();
  loadAdminBranches();
  loadQuotes();
}

document.getElementById('loginBtn').addEventListener('click', async function () {
  if (!isConfigured()) {
    showToast('Connect Supabase first — see SETUP-GUIDE.md', true);
    return;
  }
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  loginError.style.display = 'none';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = 'Login failed: ' + error.message;
    loginError.style.display = 'block';
  } else {
    showAdmin();
  }
});

// Show/Hide password toggle
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', function () {
    const pwdInput = document.getElementById('loginPassword');
    const eyeShow = this.querySelector('.eye-show');
    const eyeHide = this.querySelector('.eye-hide');
    const isPassword = pwdInput.type === 'password';
    pwdInput.type = isPassword ? 'text' : 'password';
    if (eyeShow) eyeShow.style.display = isPassword ? 'none' : 'block';
    if (eyeHide) eyeHide.style.display = isPassword ? 'block' : 'none';
    const label = isPassword ? 'Hide password' : 'Show password';
    this.setAttribute('aria-label', label);
    this.setAttribute('title', label);
    pwdInput.focus();
  });
}

document.getElementById('loginPassword').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('logoutBtn').addEventListener('click', async function () {
  if (isConfigured()) {
    await supabaseClient.auth.signOut();
  }
  loginWrap.style.display = 'flex';
  adminBody.style.display = 'none';
});

// ---------- TABS ----------
document.querySelectorAll('.admin-tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.admin-panel-section').forEach(function (s) { s.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ---------- HELPERS & SANITIZERS ----------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) {
    return trimmed.replace(/[<>"']/g, function (c) {
      return ({ '<': '%3C', '>': '%3E', '"': '%22', "'": '%27' })[c];
    });
  }
  return '';
}

function sanitizeId(id) {
  if (!id || typeof id !== 'string') return '';
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function uploadImage(file) {
  if (!file) throw new Error('No file selected');
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image too large. Maximum size is ' + (MAX_IMAGE_SIZE / (1024 * 1024)) + 'MB.');
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    throw new Error('Invalid image type (.' + ext + '). Allowed: JPG, PNG, WEBP, AVIF, GIF.');
  }
  if (file.type && !ALLOWED_IMAGE_MIMES.includes(file.type.toLowerCase())) {
    throw new Error('Invalid image format (' + file.type + ').');
  }

  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData || !sessionData.session) {
    throw new Error('Authentication required: please log in as admin.');
  }

  const cleanName = Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;
  const path = 'media/' + cleanName;
  const { error } = await supabaseClient.storage.from('media').upload(path, file, {
    contentType: file.type || 'image/' + ext,
    upsert: false
  });
  if (error) throw error;
  const { data } = supabaseClient.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
// SERMONS
// ============================================================
const sermonSaveBtn = document.getElementById('sermonSaveBtn');
const sermonCancelBtn = document.getElementById('sermonCancelBtn');

async function loadSermons() {
  const list = document.getElementById('sermonList');
  if (!isConfigured()) { list.innerHTML = '<div class="empty-state">Connect Supabase to see sermons here.</div>'; return; }
  const { data, error } = await supabaseClient.from('sermons').select('*').order('sermon_date', { ascending: false });
  if (error) { showToast('Error loading sermons: ' + error.message, true); return; }
  if (!data || data.length === 0) { list.innerHTML = '<div class="empty-state">No sermons yet. Add your first one!</div>'; return; }
  list.innerHTML = data.map(function (s) {
    var safeId = sanitizeId(s.id);
    var isUpload = s.youtube_url && s.youtube_url.indexOf('supabase') !== -1;
    var sourceTag = isUpload ? 'Uploaded video' : 'YouTube';
    return '<div class="item-row">' +
      '<div class="thumb"><svg viewBox="0 0 24 24" fill="none" stroke="#0D5C32" stroke-width="1.6"><path d="M8 5v14l11-7z"/></svg></div>' +
      '<div class="info"><h4>' + escapeHtml(s.title) + '</h4><p>' + escapeHtml(s.preacher) + ' · ' + escapeHtml(s.category) + ' · ' + formatDate(s.sermon_date) + ' · ' + sourceTag + '</p></div>' +
      '<div class="actions">' +
      '<button class="icon-btn edit" onclick="editSermon(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>' +
      '<button class="icon-btn danger" onclick="deleteSermon(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="#C42F2F" stroke-width="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' +
      '</div></div>';
  }).join('');
}

window.editSermon = async function (id) {
  const { data } = await supabaseClient.from('sermons').select('*').eq('id', id).single();
  if (!data) return;
  document.getElementById('sermonId').value = data.id;
  document.getElementById('sermonTitle').value = data.title;
  document.getElementById('sermonPreacher').value = data.preacher;
  document.getElementById('sermonCategory').value = data.category;
  document.getElementById('sermonDate').value = data.sermon_date;
  document.getElementById('sermonYoutube').value = data.youtube_url;
  document.getElementById('sermonDescription').value = data.description || '';

  // If the stored video is a direct upload (Supabase storage URL), show the upload field; otherwise show the YouTube field.
  const isDirectUpload = data.youtube_url && data.youtube_url.indexOf('supabase') !== -1;
  sermonSourceType.value = isDirectUpload ? 'upload' : 'youtube';
  sermonYoutubeField.style.display = isDirectUpload ? 'none' : 'block';
  sermonFileField.style.display = isDirectUpload ? 'block' : 'none';

  document.getElementById('sermonFormTitle').textContent = 'Edit Sermon';
  sermonSaveBtn.textContent = 'Save Changes';
  sermonCancelBtn.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteSermon = async function (id) {
  if (!confirm('Delete this sermon? This cannot be undone.')) return;
  const { error } = await supabaseClient.from('sermons').delete().eq('id', id);
  if (error) { showToast('Error deleting: ' + error.message, true); return; }
  showToast('Sermon deleted');
  loadSermons();
};

sermonCancelBtn.addEventListener('click', resetSermonForm);

const sermonSourceType = document.getElementById('sermonSourceType');
const sermonYoutubeField = document.getElementById('sermonYoutubeField');
const sermonFileField = document.getElementById('sermonFileField');

sermonSourceType.addEventListener('change', function () {
  if (sermonSourceType.value === 'upload') {
    sermonYoutubeField.style.display = 'none';
    sermonFileField.style.display = 'block';
  } else {
    sermonYoutubeField.style.display = 'block';
    sermonFileField.style.display = 'none';
  }
});

function resetSermonForm() {
  document.getElementById('sermonId').value = '';
  document.getElementById('sermonTitle').value = '';
  document.getElementById('sermonPreacher').value = '';
  document.getElementById('sermonCategory').value = 'Sunday Service';
  document.getElementById('sermonDate').value = '';
  document.getElementById('sermonYoutube').value = '';
  document.getElementById('sermonFile').value = '';
  document.getElementById('sermonDescription').value = '';
  sermonSourceType.value = 'youtube';
  sermonYoutubeField.style.display = 'block';
  sermonFileField.style.display = 'none';
  document.getElementById('sermonFormTitle').textContent = 'Add New Sermon';
  sermonSaveBtn.textContent = 'Add Sermon';
  sermonCancelBtn.style.display = 'none';
}

function uploadVideoWithProgress(file, onProgress) {
  return new Promise(async function (resolve, reject) {
    if (!file) {
      reject(new Error('No video file selected'));
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      reject(new Error('Video too large. Maximum size is ' + (MAX_VIDEO_SIZE / (1024 * 1024)) + 'MB.'));
      return;
    }
    const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!ALLOWED_VIDEO_EXTS.includes(ext)) {
      reject(new Error('Invalid video type (.' + ext + '). Allowed formats: MP4, WEBM, MOV, M4V.'));
      return;
    }
    if (file.type && !ALLOWED_VIDEO_MIMES.includes(file.type.toLowerCase())) {
      reject(new Error('Invalid video format (' + file.type + ').'));
      return;
    }

    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (!sessionData || !sessionData.session || !sessionData.session.access_token) {
        reject(new Error('Admin session expired or unauthenticated. Please log in again.'));
        return;
      }
      const accessToken = sessionData.session.access_token;
      const cleanName = Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;
      const path = 'sermons/' + cleanName;
      const uploadUrl = SUPABASE_URL + '/storage/v1/object/media/' + path;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xhr.setRequestHeader('Content-Type', file.type || 'video/' + ext);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      xhr.addEventListener('load', function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          const publicUrl = SUPABASE_URL + '/storage/v1/object/public/media/' + path;
          resolve(publicUrl);
        } else {
          var msg = 'Upload failed (status ' + xhr.status + ')';
          try {
            var parsed = JSON.parse(xhr.responseText);
            msg = parsed.message || parsed.error || msg;
          } catch(e) {}
          reject(new Error(msg));
        }
      });
      xhr.addEventListener('error', function () { reject(new Error('Network error during upload')); });
      xhr.send(file);
    } catch (err) {
      reject(err);
    }
  });
}

sermonSaveBtn.addEventListener('click', async function () {
  if (!isConfigured()) { showToast('Connect Supabase first', true); return; }
  const id = document.getElementById('sermonId').value;
  const isUpload = sermonSourceType.value === 'upload';
  const fileInput = document.getElementById('sermonFile');

  const basePayload = {
    title: document.getElementById('sermonTitle').value.trim(),
    preacher: document.getElementById('sermonPreacher').value.trim(),
    category: document.getElementById('sermonCategory').value,
    sermon_date: document.getElementById('sermonDate').value,
    description: document.getElementById('sermonDescription').value.trim()
  };

  if (!basePayload.title || !basePayload.preacher || !basePayload.sermon_date) {
    showToast('Please fill in title, preacher, and date', true);
    return;
  }

  let videoUrl = document.getElementById('sermonYoutube').value.trim();

  if (isUpload) {
    if (!fileInput.files || !fileInput.files[0]) {
      if (!id) {
        showToast('Please choose a video file to upload', true);
        return;
      }
      // editing without choosing a new file — keep existing youtube_url value as-is
      const { data: existing } = await supabaseClient.from('sermons').select('youtube_url').eq('id', id).single();
      if (existing) videoUrl = existing.youtube_url;
    } else {
      const btn = this;
      const originalText = btn.textContent;
      btn.disabled = true;

      // Show progress UI
      const progressWrap = document.getElementById('sermonUploadProgress');
      const progressBar = document.getElementById('sermonProgressBar');
      const progressPct = document.getElementById('sermonProgressPct');
      if (progressWrap) progressWrap.style.display = 'block';

      try {
        videoUrl = await uploadVideoWithProgress(fileInput.files[0], function (pct) {
          btn.textContent = 'Uploading… ' + pct + '%';
          if (progressBar) progressBar.style.width = pct + '%';
          if (progressPct) progressPct.textContent = pct + '%';
        });
        btn.textContent = 'Finalising…';
      } catch (err) {
        showToast('Video upload failed: ' + err.message, true);
        btn.disabled = false;
        btn.textContent = originalText;
        if (progressWrap) progressWrap.style.display = 'none';
        return;
      }
      btn.disabled = false;
      btn.textContent = originalText;
      if (progressWrap) progressWrap.style.display = 'none';
    }
  }

  if (!videoUrl) {
    showToast('Please provide a YouTube link or upload a video file', true);
    return;
  }

  const payload = Object.assign({}, basePayload, { youtube_url: videoUrl });

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('sermons').update(payload).eq('id', id));
  } else {
    ({ error } = await supabaseClient.from('sermons').insert([payload]));
  }
  if (error) { showToast('Error saving sermon: ' + error.message, true); return; }
  showToast(id ? 'Sermon updated ✓' : 'Sermon added ✓');
  resetSermonForm();
  loadSermons();
});

// ============================================================
// EVENTS
// ============================================================
const eventSaveBtn = document.getElementById('eventSaveBtn');
const eventCancelBtn = document.getElementById('eventCancelBtn');

async function loadEvents() {
  const list = document.getElementById('eventList');
  if (!isConfigured()) { list.innerHTML = '<div class="empty-state">Connect Supabase to see events here.</div>'; return; }
  const { data, error } = await supabaseClient.from('events').select('*').order('event_date', { ascending: true });
  if (error) { showToast('Error loading events: ' + error.message, true); return; }
  if (!data || data.length === 0) { list.innerHTML = '<div class="empty-state">No events yet. Add your first one!</div>'; return; }
  list.innerHTML = data.map(function (e) {
    var safeId = sanitizeId(e.id);
    var safeImg = sanitizeUrl(e.image_url);
    var thumb = safeImg
      ? '<div class="thumb" style="background-image:url(\'' + safeImg + '\'); background-size:cover; background-position:center;"></div>'
      : '<div class="thumb"><svg viewBox="0 0 24 24" fill="none" stroke="#0D5C32" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>';
    return '<div class="item-row">' +
      thumb +
      '<div class="info"><h4>' + escapeHtml(e.title) + '</h4><p>' + formatDate(e.event_date) + (e.start_time ? ' · ' + escapeHtml(e.start_time) + (e.end_time ? '–' + escapeHtml(e.end_time) : '') : '') + ' · ' + escapeHtml(e.location || '') + '</p></div>' +
      '<div class="actions">' +
      '<button class="icon-btn edit" onclick="editEvent(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>' +
      '<button class="icon-btn danger" onclick="deleteEvent(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="#C42F2F" stroke-width="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' +
      '</div></div>';
  }).join('');
}

let existingEventImage = '';

window.editEvent = async function (id) {
  const { data } = await supabaseClient.from('events').select('*').eq('id', id).single();
  if (!data) return;
  document.getElementById('eventId').value = data.id;
  document.getElementById('eventTitle').value = data.title;
  document.getElementById('eventDate').value = data.event_date;
  document.getElementById('eventStart').value = data.start_time || '';
  document.getElementById('eventEnd').value = data.end_time || '';
  document.getElementById('eventLocation').value = data.location || '';
  document.getElementById('eventDescription').value = data.description || '';
  existingEventImage = data.image_url || '';
  document.getElementById('eventFormTitle').textContent = 'Edit Event';
  eventSaveBtn.textContent = 'Save Changes';
  eventCancelBtn.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteEvent = async function (id) {
  if (!confirm('Delete this event?')) return;
  const { error } = await supabaseClient.from('events').delete().eq('id', id);
  if (error) { showToast('Error deleting: ' + error.message, true); return; }
  showToast('Event deleted');
  loadEvents();
};

eventCancelBtn.addEventListener('click', resetEventForm);

function resetEventForm() {
  document.getElementById('eventId').value = '';
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventDate').value = '';
  document.getElementById('eventStart').value = '';
  document.getElementById('eventEnd').value = '';
  document.getElementById('eventLocation').value = '';
  document.getElementById('eventDescription').value = '';
  document.getElementById('eventFile').value = '';
  existingEventImage = '';
  document.getElementById('eventFormTitle').textContent = 'Add New Event';
  eventSaveBtn.textContent = 'Add Event';
  eventCancelBtn.style.display = 'none';
}

eventSaveBtn.addEventListener('click', async function () {
  if (!isConfigured()) { showToast('Connect Supabase first', true); return; }
  const id = document.getElementById('eventId').value;
  const fileInput = document.getElementById('eventFile');
  const title = document.getElementById('eventTitle').value.trim();
  const event_date = document.getElementById('eventDate').value;
  const start_time = document.getElementById('eventStart').value.trim();
  const end_time = document.getElementById('eventEnd').value.trim();
  const location = document.getElementById('eventLocation').value.trim();
  const description = document.getElementById('eventDescription').value.trim();

  if (!title || !event_date) {
    showToast('Please fill in at least the title and date', true);
    return;
  }

  const btn = this;
  const originalText = btn.textContent;
  btn.disabled = true;

  try {
    let image_url = existingEventImage || null;
    if (fileInput.files && fileInput.files[0]) {
      btn.textContent = 'Uploading image…';
      image_url = await uploadImage(fileInput.files[0]);
    }
    const payload = { title, event_date, start_time, end_time, location, description, image_url };
    let dbError;
    if (id) {
      const result = await supabaseClient.from('events').update(payload).eq('id', id);
      dbError = result.error;
    } else {
      const result = await supabaseClient.from('events').insert([payload]);
      dbError = result.error;
    }
    if (dbError) throw dbError;
    showToast(id ? 'Event updated ✓' : 'Event added ✓');
    resetEventForm();
    loadEvents();
  } catch (err) {
    showToast('Error saving event: ' + err.message, true);
    console.error('[LICC Events] Save error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ============================================================
// GALLERY
// ============================================================
function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = isError ? '#C42F2F' : '#1A9B52';
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 3000);
}

// ============================================================
// MESSAGES
// ============================================================
async function loadMessages() {
  const list = document.getElementById('messagesList');
  if (!isConfigured()) { list.innerHTML = '<div class="empty-state">Connect Supabase to see messages here.</div>'; return; }
  const { data, error } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Error loading messages: ' + error.message, true); return; }
  if (!data || data.length === 0) { list.innerHTML = '<div class="empty-state">No messages yet. When people use the contact form, they will appear here!</div>'; return; }
  list.innerHTML = data.map(function (m) {
    const safeId = sanitizeId(m.id);
    const isUnread = !m.read;
    const cardClass = isUnread ? 'message-card unread' : 'message-card';
    const dateStr = new Date(m.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    return '<div class="' + cardClass + '" style="margin-bottom: 16px;">' +
      '<div class="message-header">' +
      '<div>' +
      '<div class="message-sender">' + escapeHtml(m.name) + '</div>' +
      '<div class="message-meta">' + escapeHtml(m.email) + (m.phone ? ' · ' + escapeHtml(m.phone) : '') + ' · ' + dateStr + '</div>' +
      '</div>' +
      (isUnread ? '<span style="background:var(--gold);color:white;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:100px;text-transform:uppercase;">New</span>' : '') +
      '</div>' +
      (m.reason ? '<div class="message-reason">' + escapeHtml(m.reason) + '</div>' : '') +
      '<div class="message-body">' + escapeHtml(m.message).replace(/\n/g, '<br>') + '</div>' +
      '<div class="message-actions">' +
      (isUnread ? '<button class="btn btn-outline" style="padding:6px 14px;font-size:0.8rem;" onclick="markMessageRead(\'' + safeId + '\')">Mark as Read</button>' : '') +
      '<button class="btn" style="background:#C42F2F;color:white;border:none;padding:6px 14px;font-size:0.8rem;" onclick="deleteMessage(\'' + safeId + '\')">Delete</button>' +
      '</div></div>';
  }).join('');
}

window.markMessageRead = async function (id) {
  const { error } = await supabaseClient.from('messages').update({ read: true }).eq('id', id);
  if (error) { showToast('Error marking message as read: ' + error.message, true); return; }
  loadMessages();
};

window.deleteMessage = async function (id) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  const { error } = await supabaseClient.from('messages').delete().eq('id', id);
  if (error) { showToast('Error deleting message: ' + error.message, true); return; }
  showToast('Message deleted');
  loadMessages();
};

async function loadGallery() {
  const list = document.getElementById('galleryList');
  if (!isConfigured()) { list.innerHTML = '<div class="empty-state">Connect Supabase to see gallery photos here.</div>'; return; }
  const { data, error } = await supabaseClient.from('gallery').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Error loading gallery: ' + error.message, true); return; }
  if (!data || data.length === 0) { list.innerHTML = '<div class="empty-state">No photos yet. Upload your first one!</div>'; return; }
  list.innerHTML = data.map(function (g) {
    var safeId = sanitizeId(g.id);
    var safeImg = sanitizeUrl(g.image_url);
    var thumbHtml = safeImg
      ? '<div class="thumb" style="background-image:url(\'' + safeImg + '\')"></div>'
      : '<div class="thumb"><svg viewBox="0 0 24 24" fill="none" stroke="#0D5C32" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>';
    return '<div class="item-row">' +
      thumbHtml +
      '<div class="info"><h4>' + escapeHtml(g.caption || 'Untitled photo') + '</h4><p>Added ' + formatDate(g.created_at ? g.created_at.split('T')[0] : '') + '</p></div>' +
      '<div class="actions">' +
      '<button class="icon-btn danger" onclick="deleteGalleryItem(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="#C42F2F" stroke-width="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' +
      '</div></div>';
  }).join('');
}

window.deleteGalleryItem = async function (id) {
  if (!confirm('Delete this photo?')) return;
  const { error } = await supabaseClient.from('gallery').delete().eq('id', id);
  if (error) { showToast('Error deleting: ' + error.message, true); return; }
  showToast('Photo deleted');
  loadGallery();
};

const galleryFileInput = document.getElementById('galleryFile');
const galleryFileCount = document.getElementById('galleryFileCount');
if (galleryFileInput && galleryFileCount) {
  galleryFileInput.addEventListener('change', function () {
    const files = this.files;
    if (!files || files.length === 0) {
      galleryFileCount.style.display = 'none';
      galleryFileCount.textContent = '';
      return;
    }
    const totalBytes = Array.from(files).reduce((acc, f) => acc + f.size, 0);
    const mbStr = (totalBytes / (1024 * 1024)).toFixed(1);
    galleryFileCount.textContent = `Selected: ${files.length} photo${files.length === 1 ? '' : 's'} (${mbStr} MB total)`;
    galleryFileCount.style.display = 'block';
  });
}

document.getElementById('gallerySaveBtn').addEventListener('click', async function () {
  if (!isConfigured()) { showToast('Connect Supabase first', true); return; }
  const fileInput = document.getElementById('galleryFile');
  const caption = document.getElementById('galleryCaption').value.trim();
  const files = fileInput.files;
  if (!files || files.length === 0) {
    showToast('Please choose at least one photo to upload', true);
    return;
  }

  const btn = this;
  const progressWrap = document.getElementById('galleryUploadProgress');
  const progressBar = document.getElementById('galleryProgressBar');
  const progressPct = document.getElementById('galleryProgressPct');
  const progressStatus = document.getElementById('galleryProgressStatus');

  btn.textContent = 'Uploading…';
  btn.disabled = true;
  if (progressWrap) progressWrap.style.display = 'block';

  try {
    const records = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      if (progressStatus) progressStatus.textContent = `Uploading photo ${i + 1} of ${total}…`;
      const pct = Math.round((i / total) * 100);
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';

      const url = await uploadImage(file);
      records.push({ image_url: url, caption: caption });
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressPct) progressPct.textContent = '100%';
    if (progressStatus) progressStatus.textContent = 'Saving to gallery…';

    const { error } = await supabaseClient.from('gallery').insert(records);
    if (error) throw error;

    showToast(total === 1 ? 'Photo uploaded successfully' : `Successfully uploaded ${total} photos!`);
    fileInput.value = '';
    document.getElementById('galleryCaption').value = '';
    if (galleryFileCount) galleryFileCount.style.display = 'none';
    loadGallery();
  } catch (err) {
    showToast('Upload failed: ' + err.message, true);
  } finally {
    btn.textContent = 'Upload Photos';
    btn.disabled = false;
    setTimeout(function () {
      if (progressWrap) progressWrap.style.display = 'none';
      if (progressBar) progressBar.style.width = '0%';
      if (progressPct) progressPct.textContent = '0%';
    }, 1200);
  }
});

// ============================================================
// NEWS
// ============================================================
const newsSaveBtn = document.getElementById('newsSaveBtn');
const newsCancelBtn = document.getElementById('newsCancelBtn');
let existingNewsImage = '';

async function loadNews() {
  const list = document.getElementById('newsList');
  if (!isConfigured()) { list.innerHTML = '<div class="empty-state">Connect Supabase to see news posts here.</div>'; return; }
  const { data, error } = await supabaseClient.from('news').select('*').order('published_date', { ascending: false });
  if (error) { showToast('Error loading news: ' + error.message, true); return; }
  if (!data || data.length === 0) { list.innerHTML = '<div class="empty-state">No posts yet. Publish your first one!</div>'; return; }
  list.innerHTML = data.map(function (n) {
    var safeId = sanitizeId(n.id);
    var safeImg = sanitizeUrl(n.image_url);
    return '<div class="item-row">' +
      '<div class="thumb"' + (safeImg ? ' style="background-image:url(\'' + safeImg + '\')"' : '') + '>' +
      (safeImg ? '' : '<svg viewBox="0 0 24 24" fill="none" stroke="#0D5C32" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>') +
      '</div>' +
      '<div class="info"><h4>' + escapeHtml(n.title) + '</h4><p>' + escapeHtml(n.author) + ' · ' + formatDate(n.published_date) + '</p></div>' +
      '<div class="actions">' +
      '<button class="icon-btn edit" onclick="editNews(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>' +
      '<button class="icon-btn danger" onclick="deleteNews(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="#C42F2F" stroke-width="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' +
      '</div></div>';
  }).join('');
}

window.editNews = async function (id) {
  const { data } = await supabaseClient.from('news').select('*').eq('id', id).single();
  if (!data) return;
  document.getElementById('newsId').value = data.id;
  document.getElementById('newsTitle').value = data.title;
  document.getElementById('newsAuthor').value = data.author;
  document.getElementById('newsDate').value = data.published_date;
  document.getElementById('newsBody').value = data.body;
  existingNewsImage = data.image_url || '';
  document.getElementById('newsFormTitle').textContent = 'Edit Post';
  newsSaveBtn.textContent = 'Save Changes';
  newsCancelBtn.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteNews = async function (id) {
  if (!confirm('Delete this post?')) return;
  const { error } = await supabaseClient.from('news').delete().eq('id', id);
  if (error) { showToast('Error deleting: ' + error.message, true); return; }
  showToast('Post deleted');
  loadNews();
};

newsCancelBtn.addEventListener('click', resetNewsForm);

function resetNewsForm() {
  document.getElementById('newsId').value = '';
  document.getElementById('newsTitle').value = '';
  document.getElementById('newsAuthor').value = 'LICC Admin';
  document.getElementById('newsDate').value = '';
  document.getElementById('newsFile').value = '';
  document.getElementById('newsBody').value = '';
  existingNewsImage = '';
  document.getElementById('newsFormTitle').textContent = 'Add New Post';
  newsSaveBtn.textContent = 'Publish Post';
  newsCancelBtn.style.display = 'none';
}

newsSaveBtn.addEventListener('click', async function () {
  if (!isConfigured()) { showToast('Connect Supabase first', true); return; }
  const id = document.getElementById('newsId').value;
  const title = document.getElementById('newsTitle').value.trim();
  const author = document.getElementById('newsAuthor').value.trim() || 'LICC Admin';
  const published_date = document.getElementById('newsDate').value || new Date().toISOString().slice(0, 10);
  const body = document.getElementById('newsBody').value.trim();
  const fileInput = document.getElementById('newsFile');

  if (!title || !body) {
    showToast('Please fill in a title and post content', true);
    return;
  }

  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    let image_url = existingNewsImage;
    if (fileInput.files && fileInput.files[0]) {
      image_url = await uploadImage(fileInput.files[0]);
    }
    const payload = { title, author, published_date, body, image_url };
    let error;
    if (id) {
      ({ error } = await supabaseClient.from('news').update(payload).eq('id', id));
    } else {
      ({ error } = await supabaseClient.from('news').insert(payload));
    }
    if (error) throw error;
    showToast(id ? 'Post updated' : 'Post published');
    resetNewsForm();
    loadNews();
  } catch (err) {
    showToast('Error saving: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = id ? 'Save Changes' : 'Publish Post';
  }
});

// ---------- BRANCHES ----------
let adminBranchesData = [];
const branchesList = document.getElementById('branchesList');
const branchSaveBtn = document.getElementById('branchSaveBtn');
const branchCancelBtn = document.getElementById('branchCancelBtn');

async function loadAdminBranches() {
  if (!isConfigured() || !branchesList) return;
  branchesList.innerHTML = '<div class="empty-state">Loading campuses…</div>';

  try {
    const { data, error } = await supabaseClient
      .from('branches')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      branchesList.innerHTML = '<div class="empty-state">No "branches" table found in Supabase yet.<br><small style="color:var(--ink-soft); display:block; margin-top:8px;">Run the updated <code>supabase-schema.sql</code> in your Supabase SQL editor to create the table.</small></div>';
      return;
    }

    adminBranchesData = data || [];
    if (adminBranchesData.length === 0) {
      branchesList.innerHTML = '<div class="empty-state">No custom branches in database yet. The website is currently displaying the default church directory (Headquarters, Choba, Peter Odili, Oyigbo, Abuja, Lagos, and Online). Add a branch above to customize it!</div>';
      return;
    }

    branchesList.innerHTML = adminBranchesData.map(function (b) {
      var safeId = sanitizeId(b.id);
      return '<div class="item-row">' +
        '<div class="thumb" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--bg-warm-2);">' +
          '<span style="font-size:1.4rem;">🏛️</span>' +
          '<span style="font-size:0.68rem; font-weight:700; color:var(--green-deep); margin-top:2px; text-transform:uppercase;">' + escapeHtml(b.tag || 'Campus') + '</span>' +
        '</div>' +
        '<div class="item-info">' +
          '<h4>' + escapeHtml(b.name) + '</h4>' +
          '<p>' + (b.pastor ? '<strong>' + escapeHtml(b.pastor) + '</strong> &middot; ' : '') + escapeHtml(b.address) + (b.city ? ', ' + escapeHtml(b.city) : '') + '</p>' +
          (b.phone ? '<p style="font-size:0.82rem; color:var(--green-deep); margin-top:3px;">📞 ' + escapeHtml(b.phone) + '</p>' : '') +
          (b.service_times ? '<p style="font-size:0.8rem; color:var(--ink-soft); margin-top:2px;">🕒 ' + escapeHtml(b.service_times) + '</p>' : '') +
        '</div>' +
        '<div class="item-actions">' +
          '<button class="icon-btn edit" onclick="editBranch(\'' + safeId + '\')" title="Edit">&#9998;</button>' +
          '<button class="icon-btn danger" onclick="deleteBranch(\'' + safeId + '\')" title="Delete">&#128465;</button>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch (err) {
    branchesList.innerHTML = '<div class="empty-state">Error loading branches: ' + escapeHtml(err.message) + '</div>';
  }
}

window.editBranch = function (id) {
  const b = adminBranchesData.find(function (item) { return item.id === id; });
  if (!b) return;

  document.getElementById('branchId').value = b.id;
  document.getElementById('branchName').value = b.name || '';
  document.getElementById('branchTag').value = b.tag || 'City Campus';
  document.getElementById('branchOrder').value = b.display_order || 0;
  document.getElementById('branchPastor').value = b.pastor || '';
  document.getElementById('branchAddress').value = b.address || '';
  document.getElementById('branchCity').value = b.city || 'Port Harcourt';
  document.getElementById('branchState').value = b.state || 'Rivers State';
  document.getElementById('branchPhone').value = b.phone || '';
  document.getElementById('branchWhatsapp').value = b.whatsapp || '';
  document.getElementById('branchServiceTimes').value = b.service_times || '';
  document.getElementById('branchMapsUrl').value = b.google_maps_url || '';

  document.getElementById('branchFormTitle').textContent = 'Edit Branch';
  branchSaveBtn.textContent = 'Save Changes';
  branchCancelBtn.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteBranch = async function (id) {
  if (!confirm('Are you sure you want to delete this branch?')) return;
  const { error } = await supabaseClient.from('branches').delete().eq('id', id);
  if (error) {
    showToast('Error deleting branch: ' + error.message, true);
    return;
  }
  showToast('Branch deleted');
  loadAdminBranches();
};

function resetBranchForm() {
  document.getElementById('branchId').value = '';
  document.getElementById('branchName').value = '';
  document.getElementById('branchTag').value = 'City Campus';
  document.getElementById('branchOrder').value = '0';
  document.getElementById('branchPastor').value = '';
  document.getElementById('branchAddress').value = '';
  document.getElementById('branchCity').value = 'Port Harcourt';
  document.getElementById('branchState').value = 'Rivers State';
  document.getElementById('branchPhone').value = '';
  document.getElementById('branchWhatsapp').value = '';
  document.getElementById('branchServiceTimes').value = '';
  document.getElementById('branchMapsUrl').value = '';

  document.getElementById('branchFormTitle').textContent = 'Add New Branch';
  branchSaveBtn.textContent = 'Save Branch';
  branchCancelBtn.style.display = 'none';
}

if (branchCancelBtn) {
  branchCancelBtn.addEventListener('click', resetBranchForm);
}

if (branchSaveBtn) {
  branchSaveBtn.addEventListener('click', async function () {
    if (!isConfigured()) { showToast('Connect Supabase first', true); return; }
    const id = document.getElementById('branchId').value;
    const name = document.getElementById('branchName').value.trim();
    const tag = document.getElementById('branchTag').value;
    const display_order = parseInt(document.getElementById('branchOrder').value, 10) || 0;
    const pastor = document.getElementById('branchPastor').value.trim();
    const address = document.getElementById('branchAddress').value.trim();
    const city = document.getElementById('branchCity').value.trim();
    const state = document.getElementById('branchState').value.trim();
    const phone = document.getElementById('branchPhone').value.trim();
    const whatsapp = document.getElementById('branchWhatsapp').value.trim();
    const service_times = document.getElementById('branchServiceTimes').value.trim();
    const google_maps_url = document.getElementById('branchMapsUrl').value.trim();

    if (!name || !address) {
      showToast('Please fill in the Branch Name and Address', true);
      return;
    }

    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      const payload = {
        name, tag, display_order, pastor, address, city, state, phone, whatsapp, service_times, google_maps_url
      };
      let error;
      if (id) {
        ({ error } = await supabaseClient.from('branches').update(payload).eq('id', id));
      } else {
        ({ error } = await supabaseClient.from('branches').insert(payload));
      }
      if (error) throw error;
      showToast(id ? 'Branch updated' : 'Branch added successfully');
      resetBranchForm();
      loadAdminBranches();
    } catch (err) {
      showToast('Error saving branch: ' + err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = id ? 'Save Changes' : 'Save Branch';
    }
  });
}

// ============================================================
// QUOTES
// ============================================================
const quoteSaveBtn = document.getElementById('quoteSaveBtn');
const quoteCancelBtn = document.getElementById('quoteCancelBtn');

async function loadQuotes() {
  const list = document.getElementById('quoteList');
  if (!isConfigured()) { list.innerHTML = '<div class="empty-state">Connect Supabase to see quotes here.</div>'; return; }
  const { data, error } = await supabaseClient.from('quotes').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Error loading quotes: ' + error.message, true); return; }
  if (!data || data.length === 0) { list.innerHTML = '<div class="empty-state">No quotes yet. Add your first one!</div>'; return; }
  list.innerHTML = data.map(function (q) {
    var safeId = sanitizeId(q.id);
    var statusBadge = q.active
      ? '<span style="background:#1A9B52;color:white;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:100px;">Active</span>'
      : '<span style="background:#ccc;color:#555;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:100px;">Inactive</span>';
    return '<div class="item-row">' +
      '<div class="thumb" style="font-size:1.8rem; display:flex; align-items:center; justify-content:center; background:var(--bg-warm-2);">\u201C</div>' +
      '<div class="info"><h4>' + escapeHtml(q.quote_text.substring(0, 80)) + (q.quote_text.length > 80 ? '…' : '') + '</h4>' +
      '<p>' + escapeHtml(q.author_name) + (q.author_role ? ' · ' + escapeHtml(q.author_role) : '') + ' &nbsp;' + statusBadge + '</p></div>' +
      '<div class="actions">' +
      '<button class="icon-btn edit" onclick="editQuote(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>' +
      '<button class="icon-btn danger" onclick="deleteQuote(\'' + safeId + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="#C42F2F" stroke-width="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' +
      '</div></div>';
  }).join('');
}

window.editQuote = async function (id) {
  const { data } = await supabaseClient.from('quotes').select('*').eq('id', id).single();
  if (!data) return;
  document.getElementById('quoteId').value = data.id;
  document.getElementById('quoteText').value = data.quote_text;
  document.getElementById('quoteAuthor').value = data.author_name;
  document.getElementById('quoteRole').value = data.author_role || '';
  document.getElementById('quoteActive').value = data.active ? 'true' : 'false';
  document.getElementById('quoteFormTitle').textContent = 'Edit Quote';
  quoteSaveBtn.textContent = 'Save Changes';
  quoteCancelBtn.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteQuote = async function (id) {
  if (!confirm('Delete this quote?')) return;
  const { error } = await supabaseClient.from('quotes').delete().eq('id', id);
  if (error) { showToast('Error deleting: ' + error.message, true); return; }
  showToast('Quote deleted');
  loadQuotes();
};

function resetQuoteForm() {
  document.getElementById('quoteId').value = '';
  document.getElementById('quoteText').value = '';
  document.getElementById('quoteAuthor').value = '';
  document.getElementById('quoteRole').value = '';
  document.getElementById('quoteActive').value = 'true';
  document.getElementById('quoteFormTitle').textContent = 'Add New Quote';
  quoteSaveBtn.textContent = 'Add Quote';
  quoteCancelBtn.style.display = 'none';
}

if (quoteCancelBtn) quoteCancelBtn.addEventListener('click', resetQuoteForm);

if (quoteSaveBtn) {
  quoteSaveBtn.addEventListener('click', async function () {
    if (!isConfigured()) { showToast('Connect Supabase first', true); return; }
    const id = document.getElementById('quoteId').value;
    const quote_text = document.getElementById('quoteText').value.trim();
    const author_name = document.getElementById('quoteAuthor').value.trim();
    const author_role = document.getElementById('quoteRole').value.trim();
    const active = document.getElementById('quoteActive').value === 'true';

    if (!quote_text || !author_name) {
      showToast('Please fill in the quote text and author name', true);
      return;
    }

    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      const payload = { quote_text, author_name, author_role, active };
      let error;
      if (id) {
        ({ error } = await supabaseClient.from('quotes').update(payload).eq('id', id));
      } else {
        ({ error } = await supabaseClient.from('quotes').insert(payload));
      }
      if (error) throw error;
      showToast(id ? 'Quote updated ✓' : 'Quote added ✓');
      resetQuoteForm();
      loadQuotes();
    } catch (err) {
      showToast('Error saving quote: ' + err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = id ? 'Save Changes' : 'Add Quote';
    }
  });
}

// ---------- INIT ----------
checkSession();