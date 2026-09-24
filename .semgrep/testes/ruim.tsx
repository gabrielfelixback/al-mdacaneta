// Arquivo de teste: cada trecho abaixo deve disparar uma regra.
import Anthropic from '@anthropic-ai/sdk';
const k = 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const t = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
window.confirm('apagar?');
export const C = () => <div dangerouslySetInnerHTML={{ __html: t }} />;
