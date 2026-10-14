export type TopicCode =
  | 'TRADITIONAL_SPACE_HERITAGE'
  | 'TRADITIONAL_EXPERIENCE'
  | 'TRADITIONAL_FOOD_TEA'
  | 'K_DRAMA'
  | 'K_MOVIE'
  | 'K_POP_MV'
  | 'K_ARTIST';

export type WorkType = 'DRAMA' | 'MOVIE' | 'VARIETY' | 'MUSIC_VIDEO' | 'ARTIST';

export type RelationType = 'FILMING_LOCATION' | 'VISIT_SPOT';

export interface Region {
  code: string;
  nameKo: string;
}

export interface PlaceRole {
  code: string;
  labelKo: string;
}

export interface DiscoveryTopic {
  code: TopicCode;
  labelKo: string;
  labelEn: string;
  placeCount: number;
  active: boolean;
}

export interface FeaturedRelation {
  relationId: string;
  workId: string;
  workTitle: string;
  type: WorkType;
  relationType: RelationType;
}

export interface DiscoveryPlaceSummary {
  placeId: string;
  name: string;
  region: Region;
  placeRoles: PlaceRole[];
  topics: TopicCode[];
  placeImage: string | null;
  odiiLinked: boolean;
  featuredRelation: FeaturedRelation | null;
  matchingWorkCount: number;
  saveAvailable: boolean;
  savedByMe: boolean | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SourceTaxonomy {
  provider: string;
  lclsSystm2: string | null;
  lclsSystm3: string | null;
  labelKo: string;
}

export interface OdiiInfo {
  linked: boolean;
  storyCount: number;
}

export interface KContentsInfo {
  relationCount: number;
  href: string;
}

export interface DiscoveryPlaceDetail {
  placeId: string;
  name: string;
  region: Region;
  address: string;
  coordinates: Coordinates;
  description: string;
  sourceTaxonomy: SourceTaxonomy;
  placeRoles: PlaceRole[];
  topics: TopicCode[];
  images: string[];
  odii: OdiiInfo;
  placeSummaryPoints: string[];
  kContents: KContentsInfo;
  saveAvailable: boolean;
  savedByMe: boolean | null;
}

export interface Artist {
  artistId: string;
  name: string;
}

export interface WorkSummary {
  workId: string;
  canonicalTitle: string;
  englishTitle: string | null;
  type: WorkType;
  releaseYear: number | null;
  artists: Artist[];
  workArtwork: string | null;
  publicPlaceCount: number;
  workTags: string[];
}

export interface MetadataSource {
  sourceTitle: string;
  sourceUrl: string;
  checkedAt: string;
}

export interface WorkDetail extends WorkSummary {
  summaryPoints: string[];
  officialPageUrl: string | null;
  metadataSources: MetadataSource[];
  placesHref: string;
}

export interface Evidence {
  sourceTitle: string;
  sourceUrl: string;
  sourceType: string;
  publisherName: string;
  checkedAt: string;
}

export interface KContentRelation {
  relationId: string;
  relationType: RelationType;
  work: {
    workId: string;
    canonicalTitle: string;
    type: WorkType;
    releaseYear: number | null;
  };
  contextSummary: string | null;
  relationTags: string[];
  evidence: Evidence[];
  evidenceCount: number;
  verifiedAt: string;
}

export interface FacetEntry {
  code: string;
  labelKo?: string;
  count: number;
}

export interface DiscoveryFacets {
  topic: FacetEntry[];
  regionCode: FacetEntry[];
  placeRole: FacetEntry[];
  type: FacetEntry[];
  workTagCode: FacetEntry[];
  relationTagCode: FacetEntry[];
}

export interface DiscoveryPlacesParams {
  topic?: TopicCode;
  regionCode?: string;
  placeRole?: string;
  workId?: string;
  type?: WorkType;
  sort?: string;
  limit?: number;
  cursor?: string;
}

export interface DiscoveryWorksParams {
  type?: WorkType;
  q?: string;
  releaseYear?: number;
  sort?: string;
  limit?: number;
  cursor?: string;
}

export interface DiscoveryPlacesPage {
  catalogRevision: string;
  countsAsOf: string;
  matchingPlaceCount: number;
  facets: DiscoveryFacets;
  items: DiscoveryPlaceSummary[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface DiscoveryWorksPage {
  catalogRevision: string;
  countsAsOf: string;
  matchingWorkCount: number;
  items: WorkSummary[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface KContentsPage {
  catalogRevision: string;
  countsAsOf: string;
  matchingRelationCount: number;
  items: KContentRelation[];
  hasMore: boolean;
  nextCursor: string | null;
}

export type DiscoveryErrorCode =
  | 'VALIDATION_ERROR'
  | 'CURSOR_INVALID'
  | 'NOT_FOUND'
  | 'CURSOR_EXPIRED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';
