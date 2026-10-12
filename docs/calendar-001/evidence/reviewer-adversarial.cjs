const fs=require('fs'); const ts=require(process.cwd()+'/node_modules/typescript'); const Module=require('module'); const assert=require('node:assert/strict');
const file=process.cwd()+'/src/lib/calendar.ts'; const m=new Module(file, module); m.filename=file; m.paths=module.paths; m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {appointmentLanes,clockTime,weekDays,addDays,findConflict,validAppointmentTime,isPastAppointment}=m.exports;
let state=123456789; const rand=n=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state%n;};
const base={patientId:'p',date:'2026-10-12',dentist:'A',chair:'Sillón 1',type:'x',status:'Confirmada'};
let cases=0, comparisons=0;
for(let trial=0;trial<3000;trial++) {
 const appts=Array.from({length:1+rand(18)},(_,i)=>{const start=480+15*rand(48);const duration=15*(1+rand(Math.min(16,(1200-start)/15)));return {...base,id:String(i),time:clockTime(start),duration};});
 const result=appointmentLanes(appts);assert.equal(result.length,appts.length);
 for(const a of result) {assert.ok(a.lane>=0&&a.lane<a.lanes);for(const b of result){if(a===b)continue; const start=x=>Number(x.time.slice(0,2))*60+Number(x.time.slice(3));if(start(a.appointment)<start(b.appointment)+b.appointment.duration&&start(b.appointment)<start(a.appointment)+a.appointment.duration){assert.notEqual(a.lane,b.lane); comparisons++;}}} cases++;
}
assert.deepEqual(weekDays('2028-02-29'),['2028-02-28','2028-02-29','2028-03-01','2028-03-02','2028-03-03','2028-03-04','2028-03-05']);
assert.deepEqual(weekDays('2026-10-18',true),['2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16']);
assert.equal(addDays('2028-02-29',7),'2028-03-07');
const last={...base,id:'last',time:'19:45',duration:15};assert.equal(validAppointmentTime(last),true);
for (const status of ['Confirmada','En espera','Completada']){const old={...base,id:'old',time:'09:00',duration:45,status};assert.equal(findConflict({...old,id:'new',dentist:'B'},[old]).id,'old');assert.equal(findConflict({...old,id:'new',chair:'Sillón 2'},[old]).id,'old');}
const now=new Date('2026-10-12T09:30:59');assert.equal(isPastAppointment({...base,time:'09:30'},now),true);assert.equal(isPastAppointment({...base,time:'09:45'},now),false);
console.log(JSON.stringify({result:'PASS',seed:123456789,lane_cases:cases,overlap_checks:comparisons,independent_dates:['leap-day','Sunday/workweek','week-navigation'],lastSlot:'19:45/15 PASS',resourceOrStatuses:'PASS',sameDayPastClock:'PASS',node:process.version,hostTZ:Intl.DateTimeFormat().resolvedOptions().timeZone,utc:new Date().toISOString()}));
