(function(){
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  var mq = window.matchMedia('(max-width: 760px)');

  function syncNav(){
    if(mq.matches){ nav.hidden = true; btn.setAttribute('aria-expanded','false'); }
    else { nav.hidden = false; }
  }
  syncNav();
  mq.addEventListener('change', syncNav);

  btn.addEventListener('click', function(){
    var open = nav.hidden;
    nav.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function(e){
    if(e.target.tagName === 'A' && mq.matches){
      nav.hidden = true;
      btn.setAttribute('aria-expanded','false');
    }
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

  var form = document.getElementById('contactForm');
  var msg = document.getElementById('formMsg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    msg.textContent = 'モックのため送信は行われません。実装時はここに送信完了メッセージが表示されます。';
  });
})();
