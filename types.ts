export interface Episodes {
  sub: number;
  dub: number;
  eps: number;
}

export interface SlideData {
  title: string;
  alternativeTitle: string;
  id: string;
  poster: string;
  posterType: 'image' | 'video';
  logo: string;
  rank: number;
  type: string;
  quality: string;
  duration: string;
  aired: string;
  synopsis: string;
  keywords: string[];
  episodes: Episodes;
}

export interface HeroSlidesJSON {
  success: boolean;
  data: {
    spotlight: SlideData[];
  };
}

export enum SlideType {
  TV = 'TV',
  MOVIE = 'MOVIE',
  OVA = 'OVA',
  ONA = 'ONA'
}

export enum Quality {
  HD = 'HD',
  FHD = 'FHD',
  FOUR_K = '4K',
  CAM = 'CAM'
}