export interface AmountTier {
  value: number;
  label: string;
}

export interface Campaign {
  id: string;
  schoolId: string;
  cause: string;
  title: string;
  letterBody: string;
  goal: number;
  endDate: string;
  amounts: AmountTier[];
  hideAmounts: boolean;
  matchingSentence: string;
  childFirstName: string;
  greetingName: string;
  thankYouLine: string;
  publishedAt: string;
}

export interface School {
  id: string;
  slug: string;
  name: string;
  suburb: string;
  createdAt: string;
  welcomeLine: string;
  accentColor: string;
  contactEmail: string;
  bannerImage: string;
  logoImage: string;
  adminUsername: string;
  adminPassword: string;
}

export interface Gift {
  id: string;
  campaignId: string;
  donorFirstName: string;
  amount: number;
  stars: number;
  createdAt: string;
  /** '' when the gift came from the plain give link rather than a named promoter's link. */
  promoterId: string;
}

export interface Promoter {
  id: string;
  campaignId: string;
  name: string;
  /** '' until the admin sends this promoter their link. */
  sentAt: string;
}

export interface KinData {
  schools: School[];
  campaigns: Campaign[];
  gifts: Gift[];
  promoters: Promoter[];
}
