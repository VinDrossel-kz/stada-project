export type Game = { id: number; stage: string; name: string };

export const games: Game[] = [
  { id: 1, stage: 'BASE CAMP', name: 'Продай за минуту' },
  { id: 2, stage: 'PACK YOUR BAG', name: 'Крокодил' },
  { id: 3, stage: 'ROUTE PLANNING', name: 'Своя игра' },
  { id: 4, stage: 'THE CLIMB', name: 'Визит в аптеку / к врачу' },
  { id: 5, stage: 'THE STORM', name: 'Ситуации на карточках / КВН' },
  { id: 6, stage: 'FINAL RIDGE', name: 'Танцевальный баттл' },
  { id: 7, stage: 'КАМНЕПАД', name: 'Расставь в правильном порядке' },
  { id: 8, stage: '★', name: 'SUMMIT Бриф' },
  { id: 9, stage: '★', name: 'SUMMIT Видео' },
];
