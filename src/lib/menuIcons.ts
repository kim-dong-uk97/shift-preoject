// @icons (at-icons) by Valentin Fossati — MIT License
// https://github.com/Voxybuns/at-icons  (Iconify 데이터에서 추출, viewBox 0 0 16 16)

export const menuIcons = {
  home: "<path fill=\"currentColor\" d=\"M7.316 1.14a1 1 0 0 1 1.368 0l6.394 5.995a.5.5 0 0 1-.342.865H13v7h-3v-3a2 2 0 0 0-4 0v3H3V8H1.264a.5.5 0 0 1-.341-.865z\"/>", // house
  agent: "<path fill=\"currentColor\" d=\"M8 0a1 1 0 0 1 .5 1.864V4H11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2.5V1.864A.998.998 0 0 1 8 0M5 10v2h6v-2zm.5-4a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3m5 0a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3m-9 1a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5m13 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5\"/>", // bot
  work: "<path fill=\"currentColor\" d=\"M3 15a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm9 0H4V5h8zm1-10a2 2 0 0 1 2 2v6a2 2 0 0 1-1.796 1.99L13 15zm-3-4a2 2 0 0 1 2 2v1h-2V3H6v1H4V3a2 2 0 0 1 2-2z\"/>", // briefcase
  learn: "<path fill=\"currentColor\" d=\"M1 4a7.05 7.05 0 0 1 7 0v4h1V3.527A7.06 7.06 0 0 1 15 4v9a7.06 7.06 0 0 0-6.795-.112L8 13a7.05 7.05 0 0 0-7 0z\"/>", // book-open
  make: "<g fill=\"currentColor\"><path d=\"M9.331 5.254q.771.642 1.414 1.414l-8.038 8.039a1 1 0 1 1-1.414-1.414z\"/><path d=\"M6.465 1c1.927 0 3.786.654 5.284 1.836l.544-.543a1 1 0 0 1 1.414 1.414l-.544.543A8.53 8.53 0 0 1 15 9.535V11h-1l-.169-.59A12 12 0 0 0 5.59 2.17L5 2V1z\"/></g>", // pickaxe
  logout: "<g fill=\"currentColor\"><path d=\"M4 1a1 1 0 0 1 0 2H3v10h1a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z\"/><path d=\"M9.293 3.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 1 1-1.414-1.414L11.586 9H6a1 1 0 0 1 0-2h5.586L9.293 4.707a1 1 0 0 1 0-1.414\"/></g>", // arrow-right-from-bracket
} as const;

export type MenuIconName = keyof typeof menuIcons;
