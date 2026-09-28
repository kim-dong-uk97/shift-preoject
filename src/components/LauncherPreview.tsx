"use client";

import { useEffect, useRef, useState } from "react";

// 목업 이미지 원본 크기와 주황 네모 안쪽 영역 (이미지 픽셀 기준, 테두리 제외)
const IMG_W = 768;
const IMG_H = 427;
const SLOT = { x: 106, y: 0, w: 541, h: 302 };

// 네모 안에서 사이트가 렌더링될 실제 해상도 (1920x1080 모니터 가정, 네모 비율 유지)
const VIEW_W = 1365;
const VIEW_H = Math.round((VIEW_W * SLOT.h) / SLOT.w);

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/** 런처 스크린샷을 화면에 꽉 채우고, 주황 네모 자리에 메인 화면을 끼워 보여줌 */
export default function LauncherPreview() {
  const slotRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / VIEW_W));
    ro.observe(slot);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      {/* 이미지 비율을 유지하며 화면에 최대한 크게 */}
      <div
        className="relative"
        style={{
          width: `min(100vw, calc(100vh * ${IMG_W} / ${IMG_H}))`,
          aspectRatio: `${IMG_W} / ${IMG_H}`,
          backgroundImage: "url(/preview/launcher-mockup.png)",
          backgroundSize: "100% 100%",
        }}
      >
        <div
          ref={slotRef}
          className="absolute overflow-hidden bg-black"
          style={{ left: pct(SLOT.x, IMG_W), top: pct(SLOT.y, IMG_H), width: pct(SLOT.w, IMG_W), height: pct(SLOT.h, IMG_H) }}
        >
          {scale > 0 && (
            <iframe
              src="/"
              title="aurora 메인 화면"
              width={VIEW_W}
              height={VIEW_H}
              className="absolute left-0 top-0 max-w-none origin-top-left border-0"
              style={{ transform: `scale(${scale})` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
