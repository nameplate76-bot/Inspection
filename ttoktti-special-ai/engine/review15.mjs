// Read-only evidence review. This module NEVER claims to interpret image pixels or determine legal compliance.
const s=v=>String(v??'').trim();
const nonempty=v=>s(v).length>0;
export function reviewFifteen(snapshot, number, templateRows=[]){
  const data=snapshot?.data??snapshot;
  if(!data||!Array.isArray(data.equipment))return {status:'hold',reason:'equipment 배열이 없습니다.'};
  const candidates=data.equipment.filter(e=>s(e.number).toUpperCase()===s(number).toUpperCase());
  if(candidates.length!==1)return {status:'hold',reason:candidates.length?'동일 설비번호가 여러 건입니다. 현장을 확인하세요.':'설비번호가 없습니다.'};
  const e=candidates[0];const originals=Array.isArray(e.items)?e.items:[];
  const refs=Array.isArray(e.photoRefs)?e.photoRefs:[];
  const sources=Array.isArray(snapshot?.photoSources)?snapshot.photoSources:[];
  const items=templateRows.map((t,i)=>{
    const it=originals.find(x=>Number(x.index)===i+1)??originals[i]??null;
    const title=s(it?.title)||t.title;
    const reasons=it?.reasons&&typeof it.reasons==='object'?it.reasons:{};
    const reasonEntries=Object.entries({...reasons,...Object.fromEntries(['reason0','reason1','reason2','vacuumReason1','vacuumReason2'].filter(k=>nonempty(it?.[k])).map(k=>[k,it[k]]))}).filter(([,v])=>nonempty(v));
    const photoRefs=refs.filter(p=>p.kind==='item'&&(p.itemIndex===i||(!Number.isInteger(p.itemIndex)&&s(p.item)===title)));
    const rawPhotos=Array.isArray(it?.photos)?it.photos.map((v,j)=>({itemIndex:i,index:j,exists:!!v})).filter(x=>x.exists):[];
    const directSources=sources.filter(p=>s(p.equipment).toUpperCase()===s(number).toUpperCase() && (s(p.item).startsWith(title)||s(p.item)===title));
    const count=Math.max(photoRefs.length,rawPhotos.length,directSources.length);
    const result=s(it?.result)||'미작성';
    const missing=[];if(!it)missing.push('점검항목 기록 없음');
    if(!result||result==='미작성')missing.push('점검결과 미작성');
    if(!reasonEntries.length)missing.push('점검 사유 없음');
    if(!count)missing.push('등록 사진 없음');
    const hasEvidence=reasonEntries.length>0||count>0||nonempty(it?.measurement);
    const reviewNeeded=['미흡','부적합','불량'].some(x=>result.includes(x));
    // Never assert photo contents. Flag incomplete evidence and discrepancies for human review.
    const flags=[];if(reviewNeeded&&!reasonEntries.length)flags.push('미흡 등의 결과에 대한 사유 미입력');
    if(reviewNeeded&&!count)flags.push('미흡 등의 결과에 대한 사진 미등록');
    return {index:i+1,title,result,criteriaText:t.criteriaText,reasons:reasonEntries.map(([field,text])=>({field,text:s(text)})),measurement:s(it?.measurement),action:s(it?.action),photoCount:count,photoRefs,missing,flags,hasEvidence,reviewNeeded,reviewStatus:!it?'not_recorded':missing.length?'incomplete':'requires_expert_review'};
  });
  const measurements=Array.isArray(e.measurements)?e.measurements:[];
  const suspicious=(data.truncated===true);
  const complete=items.filter(x=>x.missing.length===0).length;
  return {status:'ready_for_review',equipment:{number:e.number,type:e.type,format:e.format},site:data.site??{},items,measurements,summary:{total:items.length,complete,unfilled:items.filter(x=>x.missing.includes('점검결과 미작성')).length,missingPhotos:items.filter(x=>x.photoCount===0).length,missingReasons:items.filter(x=>x.reasons.length===0).length,measurementsCount:measurements.length,reviewNeeded:items.filter(x=>x.reviewNeeded).length},dataTruncated:suspicious,photoPixelsInterpreted:false,notes:['사진은 첨부 여부만 확인하며 이미지 내용 판독은 아직 하지 않습니다.','사진/사유/측정값의 일치 여부는 기술자가 판단해야 합니다.','15개 항목 템플릿은 M1.3.3 냉동기 원본에서 가져왔습니다.','본 결과는 법정 적합·미흡 최종 판정이 아닙니다.'],readOnly:true};
}
