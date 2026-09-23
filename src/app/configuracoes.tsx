import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import {
  BookOpen,
  ChevronRight,
  Droplet,
  FileText,
  LogOut,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { CapsuleMark, Wordmark } from '@/components/Brand';
import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Card, Chip, Divider, PressableRow, Row } from '@/components/ui';
import { notify } from '@/lib/notify';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme/tokens';

function Item({ icon: Icon, label, onPress, danger, value }: { icon: LucideIcon; label: string; onPress: () => void; danger?: boolean; value?: string }) {
  return (
    <PressableRow onPress={onPress}>
      <Row style={{ paddingVertical: space.md }}>
        <Icon size={20} color={danger ? colors.danger : colors.text} strokeWidth={1.8} />
        <Txt variant="body" color={danger ? colors.danger : colors.text} style={{ flex: 1 }}>
          {label}
        </Txt>
        {value ? <Txt variant="small">{value}</Txt> : null}
        <ChevronRight size={18} color={colors.textMuted} />
      </Row>
    </PressableRow>
  );
}

export default function Settings() {
  const cup = useStore((s) => s.settings.cupMl);
  const updateSettings = useStore((s) => s.updateSettings);
  const reset = useStore((s) => s.reset);
  const pro = useStore((s) => s.pro.active);
  const [confirming, setConfirming] = useState(false);
  const go = (h: Href) => router.push(h);

  return (
    <StackScreen title="Configurações">
      <Card tone="strong" onPress={() => go('/pro')}>
        <Row>
          <CapsuleMark size={16} color={colors.textOnStrong} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3" color={colors.textOnStrong}>
              {pro ? 'Além Pro · ativo' : 'Conheça o Além Pro'}
            </Txt>
            <Txt variant="caption" color={colors.textOnStrongMuted}>
              Biblioteca do Método 3P, assistente e relatório em PDF
            </Txt>
          </View>
          <ChevronRight size={18} color={colors.textOnStrongMuted} />
        </Row>
      </Card>

      <Txt variant="label">Seu acompanhamento</Txt>
      <Card style={{ paddingVertical: space.sm, gap: 0 }}>
        <Item icon={UserRound} label="Meus dados" onPress={() => go('/meus-dados')} />
        <Divider />
        <Item icon={Pill} label="Meu tratamento" onPress={() => go('/tratamento')} />
        <Divider />
        <Item icon={BookOpen} label="Biblioteca do Método 3P" onPress={() => go('/biblioteca')} />
        <Divider />
        <Item icon={Sparkles} label="Pergunte ao método" onPress={() => go('/assistente')} />
      </Card>

      <Txt variant="label">Para seu médico</Txt>
      <Card style={{ paddingVertical: space.sm, gap: 0 }}>
        <Item icon={FileText} label="Relatório do tratamento" onPress={() => go('/relatorio')} />
      </Card>

      <Txt variant="label">App</Txt>
      <Card style={{ gap: space.sm }}>
        <Row>
          <Droplet size={20} color={colors.text} strokeWidth={1.8} />
          <Txt variant="body" style={{ flex: 1 }}>
            Tamanho do copo
          </Txt>
        </Row>
        <Row gap={space.sm}>
          {[200, 250, 300, 500].map((ml) => (
            <Chip key={ml} small label={`${ml} ml`} active={cup === ml} onPress={() => updateSettings({ cupMl: ml })} />
          ))}
        </Row>
      </Card>
      <Card style={{ paddingVertical: space.sm, gap: 0 }}>
        <Item icon={Stethoscope} label="Referências médicas" onPress={() => go('/referencias')} />
        <Divider />
        <Item
          icon={ShieldCheck}
          label="Privacidade"
          onPress={() =>
            notify(
              'Privacidade',
              'Nesta versão, seus registros ficam só no seu aparelho. Nada é enviado para servidores, exceto a foto do prato e as perguntas ao assistente, quando você usa esses recursos.',
            )
          }
        />
        <Divider />
        <Item
          icon={LogOut}
          danger
          label={confirming ? 'Toque de novo para apagar tudo' : 'Apagar meus dados'}
          onPress={() => {
            if (!confirming) return setConfirming(true);
            reset();
          }}
        />
        {confirming ? (
          <Txt variant="caption" color={colors.danger} style={{ paddingBottom: space.sm }}>
            Todos os registros deste aparelho serão apagados e você volta ao cadastro inicial.
          </Txt>
        ) : null}
      </Card>

      <View style={{ alignItems: 'center', gap: space.sm, marginTop: space.xl }}>
        <Wordmark size={18} />
        <Txt variant="caption">
          v{Constants.expoConfig?.version ?? '0.1.0'} · Não substitui acompanhamento médico e nutricional.
        </Txt>
      </View>
    </StackScreen>
  );
}
