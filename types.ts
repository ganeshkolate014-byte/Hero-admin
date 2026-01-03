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
  rank: number;
  type: string;
  quality: string;
  duration: string;
  aired: string;
  synopsis: string;
  keywords: string[];
  episodes: Episodes;
  publishedUrl?: string;
}

export interface UserInfo {
  username: string;
  joinedAt: string;
  lastActive: string;
}

export interface UserLibraryData {
  info: UserInfo;
  library: SlideData[];
  lastUpdated: string;
}

export interface MasterDB {
  users: Record<string, UserLibraryData>;
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

export interface User {
  id: string;
  name: string;
  createdAt: string;
}