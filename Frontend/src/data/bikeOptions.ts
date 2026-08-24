export const BRANDS_LIST: string[] = [
  'Royal Enfield',
  'Yamaha',
  'Kawasaki',
  'Hero',
  'TVS',
  'Honda',
  'Suzuki',
  'Harley-Davidson',
  'KTM',
  'Bajaj',
];

export const CC_LIST: number[] = [
  100,
  110,
  125,
  150,
  160,
  200,
  220,
  250,
  310,
  390,
  650,
  812,
  883,
  890,
  1200,
];

export const BRAND_CC_MAP: Record<string, number[]> = {
  'Royal Enfield': [350, 390, 650],
  'Yamaha': [125, 150, 160, 250],
  'Kawasaki': [250, 650, 890],
  'Hero': [100, 110, 125, 150, 160, 200],
  'TVS': [100, 110, 125, 160, 200, 310],
  'Honda': [100, 110, 125, 150, 160, 200, 650],
  'Suzuki': [110, 125, 150, 250],
  'Harley-Davidson': [812, 883, 1200],
  'KTM': [125, 200, 250, 390, 890],
  'Bajaj': [100, 110, 125, 150, 160, 200, 220, 250],
};

export const getCCsForBrand = (brand?: string): number[] => {
  if (!brand || !BRAND_CC_MAP[brand]) {
    return CC_LIST;
  }
  return BRAND_CC_MAP[brand];
};
