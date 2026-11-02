(function(){
  var head = document.querySelector('.site-head');
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  var mq = window.matchMedia('(max-width: 760px)');

  function setMenu(open){
    nav.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    head.classList.toggle('is-open', open);
  }
  function syncNav(){
    if(mq.matches){ setMenu(false); }
    else { nav.hidden = false; head.classList.remove('is-open'); }
  }
  syncNav();
  mq.addEventListener('change', syncNav);

  btn.addEventListener('click', function(){ setMenu(nav.hidden); });
  nav.addEventListener('click', function(e){
    if(e.target.tagName === 'A' && mq.matches){ setMenu(false); }
  });
  // メニュー外のタップ・Esc で閉じる
  document.addEventListener('click', function(e){
    if(mq.matches && !nav.hidden && !head.contains(e.target)){ setMenu(false); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && mq.matches && !nav.hidden){ setMenu(false); btn.focus(); }
  });

  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  var map = {};
  links.forEach(function(a){
    var id = a.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if(el){ map[id] = a; }
  });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        links.forEach(function(a){ a.classList.remove('is-active'); });
        var a = map[en.target.id];
        if(a){ a.classList.add('is-active'); }
      }
    });
  }, { rootMargin: '-66px 0px -70% 0px', threshold: 0 });
  Object.keys(map).forEach(function(id){ io.observe(document.getElementById(id)); });

  // お問い合わせ：送信 API ができるまでは、入力内容を差し込んだメールを作成する
  var MAIL_TO = 'mochizuki@ashitamo80.com';
  var form = document.getElementById('contactForm');
  var msg = document.getElementById('formMsg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
    var invalid = fields.filter(function(f){
      var ok = f.checkValidity() && (!f.required || f.value.trim() !== '');
      f.setAttribute('aria-invalid', String(!ok));
      return !ok;
    });
    if(invalid.length){
      msg.classList.add('is-error');
      msg.textContent = '未入力または形式が正しくない項目があります。';
      invalid[0].focus();
      return;
    }
    var v = function(name){ return form.elements[name].value.trim(); };
    var subject = '【お問い合わせ】' + v('company') + ' ' + v('name') + ' 様';
    var body = [
      '会社名・団体名: ' + v('company'),
      'お名前: ' + v('name'),
      'メールアドレス: ' + v('email'),
      '従業員数: ' + v('size'),
      'ご相談内容: ' + v('topic'),
      '',
      'ご相談の概要:',
      v('body')
    ].join('\n');
    msg.classList.remove('is-error');
    msg.textContent = 'メールアプリが開きます。内容を確認のうえ送信してください。開かない場合は ' + MAIL_TO + ' へ直接お送りください。';
    location.href = 'mailto:' + MAIL_TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
  form.addEventListener('input', function(e){
    if(e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity() && e.target.value.trim() !== ''){
      e.target.setAttribute('aria-invalid', 'false');
    }
  });
})();
