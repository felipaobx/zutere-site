'use client';
import { useState } from 'react';
export default function Page(){const [error,setError]=useState('');async function logout(){try{const response=await fetch('/fotos/api/logout',{method:'POST'});if(!response.ok)throw new Error();window.location.assign('/fotos');}catch{setError('Não foi possível sair. Tente novamente.');}}return <main className="access-page"><section className="access-panel"><h1>Encerrar sessão</h1><button onClick={logout}>Sair da minha conta</button>{error&&<p role="alert">{error}</p>}</section></main>;}
