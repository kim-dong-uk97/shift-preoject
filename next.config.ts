import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 모드 좌측 하단 "N" 표시 숨김 (컴파일·런타임 오류 표시는 유지됨)
  devIndicators: false,
};

export default nextConfig;
