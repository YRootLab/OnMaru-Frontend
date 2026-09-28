






export interface HanokDoganEntry {
  placeId: string;
  overview: string | null;
  usetime: string | null;
  restdate: string | null;
  images: string[];
  homepage: string | null;
}

export interface NearbyAudioStory {
  storyId: string;
  stid: string;
  title: string;
  audioTitle: string;
  distance?: string;
  formattedDuration: string;
  imageUrl: string | null;
  locationName: string;
}

export interface NearbyFoodPlace {
  id: string;
  title: string;
  addr: string;
  image: string | null;
  distanceMeters: number;
}
