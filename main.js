// Mobile navigation toggle & Theme / Mood controls
document.addEventListener('DOMContentLoaded', function () {
  // 1. Theme Toggle
  initTheme();

  // 2. Spiritual Mood / Heart Toggle
  initMoodToggle();

  // 3. Mobile Nav
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  var overlay = document.querySelector('.nav-overlay');

  function closeNav() {
    nav.classList.remove('open');
    overlay.classList.remove('open');
    if (toggle) {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  function openNav() {
    nav.classList.add('open');
    overlay.classList.add('open');
    if (toggle) {
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }

  if (toggle && nav && overlay) {
    // Inject a close button inside the nav drawer
    if (!nav.querySelector('.nav-close-btn')) {
      var closeBtn = document.createElement('button');
      closeBtn.className = 'nav-close-btn';
      closeBtn.setAttribute('aria-label', 'Close menu');
      closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;width:38px;height:38px;border-radius:10px;border:1px solid rgba(26,155,82,0.2);background:rgba(255,255,255,0.7);align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px);';
      closeBtn.querySelector('svg').style.cssText = 'width:18px;height:18px;color:#0A4226;';
      closeBtn.addEventListener('click', closeNav);
      nav.insertBefore(closeBtn, nav.firstChild);
    }

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.contains('open');
      if (isOpen) { closeNav(); } else { openNav(); }
    });
    overlay.addEventListener('click', closeNav);
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeNav();
    });
  }

  // Header scroll shadow
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        header.style.boxShadow = '0 1px 0 rgba(255,255,255,0.55) inset, 0 6px 32px rgba(13, 92, 50, 0.12)';
      } else {
        header.style.boxShadow = '0 1px 0 rgba(255,255,255,0.55) inset, 0 4px 24px rgba(13, 92, 50, 0.07)';
      }
    }, { passive: true });
  }

  // Simple fade-up reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { obs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
});

// ============================================================
// CLEAN THEME MODE TOGGLE
// ============================================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('licc-theme', theme); } catch(e) {}
  document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

function initTheme() {
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('licc-theme'); } catch(e) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(currentTheme);

  var headerInner = document.querySelector('.header-inner');
  var navToggle = document.querySelector('.nav-toggle');

  if (headerInner) {
    var existingBtn = document.querySelector('.theme-toggle-btn');
    if (!existingBtn) {
      var actions = document.querySelector('.header-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'header-actions';
        if (navToggle) {
          navToggle.parentNode.insertBefore(actions, navToggle);
          actions.appendChild(navToggle);
        } else {
          headerInner.appendChild(actions);
        }
      }

      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'theme-toggle-btn';
      toggleBtn.setAttribute('aria-label', 'Toggle dark and light mode');
      toggleBtn.setAttribute('title', 'Switch theme (Dark / Light)');
      toggleBtn.innerHTML =
        '<svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="5"></circle>' +
          '<line x1="12" y1="1" x2="12" y2="3"></line>' +
          '<line x1="12" y1="21" x2="12" y2="23"></line>' +
          '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
          '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
          '<line x1="1" y1="12" x2="3" y2="12"></line>' +
          '<line x1="21" y1="12" x2="23" y2="12"></line>' +
          '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
          '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
        '</svg>' +
        '<svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
        '</svg>';

      actions.insertBefore(toggleBtn, actions.firstChild);
    }
  }
}

// Global delegated click handler for ALL theme toggle buttons
document.addEventListener('click', function (e) {
  var themeBtn = e.target.closest('.theme-toggle-btn');
  if (themeBtn) {
    e.preventDefault();
    e.stopPropagation();
    var activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }
});

// ============================================================
// SPIRITUAL MOOD / HEART ENCOURAGEMENT TOGGLE
// ============================================================
var moodsData = {
  peace: {
    verse: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."',
    ref: '— Philippians 4:6–7',
    prayer: '<strong>Prayer for Peace:</strong> "Lord, I lay down my worries and anxieties before You today. Grant me Your supernatural stillness that quiets every turbulent thought. Amen."'
  },
  thirsty: {
    verse: '"As the deer pants for streams of water, so my soul pants for you, my God. My soul thirsts for God, for the living God. When can I go and meet with God?"',
    ref: '— Psalm 42:1–2',
    prayer: '<strong>Prayer for Spiritual Thirst:</strong> "Father, fill me afresh with Your Holy Spirit. Let living water flow from my innermost being and revive every dry area of my life. Amen."'
  },
  grateful: {
    verse: '"Praise the Lord, my soul; all my inmost being, praise His holy name. Praise the Lord, my soul, and forget not all His benefits — who forgives all your sins and heals all your diseases."',
    ref: '— Psalm 103:1–3',
    prayer: '<strong>Prayer of Thanksgiving:</strong> "Lord, my heart is full of gratitude for Your faithfulness, Your mercy, and Your daily blessings. I worship You with all that is within me. Amen."'
  },
  strength: {
    verse: '"He gives strength to the weary and increases the power of the weak... those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary."',
    ref: '— Isaiah 40:29, 31',
    prayer: '<strong>Prayer for Strength:</strong> "Mighty God, when my own energy fails, You are my everlasting strength. Empower me to stand tall and walk boldly through this season. Amen."'
  },
  healing: {
    verse: '"Heal me, Lord, and I will be healed; save me and I will be saved, for you are the one I praise... Surely He took up our pain and bore our suffering."',
    ref: '— Jeremiah 17:14 & Isaiah 53:4',
    prayer: '<strong>Prayer for Healing:</strong> "Jehovah Rapha, You are my Healer. Touch my body, soul, and spirit with Your restoring hand and make me whole. Amen."'
  },
  direction: {
    verse: '"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him, and He will make your paths straight."',
    ref: '— Proverbs 3:5–6',
    prayer: '<strong>Prayer for Guidance:</strong> "Holy Spirit, lead my steps today. Give me clarity, wisdom, and the courage to follow Your divine direction. Amen."'
  }
};

function initMoodToggle() {
  // Global delegated click handler for mood pills
  document.addEventListener('click', function (e) {
    var pill = e.target.closest('.mood-pill');
    if (!pill) return;
    
    e.preventDefault();
    var key = pill.getAttribute('data-mood');
    var data = moodsData[key];
    if (!data) return;

    document.querySelectorAll('.mood-pill').forEach(function (p) {
      p.classList.remove('active');
    });
    pill.classList.add('active');

    var verseEl = document.getElementById('moodVerse');
    var refEl = document.getElementById('moodRef');
    var prayerEl = document.getElementById('moodPrayer');
    var boxEl = document.getElementById('moodContentBox');

    if (boxEl && verseEl && refEl && prayerEl) {
      boxEl.style.opacity = '0';
      boxEl.style.transform = 'translateY(6px)';
      setTimeout(function () {
        verseEl.textContent = data.verse;
        refEl.textContent = data.ref;
        prayerEl.innerHTML = data.prayer;
        boxEl.style.opacity = '1';
        boxEl.style.transform = 'translateY(0)';
      }, 150);
    }
  });
}


