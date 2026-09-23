import { HeartPulse } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Card, CardHeader, Chip, tap } from '@/components/ui';
import { useStore } from '@/store/useStore';
import type { CheckIn, Gut } from '@/store/types';
import { colors, fonts, radius, space } from '@/theme/tokens';

const GUT: { v: Gut; label: string }[] = [
  { v: 'normal', label: 'Em dia' },
  { v: 'lento', label: 'Lento' },
  { v: 'travado', label: 'Travado' },
  { v: 'solto', label: 'Solto' },
];

/** Evolução além da balança: energia, fome e intestino. */
export function CheckInCard({ day }: { day: string }) {
  const c = useStore((s) => s.checkins[day]) ?? {};
  const set = useStore((s) => s.setCheckIn);
  const travadoDias = useStore((s) => {
    let n = 0;
    const d = new Date();
    for (let i = 0; i < 4; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (s.checkins[k]?.gut === 'travado') n++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  });

  return (
    <Card>
      <CardHeader icon={HeartPulse} title="Como você está hoje" />
      <Scale label="Energia" low="baixa" high="ótima" value={c.energy} onChange={(v) => set(day, { energy: v })} />
      <Scale label="Fome" low="nenhuma" high="muita" value={c.hunger} onChange={(v) => set(day, { hunger: v })} />
      <View style={{ gap: space.sm }}>
        <Txt variant="small" color={colors.text} style={{ fontFamily: fonts.sansMedium }}>
          Intestino
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {GUT.map((g) => (
            <Chip key={g.v} small label={g.label} active={c.gut === g.v} onPress={() => set(day, { gut: g.v })} />
          ))}
        </View>
      </View>
      {c.hunger === 1 ? (
        <Txt variant="small">Sem fome é normal com a caneta. Refeições pequenas e proteicas evitam o dia em branco.</Txt>
      ) : null}
      {travadoDias >= 3 ? (
        <View style={{ backgroundColor: '#F3E3D9', borderRadius: radius.md, padding: space.md }}>
          <Txt variant="small" color={colors.danger}>
            Vários dias com o intestino travado. Se houver dor forte, inchaço, enjoo ou vômito, procure atendimento
            médico.
          </Txt>
        </View>
      ) : c.gut === 'travado' || c.gut === 'lento' ? (
        <Txt variant="small">Água, fibras que cabem no apetite (chia, aveia, frutas) e movimento ajudam a destravar.</Txt>
      ) : null}
    </Card>
  );
}

function Scale({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value?: CheckIn['energy'];
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="small" color={colors.text} style={{ fontFamily: fonts.sansMedium }}>
          {label}
        </Txt>
        <Txt variant="caption">
          {low} · {high}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const active = value !== undefined && n <= value;
          return (
            <Pressable
              key={n}
              accessibilityLabel={`${label} ${n} de 5`}
              onPress={() => {
                tap();
                onChange(n);
              }}
              style={{
                flex: 1,
                height: 30,
                borderRadius: radius.sm,
                backgroundColor: active ? colors.cardStrong : colors.track,
                opacity: active ? 0.55 + n * 0.09 : 1,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
