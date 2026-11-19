import {analyzeReadOnly} from './engine/index.mjs';
const $=id=>document.getElementById(id);
const sample={data:{scope:'가상 점검 문서',site:{name:'교육용 가상현장'},equipment:[{number:'CH-01',type:'냉동기',format:'수냉식',basic:{'설치위치':'기계실'},measurements:[{group:'증발기(냉수)',item:'출구온도',unit:'℃',design:'7',measured:'10.2'},{group:'증발기(냉수)',item:'입구온도',unit:'℃',design:'12',measured:'14.1'},{group:'증발기(냉수)',item:'유량',unit:'LPM',design:'1,200',measured:''}],items:[{title:'냉수 계통 확인',result:'검토 필요',reasons:{reason0:'운전 조건 확인 필요'}}],photoRefs:[{item:'설비 현장사진',kind:'site'}]}],truncated:false,photoCount:1,sentPhotos:[],unseenPhotos:1}};
let snapshot=null;let last=null;
function el(tag,txt,cls=''){const node=document.createElement(tag);if(cls)node.className=cls;node.textContent=txt;return node;}
function message(msg,error=false){const banner=$('banner');banner.textContent=msg;banner.className=error?'banner error':'banner';$('results').classList.add('visible');}
$('sample').addEventListener('click',()=>{snapshot=structuredClone(sample);$('jsonfile').value='';$('num').value='CH-01';message('가상 데이터가 준비되었습니다. [분석 실행]을 누르세요.');});
$('jsonfile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>5_000_000){snapshot=null;message('파일은 5MB 이하의 JSON만 지원합니다.',true);return;}try{const s=JSON.parse(await f.text());if(!Array.isArray((s?.data??s)?.equipment))throw new Error('equipment 배열이 없습니다.');snapshot=s;message('JSON을 불러왔습니다. 분석을 실행하세요.');}catch(err){snapshot=null;message('JSON 불러오기 실패: '+err.message,true);}});
$('run').addEventListener('click',()=>{
 try{
  if(!snapshot)throw new Error('먼저 가상 샘플 또는 점검 문서 JSON을 불러오세요.');
  let criteria=[];const content=$('criteria').value.trim();if(content){criteria=JSON.parse(content);if(!Array.isArray(criteria))throw new Error('승인 기준은 JSON 배열이어야 합니다.');}
  if($('democrit').checked)criteria.push({group:'증발기(냉수)',item:'출구온도',unit:'℃',min:6,max:9,operator:'between_inclusive',approved:true,source:'가상 시험 기준 (법정 기준 아님)',version:'demo-v1',effectiveDate:'2026-01-01'});
  const number=$('num').value.trim();if(!number)throw new Error('설비번호를 입력하세요.');last=analyzeReadOnly(snapshot,{number,criteria,question:$('question').value});render(last);
 }catch(err){last=null;message('분석 오류: '+err.message,true);$('measureTable').replaceChildren();$('metrics').replaceChildren();$('advice').replaceChildren();$('evidence').textContent='';}
});
function render(r){$('measureTable').replaceChildren();$('metrics').replaceChildren();$('advice').replaceChildren();$('evidence').replaceChildren();if(r.status==='hold'){message(r.reason,true);return;}
 const rows=r.comparison||[];const count={outside:rows.filter(x=>x.judgment==='outside_criterion').length,within:rows.filter(x=>x.judgment==='within_criterion').length,hold:rows.filter(x=>x.judgment==='hold').length};
 message(`${r.number} · ${r.equipment.type} / ${r.site?.name||'현장명 없음'} · 읽기 전용 분석 완료`);
 for(const [label,value] of [['검토 필요',count.outside],['기준 범위 내',count.within],['판정 보류',count.hold]]){const box=el('div','','metric');box.append(el('div',label,'label'),el('div',String(value),'value'));$('metrics').append(box);}
 const label={outside_criterion:'범위 밖',within_criterion:'범위 내',hold:'판정 보류'};
 for(const x of rows){const tr=document.createElement('tr');const td0=el('td',`${x.group} / ${x.item}`);const d=el('td',x.design===null?'—':x.design+' '+x.unit);const m=el('td',x.measured===null?'—':x.measured+' '+x.unit);const diff=el('td',x.difference===null?'—':(x.difference>0?'+':'')+x.difference+' '+x.unit);const t=document.createElement('td');t.append(el('span',label[x.judgment]||'검토',`pill ${x.judgment==='hold'?'hold':x.judgment==='within_criterion'?'within':'review'}`),el('small',x.criterion?`근거: ${x.criterion.source} / ${x.criterion.version}`:x.reason));tr.append(td0,d,m,diff,t);$('measureTable').append(tr);}
 const advice=r.advice||{};$('advice').append(el('p',advice.summary||'판정 근거가 부족합니다.'));
 if(advice.actions?.length){$('advice').append(el('h3','추가 확인 권고'));const ul=document.createElement('ul');for(const a of advice.actions)ul.append(el('li',`${a.item}: ${a.action} (${a.evidence})`));$('advice').append(ul);}
 if(advice.missing?.length){$('advice').append(el('h3','보류 항목'));const ul=document.createElement('ul');for(const a of advice.missing)ul.append(el('li',`${a.item}: ${a.reason}`));$('advice').append(ul);}
 $('advice').append(el('p',advice.disclaimer||'','muted'));
 const ev=r.evidence||{};$('evidence').append(el('p',`원문 일부 잘림: ${ev.truncated?'예':'아니오'} · 등록 사진 수: ${ev.photoCount??'정보 없음'} · 이 모듈에서 분석한 사진: 0장 · 원본 데이터 수정: 없음`),el('p',ev.photoInterpretation||'이미지 분석 미실시'));
}
$('export').addEventListener('click',()=>{if(!last)return;const blob=new Blob([JSON.stringify(last,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ttoktti_ch01_analysis_demo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
