import {parseFiniteNumber} from './normalize.mjs';
export function compareMeasurements(equipment){
  return (equipment?.measurements??[]).map((r,index)=>{
    const design=parseFiniteNumber(r.design),measured=parseFiniteNumber(r.measured);
    const result={index,group:r.group??'',item:r.item??'',unit:r.unit??'',design,measured,status:'insufficient_data',difference:null,differencePercent:null,source:'현재 점검 문서의 측정값표'};
    if(design===null||measured===null)return result;
    result.difference=Number((measured-design).toFixed(6));
    result.differencePercent=design===0?null:Number(((measured-design)/Math.abs(design)*100).toFixed(3));
    result.status='comparison_only'; // Never equate difference with statutory noncompliance.
    return result;
  });
}
