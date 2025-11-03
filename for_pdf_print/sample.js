javascript:(function(){(async()=>{const PAGE_SIZE='A4',PAGE_MARGIN='12mm',FONT_SIZE='12pt',LINE_HEIGHT=1.5;
const getText=(sel,root=document)=>root.querySelector(sel)?.innerText?.trim()||'';
const yyy=getText('#lappnum');if(!yyy){alert('lappnum が見つかりません');return;}
const rows=Array.from(document.querySelectorAll('tr[data-content-id]'));if(!rows.length){alert('処理対象の行が見つかりません');return;}
const sanitize=s=>(s||'noname').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,' ').trim();
const zzzOf=row=>row.querySelector('td.name')?.innerText?.trim()||'noname';
const kkkOf=row=>row.querySelector('td.date')?.innerText?.trim()||'noname';
const DEFAULT_SELECTED_KEYWORDS=['範囲','明細書','図面','手続補正書','意見書','拒絶理由通知書'];
const isDefaultSelected=(name)=>{const n=(name||'').toLowerCase();return DEFAULT_SELECTED_KEYWORDS.some(k=>n.includes(String(k).toLowerCase()));};

const MODAL_ID='__JPO_ZZZ_PICKER__';document.getElementById(MODAL_ID)?.remove();
const overlay=document.createElement('div');overlay.id=MODAL_ID;
overlay.innerHTML=`
  <div class="__panel">
    <div class="__hdr">
      <div class="__title">印刷対象の ZZZ（name列）を選択</div>
      <button class="__close" title="閉じる">×</button>
    </div>
    <div class="__tools">
      <input type="text" class="__filter" placeholder="フィルタ（部分一致 / 正規表現:/pattern/i）">
      <button class="__selall">全選択</button>
      <button class="__clear">全解除</button>
    </div>
    <div class="__list"></div>
    <div class="__ft">
      <span class="__count"></span><div class="__spacer"></div>
      <button class="__cancel">キャンセル</button>
      <button class="__start">選択を印刷開始</button>
    </div>
  </div>
  <style>
  :root{color-scheme:light dark;}
  #${MODAL_ID}{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:2147483647;font-family:system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial,"Noto Sans JP",sans-serif;}
  #${MODAL_ID} .__panel{width:min(900px,95vw);height:min(70vh,800px);background:#fff;color:#111;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden;}
  #${MODAL_ID} .__hdr{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #e5e7eb;background:#f8fafc;}
  #${MODAL_ID} .__title{font-weight:600;font-size:16px;}
  #${MODAL_ID} .__close{margin-left:auto;border:none;background:transparent;font-size:20px;line-height:1;cursor:pointer;padding:4px 8px;}
  #${MODAL_ID} .__tools{display:flex;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid #eef2f7;background:#fbfdff;}
  #${MODAL_ID} .__tools .__filter{flex:1;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;}
  #${MODAL_ID} .__tools button{padding:8px 10px;font-size:13px;border:1px solid #cbd5e1;background:#fff;border-radius:6px;cursor:pointer;}
  #${MODAL_ID} .__list{flex:1;overflow:auto;padding:10px 14px;background:#fff;}
  #${MODAL_ID} .__row{display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px dashed #f1f5f9;}
  #${MODAL_ID} .__row label{display:flex;align-items:center;gap:10px;cursor:pointer;width:100%;}
  #${MODAL_ID} .__row .__name{font-weight:600;}
  #${MODAL_ID} .__row .__meta{color:#64748b;font-size:12px;}
  #${MODAL_ID} .__ft{display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid #e5e7eb;background:#f8fafc;}
  #${MODAL_ID} .__spacer{flex:1;}
  #${MODAL_ID} .__ft .__start{background:#2563eb;color:#fff;border:1px solid #1d4ed8;border-radius:8px;padding:8px 14px;font-weight:600;cursor:pointer;}
  #${MODAL_ID} .__ft .__cancel{background:#fff;color:#111;border:1px solid #cbd5e1;border-radius:8px;padding:8px 14px;cursor:pointer;}
  @media (prefers-color-scheme:dark){
    #${MODAL_ID} .__panel{background:#0b1220;color:#e5e7eb;}
    #${MODAL_ID} .__hdr,#${MODAL_ID} .__ft{background:#0f172a;border-color:#1e293b;}
    #${MODAL_ID} .__tools{background:#0b1220;border-color:#1e293b;}
    #${MODAL_ID} .__tools .__filter{background:#0b1220;color:#e5e7eb;border-color:#334155;}
    #${MODAL_ID} .__tools button{background:#0b1220;color:#e5e7eb;border-color:#334155;}
    #${MODAL_ID} .__list{background:#0b1220;}
    #${MODAL_ID} .__row{border-bottom-color:#172033;}
    #${MODAL_ID} .__ft .__start{background:#2563eb;border-color:#1d4ed8;}
    #${MODAL_ID} .__ft .__cancel{background:#0b1220;color:#e5e7eb;border-color:#334155;}
  }
  </style>
`;
document.body.appendChild(overlay);

const listEl=overlay.querySelector('.__list');
const filterEl=overlay.querySelector('.__filter');
const countEl=overlay.querySelector('.__count');

const escapeHTML=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const items=rows.map((row,i)=>({idx:i,row,zzz:zzzOf(row),kkk:kkkOf(row),id:row.getAttribute('data-content-id')}));
const renderList=(flt=null)=>{
  let re=null;
  if(flt && flt.startsWith('/') && flt.lastIndexOf('/')>0){
    const last=flt.lastIndexOf('/');const body=flt.slice(1,last);const flags=flt.slice(last+1);
    try{ re=new RegExp(body,flags);}catch(_){}
  }
  const q=(flt||'').toLowerCase();
  listEl.innerHTML='';let shown=0;
  for(const it of items){
    const text=`${it.zzz}${it.kkk}`;let hit=true;
    if(re){hit=re.test(text);}else if(q){hit=text.toLowerCase().includes(q);}
    if(!hit) continue;
    const checkboxId=`__pick_${it.idx}`;const defaultChecked=isDefaultSelected(it.zzz);
    const rowEl=document.createElement('div');rowEl.className='__row';
    rowEl.innerHTML=`<label for="${checkboxId}">
      <input type="checkbox" id="${checkboxId}" data-idx="${it.idx}" ${defaultChecked?'checked':''}>
      <span class="__name">${escapeHTML(it.zzz)}</span>
      <span class="__meta">（date:${escapeHTML(it.kkk)}/ id:${escapeHTML(it.id||'')}</span>
    </label>`;
    listEl.appendChild(rowEl);shown++;
  }
  countEl.textContent=`表示:${shown}/ 全体:${items.length}`;
};
renderList();

overlay.querySelector('.__close').onclick=overlay.querySelector('.__cancel').onclick=()=>overlay.remove();
overlay.querySelector('.__selall').onclick=()=>{listEl.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=true);};
overlay.querySelector('.__clear').onclick=()=>{listEl.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=false);};
filterEl.oninput=()=>renderList(filterEl.value.trim());
overlay.addEventListener('keydown',e=>{
  if(e.key==='Escape'){overlay.remove();}
  if(e.key==='Enter'){overlay.querySelector('.__start').click();}
});

overlay.querySelector('.__start').onclick=()=>{
  const selectedIdxs=Array.from(listEl.querySelectorAll('input[type=checkbox]:checked')).map(cb=>Number(cb.getAttribute('data-idx')));
  if(!selectedIdxs.length){alert('少なくとも1件選択してください');return;}
  const picked=selectedIdxs.map(i=>items.find(it=>it.idx===i)).filter(Boolean);
  overlay.remove();runPrint(picked);
};

const buildHTML=(title,baseHref,bodyHTML)=>`<!doctype html><html><head>
<meta charset="utf-8"><title>${title}</title><base href="${baseHref}">
<style>:root{color-scheme:light dark;}body{font-size:${FONT_SIZE};line-height:${LINE_HEIGHT};}@page{size:${PAGE_SIZE};margin:${PAGE_MARGIN};}@media print{a[href]::after{content:'';}}</style>
</head><body>${bodyHTML}</body></html>`;

const waitReady=(win)=>new Promise(res=>{const tick=()=>{try{if(win.document&&win.document.readyState==='complete'){res();return;}}catch(_){}
setTimeout(tick,80);};tick();});

async function runPrint(targetItems){
  let i=0;
  if(!window.__JPO_VIEWER||window.__JPO_VIEWER.closed){window.__JPO_VIEWER=window.open('','JPO_VIEWER');if(!window.__JPO_VIEWER){alert('ポップアップがブロックされています。許可してください。');return;}}
  const viewer=window.__JPO_VIEWER;
  async function next(){
    if(i>=targetItems.length){alert('すべての処理が完了しました');return;}
    const it=targetItems[i++];
    // 行内リンクから優先的にベースURLを検出（無ければフォールバック）
    const link=it.row.querySelector('a[href*="/core/docs/jsv/content/"]');
    const baseUrl=(function(){
      if(link){try{return new URL(link.getAttribute('href'),location.href).toString().replace(/(#.*)?$/,'');}catch(_){}} 
      try{return new URL('/core/docs/jsv/content/'+it.id+'/',location.origin).toString();}catch(_){return 'https://gem.prototype.jpo.go.jp/core/docs/jsv/content/'+it.id+'/';}
    })();
    try{
      const res=await fetch(baseUrl,{credentials:'include'});if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const html=await res.text();const parser=new DOMParser();const doc=parser.parseFromString(html,'text/html');const bodyHTML=doc.body?doc.body.innerHTML:html;
      const title=`${sanitize(yyy)}_${sanitize(it.kkk)}_${sanitize(it.zzz)}`;
      viewer.document.open();viewer.document.write(buildHTML(title,baseUrl,bodyHTML));viewer.document.close();
      await waitReady(viewer);viewer.focus();viewer.print();
      alert('次へ進むには OK を押してください');next();
    }catch(e){console.error('取得失敗:',baseUrl,e);alert(`取得失敗:${it.zzz}（次へ進みます）`);next();}
  }
  next();
}
})();})()
