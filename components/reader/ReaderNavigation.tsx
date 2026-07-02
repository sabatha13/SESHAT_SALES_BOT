'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { READER_COLORS } from './types';

interface Props {
  currentPage: number;
  totalPages: number;
  onChangePage: (delta: number) => void;
  onGoToPage: (page: number) => void;
  compact?: boolean;
}

export default function ReaderNavigation({ currentPage, totalPages, onChangePage, onGoToPage, compact = false }: Props) {
  const [inputMode, setInputMode] = useState(false);
  const [value, setValue] = useState('');
  const gold = READER_COLORS.gold;

  const submit = () => {
    const n = parseInt(value, 10);
    if (!isNaN(n)) onGoToPage(n);
    setInputMode(false);
    setValue('');
  };

  const pageJump = inputMode ? (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') {
          setInputMode(false);
          setValue('');
        }
      }}
      min={1}
      max={totalPages}
      autoFocus
      placeholder={`1-${totalPages}`}
      className="w-16 text-center text-xs rounded px-1 py-0.5 focus:outline-none"
      style={{ background: '#1a1400', border: `1px solid ${gold}`, color: gold }}
    />
  ) : (
    <button
      onClick={() => {
        setInputMode(true);
        setValue(String(currentPage));
      }}
      className="text-xs px-1 rounded"
      style={{ color: gold }}
      title="Aller à une page"
    >
      <span style={{ color: gold }}>{currentPage}</span>
      <span style={{ opacity: 0.5 }}> / {totalPages}</span>
    </button>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-6">
        <button onClick={() => onChangePage(-1)} disabled={currentPage <= 1} className="p-2 disabled:opacity-30" style={{ color: gold }} title="Page précédente">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pageJump}
        <button onClick={() => onChangePage(1)} disabled={currentPage >= totalPages} className="p-2 disabled:opacity-30" style={{ color: gold }} title="Page suivante">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChangePage(-10)} disabled={currentPage <= 1} className="p-1.5 rounded disabled:opacity-30" style={{ color: gold }} title="Reculer de 10 pages">
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button onClick={() => onChangePage(-1)} disabled={currentPage <= 1} className="p-1.5 rounded disabled:opacity-30" style={{ color: gold }} title="Page précédente (←)">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pageJump}
      <button onClick={() => onChangePage(1)} disabled={currentPage >= totalPages} className="p-1.5 rounded disabled:opacity-30" style={{ color: gold }} title="Page suivante (→)">
        <ChevronRight className="w-4 h-4" />
      </button>
      <button onClick={() => onChangePage(10)} disabled={currentPage >= totalPages} className="p-1.5 rounded disabled:opacity-30" style={{ color: gold }} title="Avancer de 10 pages">
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );
}
