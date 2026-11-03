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
    document.documentElement.classList.toggle('menu-open', open);
  }
  function syncNav(){
    if(mq.matches){ setMenu(false); }
    else { nav.hidden = false; head.classList.remove('is-open'); document.documentElement.classList.remove('menu-open'); }
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
})();
