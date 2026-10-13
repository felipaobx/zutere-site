import { redirect } from 'next/navigation';
import { getChatGPTUser } from '../chatgpt-auth';
import LoginForm from '../login-form';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{alterado?:string}>}){if(await getChatGPTUser())redirect('/fotos/fotografo/painel');const query=await searchParams;return <LoginForm photographer notice={query.alterado==='1'?'Login atualizado. Entre com seu e-mail e senha atuais.':undefined}/>;}
