import { Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Card, Divider, IconButton, Row } from '@/components/ui';
import { fmt } from '@/lib/calc';
import { formatDateTime } from '@/lib/dates';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme/tokens';

export default function WeightHistory() {
  const weights = useStore((s) => s.weights);
  const remove = useStore((s) => s.removeWeight);

  return (
    <StackScreen title="Registros de peso">
      <Card style={{ paddingVertical: space.sm, gap: 0 }}>
        {weights.map((w, i) => {
          const prev = weights[i + 1];
          const diff = prev ? w.kg - prev.kg : 0;
          return (
            <View key={w.id}>
              {i > 0 && <Divider />}
              <Row style={{ paddingVertical: space.md }}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">
                    {fmt(w.kg)} kg
                    {w.waistCm ? <Txt variant="small"> · cintura {fmt(w.waistCm, 0)} cm</Txt> : null}
                  </Txt>
                  <Txt variant="caption">{formatDateTime(new Date(w.at))}</Txt>
                </View>
                {prev ? (
                  <Txt variant="small" color={diff <= 0 ? colors.textSecondary : colors.accent}>
                    {diff <= 0 ? '−' : '+'}
                    {fmt(Math.abs(diff))}
                  </Txt>
                ) : null}
                {weights.length > 1 ? <IconButton icon={Trash2} tone="plain" size={32} label="Remover" onPress={() => remove(w.id)} /> : null}
              </Row>
            </View>
          );
        })}
      </Card>
    </StackScreen>
  );
}
