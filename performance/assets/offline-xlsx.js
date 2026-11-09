/* M1.0.2 independent XLSX exporter. Creates OOXML ZIP with editable cells and embedded images.
   Uses locally bundled JSZip; it has no HTTP calls or Supabase dependency.
   Stage-1 format is functional, not the final 148-page source-identical template. */
(()=>{'use strict';
 const esc=x=>String(x??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
 const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const PKG='http://schemas.openxmlformats.org/package/2006/relationships';
 const colName=n=>{let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s};
 const uniqueNames=new Set();
 function sheetName(text){let base=String(text||'점검표').replace(/[\\/?*\[\]:]/g,' ').trim().slice(0,31)||'점검표',name=base,i=2;while(uniqueNames.has(name)){const suffix='_'+i++;name=base.slice(0,31-suffix.length)+suffix}uniqueNames.add(name);return name}
 function sheet(name){return {name:sheetName(name),cells:new Map(),merges:[],photos:[],heights:new Map(),columns:[17,17,17,17,17,17,17,17]}}
 function set(s,r,c,text,style=0){if(text===null||text===undefined)return;const value=String(text);s.cells.set(`${colName(c)}${r}`,{r,c,value,style})}
 function merge(s,from,to){s.merges.push(`${from}:${to}`)}
 function photo(s,uri,col,row,w=210,h=190){if(typeof uri==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[\w+/=]+$/i.test(uri)){s.photos.push({uri,col,row,w,h})}}
 function writeHeader(s,title,number,e,info){set(s,1,1,title,1);merge(s,'A1','H2');s.heights.set(1,28);s.heights.set(2,20);
  set(s,3,1,'설비번호',1);set(s,3,2,number,0);merge(s,'B3','C3');set(s,3,4,'설비종류',1);set(s,3,5,e.type,0);merge(s,'E3','H3');
  set(s,4,1,'점검자',1);set(s,4,2,e['점검자']||info['점검자']||'',0);merge(s,'B4','C4');set(s,4,4,'점검일',1);set(s,4,5,e['점검일']||info['점검시작일']||'',0);merge(s,'E4','H4')
 }
 function buildSummary(e,info){const s=sheet(`${e.number}_요약`);writeHeader(s,`${e.type} 성능점검표 · M1 시험용`,e.number,e,info);set(s,6,1,'현장명',1);set(s,6,2,info['현장명']||'',0);merge(s,'B6','H6');set(s,7,1,'설치위치',1);set(s,7,2,e['설치위치']||'',0);merge(s,'B7','H7');set(s,9,1,'번호',1);set(s,9,2,'점검항목',1);merge(s,'B9','G9');set(s,9,8,'결과',1);
 e.items.forEach((item,i)=>{const r=10+i;set(s,r,1,i+1,0);set(s,r,2,item.title,0);merge(s,`B${r}`,`G${r}`);set(s,r,8,item.result||'미작성',0);s.heights.set(r,23)});
 let r=11+e.items.length;set(s,r++,1,'미흡·조치사항',1);s.heights.set(r-1,26);
 const actions=e.items.filter(x=>x.result==='미흡'||x.result==='조치필요'||x.action).map(x=>`${x.title}: ${x.action||x.result}`).join('\n');set(s,r,1,actions||'없음');merge(s,`A${r}`,`H${r+3}`);s.heights.set(r,58);r+=5;
 set(s,r,1,'대표 현장사진',1);merge(s,`A${r}`,`H${r}`);
 const image=e.sitePhoto||e.items.flatMap(it=>it.photos||[]).find(Boolean);
 photo(s,image,0,r,650,250);r+=14;set(s,r,1,'비고',1);set(s,r,2,e['비고']||'');merge(s,`B${r}`,`H${r+2}`);
 return s}
 function buildItem(e,it,i,reasonValue){
 const s=sheet(`${e.number}_${String(i+1).padStart(2,'0')}`);s.columns=Array(9).fill(14.5);
 writeHeader(s,`${e.number} · ${it.title}`,e.number,e,{});
 set(s,6,1,'구분',1);merge(s,'A6','B6');set(s,6,3,'점검내용',1);merge(s,'C6','I6');
 const parts=window.PerformanceM1CriteriaLayout?.parse(it.criteria)||[{label:'점검기준',lines:[String(it.criteria||'')]}];
 let row=7;
 for(const part of parts){
  const start=row;
  for(const line of part.lines){set(s,row,3,line);merge(s,`C${row}`,`I${row}`);s.heights.set(row,Math.min(80,Math.max(26,Math.ceil(line.length/92)*16)));row++}
  set(s,start,1,part.label,1);merge(s,`A${start}`,`B${row-1}`);
 }
 row+=1;const titleRow=row,photoStart=++row,photoEnd=photoStart+9,reasonStart=photoEnd+1,reasonEnd=reasonStart+3;
 [['현황 사진',1],['적합',4],['미흡사항',7]].forEach(([title,col])=>{set(s,titleRow,col,title,1);merge(s,`${colName(col)}${titleRow}`,`${colName(col+2)}${titleRow}`)});
 merge(s,`A${photoStart}`,`C${reasonEnd}`); // status photo spans the photo row and both reason rows
 merge(s,`D${photoStart}`,`F${photoEnd}`);merge(s,`G${photoStart}`,`I${photoEnd}`);
 merge(s,`D${reasonStart}`,`F${reasonEnd}`);set(s,reasonStart,4,'사유 : '+reasonValue(it,'reason1'));
 merge(s,`G${reasonStart}`,`I${reasonEnd}`);set(s,reasonStart,7,'사유 : '+reasonValue(it,'reason2'));
 for(let k=photoStart;k<=reasonEnd;k++)s.heights.set(k,20);
 // All photos stretch to fill their designated areas. A 1px anchor offset is retained.
 photo(s,it.photos?.[0],0,photoStart-1,317,Math.round((reasonEnd-photoStart+1)*26.67)-2);
 photo(s,it.photos?.[1],3,photoStart-1,317,Math.round((photoEnd-photoStart+1)*26.67)-2);
 photo(s,it.photos?.[2],6,photoStart-1,317,Math.round((photoEnd-photoStart+1)*26.67)-2);
 row=reasonEnd+2;
 set(s,row,1,'측정값 / 확인내용',1);merge(s,`A${row}`,`B${row+3}`);set(s,row,3,it.measurement||'');merge(s,`C${row}`,`I${row+3}`);s.heights.set(row,36);row+=5;
 if((it.photos||[]).slice(3).some(Boolean)){
  set(s,row,1,'진공펌프 추가 사진',1);merge(s,`A${row}`,`I${row}`);row++;
  const vPhotoStart=row,vPhotoEnd=row+9,vReasonStart=vPhotoEnd+1,vReasonEnd=vReasonStart+3;
  merge(s,`A${vPhotoStart}`,`C${vReasonEnd}`);merge(s,`D${vPhotoStart}`,`F${vPhotoEnd}`);merge(s,`G${vPhotoStart}`,`I${vPhotoEnd}`);
  merge(s,`D${vReasonStart}`,`F${vReasonEnd}`);set(s,vReasonStart,4,'사유 : '+reasonValue(it,'vacuumReason1'));
  merge(s,`G${vReasonStart}`,`I${vReasonEnd}`);set(s,vReasonStart,7,'사유 : '+reasonValue(it,'vacuumReason2'));
  for(let k=vPhotoStart;k<=vReasonEnd;k++)s.heights.set(k,20);
  photo(s,it.photos?.[3],0,vPhotoStart-1,317,Math.round((vReasonEnd-vPhotoStart+1)*26.67)-2);
  photo(s,it.photos?.[4],3,vPhotoStart-1,317,Math.round((vPhotoEnd-vPhotoStart+1)*26.67)-2);
  photo(s,it.photos?.[5],6,vPhotoStart-1,317,Math.round((vPhotoEnd-vPhotoStart+1)*26.67)-2);
 }
 return s;
}
 function buildMeasurement(e,rows){const s=sheet(`${e.number}_측정값`);writeHeader(s,`${e.number} · 설계·측정값`,e.number,e,{});['구분','항목','설계값','측정값','단위','%','비고'].forEach((x,i)=>set(s,6,i+1,x,1));
 rows.forEach((row,i)=>{const n=7+i;[row.group,row.item,row.design,row.measured,row.unit,row.percent,row.note].forEach((x,k)=>set(s,n,k+1,x||''));s.heights.set(n,24)});return s}
 const styleXml=`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCEBF5"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFB7C7D3"/></left><right style="thin"><color rgb="FFB7C7D3"/></right><top style="thin"><color rgb="FFB7C7D3"/></top><bottom style="thin"><color rgb="FFB7C7D3"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" horizontal="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
 function xmlSheet(s,drawingId){const rows=new Map();for(const cell of s.cells.values()){if(!rows.has(cell.r))rows.set(cell.r,[]);rows.get(cell.r).push(cell)}
 const sheetRows=[...new Set([...rows.keys(),...s.heights.keys()])].sort((a,b)=>a-b).map(r=>{const values=(rows.get(r)||[]).sort((a,b)=>a.c-b.c).map(c=>`<c r="${colName(c.c)}${r}" s="${c.style}" t="inlineStr"><is><t xml:space="preserve">${esc(c.value)}</t></is></c>`).join('');return `<row r="${r}"${s.heights.has(r)?` ht="${s.heights.get(r)}" customHeight="1"`:''}>${values}</row>`}).join('');
 return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${NS}" xmlns:r="${REL}"><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="19"/><cols>${s.columns.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${sheetRows}</sheetData>${s.merges.length?`<mergeCells count="${s.merges.length}">${s.merges.map(x=>`<mergeCell ref="${x}"/>`).join('')}</mergeCells>`:''}<printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.15" footer="0.15"/><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>${drawingId?'<drawing r:id="rId1"/>':''}</worksheet>`}
 function drawingXml(photos){return `<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${REL}">${photos.map((p,i)=>{const cx=Math.round(p.w*9525),cy=Math.round(p.h*9525);return `<xdr:oneCellAnchor><xdr:from><xdr:col>${p.col}</xdr:col><xdr:colOff>9525</xdr:colOff><xdr:row>${p.row}</xdr:row><xdr:rowOff>9525</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i+1}" name="Inspection photo ${i+1}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId${i+1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`}).join('')}</xdr:wsDr>`}
 function rels(rels){return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${PKG}">${rels.map(r=>`<Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}"/>`).join('')}</Relationships>`}
 async function exportWorkbook(d,tools){if(!window.JSZip)throw Error('로컬 JSZip 라이브러리를 찾지 못했습니다.');uniqueNames.clear();
  const book=[];for(const e of d.equipment||[]){book.push(buildSummary(e,d.info||{}));e.items?.forEach((it,i)=>book.push(buildItem(e,it,i,tools.reasonValue)));book.push(buildMeasurement(e,tools.measurementRows(e)))}
  if(!book.length)throw Error('내보낼 설비가 없습니다.');const zip=new JSZip(),relsW=[],ctParts=[];let mediaId=1,drawingId=0;
  book.forEach((s,i)=>{const num=i+1;relsW.push({id:'rId'+num,type:REL+'/worksheet',target:'worksheets/sheet'+num+'.xml'});ctParts.push(`<Override PartName="/xl/worksheets/sheet${num}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
   let thisDrawing=0;if(s.photos.length){drawingId++;thisDrawing=drawingId;ctParts.push(`<Override PartName="/xl/drawings/drawing${drawingId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
    const imageRels=[];s.photos.forEach((p,j)=>{const match=p.uri.match(/^data:image\/(jpeg|png|webp);base64,(.*)$/i);if(!match)return;const ext=match[1].toLowerCase()==='jpeg'?'jpeg':match[1].toLowerCase();const filename=`image${mediaId++}.${ext}`;zip.file('xl/media/'+filename,match[2],{base64:true});imageRels.push({id:'rId'+(j+1),type:REL+'/image',target:'../media/'+filename})});
    zip.file(`xl/drawings/drawing${drawingId}.xml`,drawingXml(s.photos));zip.file(`xl/drawings/_rels/drawing${drawingId}.xml.rels`,rels(imageRels));zip.file(`xl/worksheets/_rels/sheet${num}.xml.rels`,rels([{id:'rId1',type:REL+'/drawing',target:`../drawings/drawing${drawingId}.xml`}]))}
   zip.file(`xl/worksheets/sheet${num}.xml`,xmlSheet(s,thisDrawing))});
  relsW.push({id:'rId'+(book.length+1),type:REL+'/styles',target:'styles.xml'});
  zip.file('xl/_rels/workbook.xml.rels',rels(relsW));zip.file('xl/styles.xml',styleXml);
  zip.file('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${NS}" xmlns:r="${REL}"><bookViews><workbookView/></bookViews><sheets>${book.map((s,i)=>`<sheet name="${esc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`);
  zip.file('_rels/.rels',rels([{id:'rId1',type:REL+'/officeDocument',target:'xl/workbook.xml'}]));
  zip.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Default Extension="webp" ContentType="image/webp"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${ctParts.join('')}</Types>`);
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:5}})
 }
 window.PerformanceM1Xlsx={export:exportWorkbook};
})();
