import { Droplet, Minus, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Txt } from '@/components/Txt';
import { Card, CardHeader, IconButton, Row, tap } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { fmt } from '@/lib/calc';
import { health } from '@/lib/health';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme/tokens';

function Glass({ fill }: { fill: number }) {
  // Copo com preenchimento proporcional (0..1).
  const h = 40;
  const top = 4 + (1 - fill) * (h - 8);
  return (
    <Svg width={30} height={h} viewBox={`0 0 30 ${h}`}>
      <Path d={`M3 3 H27 L24 ${h - 3} H6 Z`} stroke={colors.water} strokeWidth={1.6} fill={colors.card} strokeLinejoin="round" />
      {fill > 0 && (
        <Path
          d={`M${3 + (top / h) * 3} ${top} H${27 - (top / h) * 3} L24 ${h - 3} H6 Z`}
          fill={colors.water}
          opacity={0.85}
        />
      )}
    </Svg>
  );
}

export function WaterCard({ day }: { day: string }) {
  const ml = useStore((s) => s.water[day] ?? 0);
  const cup = useStore((s) => s.settings.cupMl);
  const sync = useStore((s) => s.settings.healthSync);
  const setWater = useStore((s) => s.setWater);
  const plan = usePlan();
  const goal = plan?.goals.waterMl ?? 2000;
  const cups = Math.max(1, Math.ceil(goal / cup));
  const filled = ml / cup;

  function add(delta: number) {
    tap();
    const next = Math.max(0, ml + delta);
    setWater(day, next);
    if (sync && delta > 0) health.writeWater(delta, new Date()).catch(() => {});
  }

  return (
    <Card>
      <CardHeader
        icon={Droplet}
        title="Água"
        right={
          <Txt variant="bodyStrong" style={{ fontSize: 18 }}>
            {fmt(ml / 1000)} L
            <Txt variant="small"> / {fmt(goal / 1000)} L</Txt>
          </Txt>
        }
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {Array.from({ length: cups }).map((_, i) => (
          <Pressable
            key={i}
            accessibilityLabel={`Copo ${i + 1}`}
            onPress={() => add(i < Math.ceil(filled) ? -cup : cup)}
            hitSlop={4}>
            <Glass fill={Math.max(0, Math.min(1, filled - i))} />
          </Pressable>
        ))}
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="small">
          {ml >= goal ? 'Meta de hoje batida. Seu intestino agradece.' : `Toque nos copos · ${cup} ml cada`}
        </Txt>
        <Row gap={space.sm}>
          <IconButton icon={Minus} size={34} label="Remover copo" onPress={() => add(-cup)} />
          <IconButton icon={Plus} size={34} tone="strong" label="Adicionar copo" onPress={() => add(cup)} />
        </Row>
      </Row>
    </Card>
  );
}
