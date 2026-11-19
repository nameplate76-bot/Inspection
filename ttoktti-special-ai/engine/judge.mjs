/** Evaluates ONLY supplied, reviewed equipment-specific criteria. No implicit legal thresholds. */
export function judgeComparisons(rows, criteria=[]){
  return rows.map(row=>{
    const matched=criteria.filter(c=>c.group===row.group&&c.item===row.item&&c.unit===row.unit&&c.approved===true&&c.source&&c.version&&c.effectiveDate&&c.operator==='between_inclusive'&&Number.isFinite(c.min)&&Number.isFinite(c.max));
    if(row.measured===null)return {...row,judgment:'hold',reason:'유효한 측정값이 없습니다.',criterion:null};
    if(matched.length!==1)return {...row,judgment:'hold',reason:'검증된 적용 기준이 없거나 적용 기준이 중복됩니다.',criterion:null};
    const c=matched[0];
    if(c.min>c.max)return {...row,judgment:'hold',reason:'기준 최솟값이 최댓값보다 큽니다.',criterion:null};
    return {...row,judgment:row.measured>=c.min&&row.measured<=c.max?'within_criterion':'outside_criterion',reason:'제공된 승인 기준에 대한 수치 비교 결과이며 법적 최종 판정은 아닙니다.',criterion:{source:c.source,version:c.version,effectiveDate:c.effectiveDate,unit:c.unit,min:c.min,max:c.max}};
  });
}
