/*!
 * ASHITAMOHARE INC. — main.js
 * 依存ライブラリなし / ES2019 相当
 * 1. ヘッダーの状態切替      2. ドロワーナビ
 * 3. ページ内リンクの追従     4. スクロールスパイ
 * 5. 数値のカウントアップ     6. スクロール表示
 * 7. トップへ戻る            8. お問い合わせフォームの検証
 */
(function () {
  'use strict';

  var doc = document;
  var header = doc.getElementById('header');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------- 1. ヘッダー */
  function headerOffset() {
    return header ? header.offsetHeight : 0;
  }

  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  /* ---------------------------------------- 2. ドロワーナビ */
  var toggle = doc.getElementById('navToggle');
  var gnav = doc.getElementById('gnav');

  function closeNav() {
    if (!toggle || !gnav) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    gnav.classList.remove('is-open');
    doc.body.style.overflow = '';
  }

  if (toggle && gnav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) {
        closeNav();
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'メニューを閉じる');
        gnav.classList.add('is-open');
      }
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ---------------------------------------- 3. ページ内リンク */
  function scrollToTarget(target) {
    var top = target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  Array.prototype.forEach.call(doc.querySelectorAll('a[href*="#"]'), function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      var hash = href.indexOf('#') === 0 ? href : null;

      /* 別ページへのリンク（/#services 等）はそのまま遷移させる */
      if (!hash) {
        var url = new URL(link.href, location.href);
        if (url.pathname !== location.pathname) return;
        hash = '#' + url.hash.replace('#', '');
      }
      if (hash === '#') return;

      var target = doc.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      closeNav();
      scrollToTarget(target);
      history.replaceState(null, '', hash);
      /* キーボード操作でも読み上げ位置が移るようにする */
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ページ読み込み時にハッシュがある場合の位置補正 */
  window.addEventListener('load', function () {
    if (!location.hash) return;
    var target = doc.querySelector(location.hash);
    if (target) setTimeout(function () { scrollToTarget(target); }, 60);
  });

  /* ---------------------------------------- 4. スクロールスパイ */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.gnav__link[href^="#"]'));
  var sections = navLinks
    .map(function (l) { return doc.querySelector(l.getAttribute('href')); })
    .filter(Boolean);

  function spy() {
    var line = window.scrollY + headerOffset() + 24;
    var currentId = '';
    sections.forEach(function (sec) {
      if (sec.offsetTop <= line) currentId = sec.id;
    });
    /* ページ最下部ではお問い合わせを現在地とみなす */
    if (window.innerHeight + window.scrollY >= doc.body.offsetHeight - 4 && sections.length) {
      currentId = sections[sections.length - 1].id;
    }
    navLinks.forEach(function (l) {
      var isCurrent = l.getAttribute('href') === '#' + currentId;
      l.classList.toggle('is-current', isCurrent);
      if (isCurrent) {
        l.setAttribute('aria-current', 'true');
      } else {
        l.removeAttribute('aria-current');
      }
    });
  }

  /* ---------------------------------------- 5. カウントアップ */
  function countUp(el) {
    var goal = parseInt(el.dataset.count, 10);
    if (isNaN(goal) || reduceMotion) return;
    var duration = 1100;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(goal * eased).toLocaleString('ja-JP');
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = '0';
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------- 6. スクロール表示 */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(doc.querySelectorAll('.reveal'), function (el) {
      revealObserver.observe(el);
    });

    var statsBlock = doc.getElementById('stats');
    if (statsBlock) {
      var statsObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Array.prototype.forEach.call(entry.target.querySelectorAll('.js-count'), countUp);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      statsObserver.observe(statsBlock);
    }
  } else {
    Array.prototype.forEach.call(doc.querySelectorAll('.reveal'), function (el) {
      el.classList.add('is-in');
    });
  }

  /* ---------------------------------------- 7. トップへ戻る */
  var toTop = doc.getElementById('toTop');
  function onScrollToTop() {
    if (!toTop) return;
    toTop.classList.toggle('is-shown', window.scrollY > window.innerHeight * 0.9);
  }

  /* スクロール系の処理をまとめて間引く */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollHeader();
      onScrollToTop();
      if (sections.length) spy();
      ticking = false;
    });
  }, { passive: true });

  onScrollHeader();
  onScrollToTop();
  if (sections.length) spy();

  /* ---------------------------------------- 8. フォーム検証 */
  var form = doc.getElementById('contactForm');
  if (form) {
    var result = doc.getElementById('formResult');

    var messages = {
      company: '会社名を入力してください。',
      name: 'お名前を入力してください。',
      email: 'メールアドレスを正しい形式で入力してください。',
      detail: 'ご相談の概要を入力してください。'
    };

    function fieldError(field, message) {
      var box = form.querySelector('[data-error-for="' + field.id + '"]');
      if (box) box.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validate(field) {
      var value = (field.value || '').trim();
      var ok = field.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
        : value.length > 0;
      fieldError(field, ok ? '' : messages[field.name]);
      return ok;
    }

    var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
    required.forEach(function (field) {
      field.addEventListener('blur', function () { validate(field); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validate(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      required.forEach(function (field) {
        if (!validate(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        if (result) result.classList.remove('is-shown');
        firstInvalid.focus();
        return;
      }

      /* モックのため送信しません。実装時はここで fetch() を呼び出します。
         例：
         fetch('/api/contact', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(Object.fromEntries(new FormData(form)))
         })
      */
      if (result) {
        result.textContent = '入力内容を確認しました。これはモックページのため送信は行われません。実際のサイトでは、この後2営業日以内に担当者よりご連絡します。';
        result.classList.add('is-shown');
      }
    });
  }

  /* ---------------------------------------- 著作権表示の年 */
  var year = doc.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
