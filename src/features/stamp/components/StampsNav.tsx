'use client';

import styled from '@emotion/styled';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { meok } from '@/design-system/tokens';

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(25, 31, 40, 0.06);
  color: ${meok[900]};

  [data-theme='dark'] & {
    background: rgba(20, 18, 16, 0.88);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: #f8f8f7;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  opacity: 0.85;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
  }
`;

const BrandLink = styled(Link)`
  font-size: 14px;
  font-weight: 800;
  color: inherit;
  text-decoration: none;
  letter-spacing: -0.02em;
`;

export default function StampsNav() {
  return (
    <Nav>
      <BackLink href="/map">
        <ArrowLeft size={16} />
        <span>지도로 돌아가기</span>
      </BackLink>
      <BrandLink href="/">
        온마루 (ONMARU)
      </BrandLink>
    </Nav>
  );
}
