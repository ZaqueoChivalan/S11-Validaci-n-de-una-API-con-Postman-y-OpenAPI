import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const base = 'http://localhost:3200';
let child;
async function run(variant) { child = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: '3200', CONTRACT_VARIANT: variant }, stdio: 'ignore' }); for (let i=0;i<30;i++){try{const r=await fetch(base+'/health');if(r.status===200)return await r.json()}catch{} await new Promise(r=>setTimeout(r,100));} throw new Error('API no inició'); }
async function stop(){child?.kill(); await new Promise(r=>setTimeout(r,100));}
await mkdir('reports',{recursive:true});
const broken = await run('broken'); const brokenFailed = broken.status !== 'ok'; await stop();
const corrected = await run('correct'); const correctedPassed = corrected.status === 'ok'; await stop();
const evidence = { title: 'Incompatibilidad controlada TC-SCHEMA-01', contractRule: 'Health.status debe ser exactamente ok (OpenAPI const: ok)', brokenResponse: broken, brokenTest: brokenFailed ? 'FAIL esperado: la aserción de contrato detectó status=degraded' : 'ERROR: no falló', correctedResponse: corrected, correctedTest: correctedPassed ? 'PASS: status=ok' : 'ERROR: no corrigió', verifiedAt: new Date().toISOString() };
await writeFile('reports/controlled-failure.json', JSON.stringify(evidence,null,2));
if (!brokenFailed || !correctedPassed) { console.error('Evidencia controlada inválida'); process.exit(1); }
console.log('FAIL esperado detectado y corrección verificada. Evidencia: reports/controlled-failure.json');
