'use client';

import { X, BookmarkCheck, Bookmark, List, Trash2 } from 'lucide-react';
import { READER_COLORS } from './types';
import type { BookmarkItem, OutlineItem, SidebarTab } from './types';

interface Props {
  open: boolean;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  outline: OutlineItem[];
  onGoToPage: (page: number) => void;
  onDeleteBookmark: (id: string) => void;
}

function OutlineNodes({ nodes, depth, onGoToPage }: { nodes: OutlineItem[]; depth: number; onGoToPage: (p: number) => void }) {
  const gold = READER_COLORS.gold;
  return (
    <>
      {nodes.map((node, i) => (
        <div key={`${depth}-${i}-${node.title}`}>
          <button
            onClick={() => node.pageNumber && onGoToPage(node.pageNumber)}
            disabled={node.pageNumber === null}
            className="w-full text-left py-1.5 rounded text-xs hover:bg-white/5 disabled:opacity-40 flex justify-between gap-2"
            style={{ paddingLeft: 8 + depth * 12, paddingRight: 8, color: '#cbb98a' }}
            title={node.title}
          >
            <span className="truncate">{node.title}</span>
            {node.pageNumber && <span style={{ color: gold, opacity: 0.7 }}>{node.pageNumber}</span>}
          </button>
          {node.items.length > 0 && <OutlineNodes nodes={node.items} depth={depth + 1} onGoToPage={onGoToPage} />}
        </div>
      ))}
    </>
  );
}

export default function ReaderSidebar({ open, activeTab, onTabChange, onClose, bookmarks, outline, onGoToPage, onDeleteBookmark }: Props) {
  const gold = READER_COLORS.gold;

  const tabBtn = (tab: SidebarTab, label: string) => (
    <button
      onClick={() => onTabChange(tab)}
      className="flex-1 py-2 text-xs font-medium"
      style={{ color: activeTab === tab ? gold : 'rgba(203,185,138,0.6)', borderBottom: `2px solid ${activeTab === tab ? gold : 'transparent'}` }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="absolute top-0 right-0 h-full w-64 flex flex-col z-20 shadow-2xl"
      style={{
        background: READER_COLORS.chrome,
        borderLeft: '1px solid rgba(229,167,0,0.2)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease',
      }}
    >
      <div className="flex items-center px-3 pt-2">
        <div className="flex flex-1">
          {tabBtn('bookmarks', 'Marque-pages')}
          {tabBtn('toc', 'Sommaire')}
        </div>
        <button onClick={onClose} className="p-1.5 ml-1" style={{ color: 'rgba(203,185,138,0.7)' }} title="Fermer"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'bookmarks' ? (
          bookmarks.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(203,185,138,0.4)' }} />
              <p className="text-xs" style={{ color: 'rgba(203,185,138,0.6)' }}>Aucun marque-page.<br />Appuyez sur B pour en ajouter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks
                .slice()
                .sort((a, b) => a.page_number - b.page_number)
                .map((bm) => (
                  <div key={bm.id} className="flex items-center gap-2 px-2 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(229,167,0,0.15)' }}>
                    <button onClick={() => onGoToPage(bm.page_number)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                      <BookmarkCheck className="w-4 h-4 shrink-0" style={{ color: gold }} />
                      <span className="text-xs" style={{ color: '#cbb98a' }}>Page {bm.page_number}</span>
                    </button>
                    <button onClick={() => onDeleteBookmark(bm.id)} className="p-1 shrink-0" style={{ color: 'rgba(203,185,138,0.5)' }} title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          )
        ) : outline.length === 0 ? (
          <div className="text-center py-8">
            <List className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(203,185,138,0.4)' }} />
            <p className="text-xs" style={{ color: 'rgba(203,185,138,0.6)' }}>Aucune table des matières disponible pour ce livre.</p>
          </div>
        ) : (
          <OutlineNodes nodes={outline} depth={0} onGoToPage={onGoToPage} />
        )}
      </div>
    </div>
  );
}
