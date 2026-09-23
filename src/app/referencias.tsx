import * as WebBrowser from 'expo-web-browser';
import { Activity, BookOpen, Briefcase, FlaskConical, PersonStanding, Utensils, type LucideIcon } from 'lucide-react-native';
import { ExternalLink } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Card, Divider, Row, tap } from '@/components/ui';
import { REFERENCE_GROUPS } from '@/lib/references';
import { colors, space } from '@/theme/tokens';

const ICONS: Record<string, LucideIcon> = {
  medicamentos: Briefcase,
  imc: PersonStanding,
  estudos: FlaskConical,
  proteina: Utensils,
  energia: Activity,
};

export default function References() {
  return (
    <StackScreen title="Referências médicas">
      <Txt variant="small">
        As informações de saúde do Além da Caneta são baseadas em fontes oficiais e literatura científica. Toque em uma
        fonte para abri-la. O app é educacional e não substitui a orientação de um profissional de saúde.
      </Txt>
      {REFERENCE_GROUPS.map((g) => {
        const Icon = ICONS[g.id] ?? BookOpen;
        return (
          <Card key={g.id} style={{ gap: space.sm }}>
            <Row>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={colors.text} strokeWidth={1.8} />
              </View>
              <Txt variant="h3" style={{ flex: 1 }}>
                {g.title}
              </Txt>
            </Row>
            {g.items.map((r, i) => (
              <View key={r.url}>
                {i > 0 && <Divider />}
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    tap();
                    WebBrowser.openBrowserAsync(r.url).catch(() => {});
                  }}
                  style={({ pressed }) => ({ paddingVertical: space.md, opacity: pressed ? 0.6 : 1 })}>
                  <Row style={{ alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="body">{r.title}</Txt>
                      <Txt variant="caption">{r.source}</Txt>
                    </View>
                    <ExternalLink size={18} color={colors.textSecondary} />
                  </Row>
                </Pressable>
              </View>
            ))}
          </Card>
        );
      })}
    </StackScreen>
  );
}
