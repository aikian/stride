import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import ts from 'typescript';import crypto from 'node:crypto';
const source=fs.readFileSync('src/App.tsx','utf8');
const core=source.slice(source.indexOf('type Profile'),source.indexOf('export default'))+';globalThis.api={levelFor,defaultDays,plan,segmentAt,skipForward,dayInfo,addDays,clock,kmBetween,loadData,saveData,advance,nextTraining,buildIcs,kcalPerMin,upsertWeight,durText};';
const store=new Map();const c={crypto:crypto.webcrypto,localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)}};vm.createContext(c);vm.runInContext(ts.transpile(core,{target:ts.ScriptTarget.ES2022}),c);const {levelFor,defaultDays,plan,segmentAt,skipForward,dayInfo,addDays,clock,kmBetween,loadData,saveData,advance,nextTraining,buildIcs,kcalPerMin,upsertWeight,durText}=c.api;
for(let w=1;w<=8;w++)for(let day=1;day<=3;day++){const seg=plan(w,null,day);let t=0;seg.forEach((s,i)=>{assert.equal(segmentAt(seg,t).index,i);assert.equal(segmentAt(seg,t+s.seconds-.001).index,i);t+=s.seconds;});assert.equal(segmentAt(seg,t).remaining,0);}
const a={segments:plan(1,null),schedule:12,elapsed:12,calories:1.3,distance:.01,paused:true};const next=skipForward(a);assert.equal(next.schedule,300);assert.equal(next.elapsed,12);assert.equal(next.calories,1.3);assert.equal(next.distance,.01);assert.equal(next.paused,true);assert.equal(next.skipped,1);assert.equal(segmentAt(next.segments,next.schedule).kind,'run');
let run=a;for(let i=0;i<12;i++)run=skipForward(run);assert.equal(run.schedule,1500);assert.equal(run.elapsed,12);assert.equal(run.skipped,12);
let count=0;for(let i=0;i<56;i++){const date=addDays('2026-09-29',i);const info=dayInfo('2026-09-29',date);assert.equal(info.week,Math.floor(i/7)+1);assert.equal(info.inRange,true);if(info.sessionDay)count++;}assert.equal(count,24);assert.equal(dayInfo('2026-09-29','2026-11-24').inRange,false);assert.equal(addDays('2026-12-31',1),'2027-01-01');
const profile={height:170,weight:70,age:30,experience:'new'};saveData({profile,planStart:'2026-09-29'});saveData({runs:[{id:'unit-test'}]});assert.equal(loadData().profile.height,170);assert.equal(loadData().planStart,'2026-09-29');assert.equal(loadData().runs[0].id,'unit-test');
assert.equal(plan(1,profile,3)[1].seconds,90);assert.equal(clock(125.8),'02:05');assert.ok(Math.abs(kmBetween([0,0],[0,1])-111.195)<.01);
console.log('PASS: 24 course boundaries; skip preserves real time, calories, distance and pause; 56 dates/24 sessions; local data persistence; GPS math.');
const sp={walkSpeed:5,runSpeed:7};const base={segments:plan(1,profile,1),schedule:0,elapsed:0,calories:0,distance:0,paused:false,mode:'treadmill'};
const big=advance(base,600,70,sp);assert.equal(big.schedule,600);assert.equal(big.elapsed,600);assert.ok(Math.abs(big.distance-(5*420+7*180)/3600)<1e-6,'treadmill distance follows each segment speed across a long background gap');
let s1=base;for(let i=0;i<1200;i++)s1=advance(s1,0.5,70,sp);assert.ok(Math.abs(s1.calories-big.calories)<1e-6,'many small ticks equal one big catch-up tick');
const fin=advance(base,99999,70,sp);assert.equal(fin.schedule,fin.segments.reduce((s,x)=>s+x.seconds,0));assert.equal(advance({...base,mode:'outdoor'},600,70,sp).distance,0);
assert.ok(kcalPerMin('run',7,88)>kcalPerMin('walk',5,88));assert.equal(durText(90),'1분 30초');assert.equal(durText(300),'5분');
assert.equal(skipForward({...base,schedule:300}).skippedRun,1);assert.equal(skipForward({...base,schedule:10}).skippedRun,0);
assert.equal(nextTraining('2026-09-29','2026-09-30'),'2026-10-01');assert.equal(nextTraining('2026-09-29','2026-11-24'),null);assert.equal(dayInfo('2026-09-29','2026-09-27').sessionDay,0);
const ics=buildIcs('2026-09-29','07:30',profile);assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,24);assert.ok(ics.includes('DTSTART:20260929T073000'));
assert.deepEqual(JSON.parse(JSON.stringify(upsertWeight([{date:'2026-09-02',kg:80},{date:'2026-09-01',kg:81}],{date:'2026-09-02',kg:79.5}))),[{date:'2026-09-01',kg:81},{date:'2026-09-02',kg:79.5}]);
console.log('PASS: background catch-up timing, treadmill distance/kcal, skip tracking, next session, 24-event calendar, weight log.');
assert.equal(levelFor(3,3,{1:3,2:1}),2,'week 2 had <2 done → hold level');assert.equal(levelFor(3,3,{1:3,2:2}),3);assert.equal(levelFor(5,3,{1:3,2:3}),5,'future weeks assume progress');
// 2026-09-29 is Tue; choosing Mon/Wed/Fri → Wed(1), Fri(2), Mon(3) within the first 7-day window
assert.equal(dayInfo('2026-09-29','2026-09-30',[1,3,5]).sessionDay,1);assert.equal(dayInfo('2026-09-29','2026-10-02',[1,3,5]).sessionDay,2);assert.equal(dayInfo('2026-09-29','2026-10-05',[1,3,5]).sessionDay,3);assert.equal(dayInfo('2026-09-29','2026-09-29',[1,3,5]).sessionDay,0);
let cnt=0;for(let i=0;i<56;i++)if(dayInfo('2026-09-29',addDays('2026-09-29',i),[0,2,6]).sessionDay)cnt++;assert.equal(cnt,24);
assert.ok(kcalPerMin('walk',5,80,5)>kcalPerMin('walk',5,80,0)*1.4,'incline walking burns noticeably more');
console.log('PASS: chosen weekdays, adaptive level, incline calories.');
