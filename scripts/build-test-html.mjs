// Gera um único HTML autocontido do app (código e fontes embutidos) para testes no navegador.
// Uso: npm run build:teste  →  dist-teste/alem-da-caneta-teste.html
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

execSync('npx expo export -p web --clear', {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_TEST_MODE: '1', EXPO_PUBLIC_INLINE_FONTS: '1' },
});

const index = readFileSync('dist/index.html', 'utf8');
const src = index.match(/<script src="([^"]+)" defer><\/script>/)[1];
const js = readFileSync(`dist${src}`, 'utf8').replaceAll('</script', '<\\/script');

const FONTS = {
  InstrumentSerif_400Regular: 'instrument-serif/400Regular/InstrumentSerif_400Regular.ttf',
  InstrumentSerif_400Regular_Italic: 'instrument-serif/400Regular_Italic/InstrumentSerif_400Regular_Italic.ttf',
  InstrumentSans_400Regular: 'instrument-sans/400Regular/InstrumentSans_400Regular.ttf',
  InstrumentSans_500Medium: 'instrument-sans/500Medium/InstrumentSans_500Medium.ttf',
  InstrumentSans_600SemiBold: 'instrument-sans/600SemiBold/InstrumentSans_600SemiBold.ttf',
  InstrumentSans_700Bold: 'instrument-sans/700Bold/InstrumentSans_700Bold.ttf',
};
const faces = Object.entries(FONTS)
  .map(([family, path]) => {
    const b64 = readFileSync(`node_modules/@expo-google-fonts/${path}`).toString('base64');
    return `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64}) format('truetype');font-display:block;}`;
  })
  .join('\n');

const page = `<title>Além da Caneta</title>
<style>
:root{--creme:#F4F0E8;--floresta:#17332B;color-scheme:light;}
html{box-sizing:border-box;height:100%;}
body{height:100%;overflow:hidden;background:var(--creme);color:var(--floresta);}
#root{display:flex;height:100%;flex:1;}
${faces}
</style>
<div id="root"></div>
<script>
// O app usa o endereço da página como rota: começa sempre pelo início.
try { if (location.pathname !== '/') history.replaceState(null, '', '/'); } catch (e) {}
</script>
<script>${js}</script>
`;

mkdirSync('dist-teste', { recursive: true });
writeFileSync('dist-teste/alem-da-caneta-teste.html', page);
console.log(`dist-teste/alem-da-caneta-teste.html (${(page.length / 1e6).toFixed(1)} MB)`);
