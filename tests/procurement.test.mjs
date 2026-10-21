import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'lex-test-'));process.env.LEX_DB_PATH=join(dir,'test.sqlite');
const s=await import('../lib/store.mjs');
const buyer={...s.users.buyer,actor:'buyer'}, approver={...s.users.approver,actor:'approver'}, supplier={...s.users.supplier,actor:'supplier'};
after(()=>rmSync(dir,{recursive:true,force:true}));
test('complete procurement journey with supplier response, version checks and independent approval',()=>{
 const id=s.createRequirement(buyer,{title:'Integration test renewable supply',quantity:1200,price:32,delivery:'2035-01-01',source:'Solar'});
 assert.equal(s.get(buyer,id).status,'Draft');
 const tender=s.transition(buyer,id,1,'publish');
 assert.equal(s.get(buyer,tender).status,'Open');
 assert.throws(()=>s.transition(buyer,id,1,'publish'),/changed/);
 assert.throws(()=>s.get(supplier,tender),/unavailable/);
 assert.ok(s.invitations(supplier).some(t=>t.id===tender));
 assert.equal(s.list(buyer,'offers').filter(o=>o.data.tender===tender).length,0);
 const receipt=s.submitOffer(supplier,{tender,price:29.5});assert.ok(receipt);
 assert.throws(()=>s.submitOffer(supplier,{tender,price:30}),/already/);
 assert.equal(s.list(buyer,'offers').filter(o=>o.data.tender===tender).length,0);
 s.transition(buyer,tender,1,'close');
 assert.equal(s.list(buyer,'offers').filter(o=>o.data.tender===tender).length,1);
 s.transition(buyer,tender,2,'review');
 assert.throws(()=>s.transition(buyer,tender,3,'approve'),/not permitted/);
 const contract=s.transition(approver,tender,3,'approve');
 assert.equal(s.get(buyer,contract).data.supplier,'Solar Lanka');
 assert.equal(s.get(buyer,contract).status,'Draft · awaiting signatures');
 assert.equal(s.get(buyer,tender).version,4);
 assert.equal(s.history(buyer,tender).length,4);
 assert.throws(()=>s.transition(approver,tender,3,'approve'),/changed/);
});
test('tenant isolation also applies to exports and histories',()=>{
 assert.equal(s.list(supplier,'requirements').length,0);
 assert.equal(s.exportRecords(supplier).length,0);
 assert.throws(()=>s.history(supplier,'req-2027'),/unavailable/);
 assert.throws(()=>s.createRequirement(approver,{}),/Buyer maker/);
 assert.throws(()=>s.list(null,'contracts'),/Sign in/);
});
test('invalid values cannot create procurement records',()=>{
 for(const quantity of [0,-1,NaN,Infinity,1000001]) assert.throws(()=>s.createRequirement(buyer,{title:'Invalid energy requirement',quantity,price:30,delivery:'2035-01-01'}));
 assert.throws(()=>s.createRequirement(buyer,{title:'Invalid date requirement',quantity:1,price:30,delivery:'2020-01-01'}),/future/);
 assert.throws(()=>s.submitOffer(buyer,{tender:'tender-solar',price:30}),/Seller maker/);
});
test('session issuance, lookup and revocation',()=>{
 const token=s.startSession('buyer');assert.equal(s.session(token).org,'serendib');
 assert.equal(s.session('forged'),null);s.endSession(token);assert.equal(s.session(token),null);
 assert.throws(()=>s.startSession('admin'),/Unknown/);
});
