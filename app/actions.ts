'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { startSession, endSession, createRequirement, transition } from '@/lib/store.mjs';
import { requireUser } from '@/lib/auth';
async function sameOrigin(){ const h=await headers(); const origin=h.get('origin'); if(!origin || new URL(origin).host!==h.get('host')) throw Error('Invalid request origin'); }
export async function login(form:FormData){
 await sameOrigin(); const actor=String(form.get('actor')); const token=startSession(actor);
 (await cookies()).set('lex-session',token,{httpOnly:true,sameSite:'lax',secure:process.env.LEX_SECURE_COOKIE==='true',path:'/',maxAge:28800});
 redirect(`/w/${actor==='supplier'?'solar':'serendib'}/overview`);
}
export async function logout(){ await sameOrigin(); const c=await cookies(); endSession(c.get('lex-session')?.value); c.delete('lex-session'); redirect('/'); }
export async function saveRequirement(form:FormData){
 await sameOrigin(); const user=await requireUser(); let id;
 try { id=createRequirement(user,Object.fromEntries(form)); }
 catch(e){ redirect(`/w/${user.org}/requirements/new?error=${encodeURIComponent((e as Error).message)}`); }
 revalidatePath(`/w/${user.org}`,'layout'); redirect(`/w/${user.org}/requirements/${id}`);
}
export async function changeState(form:FormData){
 await sameOrigin(); const user=await requireUser(); const id=String(form.get('id')); const kind=String(form.get('kind'));
 if(!['requirements','tenders'].includes(kind)) throw Error('Invalid record type');
 try { transition(user,id,Number(form.get('version')),String(form.get('command'))); }
 catch(e){ redirect(`/w/${user.org}/${kind}/${id}?error=${encodeURIComponent((e as Error).message)}`); }
 revalidatePath(`/w/${user.org}`,'layout'); redirect(`/w/${user.org}/${kind}/${id}?success=1`);
}
export async function sendOffer(form:FormData){
 await sameOrigin(); const user=await requireUser();
 const {submitOffer}=await import('@/lib/store.mjs');let receipt;
 try { receipt=submitOffer(user,Object.fromEntries(form)); }
 catch(e){redirect(`/w/${user.org}/offers?error=${encodeURIComponent((e as Error).message)}`);}
 revalidatePath(`/w/${user.org}`,'layout');redirect(`/w/${user.org}/offers?receipt=${receipt}`);
}
