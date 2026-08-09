'use client';

import React, { useMemo, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Clock,
  CalendarOff,
  Car,
  Phone,
  Globe,
  Info,
  Images,
} from 'lucide-react';
import { meok, lightPalette } from '@/design-system/tokens';
import type { Village, VillageDetailResponse } from '@/hanok/types';

interface VillageDetailModalProps {
  village: Village | null;
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(25, 31, 40, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 99999;
  display: grid;
  place-items: center;
  padding: 24px;
`;

const ModalCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 28px;
  max-width: 720px;
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(43, 92, 230, 0.12);
  box-shadow: 0 24px 48px -12px rgba(25, 31, 40, 0.25);
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ImageHero = styled.div<{ $bg: string | null }>`
  position: relative;
  width: 100%;
  height: 300px;
  background-color: rgba(78, 89, 104, 0.08);
  transition: background-image 0.3s ease;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : 'background: linear-gradient(135deg, #2B5CE6 0%, #1A3898 100%);'}

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 40%, rgba(14, 20, 36, 0.8) 100%);
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  color: ${meok[900]};
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    transform: scale(1.08);
    background: #ffffff;
  }
`;

const HeroContent = styled.div`
  position: absolute;
  bottom: 20px;
  left: 24px;
  right: 24px;
  z-index: 2;
  color: #ffffff;
`;

const HeroRegion = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${lightPalette.kobalt[100]};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const HeroTitle = styled.h2`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 700;
  margin: 4px 0 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  color: #ffffff;
`;

const Body = styled.div`
  padding: 24px 28px 32px;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const TypeBadge = styled.span`
  background: ${lightPalette.kobalt[50]};
  color: ${lightPalette.kobalt[700]};
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(43, 92, 230, 0.18);
`;

const AddrText = styled.span`
  font-size: 13px;
  color: ${meok[500]};
`;

const CuratorsNoteSection = styled.div`
  background: #f8fbff;
  border: 1px solid rgba(43, 92, 230, 0.12);
  border-radius: 20px;
  padding: 20px 22px;
  margin-bottom: 24px;
`;

const NoteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: ${lightPalette.kobalt[500]};
  margin-bottom: 12px;
`;

const HeaderBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SourceTag = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #1a49c6;
  background: #eef3ff;
  padding: 3px 9px;
  border-radius: 6px;
`;

const StoryContainer = styled.div<{ $isExpanded: boolean }>`
  position: relative;
  ${({ $isExpanded }) =>
    !$isExpanded &&
    `
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const StoryParagraph = styled.p`
  font-size: 14px;
  color: ${meok[700]};
  line-height: 1.78;
  margin: 0 0 14px;
  letter-spacing: -0.01em;
  word-break: keep-all;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const ExpandBtn = styled.button`
  border: none;
  background: transparent;
  color: ${lightPalette.kobalt[500]};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0 0;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
`;


const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  margin: 24px 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

const InfoCard = styled.div`
  background: #fcfcfd;
  border: 1px solid rgba(78, 89, 104, 0.12);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const InfoIconBox = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: ${lightPalette.kobalt[50]};
  color: ${lightPalette.kobalt[500]};
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

const InfoContentBox = styled.div`
  flex: 1;
  min-width: 0;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${meok[500]};
  margin-bottom: 3px;
`;

const InfoVal = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${meok[700]};
  line-height: 1.5;
  word-break: keep-all;

  a {
    color: ${lightPalette.kobalt[500]};
    text-decoration: underline;
    font-weight: 600;
    &:hover {
      color: ${lightPalette.kobalt[700]};
    }
  }
`;


const RepeatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
`;

const RepeatItemCard = styled.div`
  background: rgba(248, 250, 255, 0.7);
  border: 1px solid rgba(43, 92, 230, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
`;

const RepeatTitleText = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${lightPalette.kobalt[700]};
  margin-bottom: 4px;
`;

const RepeatContentText = styled.div`
  font-size: 13px;
  color: ${meok[700]};
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: keep-all;
`;

const GallerySection = styled.div`
  margin-bottom: 24px;
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 10px;
`;

const GalleryThumb = styled.button<{ $active: boolean }>`
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid ${({ $active }) => ($active ? lightPalette.kobalt[500] : 'transparent')};
  padding: 0;
  background: #eee;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: scale(1.04);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const OverviewSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`;

