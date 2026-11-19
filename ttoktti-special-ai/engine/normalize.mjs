/** Read-only conversion of M1.3.3 TTOKTTI_READ_INSPECTION_CONTEXT output. */
const str=(v)=>String(v??'').trim();
export function locateEquipment(snapshot, number='CH-01') {
  const data=snapshot?.data??snapshot;
  if(!data || !Array.isArray(data.equipment))return {ok:false,reason:'점검 문서 데이터가 없습니다.'};
  const target=data.equipment.find(e=>str(e.number).toUpperCase()===str(number).toUpperCase());
  if(!target)return {ok:false,reason:`${number} 설비번호가 문서에 없습니다.`,truncated:!!data.truncated};
  return {ok:true,equipment:structuredClone(target),site:structuredClone(data.site??{}),truncated:!!data.truncated,photoCount:data.photoCount??null,sentPhotos:data.sentPhotos??[],unseenPhotos:data.unseenPhotos??null};
}
export function parseFiniteNumber(v){
  if(v===null||v===undefined||typeof v==='boolean')return null;
  const s=String(v).trim().replace(/,/g,'');
  if(!s||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;
  const n=Number(s);return Number.isFinite(n)?n:null;
}
