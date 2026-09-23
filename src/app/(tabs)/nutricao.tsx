import { router } from 'expo-router';
import { Camera, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { NutritionCard } from '@/components/cards/NutritionCard';
import { WaterCard } from '@/components/cards/WaterCard';
import { TabScreen } from '@/components/Screen';
import { HeaderActions } from '@/components/StreakBadge';
import { Txt } from '@/components/Txt';
import { Button, Card, Divider, IconButton, Row, tap } from '@/components/ui';
import { fmtInt } from '@/lib/calc';
import { addDays, dayKey, fromDayKey, startOfWeek, WEEKDAYS_SHORT } from '@/lib/dates';
import { isProteinRich } from '@/lib/foods';
import { useStore } from '@/store/useStore';
import { MEAL_SLOTS } from '@/store/types';
import { colors, fonts, radius, space } from '@/theme/tokens';

export default function Nutrition() {
  const [day, setDay] = useState(dayKey());
  const meals = useStore((s) => s.meals);
  const doses = useStore((s) => s.doses);
  const removeMeal = useStore((s) => s.removeMeal);
  const todayKey = dayKey();
  const week = startOfWeek(fromDayKey(day));
  const doseDays = new Set(doses.map((d) => dayKey(new Date(d.at))));

  const open = (slot?: string, mode?: 'foto') =>
    router.push({ pathname: '/refeicao', params: { day, ...(slot ? { slot } : {}), ...(mode ? { mode } : {}) } });

  return (
    <TabScreen title="Nutrição" right={<HeaderActions />}>
      <Row gap={4} style={{ justifyContent: 'space-between' }}>
        <IconButton icon={ChevronLeft} tone="plain" size={32} label="Semana anterior" onPress={() => setDay(dayKey(addDays(week, -7)))} />
        {Array.from({ length: 7 }).map((_, i) => {
          const d = addDays(week, i);
          const k = dayKey(d);
          const active = k === day;
          const future = k > todayKey;
          return (
            <Pressable
              key={k}
              disabled={future}
              onPress={() => {
                tap();
                setDay(k);
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: radius.md,
                backgroundColor: active ? colors.cardStrong : 'transparent',
                opacity: future ? 0.35 : 1,
              }}>
              <Txt variant="caption" color={active ? colors.textOnStrongMuted : colors.textMuted}>
                {WEEKDAYS_SHORT[i]}
              </Txt>
              <Txt variant="bodyStrong" color={active ? colors.textOnStrong : colors.text}>
                {d.getDate()}
              </Txt>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  marginTop: 3,
                  backgroundColor: doseDays.has(k) ? colors.accent : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
        <IconButton
          icon={ChevronRight}
          tone="plain"
          size={32}
          label="Próxima semana"
          onPress={() => {
            const next = dayKey(addDays(week, 7));
            setDay(next > todayKey ? todayKey : next);
          }}
        />
      </Row>

      <NutritionCard day={day} />
      <WaterCard day={day} />

      <Row gap={space.sm}>
        <Button label="Foto do prato" icon={Camera} tone="accent" style={{ flex: 1 }} onPress={() => open(undefined, 'foto')} />
        <Button label="Buscar" icon={Plus} tone="secondary" style={{ flex: 1 }} onPress={() => open()} />
      </Row>

      <Txt variant="h2" style={{ marginTop: space.md }}>
        Refeições
      </Txt>
      {MEAL_SLOTS.map((slot) => {
        const items = meals.filter((m) => m.day === day && m.slot === slot.id);
        const kcal = items.reduce((t, m) => t + m.kcal, 0);
        const prot = items.reduce((t, m) => t + m.protein, 0);
        return (
          <Card key={slot.id} style={{ gap: space.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Txt variant="h3">{slot.label}</Txt>
                <Txt variant="caption">
                  {items.length ? `${fmtInt(kcal)} kcal · ${Math.round(prot)} g proteína` : slot.hint}
                </Txt>
              </View>
              <IconButton icon={Plus} size={36} label={`Adicionar em ${slot.label}`} onPress={() => open(slot.id)} />
            </Row>
            {items.length > 0 && <Divider />}
            {items.map((m) => (
              <Row key={m.id} style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Row gap={6}>
                    <Txt variant="small" color={colors.text} style={{ fontFamily: fonts.sansMedium, flexShrink: 1 }}>
                      {m.qty !== 1 ? `${String(m.qty).replace('.', ',')}× ` : ''}
                      {m.name}
                    </Txt>
                    {isProteinRich(m) ? (
                      <View style={{ backgroundColor: '#F1E1D6', borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Txt variant="caption" color={colors.accent} style={{ fontSize: 10 }}>
                          P1
                        </Txt>
                      </View>
                    ) : null}
                  </Row>
                  <Txt variant="caption">
                    {fmtInt(m.kcal)} kcal · P {Math.round(m.protein)} g · C {Math.round(m.carbs)} g · G {Math.round(m.fat)} g
                    {m.source === 'foto' ? ' · por foto' : ''}
                  </Txt>
                </View>
                <IconButton icon={Trash2} tone="plain" size={32} label="Remover" onPress={() => removeMeal(m.id)} />
              </Row>
            ))}
          </Card>
        );
      })}
    </TabScreen>
  );
}
