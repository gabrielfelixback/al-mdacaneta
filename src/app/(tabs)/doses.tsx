import { router } from 'expo-router';
import { Calculator, ChevronRight, Frown, History, Info, MapPin, Plus, Trash2, Waves } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { NextDoseCard } from '@/components/cards/NextDoseCard';
import { LevelChart } from '@/components/charts';
import { TabScreen } from '@/components/Screen';
import { HeaderActions } from '@/components/StreakBadge';
import { Txt } from '@/components/Txt';
import { Button, Card, CardHeader, Divider, IconButton, Row } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { fmt, fmtMg } from '@/lib/calc';
import { formatDateTime, formatShort } from '@/lib/dates';
import { INJECTION_SITES, nextSite, siteLabel } from '@/lib/medications';
import { currentLevel, halfLifeLabel, levelSeries, medicationLabel } from '@/lib/treatment';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

const BACK = 21;
const AHEAD = 7;

export default function Doses() {
  const treatment = useStore((s) => s.treatment);
  const doses = useStore((s) => s.doses);
  const sideEffects = useStore((s) => s.sideEffects);
  const removeDose = useStore((s) => s.removeDose);
  const removeSideEffect = useStore((s) => s.removeSideEffect);
  const now = useNow(60_000);
  const [showInfo, setShowInfo] = useState(false);
  const [showAll, setShowAll] = useState(false);
  if (!treatment) return null;

  const level = currentLevel(doses, now);
  const series = levelSeries(doses, BACK, AHEAD, now);
  const suggested = nextSite(doses[0]?.site);
  const recentSites = doses.slice(0, 6).map((d) => d.site).filter(Boolean) as string[];

  return (
    <TabScreen title="Doses" right={<HeaderActions />}>
      <NextDoseCard />

      <Card>
        <CardHeader
          icon={Waves}
          title="Nível estimado no corpo"
          right={<IconButton icon={Info} size={32} tone="plain" label="Como é calculado" onPress={() => setShowInfo(!showInfo)} />}
        />
        {doses.length === 0 ? (
          <Txt variant="small">Registre sua primeira aplicação para ver a curva.</Txt>
        ) : (
          <>
            <Row style={{ alignItems: 'flex-end' }} gap={space.md}>
              <Txt variant="display">{level.pct}%</Txt>
              <Txt variant="small" style={{ marginBottom: 8 }}>
                {fmt(level.mg, 2)} mg da última dose
              </Txt>
            </Row>
            <LevelChart series={series} nowIndex={BACK} />
          </>
        )}
        {showInfo ? (
          <Txt variant="caption">
            Estimativa educacional: soma das doses registradas decaindo pela meia-vida do princípio ativo (
            {halfLifeLabel(treatment.medicationId)}), sem considerar a fase de absorção. Não é uma medida real e não
            deve guiar mudanças de dose.
          </Txt>
        ) : null}
      </Card>

      <Card>
        <CardHeader icon={MapPin} title="Rodízio de locais" />
        <Txt variant="small">
          Próxima sugestão: <Txt variant="bodyStrong">{siteLabel(suggested)}</Txt>
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {INJECTION_SITES.map((s) => {
            const idx = recentSites.indexOf(s.id);
            const isNext = s.id === suggested;
            return (
              <View
                key={s.id}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: isNext ? colors.accent : colors.line,
                  backgroundColor: isNext ? '#F1E1D6' : idx === 0 ? colors.bgAlt : colors.card,
                }}>
                <Txt variant="caption" color={isNext ? colors.accent : colors.text}>
                  {s.label}
                  {idx === 0 ? ' · última' : ''}
                </Txt>
              </View>
            );
          })}
        </View>
        <Txt variant="caption">Alternar o local ajuda a evitar irritação e nódulos na pele.</Txt>
      </Card>

      <Card onPress={() => router.push('/calculadora')}>
        <Row>
          <Calculator size={22} color={colors.text} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">Calculadora de doses</Txt>
            <Txt variant="small">Quantas unidades (UI) puxar para a sua dose</Txt>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Row>
      </Card>

      <Card>
        <CardHeader
          icon={Frown}
          title="Efeitos colaterais"
          right={<IconButton icon={Plus} size={34} label="Registrar efeito" onPress={() => router.push('/efeito')} />}
        />
        {sideEffects.length === 0 ? (
          <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
            <Txt variant="small">Nenhum efeito registrado.</Txt>
            <Button small tone="secondary" icon={Plus} label="Adicionar" onPress={() => router.push('/efeito')} />
          </View>
        ) : (
          sideEffects.slice(0, 5).map((e) => (
            <Row key={e.id} style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">
                  {e.kind}{' '}
                  <Txt variant="caption" color={e.severity === 3 ? colors.danger : colors.textMuted}>
                    {['', 'leve', 'moderado', 'forte'][e.severity]}
                  </Txt>
                </Txt>
                <Txt variant="caption">
                  {formatDateTime(new Date(e.at))}
                  {e.note ? ` · ${e.note}` : ''}
                </Txt>
              </View>
              <IconButton icon={Trash2} tone="plain" size={32} label="Remover" onPress={() => removeSideEffect(e.id)} />
            </Row>
          ))
        )}
      </Card>

      <Card>
        <CardHeader
          icon={History}
          title={`Aplicações (${doses.length})`}
          right={<IconButton icon={Plus} size={34} label="Registrar aplicação" onPress={() => router.push('/aplicacao')} />}
        />
        <Txt variant="small">
          {medicationLabel(treatment)} · dose atual {fmtMg(treatment.doseMg)}
        </Txt>
        {doses.length > 0 && <Divider />}
        {(showAll ? doses : doses.slice(0, 4)).map((d, i) => {
          const changed = doses[i + 1] && doses[i + 1].mg !== d.mg;
          return (
            <Row key={d.id} style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">
                  {fmtMg(d.mg)}
                  {changed ? (
                    <Txt variant="caption" color={colors.accent}>
                      {'  '}nova dose
                    </Txt>
                  ) : null}
                </Txt>
                <Txt variant="caption">
                  {formatShort(new Date(d.at))} · {d.site ? siteLabel(d.site) : 'local não informado'}
                </Txt>
              </View>
              <IconButton icon={Trash2} tone="plain" size={32} label="Remover" onPress={() => removeDose(d.id)} />
            </Row>
          );
        })}
        {doses.length > 4 ? (
          <Button small tone="ghost" label={showAll ? 'Mostrar menos' : 'Ver todas'} onPress={() => setShowAll(!showAll)} />
        ) : null}
      </Card>
    </TabScreen>
  );
}
