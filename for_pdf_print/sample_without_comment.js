javascript:(function(){(async()=>{const PAGE_SIZE='A4',PAGE_MARGIN='12mm',FONT_SIZE='12pt',LINE_HEIGHT=1.5;
const getText=(sel,root=document)=>root.querySelector(sel)?.innerText?.trim()||'';
const yyy=getText('#lappnum');if(!yyy){alert('lappnum が見つかりません');return;}
const rows=Array.from(document.querySelectorAll('tr[data-content-id]'));if(!rows.length){alert('処理対象の行が見つかりません');return;}

const sanitize=s=>(s||'noname').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,' ').trim();
const zzzOf=row=>row.querySelector('td.name')?.innerText?.trim()||'noname';
const kkkOf=row=>row.querySelector('td.date')?.innerText?.trim()||'noname';
const DEFAULT_SELECTED_KEYWORDS=['範囲','明細書','図面','手続補正書','意見書','拒絶理由通知書'];
const isDefaultSelected=name=>{const n=(name||'').toLowerCase();return DEFAULT_SELECTED_KEYWORDS.some(k=>n.includes(String(k).toLowerCase()));};

const MODAL_ID='__JPO_ZZZ_PICKER__';document.getElementById(MODAL_ID)?.remove();
const overlay=document.createElement('div');
overlay.id=MODAL_ID;
overlay.setAttribute('role','dialog');
overlay.setAttribute('aria-modal','true');
overlay.innerHTML=`
  <div class="__panel" role="document" aria-labelledby="__modal_title">
    <div class="__hdr">
      <div class="__title" id="__modal_title">印刷対象の ZZZ（name列）を選択</div>
      <button class="__close" title="閉じる" aria-label="閉じる" type="button">×</button>
    </div>
    <div class="__tools">
      <input type="text" class="__filter" placeholder="フィルタ（部分一致 / 正規表現:/pattern/i）" aria-label="フィルタ入力">
      <button class="__selall" type="button">全選択</button>
      <button class="__clear" type="button">全解除</button>
    </div>
    <div class="__list" tabindex="0" aria-label="候補一覧"></div>
    <div class="__ft">
      <span class="__count" aria-live="polite"></span>
      <div class="__spacer"></div>
      <button class="__cancel" type="button">キャンセル</button>
      <button class="__start" type="button">選択を印刷開始</button>
    </div>
  </div>
  <style>
    :root{color-scheme:light dark;}
    #${MODAL_ID}{
      position:fixed;inset:0;z-index:2147483647;
      display:flex;align-items:center;justify-content:center;
      background:rgba(10,25,61,.45);
      backdrop-filter:saturate(120%) blur(2px);
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,"Noto Sans JP",sans-serif;
    }
    #${MODAL_ID} .__panel{
      width:min(900px,95vw);height:min(72vh,820px);
      background:#fff;color:#0f172a;
      border:1px solid #e5e7eb;border-radius:14px;
      box-shadow:0 24px 60px rgba(2,8,23,.30),0 8px 20px rgba(2,8,23,.18);
      display:flex;flex-direction:column;overflow:hidden;
      animation:__modalIn .16s ease-out;
    }
    @keyframes __modalIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
    #${MODAL_ID} .__hdr{
      display:flex;align-items:center;gap:8px;padding:12px 14px;
      background:linear-gradient(180deg,#eff6ff,#ffffff 60%);
      border-bottom:1px solid #e5e7eb;
    }
    #${MODAL_ID} .__title{font-weight:700;font-size:16px;letter-spacing:.2px}
    #${MODAL_ID} .__close{
      margin-left:auto;border:1px solid #dbeafe;background:#ffffff;
      font-size:18px;line-height:1;border-radius:8px;cursor:pointer;padding:6px 10px;
    }
    #${MODAL_ID} .__tools{
      display:flex;gap:8px;align-items:center;padding:10px 14px;
      border-bottom:1px solid #e5e7eb;background:#f8fbff;
    }
    #${MODAL_ID} .__tools .__filter{
      flex:1;padding:10px 12px;border:1px solid #cfe0ff;border-radius:10px;font-size:14px;outline:none;
    }
    #${MODAL_ID} .__tools .__filter:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
    #${MODAL_ID} .__tools button,
    #${MODAL_ID} .__ft button{
      padding:10px 12px;font-size:13px;border-radius:10px;cursor:pointer;
      border:1px solid #cfe0ff;background:#ffffff;
    }
    #${MODAL_ID} .__list{flex:1;overflow:auto;padding:8px 14px;background:#ffffff}
    #${MODAL_ID} .__row{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px dashed #eef2ff}
    #${MODAL_ID} .__row:hover{background:#f6faff}
    #${MODAL_ID} .__row label{display:flex;align-items:center;gap:10px;cursor:pointer;width:100%;}
    #${MODAL_ID} .__row .__name{font-weight:600}
    #${MODAL_ID} .__row .__meta{color:#5b6b8a;font-size:12px}
    #${MODAL_ID} .__ft{
      display:flex;align-items:center;gap:10px;padding:12px 14px;
      border-top:1px solid #e5e7eb;background:#f8fbff;
    }
    #${MODAL_ID} .__ft button.__start{
      background:#2563eb;color:#ffffff;border:1px solid #1d4ed8;
      font-weight:700;display:inline-flex;align-items:center;justify-content:center;
      min-height:38px;min-width:11em;padding:10px 14px;white-space:nowrap;
    }
    #${MODAL_ID} .__start:hover{filter:brightness(1.05)}
    #${MODAL_ID} .__cancel{background:#ffffff;color:#0f172a;border:1px solid #cfe0ff}
    #${MODAL_ID} button:focus-visible{outline:3px solid rgba(37,99,235,.35);outline-offset:2px}
    @media (prefers-color-scheme:dark){
      #${MODAL_ID}{background:rgba(2,6,23,.6)}
      #${MODAL_ID} .__panel{background:#0b1220;color:#e5e7eb;border-color:#1e293b}
      #${MODAL_ID} .__hdr{background:linear-gradient(180deg,#0b172f,#0b1220 70%);border-bottom-color:#1e293b}
      #${MODAL_ID} .__tools,#${MODAL_ID} .__ft{background:#0b1220;border-color:#1e293b}
      #${MODAL_ID} .__tools .__filter{background:#0b1220;color:#e5e7eb;border-color:#334155}
      #${MODAL_ID} .__tools button,#${MODAL_ID} .__ft button{background:#0b1220;color:#e5e7eb;border-color:#334155}
      #${MODAL_ID} .__ft button.__start{background:#3b82f6;border-color:#2563eb;color:#ffffff}
      #${MODAL_ID} .__row{border-bottom-color:#172033}
      #${MODAL_ID} .__row:hover{background:#0f172a}
    }
  </style>
`;

const prevOverflow=document.body.style.overflow;
const prevPR=document.body.style.paddingRight;
const scw=window.innerWidth-document.documentElement.clientWidth;
document.body.style.overflow='hidden';
if(scw>0) document.body.style.paddingRight=scw+'px';

document.body.appendChild(overlay);

const panel=overlay.querySelector('.__panel');
const listEl=overlay.querySelector('.__list');
const filterEl=overlay.querySelector('.__filter');
const countEl=overlay.querySelector('.__count');
const closeBtn=overlay.querySelector('.__close');
const cancelBtn=overlay.querySelector('.__cancel');
const startBtn=overlay.querySelector('.__start');

function closeModal(){
  overlay.remove();
  document.body.style.overflow=prevOverflow;
  document.body.style.paddingRight=prevPR;
}

overlay.addEventListener('mousedown',e=>{if(e.target===overlay) closeModal();});
overlay.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeModal();
  if(e.key==='Enter' && document.activeElement===filterEl) startBtn.click();
  if(e.key==='Tab'){
    const f=Array.from(panel.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el=>!el.disabled&&el.offsetParent!==null);
    if(!f.length) return;
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){last.focus();e.preventDefault();}
    else if(!e.shiftKey && document.activeElement===last){first.focus();e.preventDefault();}
  }
});
setTimeout(()=>filterEl.focus(),10);

