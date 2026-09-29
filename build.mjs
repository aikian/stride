import fs from 'node:fs';
const {build}=await import(process.env.STRIDE_ESBUILD_MODULE || 'esbuild');
const result=await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,charset:'utf8',format:'iife',jsx:'automatic',write:false,define:{'process.env.NODE_ENV':'"production"'},target:['es2020'],legalComments:'inline',tsconfig:'tsconfig.json'});
const js=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const css=fs.readFileSync('src/base.css','utf8')+'\n'+fs.readFileSync('src/extra.css','utf8');
const icon=fs.readFileSync('icon-192.png').toString('base64');
fs.writeFileSync('index.html',`<!doctype html><html lang="ko" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#111413"><meta name="description" content="로그인 없는 러닝 웹앱: 날짜별 훈련 코스와 구간 타이머"><title>STRIDE · 러닝 웹앱</title><link rel="icon" href="data:image/png;base64,${icon}"><link rel="manifest" href="./manifest.webmanifest"><style>${css}</style></head><body><div id="root"></div><noscript>이 앱은 JavaScript를 사용하는 웹앱입니다. 브라우저에서 JavaScript를 허용해주세요.</noscript><script>${js}</script></body></html>`);
console.log('Built self-contained index.html: '+fs.statSync('index.html').size+' bytes');
