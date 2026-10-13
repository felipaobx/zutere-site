import { redirect } from 'next/navigation';
import { getChatGPTUser } from '../chatgpt-auth';
import LoginForm from '../login-form';
export const dynamic='force-dynamic';
export default async function Page(){if(await getChatGPTUser())redirect('/fotos/fotografo/painel');return <LoginForm photographer/>;}
