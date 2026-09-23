import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Camera, Check, ImageIcon, Plus, Search, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { ModalScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Chip, Divider, Field, Row, Segmented, tap } from '@/components/ui';
import { fmtInt } from '@/lib/calc';
import { dayKey } from '@/lib/dates';
import { isProteinRich, searchFoods, type Food } from '@/lib/foods';
import { analyzeMealPhoto, MEAL_API_URL, type MealAnalysis } from '@/lib/mealAI';
import { dismiss } from '@/lib/nav';
import { parseNum } from '@/lib/parse';
import { pickMealPhoto, type PickedPhoto } from '@/lib/photo';
import { useStore } from '@/store/useStore';
import { MEAL_SLOTS, type MealEntry, type MealSlot } from '@/store/types';
import { colors, fonts, radius, space } from '@/theme/tokens';

type Mode = 'buscar' | 'foto' | 'manual';
type NewMeal = Omit<MealEntry, 'id' | 'at'>;
const QTY = [0.5, 1, 1.5, 2, 3];

function slotForNow(): MealSlot {
  const h = new Date().getHours();
  if (h < 10) return 'cafe';
  if (h < 15) return 'almoco';
  if (h < 19) return 'lanche';
  return 'jantar';
}

export default function LogMeal() {
  const params = useLocalSearchParams<{ day?: string; slot?: MealSlot; mode?: Mode }>();
  const [mode, setMode] = useState<Mode>(params.mode ?? 'buscar');
  const [slot, setSlot] = useState<MealSlot>(params.slot ?? slotForNow());
  const day = params.day ?? dayKey();
  const addMeal = useStore((s) => s.addMeal);
  const [added, setAdded] = useState(0);

  const add = (e: NewMeal) => {
    addMeal(e);
    setAdded((n) => n + 1);
  };

  return (
    <ModalScreen
      title="Registrar"
      italicWord="refeição"
      footer={added > 0 ? <Button label={`Concluir · ${added} ${added === 1 ? 'item' : 'itens'}`} icon={Check} onPress={dismiss} /> : undefined}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {MEAL_SLOTS.map((s) => (
          <Chip key={s.id} small label={s.label} active={slot === s.id} onPress={() => setSlot(s.id)} />
        ))}
      </View>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'buscar', label: 'Buscar' },
          { value: 'foto', label: 'Foto' },
          { value: 'manual', label: 'Manual' },
        ]}
      />
      {mode === 'buscar' && <SearchMode onAdd={(f, qty) => add(fromFood(f, qty, day, slot))} />}
      {mode === 'foto' && <PhotoMode day={day} slot={slot} onAdd={add} />}
      {mode === 'manual' && <ManualMode day={day} slot={slot} onAdd={add} />}
    </ModalScreen>
  );
}

function fromFood(f: Food, qty: number, day: string, slot: MealSlot) {
  return {
    day,
    slot,
    name: f.name,
    portion: f.portion,
    qty,
    kcal: Math.round(f.kcal * qty),
    protein: f.protein * qty,
    carbs: f.carbs * qty,
    fat: f.fat * qty,
    fiber: f.fiber * qty,
    source: 'base' as const,
  };
}

// ---------- Busca na base local ----------

