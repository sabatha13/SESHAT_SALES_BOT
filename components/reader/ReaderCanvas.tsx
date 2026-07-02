'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { THEME_STYLES } from './types';
import type { Theme } from './types';

interface Props {
  getPage: (n: number) => Promise<any | null>;
  prefetch: (n: number) => void;
  currentPage: number;
  scale: number;
  theme: Theme;
  userEmail: string;
  isSubscriptionAccess: boolean;
  loading: boolean;
  onTouchStart?: (e: ReactTouchEvent) => void;
  onTouchEnd?: (e: ReactTouchEvent) => void;
}

export default function ReaderCanvas({
  getPage,
  prefetch,
  currentPage,
  scale,
  theme,
  userEmail,
  isSubscriptionAccess,
  loading,
  onTouchStart,
  onTouchEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [rendering, setRendering] = useState(true);

  const drawWatermark = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = '#D4AF37';
      ctx.font = `${Math.max(12, w * 0.018)}px serif`;
      ctx.textAlign = 'center';
      const angle = -30 * (Math.PI / 180);
      const step = 200;
      const line2 = isSubscriptionAccess ? 'Lecture en abonnement' : 'Usage personnel uniquement';
      const date = new Date().toLocaleDateString('fr-FR');
      for (let x = -step; x < w + step; x += step) {
        for (let y = 0; y < h + step; y += step) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillText(userEmail, 0, 0);
          ctx.fillText(line2, 0, 20);
          ctx.fillText(date, 0, 40);
          ctx.restore();
        }
      }
      ctx.restore();
    },
    [userEmail, isSubscriptionAccess],
  );

  const renderPage = useCallback(async () => {
    const page = await getPage(currentPage);
    if (!page || !canvasRef.current) return;
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        /* annulation silencieuse */
      }
      renderTaskRef.current = null;
    }
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    setRendering(true);
    try {
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
      drawWatermark(ctx, canvas.width, canvas.height);
      setRendering(false);
      prefetch(currentPage + 1);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') setRendering(false);
    }
  }, [getPage, currentPage, scale, drawWatermark, prefetch]);

  useEffect(() => {
    if (!loading) renderPage();
  }, [loading, renderPage]);

  return (
    <div
      className="flex-1 overflow-auto flex items-start justify-center p-4 md:p-8"
      style={{ background: THEME_STYLES[theme].readingBg }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {loading ? (
        <div className="w-full max-w-[600px] mx-auto animate-pulse">
          <div
            className="rounded-lg"
            style={{ width: '100%', aspectRatio: '1 / 1.414', background: 'rgba(229,167,0,0.08)', border: '1px solid rgba(229,167,0,0.12)' }}
          />
        </div>
      ) : (
        <div className="relative shadow-2xl">
          <canvas
            ref={canvasRef}
            className="block max-w-full"
            style={{
              pointerEvents: 'none',
              opacity: rendering ? 0 : 1,
              transition: 'opacity 150ms ease',
              filter: THEME_STYLES[theme].canvasFilter || undefined,
            }}
          />
        </div>
      )}
    </div>
  );
}
