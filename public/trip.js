export function reviseTrip(trip,note,excludedId){
 const text=String(note??'').trim();if(!text||text.length>350)throw new Error('补充顾虑请填写 1–350 字。');
 const revisions=[...(trip.revisions??[]),text];if(revisions.length>8)throw new Error('已保留 8 轮顾虑，请整理条件后重新提交。');
 return {...trip,revisions,excluded:[...new Set([...(trip.excluded??[]),excludedId])]};
}