const escapeHTML=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const items=rows.map((row,i)=>({idx:i,row,zzz:zzzOf(row),kkk:kkkOf(row),id:row.getAttribute('data-content-id')}));
function renderList(flt=null){
  let re=null;
  if(flt && flt.startsWith('/') && flt.lastIndexOf('/')>0){
    const last=flt.lastIndexOf('/');const body=flt.slice(1,last);const flags=flt.slice(last+1);
    try{re=new RegExp(body,flags);}catch(_){}
  }
  const q=(flt||'').toLowerCase();
  listEl.innerHTML='';let shown=0;
  for(const it of items){
    const text=`${it.zzz}${it.kkk}`.toLowerCase();
    let hit=true;
    if(re) hit=re.test(text);
    else if(q) hit=text.includes(q);
    if(!hit) continue;
    const checkboxId=`__pick_${it.idx}`;
    const def=DEFAULT_SELECTED_KEYWORDS.some(k=>(it.zzz||'').toLowerCase().includes(String(k).toLowerCase()));
    const rowEl=document.createElement('div');rowEl.className='__row';
    rowEl.innerHTML=`<label for="${checkboxId}">
      <input type="checkbox" id="${checkboxId}" data-idx="${it.idx}" ${def?'checked':''}>
      <span class="__name">${escapeHTML(it.zzz)}</span>
      <span class="__meta">（date:${escapeHTML(it.kkk)}/ id:${escapeHTML(it.id||'')}）</span>
    </label>`;
    listEl.appendChild(rowEl);shown++;
  }
  countEl.textContent=`表示:${shown}/ 全体:${items.length}`;
}
renderList();

