export interface IStation {
  metar?: IMetar;
  dep?: string;
  arr?: string;
  letter?: string;
}

export interface IMetar {
  station: string;
  temperature?: number;
  dewPoint?: number;
  altimeter?: number;
  wind?: IWind;
  visibility?: IVisibility;
  verticalVisibility?: number;
  clouds?: ICloud[];
  hour?: number;
}

interface IWind {
  degrees?: number; // NULL is VBR
  speed: number;
  gust?: number;
  direction: string;
}

interface IVisibility {
  indicator: string;
  value: number;
}

export interface ICloud {
  height?: number;
  quantity: 'SKC' | 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'NSC';
}
