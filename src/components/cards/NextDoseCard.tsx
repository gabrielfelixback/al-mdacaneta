import { router } from 'expo-router';
import { View } from 'react-native';

import { CapsuleMark } from '@/components/Brand';
import { Txt } from '@/components/Txt';
import { Button, Card, ProgressBar, Row, Stat } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { fmtMg } from '@/lib/calc';
import { formatCountdown, formatShort, formatTime } from '@/lib/dates';
import { siteLabel } from '@/lib/medications';
import { medicationLabel, nextDoseInfo } from '@/lib/treatment';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

export function NextDoseCard() {
  const treatment = useStore((s) => s.treatment);
  const doses = useStore((s) => s.doses);
  const now = useNow();
  if (!treatment) return null;
  const info = nextDoseInfo(treatment, doses, now);
  const cd = formatCountdown(info.next.getTime() - now.getTime());

  return (
    <Card tone="strong" style={{ gap: space.lg }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="label" color={colors.textOnStrongMuted}>
          Próxima aplicação
        </Txt>
        <View style={{ backgroundColor: colors.trackOnStrong, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill }}>
          <Txt variant="caption" color={colors.textOnStrong} style={{ fontSize: 12 }}>
            {medicationLabel(treatment)}
          </Txt>
        </View>
      </Row>

      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Txt variant="display" italic={info.overdue} color={colors.textOnStrong} style={{ fontSize: 52, lineHeight: 56 }}>
            {cd.big}
          </Txt>
          <Txt variant="bodyStrong" color={colors.support}>
            {cd.small}
          </Txt>
        </View>
        <CapsuleMark size={30} color={colors.textOnStrong} progress={info.overdue ? 1 : Math.max(0.08, info.progress)} />
      </Row>

      <ProgressBar value={info.overdue ? 1 : info.progress} color={colors.accent} track={colors.trackOnStrong} height={6} />

      <Row style={{ justifyContent: 'space-between' }}>
        <Stat onStrong label="Próxima dose" value={`${formatShort(info.next)} · ${formatTime(info.next)}`} />
        <Stat
          onStrong
          label="Última dose"
          value={info.last ? `${formatShort(new Date(info.last.at))} · ${fmtMg(info.last.mg)}` : '—'}
        />
      </Row>
      {info.last?.site ? (
        <Txt variant="caption" color={colors.textOnStrongMuted}>
          Último local: {siteLabel(info.last.site)}
        </Txt>
      ) : null}
      {info.overdue ? (
        <Button tone="onStrong" label="Registrar aplicação" onPress={() => router.push('/aplicacao')} />
      ) : null}
    </Card>
  );
}
