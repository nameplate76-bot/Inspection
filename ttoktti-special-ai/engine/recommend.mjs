/** Draft-only, evidence-labeled recommendations. No writes, no diagnosis without evidence. */
export function recommendations(judgments,knowledge=[]){
  const outside=judgments.filter(j=>j.judgment==='outside_criterion');
  const insufficient=judgments.filter(j=>j.judgment==='hold');
  return {status:outside.length?'review_required':insufficient.length?'hold':'review_required',
    summary:outside.length?`검증된 기준 범위 밖의 측정항목 ${outside.length}건을 확인했습니다.`:'확정적인 이상 판정을 내리지 않습니다.',
    actions:outside.map(j=>({item:j.item,action:'측정 조건과 계측기 상태를 확인하고 재측정 후 담당 기술자가 원인을 검토하세요.',evidence:`${j.group}/${j.item}: ${j.measured} ${j.unit}; 기준 ${j.criterion.min}~${j.criterion.max} ${j.unit}`,source:j.criterion.source})),
    missing:insufficient.map(j=>({item:j.item,reason:j.reason})),knowledge:knowledge.map(k=>({title:k.title,source:k.source,version:k.version})),
    disclaimer:'AI 참고용 초안입니다. 성능점검 결과 및 조치 확정은 권한 있는 점검원이 수행합니다.'};
}