const SkeletonLine = styled.div`
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, ${meok[200]} 25%, #e8e8e8 50%, ${meok[200]} 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  ${shimmer}
`;

const BadgeTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${meok[500]};
  margin-bottom: 8px;
`;

const BadgeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`;

const TagBadge = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${lightPalette.kobalt[700]};
  background: ${lightPalette.kobalt[50]};
  padding: 4px 11px;
  border-radius: 9999px;
  border: 1px solid rgba(43, 92, 230, 0.15);
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(43, 92, 230, 0.1);
`;

const MapBtn = styled.a`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, ${lightPalette.kobalt[500]} 0%, ${lightPalette.kobalt[700]} 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px;
  border-radius: 9999px;
  text-decoration: none;
  transition: opacity 0.18s ease;

  &:hover {
    opacity: 0.9;
  }
`;

function cleanTourApiHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractHomepageUrl(homepageRaw?: string | null): { url: string | null; label: string } {
  if (!homepageRaw) return { url: null, label: '' };
  const hrefMatch = homepageRaw.match(/href=["']([^"']+)["']/i);
  if (hrefMatch && hrefMatch[1]) {
    return { url: hrefMatch[1], label: '공식 웹사이트 바로가기' };
  }
  const cleanText = cleanTourApiHtml(homepageRaw);
  if (cleanText.startsWith('http://') || cleanText.startsWith('https://')) {
    return { url: cleanText, label: '공식 웹사이트 바로가기' };
  }
  return { url: null, label: cleanText };
}

/* ── 풍성하고 인문학적인 한옥 에디토리얼 도슨트 서사 생성 엔진 (Fallback) ── */
function generateRichHanokStory(village: Village): string {
  const name = village.name;
  const addr = village.addr;
  const region = village.region;
  const type = village.type;

  if (name.includes('하회') || name.includes('병산')) {
    return `${name}은(는) 낙동강 물길이 S자로 마을을 감싸 안는 연화부수형(蓮花浮水形) 길지에 터를 잡은 영남 사대부의 상징 공간입니다.\n\n서애 류성룡 선생 가문의 고즈넉한 문중 고택들과 병산서원의 만대루처럼 자연과의 조화를 극대화한 한국 전통 목조건축의 절정을 자랑합니다.\n\n바람이 툇마루를 따라 부는 날, 서래선 기와너머 펼쳐지는 낙동강 백사장과 솔숲의 장관은 우리 전통 주거 공간이 자연을 대하는 거룩한 애정을 느끼게 합니다.`;
  }
  if (name.includes('선교장') || name.includes('활래정')) {
    return `${name}은(는) 강릉의 호방한 영동 사대부 기품과 열두 대문의 웅장함이 서려 있는 조선 최고 수준의 명가 가옥입니다.\n\n창덕궁 낙선재의 기품을 닮은 열화당과 인공 연못 위에 연꽃처럼 띄워진 정자 활래정(活來亭)은 조상의 운치 있는 풍류 생활을 생생히 전해줍니다.\n\n계절이 바뀔 때마다 연못에 비치는 활래정의 단아한 소나무 그림자와 대청마루에서 우려내는 차 향기가 방문객의 마음을 평온하게 채워줍니다.`;
  }
  if (name.includes('학인당') || name.includes('전주한옥')) {
    return `${name}은(는) 전주천의 물길과 남천교의 돌다리를 배경으로, 고종 황제의 어진을 모셨던 호남 전통 가옥의 미학적 정수입니다.\n\n조선 후기 궁궐 건축 기술을 응용하여 높은 천장과 기품 있는 솟을대문, 웅장한 대청 구조를 온전히 보존하고 있습니다.\n\n은은한 햇살이 창호지에 스며들 때 느껴지는 아늑한 온돌 온기와 마당 한편 흙돌담길의 소박한 선율이 전주 한옥마을의 진짜 멋을 일깨워줍니다.`;
  }
  if (name.includes('일두') || name.includes('개평')) {
    return `${name}은(는) 지리산 덕유산 자락 아래, 조선 성리학의 거두 일두 정여창 선생의 숨결과 500년 전통의 솔향기가 감도는 고택입니다.\n\n웅장한 솟을대문에 달린 4개의 명정판과 사랑채 마당의 가산(假山) 정원은 선비 정신의 단아한 결기를 온전히 보여줍니다.\n\n툇마루에 가만히 앉아 솔바람 소리를 청하면, 세월을 뛰어넘어 전해지는 한국 사대부 종가 가옥만의 그윽한 품격과 여백의 미를 만나게 됩니다.`;
  }

  const regionIntro: Record<string, string> = {
    서울: '조선 왕조 600년의 도성 역사와 혜화, 삼청동의 고즈넉한 길목에 스며있는 한옥입니다.',
    경북: '안동과 경주의 유교 사상과 수백 년 내려온 사대부 종택의 묵직한 가치가 기품 있게 깃든 한옥입니다.',
    전북: '전주 한옥마을의 다정한 가옥 풍류와 호남 유학의 멋스러움이 아늑하게 피어나는 공간입니다.',
    경남: '지리산의 웅장한 지형 아래 선 선비 문화와 남해의 바람을 머금은 단정한 전통 가옥입니다.',
    충남: '공주·부여의 유서 깊은 백제 문화와 외암마을의 따스한 온돌 지혜가 조화를 이루는 가옥입니다.',
    강원: '강릉 선교장의 운치처럼 동해의 청정한 자연 속에 호방하면서도 절제된 기품으로 자리 잡은 한옥입니다.',
    경기: '수원 화성과 임진강의 역사적 유산 곁에서 전통의 숨결을 든든하게 계승하고 있는 가옥입니다.',
    전남: '해남 녹우당과 나주 향교로 대변되는 남도 서정과 자생적 유학 풍류의 은은함을 지닌 한옥입니다.',
  };

  const typeDetails: Record<string, string> = {
    '한옥 고택 스테이': '아침 일찍 툇마루에 앉아 조용히 우려낸 전통 차 한 잔을 마시며, 나무의 고유한 결향과 문종이에 스미는 아침 햇살을 오롯이 조망할 수 있는 스페셜 스테이 공간입니다.',
    '궁궐 한옥': '조선 왕실의 웅장한 단청과 대청 구조, 겹처마 기와가 선사하는 고결한 수직·수평선이 조화를 이루는 국가적 문화유산입니다.',
    '사대부 고택': '솟을대문을 거쳐 사랑채와 안채로 이어지는 조선 시대 양반 가옥만의 지혜로운 공간 분할과 흙돌담길의 고요한 운치를 만나실 수 있습니다.',
    '서원·향교': '조선 시대 학문을 다듬고 옛 성현을 배향하던 유학의 교육 터전으로, 고풍스러운 목조건축과 주변 수목이 우아한 단조로움을 이룹니다.',
    '한옥 공공건축물': '주민센터, 도서관, 박물관 등 현대 주민 생활과 자연스럽게 호흡하도록 설계된 전통과 현대의 유연한 조화 공간입니다.',
    '집성촌형': '마을 정자나무와 담장 너머로 이어진 아담한 기와지붕들이 모여 옛 이웃 간의 삶과 조화의 미덕을 생생하게 보여주는 공간입니다.',
  };

  const rText = regionIntro[region] || '우리나라의 수려한 산천과 풍광 속에 다정하게 터를 잡은 전통 가옥 공간입니다.';
  const tText = typeDetails[type] || '전통 한옥의 고즈넉한 기품과 아늑한 여백의 아름다움을 전해주는 대표적인 명소입니다.';

  return `${name}은(는) ${addr}에 정교하게 자리한 한옥 유산입니다.\n\n${rText}\n\n${tText}\n\n자연 목재의 결을 온전히 살린 기둥과 솟을대문, 아침 햇살이 은은하게 번지는 창호문종이가 특유의 정겨움을 더해주며, 사계절 정원의 수목과 기와선이 선사하는 정갈한 힐링의 시간을 누리실 수 있습니다.`;
}

export default function VillageDetailModal({
  village,
  onClose,
}: VillageDetailModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);

  useEffect(() => {
    setIsExpanded(false);
    setDetailData(null);
    setActiveImageIdx(null);

    if (!village) return;

    setIsLoadingOverview(true);
    fetch(`/api/tourapi/detail?id=${village.id}`)
      .then((r) => r.json())
      .then((data: VillageDetailResponse) => {
        if (data && data.source === 'TourAPI') {
          setDetailData(data);
        }
      })
      .catch((err) => console.warn('[Modal] TourAPI fetch failed', err))
      .finally(() => setIsLoadingOverview(false));
  }, [village]);

  const fetchedOverview = detailData?.overview ? cleanTourApiHtml(detailData.overview) : null;

  const rawStory = useMemo(() => {
    if (!village) return '';
    if (fetchedOverview && fetchedOverview.length > 20) return fetchedOverview;
    if (village.overview && !village.overview.includes(' — ') && village.overview.length > 80) {
      return cleanTourApiHtml(village.overview);
    }
    return generateRichHanokStory(village);
  }, [village, fetchedOverview]);

  const paragraphs = useMemo(() => {
    return rawStory.split('\n\n').filter((p) => p.trim().length > 0);
  }, [rawStory]);

  const isLongContent = paragraphs.length > 2 || rawStory.length > 320;

  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (village?.image) list.push(village.image);
    if (detailData?.images && detailData.images.length > 0) {
      for (const img of detailData.images) {
        if (!list.includes(img)) list.push(img);
      }
    }
    return list;
  }, [village, detailData]);

  const currentHeroImage = useMemo(() => {
    if (activeImageIdx !== null && galleryImages[activeImageIdx]) {
      return galleryImages[activeImageIdx];
    }
    return village?.hasImage ? village.image : galleryImages[0] || null;
  }, [activeImageIdx, galleryImages, village]);

  const homepageInfo = useMemo(() => {
    return extractHomepageUrl(detailData?.homepage);
  }, [detailData]);

  const hasOperationalInfo = Boolean(
    detailData?.usetime ||
      detailData?.restdate ||
      detailData?.parking ||
      detailData?.tel ||
      homepageInfo.url ||
      detailData?.expguide
  );

  return (
    <AnimatePresence>
      {village && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalCard
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CloseBtn onClick={onClose} aria-label="닫기">
              <X size={18} />
            </CloseBtn>

            <ImageHero $bg={currentHeroImage}>
              <HeroContent>
                <HeroRegion>{village.region}</HeroRegion>
                <HeroTitle>{village.name}</HeroTitle>
              </HeroContent>
            </ImageHero>

            <Body>
              <MetaRow>
                <TypeBadge>{village.type}</TypeBadge>
                <AddrText>
                  <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {village.addr}
                </AddrText>
              </MetaRow>

              {isLoadingOverview ? (
                <OverviewSkeleton>
                  <SkeletonLine style={{ width: '100%' }} />
                  <SkeletonLine style={{ width: '92%' }} />
                  <SkeletonLine style={{ width: '96%' }} />
                  <SkeletonLine style={{ width: '78%' }} />
                </OverviewSkeleton>
              ) : (
                <CuratorsNoteSection>
                  <NoteHeader>
                    <HeaderBadge>
                      {fetchedOverview ? <BookOpen size={16} /> : <Sparkles size={16} />}
                      <span>
                        {fetchedOverview ? '한국관광공사 문화유산 & 한옥 원본 상세 글' : '온마루 한옥 도감 에디토리얼'}
                      </span>
                    </HeaderBadge>
                    {fetchedOverview && <SourceTag>TourAPI 4.0 100% 실시간 연동</SourceTag>}
                  </NoteHeader>
                  <StoryContainer $isExpanded={isExpanded}>
                    {paragraphs.map((p, idx) => (
                      <StoryParagraph key={idx}>{p}</StoryParagraph>
                    ))}
                  </StoryContainer>
                  {isLongContent && !isExpanded && (
                    <ExpandBtn onClick={() => setIsExpanded(true)}>
                      더보기 (스토리 전문 읽기) <ChevronDown size={14} />
                    </ExpandBtn>
                  )}
                  {isLongContent && isExpanded && (
                    <ExpandBtn onClick={() => setIsExpanded(false)}>
                      접기 <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
                    </ExpandBtn>
                  )}

                </CuratorsNoteSection>
              )}

              {/* 100% 연동된 관람 및 이용 안내 카드 그리드 */}
              {!isLoadingOverview && hasOperationalInfo && (
                <>
                  <SectionTitle>
                    <Info size={16} /> 관람 및 이용 안내
                  </SectionTitle>
                  <InfoGrid>
                    {detailData?.usetime && (
                      <InfoCard>
                        <InfoIconBox>
                          <Clock size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>관람 / 이용 시간</InfoLabel>
                          <InfoVal>{cleanTourApiHtml(detailData.usetime)}</InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}

                    {detailData?.restdate && (
                      <InfoCard>
                        <InfoIconBox>
                          <CalendarOff size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>정기 휴무일</InfoLabel>
                          <InfoVal>{cleanTourApiHtml(detailData.restdate)}</InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}

                    {detailData?.parking && (
                      <InfoCard>
                        <InfoIconBox>
                          <Car size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>주차 시설</InfoLabel>
                          <InfoVal>{cleanTourApiHtml(detailData.parking)}</InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}

                    {detailData?.tel && (
                      <InfoCard>
                        <InfoIconBox>
                          <Phone size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>문의 전화</InfoLabel>
                          <InfoVal>{cleanTourApiHtml(detailData.tel)}</InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}

                    {homepageInfo.url && (
                      <InfoCard>
                        <InfoIconBox>
                          <Globe size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>공식 웹사이트</InfoLabel>
                          <InfoVal>
                            <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                              {homepageInfo.label} <ArrowUpRight size={12} style={{ display: 'inline' }} />
                            </a>
                          </InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}
                  </InfoGrid>
                </>
              )}

              {/* 세부 반복 관람/입장료 안내 (repeatInfo) */}
              {!isLoadingOverview && detailData?.repeatInfo && detailData.repeatInfo.length > 0 && (
                <>
                  <SectionTitle>
                    <BookOpen size={16} /> 세부 관람 및 이용 요금 안내
                  </SectionTitle>
                  <RepeatList>
                    {detailData.repeatInfo.map((info, idx) => (
                      <RepeatItemCard key={idx}>
                        <RepeatTitleText>{info.title}</RepeatTitleText>
                        <RepeatContentText>{cleanTourApiHtml(info.content)}</RepeatContentText>
                      </RepeatItemCard>
                    ))}
                  </RepeatList>
                </>
              )}

              {/* 고화질 사진 갤러리 */}
              {galleryImages.length > 1 && (
                <GallerySection>
                  <SectionTitle>
                    <Images size={16} /> 문화유산 화보 갤러리 ({galleryImages.length})
                  </SectionTitle>
                  <GalleryGrid>
                    {galleryImages.map((img, idx) => (
                      <GalleryThumb
                        key={idx}
                        $active={activeImageIdx === idx || (activeImageIdx === null && idx === 0)}
                        onClick={() => setActiveImageIdx(idx)}
                      >
                        <img src={img} alt={`${village.name} 사진 ${idx + 1}`} />
                      </GalleryThumb>
                    ))}
                  </GalleryGrid>
                </GallerySection>
              )}

              {village.badges.length > 0 && (
                <>
                  <BadgeTitle>주요 특징 태그</BadgeTitle>
                  <BadgeList>
                    {village.badges.map((b) => (
                      <TagBadge key={b}>#{b}</TagBadge>
                    ))}
                  </BadgeList>
                </>
              )}

              <ActionRow>
                <MapBtn href={`/map?lat=${village.lat}&lng=${village.lng}`}>
                  <MapPin size={15} /> 지도에서 위치 탐색하기 <ArrowUpRight size={14} />
                </MapBtn>
              </ActionRow>
            </Body>
          </ModalCard>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
