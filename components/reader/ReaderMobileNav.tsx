'use client';

import ReaderNavigation from './ReaderNavigation';
import { READER_COLORS } from './types';

interface Props {
  currentPage: number;
  totalPages: number;
  onChangePage: (delta: number) => void;
  onGoToPage: (page: number) => void;
}

export default function ReaderMobileNav({ currentPage, totalPages, onChangePage, onGoToPage }: Props) {
  return (
    <div
      className="flex items-center justify-center py-2 sm:hidden shrink-0"
      style={{ background: READER_COLORS.chrome, borderTop: '1px solid rgba(229,167,0,0.2)' }}
    >
      <ReaderNavigation currentPage={currentPage} totalPages={totalPages} onChangePage={onChangePage} onGoToPage={onGoToPage} compact />
    </div>
  );
}