function SearchMode({ onAdd }: { onAdd: (f: Food, qty: number) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const results = useMemo(() => searchFoods(q).slice(0, 40), [q]);

  return (
    <>
      <Field value={q} onChangeText={setQ} placeholder="Buscar: frango, iogurte, arroz…" autoCorrect={false} />
      {!q ? (
        <Row gap={6}>
          <Search size={14} color={colors.textMuted} />
          <Txt variant="caption">Itens ricos em proteína aparecem primeiro (P1).</Txt>
        </Row>
      ) : null}
      <Card style={{ paddingVertical: space.sm, gap: 0 }}>
        {results.length === 0 ? (
          <Txt variant="small" style={{ paddingVertical: space.md }}>
            Nada encontrado. Use a aba Manual ou a Foto.
          </Txt>
        ) : (
          results.map((f, i) => (
            <View key={f.id}>
              {i > 0 && <Divider />}
              <Pressable
                onPress={() => {
                  tap();
                  setOpen(open === f.id ? null : f.id);
                  setQty(1);
                }}
                style={{ paddingVertical: space.md, gap: 2 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Row gap={6}>
                      <Txt variant="bodyStrong" style={{ flexShrink: 1 }}>
                        {f.name}
                      </Txt>
                      {isProteinRich(f) ? (
                        <Txt variant="caption" color={colors.accent} style={{ fontFamily: fonts.sansSemi }}>
                          P1
                        </Txt>
                      ) : null}
                    </Row>
                    <Txt variant="caption">
                      {f.portion} · {f.kcal} kcal · P {f.protein} g
                    </Txt>
                  </View>
                  {justAdded === f.id ? <Check size={20} color={colors.accent} /> : <Plus size={20} color={colors.textMuted} />}
                </Row>
                {open === f.id ? (
                  <View style={{ gap: space.sm, marginTop: space.sm }}>
                    <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
                      {QTY.map((n) => (
                        <Chip key={n} small label={`${String(n).replace('.', ',')}×`} active={qty === n} onPress={() => setQty(n)} />
                      ))}
                    </Row>
                    <Button
                      small
                      label={`Adicionar · ${fmtInt(f.kcal * qty)} kcal · ${Math.round(f.protein * qty)} g proteína`}
                      onPress={() => {
                        onAdd(f, qty);
                        setJustAdded(f.id);
                        setOpen(null);
                      }}
                    />
                  </View>
                ) : null}
              </Pressable>
            </View>
          ))
        )}
      </Card>
    </>
  );
}

// ---------- Foto do prato (IA) ----------

function PhotoMode({
  day,
  slot,
  onAdd,
}: {
  day: string;
  slot: MealSlot;
  onAdd: (e: NewMeal) => void;
}) {
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MealAnalysis | null>(null);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [saved, setSaved] = useState(false);

  async function pick(source: 'camera' | 'galeria') {
    setError(null);
    try {
      const p = await pickMealPhoto(source);
      if (p) {
        setPhoto(p);
        setResult(null);
        setSaved(false);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function analyze() {
    if (!photo) return;
    setLoading(true);
    setError(null);
    try {
      const r = await analyzeMealPhoto(photo.base64, photo.mediaType, context);
      setResult(r);
      setSelected(r.items.map(() => true));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!result) return;
    result.items.forEach((it, i) => {
      if (!selected[i]) return;
      onAdd({
        day,
        slot,
        name: it.name,
        portion: it.portion,
        qty: 1,
        kcal: Math.round(it.kcal),
        protein: it.protein_g,
        carbs: it.carbs_g,
        fat: it.fat_g,
        fiber: it.fiber_g,
        source: 'foto',
      });
    });
    setSaved(true);
  }

  const totals = result?.items.reduce(
    (t, it, i) => (selected[i] ? { kcal: t.kcal + it.kcal, p: t.p + it.protein_g } : t),
    { kcal: 0, p: 0 },
  );

  return (
    <>
      {!MEAL_API_URL && __DEV__ ? (
        <Card tone="soft">
          <Txt variant="small">
            Para analisar fotos, rode o servidor em /server e defina EXPO_PUBLIC_API_URL no app. Veja o README.
          </Txt>
        </Card>
      ) : null}

      {photo ? (
        <Image source={{ uri: photo.uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg }} contentFit="cover" />
      ) : (
        <Card tone="strong" style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
          <Sparkles size={28} color={colors.support} />
          <Txt variant="h2" color={colors.textOnStrong} align="center">
            Fotografe o{' '}
            <Txt variant="h2" italic color={colors.textOnStrong}>
              prato
            </Txt>
          </Txt>
          <Txt variant="small" color={colors.textOnStrongMuted} align="center">
            A IA identifica os alimentos, estima porções e calcula calorias e proteína. Você revisa antes de salvar.
          </Txt>
        </Card>
      )}

      <Row gap={space.sm}>
        <Button label={photo ? 'Nova foto' : 'Câmera'} icon={Camera} tone={photo ? 'secondary' : 'accent'} style={{ flex: 1 }} onPress={() => pick('camera')} />
        <Button label="Galeria" icon={ImageIcon} tone="secondary" style={{ flex: 1 }} onPress={() => pick('galeria')} />
      </Row>

      {photo && !result ? (
        <>
          <Field
            label="Algo que a foto não mostra? (opcional)"
            value={context}
            onChangeText={setContext}
            placeholder="Ex.: frango grelhado sem óleo, 1 colher de azeite"
          />
          <Button label={loading ? 'Analisando…' : 'Analisar refeição'} icon={Sparkles} disabled={loading} onPress={analyze} />
          {loading ? <ActivityIndicator color={colors.accent} /> : null}
        </>
      ) : null}

      {error ? (
        <Txt variant="small" color={colors.danger}>
          {error}
        </Txt>
      ) : null}

      {result && !result.is_food ? (
        <Txt variant="small">Não encontramos comida nesta foto. Tente outra imagem.</Txt>
      ) : null}

      {result && result.is_food ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="label">Itens identificados</Txt>
            <Txt variant="caption">confiança {result.confidence}</Txt>
          </Row>
          {result.items.map((it, i) => (
            <Pressable
              key={`${it.name}-${i}`}
              onPress={() => {
                tap();
                setSelected(selected.map((v, j) => (j === i ? !v : v)));
              }}>
              <Row>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: colors.cardStrong,
                    backgroundColor: selected[i] ? colors.cardStrong : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {selected[i] ? <Check size={14} color={colors.textOnStrong} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{it.name}</Txt>
                  <Txt variant="caption">
                    {it.portion} (~{Math.round(it.grams)} g) · {Math.round(it.kcal)} kcal · P {Math.round(it.protein_g)} g · C{' '}
                    {Math.round(it.carbs_g)} g · G {Math.round(it.fat_g)} g
                  </Txt>
                </View>
              </Row>
            </Pressable>
          ))}
          <Divider />
          <Txt variant="bodyStrong">
            Total: {fmtInt(totals?.kcal ?? 0)} kcal · {Math.round(totals?.p ?? 0)} g proteína
          </Txt>
          {result.tip ? <Txt variant="small">{result.tip}</Txt> : null}
          <Button
            label={saved ? 'Adicionado' : 'Adicionar à refeição'}
            icon={saved ? Check : Plus}
            disabled={saved || !selected.some(Boolean)}
            onPress={save}
          />
          <Txt variant="caption">Estimativa por imagem: pode variar. Ajuste se souber a porção exata.</Txt>
        </Card>
      ) : null}
    </>
  );
}

// ---------- Manual ----------

function ManualMode({
  day,
  slot,
  onAdd,
}: {
  day: string;
  slot: MealSlot;
  onAdd: (e: NewMeal) => void;
}) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [fib, setFib] = useState('');
  const k = parseNum(kcal);
  const valid = name.trim().length > 1 && k >= 0;
  const n = (s: string) => (Number.isFinite(parseNum(s)) ? parseNum(s) : 0);

  return (
    <>
      <Field label="Alimento" value={name} onChangeText={setName} placeholder="Ex.: marmita do restaurante" />
      <Field label="Calorias" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" suffix="kcal" />
      <Row gap={space.sm}>
        <Field style={{ flex: 1 }} label="Proteína" value={p} onChangeText={setP} keyboardType="decimal-pad" suffix="g" />
        <Field style={{ flex: 1 }} label="Carbo" value={c} onChangeText={setC} keyboardType="decimal-pad" suffix="g" />
      </Row>
      <Row gap={space.sm}>
        <Field style={{ flex: 1 }} label="Gordura" value={f} onChangeText={setF} keyboardType="decimal-pad" suffix="g" />
        <Field style={{ flex: 1 }} label="Fibra" value={fib} onChangeText={setFib} keyboardType="decimal-pad" suffix="g" />
      </Row>
      <Button
        label="Adicionar"
        icon={Plus}
        disabled={!valid}
        onPress={() => {
          onAdd({ day, slot, name: name.trim(), qty: 1, kcal: Math.round(k), protein: n(p), carbs: n(c), fat: n(f), fiber: n(fib), source: 'manual' });
          setName('');
          setKcal('');
          setP('');
          setC('');
          setF('');
          setFib('');
        }}
      />
      <Txt variant="caption">Os valores do rótulo costumam vir por porção — confira a porção que você comeu.</Txt>
    </>
  );
}
