(function(){
  'use strict';
  const STORE='pjt_webapp_v57_table_column_widths';
  const SELECTOR='table.searchResultTable,table.smTable,table.salesTable,table.imTable,table.idTable,table.mpTable';
  const MIN_WIDTH=64;
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(_){saved={}}

  function tableKey(table){
    const owner=table.closest('[id]');
    const body=table.tBodies?.[0];
    const name=table.id||body?.id||Array.from(table.classList).sort().join('.');
    return `${owner?.id||'page'}::${name||'table'}`;
  }
  function columnKey(table,index){return `${tableKey(table)}::${index}`}
  function headers(table){return Array.from(table.tHead?.rows?.[0]?.cells||[])}
  function cellsAt(table,index){
    const result=[];
    Array.from(table.rows||[]).forEach(row=>{const cell=row.cells?.[index];if(cell&&!cell.hasAttribute('colspan'))result.push(cell)});
    return result;
  }
  function applyWidth(table,index,width,persist){
    const next=Math.max(MIN_WIDTH,Math.round(width));
    cellsAt(table,index).forEach(cell=>{
      cell.style.setProperty('width',`${next}px`);
      cell.style.setProperty('min-width',`${next}px`);
      cell.style.setProperty('max-width',`${next}px`);
    });
    table.dataset.userResized='true';
    if(persist){saved[columnKey(table,index)]=next;try{localStorage.setItem(STORE,JSON.stringify(saved))}catch(_){}}
  }
  function restoreWidths(table){
    headers(table).forEach((_,index)=>{const width=Number(saved[columnKey(table,index)]);if(width>=MIN_WIDTH)applyWidth(table,index,width,false)});
  }
  function startResize(event,table,index){
    if(event.pointerType==='mouse'&&event.button!==0)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const th=headers(table)[index];if(!th)return;
    const startX=event.clientX,startWidth=th.getBoundingClientRect().width;
    const handle=event.currentTarget;
    handle.setPointerCapture?.(event.pointerId);
    document.body.classList.add('tableColumnResizing');
    th.classList.add('columnResizeActive');
    const move=e=>{if(e.pointerId!==event.pointerId)return;e.preventDefault();applyWidth(table,index,startWidth+(e.clientX-startX),false)};
    const finish=e=>{
      if(e.pointerId!==event.pointerId)return;
      handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',finish);
      document.body.classList.remove('tableColumnResizing');th.classList.remove('columnResizeActive');
      applyWidth(table,index,th.getBoundingClientRect().width,true);
    };
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
  }
  function attach(table){
    if(!(table instanceof HTMLTableElement))return;
    const list=headers(table);if(!list.length)return;
    list.forEach((th,index)=>{
      if(th.colSpan>1||th.matches('.searchSelectCell,.searchManageCell'))return;
      if(th.querySelector(':scope > .columnResizeHandle'))return;
      th.classList.add('columnResizable');
      const handle=document.createElement('span');
      handle.className='columnResizeHandle';handle.setAttribute('aria-hidden','true');handle.title='좌우로 끌어 열 너비 조절';
      handle.addEventListener('pointerdown',event=>startResize(event,table,index),true);
      handle.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()},true);
      th.appendChild(handle);
    });
    restoreWidths(table);
  }
  function refresh(root=document){
    if(root instanceof HTMLTableElement&&root.matches(SELECTOR))attach(root);
    root.querySelectorAll?.(SELECTOR).forEach(attach);
    document.querySelectorAll(SELECTOR).forEach(table=>{if(table.dataset.userResized==='true')restoreWidths(table)});
  }
  const observer=new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)refresh(node)}));
  });
  function init(){refresh();observer.observe(document.body,{childList:true,subtree:true})}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
