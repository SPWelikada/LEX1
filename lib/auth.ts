import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { session } from './store.mjs';
export async function currentUser(){ return session((await cookies()).get('lex-session')?.value); }
export async function requireUser(org?:string){ const user=await currentUser(); if(!user) redirect('/sign-in'); if(org && user.org!==org) redirect(`/w/${user.org}/overview`); return user; }
