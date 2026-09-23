# além da caneta · app

> O remédio cuida da fome. O resto é *método*.

App de acompanhamento para quem usa canetas GLP-1 (tirzepatida, semaglutida, liraglutida, dulaglutida). Registra doses, água, peso/IMC, refeições (inclusive por foto), movimento e como a pessoa se sente, com a identidade do guia de marca Além da Caneta e o Método 3P no centro.

Feito em **Expo SDK 57 + Expo Router**, roda em iOS, Android e web (preview).

## O que já funciona

| Área | Recursos |
| --- | --- |
| **Onboarding** | Nome, sexo, idade, altura, peso, meta, nível de atividade, medicamento/dose/dia/horário e última aplicação. Gera o plano diário (energia, proteína, água, fibras). |
| **Hoje** | Topo em Floresta com a marca e a **jornada da semana desenhada pela linha argila** do símbolo (dias com registro, cápsula no dia da aplicação), contagem da próxima dose, **próximo passo** escolhido pelo que falta no dia, grade de blocos (proteína, água que enche ao toque, movimento, peso com minicurva), check-in, biblioteca e assistente. |
| **Nutrição** | Calendário semanal (marca dias de aplicação), resumo de macros, refeições por período. Registro por **busca** na base local (TACO), **foto do prato com IA** ou **manual**. |
| **Doses** | Próxima aplicação, **nível estimado no corpo** (curva por meia-vida), **rodízio de locais**, efeitos colaterais, histórico de aplicações. |
| **Calculadora** | Frasco (mg + mL → concentração), dose prescrita, seringa de 30/50/100 UI, arredondamento para o traço com diferença em mg e %, modo “quanto puxei”, régua em UI e **tabela do frasco** para compartilhar. |
| **Além Pro** | Página de assinatura (anual/mensal), resgate de código para quem comprou o Método 3P, **biblioteca com os 8 materiais do curso** (Plano do Depois libera no 7º dia), **assistente IA** (3 perguntas/dia no gratuito, ilimitado no Pro) e **relatório em PDF**. |
| **Relatório para consulta** | PDF no padrão da marca: resumo (tempo de tratamento, peso, perda, ritmo, IMC, adesão, sintomas, proteína), identificação, tratamento e adesão, evolução de peso com gráfico, medidas, sintomas e nutrição/hidratação. Período e seções selecionáveis. |
| **Comunidade** | Postagens com temas, curtidas, comentários, enquetes e combinados da comunidade. *Dados locais de demonstração por enquanto.* |
| **Perfil** | Peso atual e progresso, IMC com régua OMS, curva de peso (15D/2M/6M/Tudo), “Além da balança” (7 dias), registros de peso, relatório para o médico (compartilhar/copiar). |
| **Saúde do sistema** | Apple Saúde (iOS) e Health Connect (Android): lê passos, calorias ativas e peso; grava peso e água. |
| **Referências médicas** | ANVISA, FDA/DailyMed, NIDDK, OMS, SURMOUNT-1/4, SURPASS-2, STEP-1, ISSN, Mifflin-St Jeor, Compendium, TACO. |

### Cálculos (`src/lib/calc.ts`)

- **IMC** = peso ÷ altura², classificação OMS.
- **Basal**: Mifflin-St Jeor. **Meta calórica**: basal × fator de atividade − 500 kcal, com piso de 1200 (F) / 1500 (M).
- **Proteína (P1)**: 1,5 g/kg; com IMC ≥ 30 usa peso ajustado (peso no IMC 25 + 25% do excedente).
- **Água**: 35 ml/kg. **Fibras**: 25 g (F) / 30 g (M).
- **Atividade**: MET (Compendium) × peso × horas, por tipo e intensidade (leve/moderado/intenso).
- **Nível do medicamento**: soma das doses decaindo pela meia-vida (tirzepatida ~5 d, semaglutida ~7 d, liraglutida ~13 h). Estimativa educacional.
- **Calculadora de doses**: mg ÷ (mg/mL) × 100 = UI.

## Testar o app

