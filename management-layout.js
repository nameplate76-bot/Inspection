/* Existing ledger fields and actions remain the source of truth. */
(()=>{
let category='전체',loadEpoch=0;
const kinds=['전체','매출','매입','비용','예산','기타'];
window.installManagementLayout=function(){
 const page=document.getElementById('workPage'),dialog=document.getElementById('managementDialog');if(!page||!dialog)return false;
 page.classList.add('managementLayout');
 if(!document.getElementById('managementWorkspace')){
  const shell=document.createElement('div');shell.id='managementWorkspace';
  shell.innerHTML=`<header class="mgHeader"><div class="mgHeaderInner"><button type="button" class="mgBack" onclick="goHome()">‹ 업무 선택</button><div><h1>경영·회계 관리</h1><p>매출·매입·비용과 예산 자료를 관리합니다.</p></div></div></header><div class="mgLayout"><nav class="mgNav" aria-label="경영·회계 메뉴"><p>자료 관리</p>${kinds.map(k=>`<button type="button" data-mg-category="${k}" ${k==='전체'?'aria-current="page"':''}>${k==='전체'?'전체 자료':k}</button>`).join('')}</nav><main class="mgContent"><div class="mgTitle"><div><span>경영·회계</span><h2 id="mgCurrentTitle">전체 자료</h2></div><button type="button" id="mgReload">새로고침</button></div><div class="mgMeta"><span id="mgCount" role="status">자료를 불러오는 중입니다.</span><span>금액 단위: 원</span></div><div id="mgLedgerMount"></div><p id="mgLoadStatus" role="status"></p></main></div>`;
  page.appendChild(shell);
  shell.querySelectorAll('[data-mg-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.mgCategory;filterLedger()}));
  document.getElementById('mgReload').onclick=()=>window.startManagementWorkspace(false);
  document.getElementById('mgLedgerMount').appendChild(dialog);
  dialog.classList.add('mgInlineLedger');dialog.setAttribute('aria-label','경영·회계 자료');
  // Non-modal open dialog: keep the original form IDs and all save handlers.
  if(dialog.open)dialog.close();dialog.setAttribute('open','');
  const table=dialog.querySelector('table');if(table){table.setAttribute('aria-label','경영·회계 자료 목록');table.querySelectorAll('th').forEach(th=>th.scope='col')}
  const labels={managementDate:'일자',managementCategory:'구분',managementDescription:'내용',managementAmount:'금액 (원)',managementNote:'비고'};
  Object.entries(labels).forEach(([id,name])=>{const field=document.getElementById(id);field?.setAttribute('aria-label',name);const label=field?.previousElementSibling;if(label?.tagName==='LABEL')label.htmlFor=id});
  new MutationObserver(filterLedger).observe(document.getElementById('managementBody'),{childList:true});
  new MutationObserver(()=>{const form=document.getElementById('managementForm');if(form.style.display!=='none'){form.scrollIntoView({block:'nearest'});document.getElementById('managementDate').focus({preventScroll:true})}}).observe(document.getElementById('managementForm'),{attributes:true,attributeFilter:['style']});
 }
 return true;
};
function filterLedger(){
 const body=document.getElementById('managementBody');if(!body)return;
 let shown=0,total=0;
 [...body.rows].forEach(row=>{if(row.dataset.mgEmpty)return;if(row.cells.length<6){row.hidden=category!=='전체';return}total++;row.hidden=category!=='전체'&&row.cells[1].textContent.trim()!==category;if(!row.hidden)shown++});
 let empty=body.querySelector('[data-mg-empty]');
 if(!shown&&category!=='전체'){if(!empty){empty=body.insertRow();empty.dataset.mgEmpty='true';const cell=empty.insertCell();cell.colSpan=6;cell.className='mgEmpty'}empty.hidden=false;empty.cells[0].textContent=`등록된 ${category} 자료가 없습니다.`}else if(empty)empty.hidden=true;
 // The observer only responds to new records; avoid a remove/add notification loop.
 document.getElementById('mgCount').textContent=`${category==='전체'?'전체':category} ${shown}건 · 등록 자료 ${total}건`;
 document.getElementById('mgCurrentTitle').textContent=category==='전체'?'전체 자료':category+' 자료';
 document.querySelectorAll('[data-mg-category]').forEach(button=>{if(button.dataset.mgCategory===category)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});
}
window.presentManagementLedger=function(){
 if(document.getElementById('workPage')?.classList.contains('managementLayout')){const dialog=document.getElementById('managementDialog');dialog.setAttribute('open','');dialog.dataset.loaded='true';filterLedger();document.getElementById('mgLoadStatus').textContent='';}
 else document.getElementById('managementDialog').showModal();
};
window.startManagementWorkspace=async function(reset=true){
 if(!canViewManagement())return;if(!window.installManagementLayout())return;if(reset)category='전체';
 const epoch=++loadEpoch,dialog=document.getElementById('managementDialog');
 delete dialog.dataset.loaded;
 document.getElementById('managementForm').style.display='none';
 document.getElementById('managementActions').replaceChildren();
 document.getElementById('managementBody').replaceChildren();
 const reload=document.getElementById('mgReload');reload.disabled=true;
 document.getElementById('mgLoadStatus').textContent='자료를 불러오는 중입니다.';
 try{if(typeof window.openManagementLedger!=='function')throw new Error('준비 중');await window.openManagementLedger();if(epoch!==loadEpoch)return;if(!dialog.dataset.loaded)document.getElementById('mgLoadStatus').textContent='자료를 불러오지 못했습니다. 새로고침을 눌러 다시 시도하세요.';}
 catch(error){if(epoch===loadEpoch)document.getElementById('mgLoadStatus').textContent='자료를 불러오지 못했습니다. 새로고침을 눌러 다시 시도하세요.';}
 finally{if(epoch===loadEpoch)reload.disabled=false}
};
})();
