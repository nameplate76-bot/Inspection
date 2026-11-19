/** Offline demo lookup; replace with authenticated retrieval in a TEST backend. */
export function findKnowledge(question,documents=[]){
  const words=String(question).toLowerCase().match(/[가-힣a-z0-9]{2,}/g)??[];
  return documents.filter(d=>d?.approved===true && d?.source && d?.version && d?.effectiveDate && typeof d?.text==='string')
    .map(d=>({...d,score:words.filter(w=>d.text.toLowerCase().includes(w)).length}))
    .filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,3)
    .map(({id,title,source,version,effectiveDate,text})=>({id,title,source,version,effectiveDate,excerpt:text.slice(0,600)}));
}
