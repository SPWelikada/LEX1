import { currentUser } from '@/lib/auth';
import { exportRecords } from '@/lib/store.mjs';
export async function GET(){ const user=await currentUser();if(!user)return Response.json({error:'Sign in required'},{status:401});return new Response(JSON.stringify({environment:'synthetic-demo',organisation:user.org,exported:new Date().toISOString(),records:exportRecords(user)},null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="lex-procurement.json"','Cache-Control':'private, no-store'}});}
