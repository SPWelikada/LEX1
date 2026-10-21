import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
const path = process.env.LEX_DB_PATH || `${process.cwd()}/.data/lex.sqlite`;
mkdirSync(dirname(path), { recursive: true });
const db = new DatabaseSync(path);
db.exec(`PRAGMA busy_timeout=10000; PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, org TEXT NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, maker TEXT NOT NULL, data TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, record TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, version INTEGER NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, actor TEXT NOT NULL, expires INTEGER NOT NULL);`);
export const users = {
 'buyer': { name: 'Anjali Perera', role: 'Buyer maker', org: 'serendib', initials: 'AP' },
 'approver': { name: 'Nimal Fernando', role: 'Participant approver', org: 'serendib', initials: 'NF' },
 'supplier': { name: 'Kavindi Silva', role: 'Seller maker', org: 'solar', initials: 'KS' },
};
export function startSession(actor) {
 if (!Object.hasOwn(users,actor)) throw Error('Unknown demo identity');
 const token = randomUUID() + randomUUID();
 db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token,actor,Date.now()+8*3600000); return token;
}
export function session(token) {
 const s=db.prepare('SELECT actor FROM sessions WHERE token=? AND expires>?').get(token||'',Date.now());
 return s && Object.hasOwn(users,s.actor) ? { ...users[s.actor], actor:s.actor } : null;
}
export function endSession(token) { db.prepare('DELETE FROM sessions WHERE token=?').run(token||''); }
function event(id, actor, action, version) { db.prepare('INSERT INTO events(record,actor,action,version,created) VALUES(?,?,?,?,?)').run(id,actor,action,version,new Date().toISOString()); }
function insert(org,kind,title,status,maker,data,id=randomUUID()) {
 db.prepare('INSERT INTO records VALUES(?,?,?,?,?,1,?,?,?)').run(id,org,kind,title,status,maker,JSON.stringify(data),new Date().toISOString());
 event(id,maker,'Created',1); return id;
}
function decode(r) { return r ? {...r,data:JSON.parse(r.data)} : null; }
export function list(user,kind) {
 if(!user) throw Error('Sign in required');
 return db.prepare('SELECT * FROM records WHERE org=? AND kind=? ORDER BY created DESC').all(user.org,kind).map(decode).filter(r=>kind!=='offers'||db.prepare('SELECT status FROM records WHERE id=?').get(r.data.tender)?.status!=='Open');
}
export function get(user,id) {
 if(!user) throw Error('Sign in required');
 const r=decode(db.prepare('SELECT * FROM records WHERE id=? AND org=?').get(id,user.org));
 if(!r) throw Error('Record unavailable in this organisation'); return r;
}
export function history(user,id) { get(user,id); return db.prepare('SELECT * FROM events WHERE record=? ORDER BY id DESC').all(id); }
export function createRequirement(user,input) {
 if(user?.actor!=='buyer') throw Error('Buyer maker role required');
 const title=String(input.title||'').trim(), quantity=Number(input.quantity), price=Number(input.price);
 if(title.length<5 || title.length>120 || !Number.isFinite(quantity) || quantity<=0 || quantity>1000000 || !Number.isFinite(price) || price<=0 || price>1000) throw Error('Enter a title (5–120 characters), positive annual MWh (up to 1,000,000) and budget LKR/kWh (up to 1,000).');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.delivery||'') || !Number.isFinite(Date.parse(input.delivery)) || input.delivery < new Date().toISOString().slice(0,10)) throw Error('Choose a valid future delivery date.');
 return insert(user.org,'requirements',title,'Draft',user.actor,{quantity,price,delivery:input.delivery,source:input.source==='Solar'?'Solar':'Any renewable',location:'Western Province'});
}
export function transition(user,id,version,command) {
 db.exec('BEGIN IMMEDIATE');
 try {
 const r=get(user,id);
 if(r.version!==version) throw Error('This record has changed. Refresh and review the latest version.');
 let status; let child;
 if(command==='publish' && user.actor==='buyer' && r.kind==='requirements' && r.status==='Draft') {
 status='Tender published'; child=insert(user.org,'tenders',r.title,'Open',user.actor,{...r.data,requirement:id});
 } else if(command==='close' && user.actor==='buyer' && r.kind==='tenders' && r.status==='Open') {
 status='Evaluation';
 } else if(command==='review' && user.actor==='buyer' && r.kind==='tenders' && r.status==='Evaluation') {
 const offers=list(user,'offers').filter(o=>o.data.tender===id);
 if(!offers.length) throw Error('At least one offer is required before review.');
 status='Pending approval';
 } else if(command==='approve' && user.actor==='approver' && r.maker!==user.actor && r.kind==='tenders' && r.status==='Pending approval') {
 status='Award approved'; const offers=list(user,'offers').filter(o=>o.data.tender===id).sort((a,b)=>a.data.price-b.data.price);
 if(!offers.length) throw Error('No eligible offer');
 child=insert(user.org,'contracts',r.title,'Draft · awaiting signatures',user.actor,{...r.data,supplier:offers[0].data.supplier,price:offers[0].data.price,tender:id});
 } else throw Error('Action is not permitted for this role or record state.');
 db.prepare('UPDATE records SET status=?, version=version+1 WHERE id=?').run(status,id);
 event(id,user.actor,command,version+1); db.exec('COMMIT'); return child||id;
 } catch(e) { db.exec('ROLLBACK'); throw e; }
}
export function exportRecords(user) { return ['requirements','tenders','contracts'].flatMap(k=>list(user,k)); }
// Fixed synthetic fixtures. They are never represented as live market information.
db.exec('BEGIN IMMEDIATE');
if(!db.prepare('SELECT id FROM records LIMIT 1').get()) {
 insert('serendib','requirements','2027 renewable energy supply','Draft','buyer',{quantity:4800,price:32.5,delivery:'2027-04-01',source:'Any renewable',location:'Western Province'},'req-2027');
 insert('serendib','tenders','Rooftop solar · Western Province','Evaluation','buyer',{quantity:2400,price:34,delivery:'2027-04-01',source:'Solar',location:'Western Province'},'tender-solar');
 for(const [name,price,capacity] of [['Helio Ceylon Energy',28.4,12],['Lanka Solar Partners',30.2,8],['Southern Renewables',31.6,20]])
 insert('serendib','offers',`${name} · supply proposal`,'Received','supplier',{tender:'tender-solar',supplier:name,price,quantity:2400,capacity,fees:1.5,term:10,qualification:'Synthetic evidence only'});
 insert('serendib','contracts','Central Province · renewable PPA','Draft · awaiting signatures','approver',{quantity:3600,price:29.8,delivery:'2027-01-01',supplier:'Hill Country Renewables'},'contract-central');
 insert('serendib','assets','Colombo distribution centre','Registered · demo','buyer',{quantity:4800,location:'Colombo',type:'Consumer site'},'asset-colombo');
 insert('solar','assets','Galle solar park','Proposed · demo','supplier',{quantity:12000,location:'Galle',type:'Solar generation'},'asset-galle');
}
db.exec('COMMIT');
export function invitations(user) {
 if(user?.actor!=='supplier') throw Error('Seller maker required');
 return db.prepare("SELECT id,title,data FROM records WHERE kind='tenders' AND status='Open'").all().map(r=>{const d=JSON.parse(r.data);return {id:r.id,title:r.title,quantity:d.quantity,delivery:d.delivery,source:d.source};});
}
export function submitOffer(user,input) {
 if(user?.actor!=='supplier') throw Error('Seller maker required');
 const tender=invitations(user).find(t=>t.id===input.tender);const price=Number(input.price);
 if(!tender || !Number.isFinite(price) || price<=0 || price>1000) throw Error('Select an open invitation and a positive rate up to 1,000 LKR/kWh.');
 const target=db.prepare('SELECT org FROM records WHERE id=?').get(tender.id);
 const existing=db.prepare("SELECT id FROM records WHERE kind='offers' AND maker=? AND json_extract(data,'$.tender')=? AND json_extract(data,'$.supplier')='Solar Lanka'").get(user.actor,tender.id);
 if(existing) throw Error('A response has already been submitted for this invitation.');
 return insert(target.org,'offers',`Solar Lanka · supply proposal`,'Received',user.actor,{tender:tender.id,supplier:'Solar Lanka',price,quantity:tender.quantity,capacity:8,fees:1.5,term:10,qualification:'Synthetic evidence only'});
}
