/* GD Ruse30 v2 – tiny vanilla JS: theme, tabs, segmented charts, sortable tables, tooltips, filters */
(function(){
var d=document,root=d.documentElement;
d.body.classList.remove('nojs');d.body.classList.add('js');
/* theme toggle: auto -> light -> dark */
var tb=d.getElementById('themebtn');
function setT(t){if(t==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',t)}try{localStorage.setItem('gdr-theme',t)}catch(e){}if(tb)tb.setAttribute('aria-label','Theme: '+t)}
if(tb){tb.addEventListener('click',function(){var c=root.getAttribute('data-theme')||'auto';setT(c==='auto'?'light':c==='light'?'dark':'auto')})}
/* tabs */
d.querySelectorAll('[role=tablist][data-tabs]').forEach(function(list){
  var tabs=[].slice.call(list.querySelectorAll('[role=tab]'));
  function show(id,push){tabs.forEach(function(t){var on=t.getAttribute('aria-controls')===id;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;var p=d.getElementById(t.getAttribute('aria-controls'));if(p)p.hidden=!on});
    if(push&&history.replaceState)history.replaceState(null,'','#'+id.replace(/^p-/,''))}
  tabs.forEach(function(t,i){t.addEventListener('click',function(e){e.preventDefault();show(t.getAttribute('aria-controls'),true)});
    t.addEventListener('keydown',function(e){var k=e.key,j=k==='ArrowRight'?i+1:k==='ArrowLeft'?i-1:null;if(j===null)return;j=(j+tabs.length)%tabs.length;tabs[j].focus();show(tabs[j].getAttribute('aria-controls'),true)})});
  var h=location.hash.slice(1),init=tabs[0].getAttribute('aria-controls');
  tabs.forEach(function(t){if(t.getAttribute('aria-controls')==='p-'+h)init='p-'+h});
  show(init,false);
  d.querySelectorAll('a[data-goto]').forEach(function(a){a.addEventListener('click',function(e){var id='p-'+a.getAttribute('data-goto');if(d.getElementById(id)){e.preventDefault();show(id,true);list.scrollIntoView({behavior:'smooth',block:'start'})}})});
});
/* segmented switches */
d.querySelectorAll('[data-switch]').forEach(function(seg){
  var g=seg.getAttribute('data-switch'),bs=[].slice.call(seg.querySelectorAll('button'));
  function sel(v){bs.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.opt===v)});d.querySelectorAll('[data-pane^="'+g+':"]').forEach(function(p){p.hidden=p.getAttribute('data-pane')!==g+':'+v})}
  bs.forEach(function(b){b.addEventListener('click',function(){sel(b.dataset.opt)})});sel(bs[0].dataset.opt);
});
/* sortable tables */
d.querySelectorAll('table.sortable').forEach(function(t){
  var ths=[].slice.call(t.tHead.rows[0].cells);
  ths.forEach(function(th,ci){var b=th.querySelector('button');if(!b)return;b.addEventListener('click',function(){
    var cur=th.getAttribute('aria-sort'),dir=cur==='descending'?'ascending':'descending';
    ths.forEach(function(x){x.removeAttribute('aria-sort')});th.setAttribute('aria-sort',dir);
    var tb=t.tBodies[0],rows=[].slice.call(tb.rows);
    rows.sort(function(a,b){var x=a.cells[ci].getAttribute('data-s'),y=b.cells[ci].getAttribute('data-s');
      var nx=parseFloat(x),ny=parseFloat(y);var r;
      if(!isNaN(nx)||!isNaN(ny)){nx=isNaN(nx)?-1e9:nx;ny=isNaN(ny)?-1e9:ny;r=nx-ny}else{r=String(x).localeCompare(String(y))}
      return dir==='ascending'?r:-r});
    rows.forEach(function(r){tb.appendChild(r)});
  })});
});
/* tooltips */
var tip=d.createElement('div');tip.id='tip';tip.setAttribute('role','tooltip');d.body.appendChild(tip);var cur=null;
function place(x,y){var w=tip.offsetWidth,h=tip.offsetHeight,vw=innerWidth;var l=Math.min(Math.max(8,x-w/2),vw-w-8),t=y-h-12;if(t<8)t=y+18;tip.style.left=l+'px';tip.style.top=t+'px'}
function showTip(el,x,y){cur=el;tip.textContent=el.getAttribute('data-tip');tip.classList.add('on');place(x,y)}
function hideTip(){cur=null;tip.classList.remove('on')}
d.addEventListener('mouseover',function(e){var el=e.target.closest&&e.target.closest('[data-tip]');if(el&&el!==cur){showTip(el,e.clientX,e.clientY)}else if(!el&&cur)hideTip()});
d.addEventListener('mousemove',function(e){if(cur)place(e.clientX,e.clientY)});
d.addEventListener('focusin',function(e){var el=e.target.closest&&e.target.closest('[data-tip]');if(el){var r=el.getBoundingClientRect();showTip(el,r.left+r.width/2,r.top)}});
d.addEventListener('focusout',hideTip);
d.addEventListener('click',function(e){var el=e.target.closest&&e.target.closest('[data-tip]');if(el&&el.tagName!=='A'){var r=el.getBoundingClientRect();showTip(el,r.left+r.width/2,r.top)}else if(!el)hideTip()});
addEventListener('scroll',hideTip,{passive:true});
/* games filter */
var gf=d.querySelector('[data-gfilter]');
if(gf){var gb=[].slice.call(gf.querySelectorAll('button'));gb.forEach(function(b){b.addEventListener('click',function(){gb.forEach(function(x){x.setAttribute('aria-selected',x===b)});var v=b.dataset.opt,n=0;
  d.querySelectorAll('.gcard').forEach(function(c){var on=v==='all'||c.dataset.optenue===v||c.dataset.res===v;c.hidden=!on;if(on)n++});var cn=d.getElementById('gcount');if(cn)cn.textContent=n+(n===1?' game':' games')})})}
var gs=d.querySelector('[data-gsort]');
if(gs){var sb=[].slice.call(gs.querySelectorAll('button'));sb.forEach(function(b){b.addEventListener('click',function(){sb.forEach(function(x){x.setAttribute('aria-pressed',x===b)});var box=d.getElementById('gcards'),cs=[].slice.call(box.children);cs.sort(function(a,c){return b.dataset.opt==='new'?c.dataset.d.localeCompare(a.dataset.d):a.dataset.d.localeCompare(c.dataset.d)});cs.forEach(function(c){box.appendChild(c)})})})}
/* players sort */
var ps=d.querySelector('[data-psort]');
if(ps){var pb=[].slice.call(ps.querySelectorAll('button'));pb.forEach(function(b){b.addEventListener('click',function(){pb.forEach(function(x){x.setAttribute('aria-pressed',x===b)});var k=b.dataset.opt,box=d.getElementById('pcards'),cs=[].slice.call(box.children);
  cs.sort(function(a,c){if(k==='num')return (+a.dataset.num)-(+c.dataset.num);return (+c.dataset[k])-(+a.dataset[k])||(+a.dataset.num)-(+c.dataset.num)});cs.forEach(function(c){box.appendChild(c)})})})}
/* glossary search */
var q=d.getElementById('gq');
if(q){q.addEventListener('input',function(){var v=q.value.trim().toLowerCase(),n=0;d.querySelectorAll('.gterm').forEach(function(t){var on=!v||t.textContent.toLowerCase().indexOf(v)>-1;t.hidden=!on;if(on)n++});
  d.querySelectorAll('[data-ggroup]').forEach(function(g){g.hidden=!g.querySelector('.gterm:not([hidden])')});var c=d.getElementById('gcnt');if(c)c.textContent=n+' terms'})}
})();
(function(){var d=document;
d.querySelectorAll('.plsel').forEach(function(s){s.addEventListener('change',function(){location.href=s.value})});
var ss=d.getElementById('seasonsel');if(ss){ss.addEventListener('change',function(){d.querySelectorAll('[data-season]').forEach(function(p){p.hidden=p.getAttribute('data-season')!==ss.value})})}
})();
