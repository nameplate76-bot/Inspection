/* M1.0.2 - Single criteria classification used by PDF and editable Excel.
   Template text is authoritative. No summary or omitted lines. */
(()=>{'use strict';
function parse(raw){
 const source=String(raw||'').replace(/\r/g,'').trim();
 if(!source)return[{label:'점검기준',lines:['']}];
 const lines=source.split('\n').map(v=>v.trim()).filter(Boolean);
 if(!lines.length)return[{label:'점검기준',lines:['']}];
 // Long technical criteria contain tables, formulas or regulations: never guess how to split them.
 if(source.length>440||/^(?:가|나|다)\.|<표|측정항목\s*[:：]/m.test(source))return[{label:'점검기준',lines:[source]}];
 const bullets=[];
 for(const line of lines){
  if(/^[-•·]\s*/.test(line)){bullets.push(line)}
  else if(bullets.length){bullets[bullets.length-1]+=' '+line}
  else bullets.push(line);
 }
 if(!bullets.length)return[{label:'점검기준',lines:[source]}];
 // Only treat the first bullet as a method when it unambiguously describes a procedure.
 const first=bullets[0].replace(/^[-•·]\s*/, '').trim();
 const procedure=/(측정|육안.?점검|육안.?확인|비교.?확인|개방하여|설치하여|점검구를|운전 중|운전 시|확인한다|조사한다|시험한다|측정한다|비교한다|실시한다|확인 후)/.test(first);
 const question=/[?？]$/.test(first)||/(인가|있는가|없는가|만족하는가|이내인가|양호한가|작성되었는가|초과하는가)$/.test(first);
 if(bullets.length>=2&&procedure&&!question){return[{label:'점검방법',lines:[bullets[0]]},{label:'점검기준',lines:bullets.slice(1)}]}
 return[{label:'점검기준',lines:bullets}];
}
window.PerformanceM1CriteriaLayout={parse};
})();
