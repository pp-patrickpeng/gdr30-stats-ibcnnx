(() => {
  const pickers=[...document.querySelectorAll('[data-division-picker]')];
  const currentPicker = pickers.find(p => p.hasAttribute('data-current-division'));
  function select(value){
    pickers.forEach(p=>p.value=value);
    const badge=document.querySelector('.recpill');if(badge){badge.textContent=({b3:'B3 · 0–1',c1:'C1 · 4–0',all:'S2 · 4–1'})[value];badge.title=({b3:'U16 B3',c1:'U16 C1 grading',all:'Whole Season 2'})[value];}
    document.querySelectorAll('[data-division-scope]').forEach(el=>{el.hidden=el.dataset.divisionScope!==value});
  }
  pickers.forEach(p=>p.addEventListener('change',()=>{
    select(p.value);
    if (!currentPicker) try{localStorage.setItem('gdr30-division',p.value)}catch(e){}
  }));
  let initial = currentPicker?.querySelector('option[selected]')?.value ?? 'b3';
  if (!currentPicker) try{const saved=localStorage.getItem('gdr30-division');if(['b3','c1','all'].includes(saved))initial=saved}catch(e){}
  const panel = location.hash.match(/^#(?:(b3|c1|all)-)?(overview|gamelog|trends|goals)$/);
  if (!currentPicker && panel?.[1]) initial = panel[1];
  select(initial);
  if (currentPicker) window.addEventListener('pageshow', () => select(initial));
  if (panel && !panel[1]) {
    const tab = document.querySelector(`[aria-controls="p-${initial}-${panel[2]}"]`);
    if (tab) window.addEventListener('DOMContentLoaded', () => tab.click(), { once: true });
  }
  document.querySelectorAll('[data-insight-sort]').forEach(p=>p.addEventListener('change',()=>{
    const grid=p.closest('[data-division-scope]')?.querySelector('.pcards');if(!grid)return;
    const field=`insight${p.value[0].toUpperCase()}${p.value.slice(1)}`;
    grid.append(...[...grid.children].sort((a,b)=>Number(b.dataset[field])-Number(a.dataset[field])));
  }));
})();
