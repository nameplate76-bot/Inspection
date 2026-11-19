import {locateEquipment} from './normalize.mjs';
import {compareMeasurements} from './compare.mjs';
import {judgeComparisons} from './judge.mjs';
import {findKnowledge} from './knowledge.mjs';
import {recommendations} from './recommend.mjs';
export function analyzeReadOnly(snapshot,{number='CH-01',criteria=[],documents=[],question=''}={}){
  const found=locateEquipment(snapshot,number);
  if(!found.ok)return {status:'hold',reason:found.reason,number};
  const comparison=compareMeasurements(found.equipment),judgments=judgeComparisons(comparison,criteria),references=findKnowledge(question,documents);
  return {number,site:found.site,equipment:{number:found.equipment.number,type:found.equipment.type,format:found.equipment.format},comparison:judgments,advice:recommendations(judgments,references),evidence:{truncated:found.truncated,photoCount:found.photoCount,imagesSent:found.sentPhotos.length,unseenPhotos:found.unseenPhotos,photoInterpretation:'사진 분석 미실시: 이 모듈은 원본 사진을 읽거나 분석하지 않습니다.'},readOnly:true};
}
