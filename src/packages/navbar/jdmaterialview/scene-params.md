# JDMaterialView 三端场景参数表

> 来源：`scene-presets.ts`（本目录）。7 个场景 = `top-solid` / `top-plain` / `top-bar` / `promotion-fair` / `promotion-deep` / `immersive` / `bottom-bar`。
> iOS / 安卓 / 鸿蒙**三端各一套独立参数**，互不复用。

## 叠加色落点差异（三端不同，最易错）

| 平台 | 模糊 | 叠加色落点 | 圆角 |
| --- | --- | --- | --- |
| **iOS** | JDIOSMaterialView 原生（liquidGlass / frostedGlass / gradientBlur） | 原生（liquidGlass tint 等），无 CSS 叠加色 | 原生按 iOS 版本回退 |
| **安卓** | CSS `backdropFilter: blur(px)` | `tintColor` → **`overlayColor` 原生属性**（透传） | CSS `borderRadius` |
| **鸿蒙** | 原生 `blurScale` prop | `overlayColor` → **CSS `style.backgroundColor`** | 原生 `borderRadius` prop |

**业务圆角优先**：任一端业务在 `style` 里显式给 `borderRadius`，都优先于场景预设。

---

## iOS（`getPreset` + `getCornerRadius`）

液态玻璃（liquidGlass）需 **iOS ≥ 26**；`< 26` 走 frostedGlass / gradientBlur / 实色回退降级。

| scene | iOS ≥ 26 | iOS < 26 回退 | 圆角 ≥26 / <26 |
| --- | --- | --- | --- |
| top-solid | liquidGlass `regular`, interactive, tint 日 `rgba(255,255,255,.45)` / 夜 `rgba(0,0,0,.75)`, showTintOverlay=夜 | 实色底：日 `#FFFFFF` / 夜 `#2A2F36` | 12 / 8 |
| top-plain | 同 top-solid 的 liquidGlass | `{}` 纯透明（不铺底） | 12 / 0 |
| top-bar | frostedGlass 日 `thick-light` / 夜 `thick-dark`（与版本无关） | 同左 | 0 / 0 |
| promotion-fair | liquidGlass `clear` 非交互 + frostedGlass `thick-light` α0.85 回退 | frostedGlass 接管（α0.85） | 12 / 8 |
| promotion-deep | liquidGlass `clear` 非交互 + frostedGlass `thick-light` α0.35 回退 | frostedGlass 接管（α0.35） | 12 / 8 |
| immersive | liquidGlass `regular`, forceDark, interactive, tint `rgba(0,0,0,.75)` | frostedGlass `regular-dark` α0.4 | 12 / 8 |
| bottom-bar | gradientBlur min0.5 / max0.8 / overlayAlpha0.9 / overlayColor 日 `rgba(255,255,255,1)` 夜 `rgba(0,0,0,1)`（与版本无关） | 同左 | 0 / 0 |

---

## 安卓 Android（`getFrostedPreset`）

`blurRadius` → CSS `backdropFilter`；`tintColor` → **`overlayColor` 原生属性**；圆角**日夜一致、与 iOS 版本无关**。
圆角与鸿蒙完全一致，共用 `getNonIOSCornerRadius`（悬浮容器 8、背板 0）。
叠加色常量：`OVERLAY_LIGHT = 255,255,255`、`OVERLAY_DARK = 31,34,38`。

| scene | blurRadius | 圆角 | tintColor（→ overlayColor 属性） |
| --- | --- | --- | --- |
| top-solid | 40 | 8 | 日 `rgba(255,255,255,1)` / 夜 `rgba(42,47,54,1)`（实色 α100%） |
| top-plain | 40 | 8 | 无（α0，仅模糊不染色） |
| top-bar | 40 | 0 | 日 `rgba(255,255,255,.9)` / 夜 `rgba(31,34,38,.9)` |
| promotion-fair | 40 | 8 | `rgba(255,255,255,.85)`（日夜恒浅） |
| promotion-deep | 40 | 8 | `rgba(255,255,255,.2)`（日夜恒浅） |
| immersive | 40 | 8 | `rgba(31,34,38,.4)`（日夜恒深） |
| bottom-bar | 50 | 0 | 日 `rgba(255,255,255,.8)` / 夜 `rgba(31,34,38,.8)` |

---

## 鸿蒙 Harmony（`getHarmonyPreset`）

`blurScale` / `borderRadius` / `colorMode` → 原生 prop；`overlayColor` → CSS `style.backgroundColor`。
圆角与安卓完全一致，共用 `getNonIOSCornerRadius`（悬浮容器 8、背板 0）。
**colorMode 由场景决定**（非简单跟随系统）：promotion-fair/deep 恒 `light`、immersive 恒 `dark`、其余跟随系统。

| scene | blurScale | 圆角 | colorMode | overlayColor（→ backgroundColor） |
| --- | --- | --- | --- | --- |
| top-solid | 1.0 | 8 | 跟随系统 | 日 `#FFFFFF` / 夜 `#2A2F36` |
| top-plain | 0.0 | 8 | 跟随系统 | 无 |
| top-bar | 0.9 | 0 | 跟随系统 | 无 |
| promotion-fair | 0.85 | 8 | 恒 `light` | 无 |
| promotion-deep | 0.2 | 8 | 恒 `light` | 无 |
| immersive | 0.4 | 8 | 恒 `dark` | 无 |
| bottom-bar | 0.2 | 0 | 跟随系统 | 无 |

---

## H5（`getH5FrostedPreset`）

`blurRadius` → CSS `backdropFilter: blur(NPX)`；`tintColor` → CSS `style.backgroundColor`；`boxShadow` → CSS `style.boxShadow`（多层内发光拟态）。
对齐 Joyspace 设计稿规范：统一使用 3PX 微模糊 + 多层高光/阴影。

| scene | blurRadius | 圆角 | tintColor（→ backgroundColor） | boxShadow |
| --- | --- | --- | --- | --- |
| top-solid | 3 | 8 | 日 `rgba(255,255,255,0.65)` / 夜 `rgba(31,34,38,0.6)` | SHADOW_LIGHT / SHADOW_DARK |
| top-plain | 0 | 8 | 无 | 无 |
| top-bar | 3 | 0 | 日 `rgba(255,255,255,0.65)` / 夜 `rgba(31,34,38,0.6)` | SHADOW_LIGHT / SHADOW_DARK |
| promotion-fair | 3 | 8 | `rgba(255,255,255,0.85)` | 无 |
| promotion-deep | 3 | 8 | `rgba(255,255,255,0.2)` | 无 |
| immersive | 3 | 8 | `rgba(31,34,38,0.6)` | SHADOW_DARK |
| bottom-bar | 3 | 0 | 日 `rgba(255,255,255,0.8)` / 夜 `rgba(31,34,38,0.8)` | 无 |

---

## top-plain 的 `alpha=0` 语义（跨端不同）

- **安卓** `GlassStyle(40,12,12,0,0)`：alpha=0 是**叠加色透明**，仍保留 40 模糊 —— 「有毛玻璃、不染色」，非整体消失。
- **iOS < 26** top-plain：`JDGlassBackgroundTypeTransparent` **连模糊层都不建**，纯透明、圆角归 0。
- 两端「top-plain」语义不同，勿混为一谈。
