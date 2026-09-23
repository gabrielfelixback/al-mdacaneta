export interface HealthDay {
  steps: number;
  activeKcal: number;
}

export interface HealthBridge {
  /** Nome exibido ao usuário, ex.: "Apple Saúde". */
  label: string;
  isSupported: () => Promise<boolean>;
  connect: () => Promise<boolean>;
  readDay: (day: Date) => Promise<HealthDay>;
  writeWeight: (kg: number, at: Date) => Promise<void>;
  writeWater: (ml: number, at: Date) => Promise<void>;
}
