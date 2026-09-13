# R / Pixel Sky

像素、星空主題的靜態個人網站。開場動畫、主頁導航、主題切換、個人介紹與 Projects 全部收在同一個 HTML，不含部署或後端。

## 本機預覽

使用 Node.js 20 以上，不需要安裝套件：

```sh
node scripts/serve.mjs
```

開啟 http://127.0.0.1:4173/ ，或使用 VS Code Live Server。完整動畫需以 HTTP 載入 ES modules；直接雙擊 HTML 時，仍可看到主頁基本版面，但瀏覽器可能阻擋 JavaScript 模組。

## 開場流程

整段約 12 秒，自動播放一次：

1. 像素 `Hello World` 在星空中由擾動字元顯現。
2. 鏡頭向上移動；遠方星點與近處像素雲以不同速度向下滑過。
3. `LEARN / CREATE / EXPLORE / REPEAT` 以不同大小、左右錯落的位置形成星座構圖。
4. 鏡頭再次上升，穿過較大的前景雲層，逐漸淡入主頁。

目前不再停留於大 R 或等待按鍵。右下角「略過開場」可直接進入。主題偏好會儲存在本機，重新整理後開場也沿用該主題。

背景分頁會暫停開場。啟用系統「減少動態效果」或動畫載入失敗時直接顯示主頁；主頁預設在 HTML 中可見，不會因 JavaScript 失敗而整頁隱藏。

## 色票

統一由 `css/style.css` 的 CSS 變數控制，Canvas 同樣讀取這些變數。兩套主題使用相同構圖、字形與雲朵，只替換色彩角色。

| 角色 | Light | Dark |
| --- | --- | --- |
| background | `#F5F1E8` | `#161819` |
| surface | `#FCFAF5` | `#202326` |
| text | `#262626` | `#E9E6DE` |
| text-secondary | `#6C6B67` | `#AAA8A2` |
| accent | `#547792` | `#6F9DBD` |
| accent-hover | `#40657F` | `#8BB4CF` |
| border | `#DDD8CD` | `#34383B` |

## 主頁

R 標誌獨立留在左上角；導航列靠右，寬度固定為頁面的 65%，左端以階梯狀像素曲線收尾。背景直接承載個人介紹，沒有內容面板或外框。

個人介紹使用已提供的 Yan-Hua Chen、元智大學資訊工程學系與 GitHub 帳號 Raxter62。可直接在 `index.html` 修改文字；像素姓名圖形在 `assets/profile-name.svg`，若更名也需同步修改該圖形及標題的無障礙文字。

導航列桌面高度為 76px，字級 17px；手機高度 64px，字級 15px。窄螢幕以「作品」呈現 Projects 入口，點擊會移到本頁 `#projects`。頁面順序是個人介紹、Projects、`© 2026 Raxter62` 頁尾。

## Projects

四個專案直接寫在 `index.html`，以水平滑動的立體卡片展示，標題使用藍底，沿用兩套主題色票。支援觸控、觸控板橫向滑動、滑鼠拖曳、左右按鈕、圓點選擇，以及聚焦卡片區後按方向鍵 / Home / End。啟用減少動態效果時取消立體變形與平滑移動；停用 JavaScript 時仍可原生水平捲動並閱讀所有卡片。

輪播首尾相接：Fitconnect 的左側為 Sky qr，Sky qr 的右側為 Fitconnect，左右按鈕永遠可切換。桌面以完整的左、中、右三張卡片排列，輪播舞台延伸到文字內容欄之外，保留畫面邊距且不裁切網站。手機保留可閱讀的中央卡片，將兩張完整的鄰接縮圖排列於下方；點選縮圖可切換。

專案文案與完成清單使用英文，勾號代表完成、空心圓代表待辦。實作百分比按目前清單的完成項目數計算，各項等權重，並非工程工時估算：Fitconnect 3/6 = 50%、BufferOverdrive 3/5 = 60%、Raxter62.github.io 3/5 = 60%、Sky qr 0/1 = 0%。修改清單時同步更新百分比文字、進度條寬度及 ARIA 數值。

Fitconnect 的 Website 連到 `https://fitconnect.raxter9501.com/`，其餘網站入口顯示沒有連結的箭頭。前三項保留 GitHub repository 連結；Sky qr 目前為 Concept development。

直接開啟 `#home`、`#about` 或 `#projects` 會顯示對應內容，不重播開場。無這些 hash 的首頁仍會播放開場。舊的 `projects.html` 已移除；本機預覽伺服器會將舊路徑轉到 `/#projects`。

## 檔案

- `index.html`：開場 Canvas、導航、主題按鈕、個人介紹、四個專案與頁尾。
- `css/style.css`：兩套完整色票及響應式版面。
- `css/projects.css`：專案卡片、藍底標題、像素進度條與立體滑動版面。
- `js/main.js`：文字時間軸、自動進入、略過、主題與無障礙狀態。
- `js/projects.js`：卡片捲動、立體角度、拖曳、鍵盤操作與位置指示。
- `js/sky.js`：星空、像素雲、分層鏡頭移動、單字構圖與淡出。
- `js/pixels.js`：本地 5 × 7 字形與像素文字繪製。
- `js/vendor/`：本地 Anime.js 4.4.0 及 MIT 授權。
- `scripts/serve.mjs`：本機靜態預覽。

調整開場節奏：編輯 `js/main.js` 的文字時間點，以及 `js/sky.js` 的鏡頭區間與 `DURATION`。單字位置位於 `js/sky.js` 的 `positions`，雲的位置位於 `clouds`。

## 驗證

使用 Chrome / Playwright 驗證淺色與深色完整流程、自動進入、指定色碼、主題記憶、手機觸控略過、320–1440px 版型、減少動態效果及 JavaScript / 套件載入失敗時的基本頁面。沒有未捕捉的 JavaScript 錯誤。