**No navegador (link de teste):** `npm run build:teste` gera `dist-teste/alem-da-caneta-teste.html`, um único arquivo com o app inteiro (código e fontes embutidos) em modo de teste — o Pro é liberado sem cobrança. Abre em qualquer navegador, inclusive no celular. Recursos do aparelho (Apple Saúde/Health Connect, câmera nativa, PDF compartilhável) só existem no app instalado.

**No celular, instalado (build de teste):** com uma conta Expo, `npx eas-cli@latest build --profile preview --platform android` gera um APK instalável por link; no iPhone, o mesmo comando com `--platform ios` exige conta Apple Developer (distribuição interna/TestFlight). O perfil `preview` já liga o modo de teste do Pro.

**No Expo Go:** `npx expo start` e escaneie o QR code. Tudo funciona menos a integração com apps de saúde, que precisa do build instalado.

## Rodando

```bash
npm install
npm run web        # preview no navegador
npm run ios        # simulador / Expo Go (sem Apple Saúde)
npm run android    # emulador / Expo Go (sem Health Connect)
```

A integração com Apple Saúde e Health Connect usa módulos nativos e **não roda no Expo Go**. Gere um development build:

```bash
npx eas-cli@latest build --profile development --platform ios     # ou android
```

### Foto do prato (IA)

A análise de foto usa a API do Claude (`claude-opus-5`, saída estruturada) num servidor próprio. A chave nunca vai para o app.

```bash
cd server
cp .env.example .env     # preencha ANTHROPIC_API_KEY
npm install
npm run dev              # http://localhost:8787
```

No app, aponte para o servidor:

```bash
EXPO_PUBLIC_API_URL=http://SEU-IP:8787 npm start
```

Endpoints:

- `POST /api/assistant` com `{ messages: [{ role, text }], context?: string }` → `{ text }`. Assistente do Método 3P, sem orientação de dose.
- `POST /api/analyze-meal` com `{ image: <base64>, mediaType: "image/jpeg", context?: string }` → itens com porção, gramas, kcal, proteína, carboidratos, gordura e fibras, mais confiança e uma dica curta.

### Pro, biblioteca e pagamentos

- Os PDFs do curso entram em `src/lib/library.ts`, no campo `url` de cada material (ex.: link assinado de um storage privado). Sem `url`, o app mostra “PDF em preparação”.
- Preços provisórios em `src/lib/purchases.ts` (`PLANS`). A cobrança real (App Store / Google Play) ainda não está ligada: com `BILLING_READY = false`, em desenvolvimento o botão ativa o Pro em modo de teste e em produção mostra que pagamentos ainda não estão disponíveis. Próximo passo: RevenueCat + validação do código de compra no servidor.

## Estrutura

```
src/
  app/                 rotas (Expo Router)
    (tabs)/            Hoje, Nutrição, Doses, Comunidade, Perfil
    onboarding.tsx     primeiro acesso
    registrar.tsx      menu rápido do botão +
    refeicao.tsx       busca, foto (IA) e manual
    peso, atividade, aplicacao, efeito, publicar, ...
  components/          UI da marca, cards e gráficos (SVG)
  lib/                 cálculos, medicamentos, alimentos, referências, saúde (ios/android/web)
  store/               estado com zustand + AsyncStorage (offline-first)
  theme/tokens.ts      paleta, tipografia e espaçamentos do guia de marca
server/                API de análise de refeição por foto (Hono + Anthropic SDK)
```

## Marca

Paleta 60/30/10 (Creme/Linho · Floresta/Sálvia/Musgo · Argila só como acento), Instrument Serif (itálico só na palavra-chave) e Instrument Sans. Seguindo o “fora da marca”: sem emojis, sem ilustração de agulha/seringa ou balança/fita métrica, sem antes/depois e sem gradientes saturados. Todas as telas de saúde trazem o aviso de que o app não substitui acompanhamento médico e nutricional.

## Próximos passos

- Backend real (contas, sincronização e comunidade com moderação) — ex.: Supabase.
- Lembretes com notificações locais (aplicação, água, suplementos).
- Cobrança real do Pro (RevenueCat) e validação do código de compra do Método 3P no servidor.
- Hospedar os PDFs do curso com acesso restrito a assinantes.
- Busca de alimentos ampliada (TACO completa + códigos de barras).