overlay.querySelector('.__selall').onclick=()=>{listEl.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=true);};
overlay.querySelector('.__clear').onclick=()=>{listEl.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=false);};
filterEl.oninput=()=>renderList(filterEl.value.trim());
closeBtn.onclick=cancelBtn.onclick=closeModal;

startBtn.onclick=()=>{
  const selectedIdxs=Array.from(listEl.querySelectorAll('input[type=checkbox]:checked')).map(cb=>Number(cb.getAttribute('data-idx')));
  if(!selectedIdxs.length){alert('少なくとも1件選択してください');return;}
  const picked=selectedIdxs.map(i=>items.find(it=>it.idx===i)).filter(Boolean);
  closeModal();runPrint(picked);
};

const buildHTML=(title,baseHref,bodyHTML)=>`<!doctype html><html><head>
<meta charset="utf-8"><title>${title}</title><base href="${baseHref}">
<style>:root{color-scheme:light dark;}body{font-size:${FONT_SIZE};line-height:${LINE_HEIGHT};}@page{size:${PAGE_SIZE};margin:${PAGE_MARGIN};}@media print{a[href]::after{content:'';}}</style>
</head><body>${bodyHTML}</body></html>`;

const waitReady=(win)=>new Promise(res=>{const tick=()=>{try{if(win.document&&win.document.readyState==='complete'){res();return;}}catch(_){}
setTimeout(tick,80);};tick();});

async function runPrint(targetItems){
  let i=0;
  if(!window.__JPO_VIEWER||window.__JPO_VIEWER.closed){
    window.__JPO_VIEWER=window.open('','JPO_VIEWER');
    if(!window.__JPO_VIEWER){alert('ポップアップがブロックされています。許可してください。');return;}
  }
  const viewer=window.__JPO_VIEWER;
  async function next(){
    if(i>=targetItems.length){alert('すべての処理が完了しました');return;}
    const it=targetItems[i++];
    const link=it.row.querySelector('a[href*="/core/docs/jsv/content/"]');
    const baseUrl=(function(){
      if(link){try{return new URL(link.getAttribute('href'),location.href).toString().replace(/(#.*)?$/,'');}catch(_){}}
      try{return new URL('/core/docs/jsv/content/'+it.id+'/',location.origin).toString();}catch(_){return 'https://gem.prototype.jpo.go.jp/core/docs/jsv/content/'+it.id+'/';}
    })();
    try{
      const res=await fetch(baseUrl,{credentials:'include'});if(!res.ok) throw new Error('HTTP '+res.status);
      const html=await res.text();const doc=new DOMParser().parseFromString(html,'text/html');const bodyHTML=doc.body?doc.body.innerHTML:html;
      const title=`${sanitize(yyy)}_${sanitize(it.kkk)}_${sanitize(it.zzz)}`;
      viewer.document.open();viewer.document.write(buildHTML(title,baseUrl,bodyHTML));viewer.document.close();
      await waitReady(viewer);viewer.focus();viewer.print();
      alert('次へ進むには OK を押してください');next();
    }catch(e){
      console.error('取得失敗:',baseUrl,e);alert('取得失敗:'+it.zzz+'（次へ進みます）');next();
    }
  }
  next();
}
})();})()
