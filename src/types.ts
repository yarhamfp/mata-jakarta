export interface Cam {
  id: string;
  name: string;
  cam: string;
  area: string;
  base: string;
}

export type CamStatus = 'wait' | 'ok' | 'off';
