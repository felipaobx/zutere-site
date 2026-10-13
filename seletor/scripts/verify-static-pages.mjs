import assert from 'node:assert/strict';
for (const origin of ['https://zutere.com.br', 'https://www.zutere.com.br']) {
  for (let index = 0; index < 8; index++) {
    const response = await fetch(origin + '/fotos?verificacao=' + index, { headers: { 'cache-control': 'no-cache' } });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(html.includes('/fotos/browser-assets/'), 'A página deve usar o frontend estático.');
    assert.ok(!html.includes('Worker exceeded resource limits'));
    if (index === 0) for (const asset of [...html.matchAll(/(?:src|href)="([^"]+browser-assets[^"]+)"/g)].map(match => match[1])) {
      const file = await fetch(origin + asset);
      assert.equal(file.status, 200);
      assert.ok(!file.headers.get('content-type')?.includes('text/html'), 'O arquivo precisa ter o tipo correto.');
    }
  }
  console.log('PASS 8 carregamentos estáticos e arquivos: ' + origin + '/fotos');
  assert.equal((await fetch(origin + '/fotos/api/client/galleries')).status, 401);
  console.log('PASS lista de galerias protegida');
}
