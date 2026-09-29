import type { CSSProperties } from 'react'
import type {
  LiquidGlassConfig,
  FrostedGlassConfig,
  GradientBlurConfig,
  MaterialScene,
} from './types'

// 场景材质预设：由 scene + 明暗 + iOS 主版本解析出透传给 JDIOSMaterialView 的入参。
// 参数唯一标准来自 ObjC JDGlassContainerView，已在 ios-material-scenes demo 验证。
/** @internal */
export interface MaterialPreset {
  liquidGlass?: LiquidGlassConfig
  frostedGlass?: FrostedGlassConfig
  gradientBlur?: GradientBlurConfig
  /** iOS<26 液态玻璃不可用时的实色回退底（其余情况不设） */
  fallbackStyle?: CSSProperties
}

// 液态玻璃可用的最低 iOS 主版本
const LIQUID_GLASS_MIN_IOS = 26

/**
 * 解析场景材质预设。
 * @param scene 材质场景
 * @param dark 是否暗色（已由 theme 解析）
 * @param iosMajor iOS 主版本号（非 iOS 或解析失败传 0；用于液态玻璃场景的 <26 回退）
 */
export function getPreset(
  scene: MaterialScene,
  dark: boolean,
  iosMajor: number
): MaterialPreset {
  const liquidGlassAvailable = iosMajor >= LIQUID_GLASS_MIN_IOS

  switch (scene) {
    // 浅色背景悬浮容器：regular 液态玻璃 + 交互高光；暗色不染色（对齐原生去遮罩 + darkTintAlpha=0）
    // darkMode 按主题传（true=暗/false=亮），原生据此写死明暗，消除首帧闪白
    case 'top-solid': {
      if (liquidGlassAvailable) {
        return {
          liquidGlass: {
            style: 'regular',
            interactive: true,
            darkMode: dark,
            ...(dark ? {} : { tintColor: 'rgba(255, 255, 255, 0.45)' }),
          },
        }
      }
      // <26 回退：实色底（light 白 / dark 深灰）
      return {
        fallbackStyle: { backgroundColor: dark ? '#2A2F36' : '#FFFFFF' },
      }
    }

    // 白色背景悬浮容器：参数同 top-solid，<26 透明回退（不铺底）
    case 'top-plain': {
      if (liquidGlassAvailable) {
        return {
          liquidGlass: {
            style: 'regular',
            interactive: true,
            darkMode: dark,
            ...(dark ? {} : { tintColor: 'rgba(255, 255, 255, 0.45)' }),
          },
        }
      }
      return {}
    }

    // 吸顶背板：厚毛玻璃（与 iOS 版本无关）
    case 'top-bar':
      return { frostedGlass: { style: dark ? 'thick-dark' : 'thick-light' } }

    // 浅色换肤：clear 液态玻璃 + 厚毛玻璃回退（<26 时液态玻璃自动不生效、毛玻璃接管）
    // 对应 ObjC blur=SystemThickMaterialLight、alpha=1.0（日夜同款）
    case 'promotion-fair':
      return {
        liquidGlass: { style: 'clear', interactive: false },
        frostedGlass: { style: 'thick-light', alpha: 1.0 },
      }

    // 深色换肤：clear 液态玻璃 + 超薄毛玻璃回退
    // 对应 ObjC blur=SystemUltraThinMaterialLight、alpha=1.0（日夜同款）
    case 'promotion-deep':
      return {
        liquidGlass: { style: 'clear', interactive: false },
        frostedGlass: { style: 'ultra-thin-light', alpha: 1.0 },
      }

    // 沉浸式：强制暗色 regular 液态玻璃 + 交互高光；
    // <26 回退常规暗毛玻璃（对应 ObjC blur=SystemMaterialDark、alpha=1.0）
    case 'immersive': {
      if (liquidGlassAvailable) {
        return {
          liquidGlass: {
            style: 'regular',
            darkMode: true,
            interactive: true,
            tintColor: 'rgba(0, 0, 0, 0.75)',
          },
        }
      }
      return { frostedGlass: { style: 'regular-dark', alpha: 1.0 } }
    }

    // 底部导航背板：渐变可变模糊（与 iOS 版本无关）；rgba 逗号后须带空格
    case 'bottom-bar':
      return {
        gradientBlur: {
          minBlur: 0.5,
          maxBlur: 0.8,
          overlayAlpha: 0.9,
          overlayColor: dark ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
        },
      }

    default:
      return {}
  }
}

/**
 * 解析场景默认圆角（业务未传 borderRadius 时使用）。
 * 对齐 ObjC JDGlassContainerView 的 effectiveCornerRadius：
 * - 背板（top-bar / bottom-bar）恒 0；
 * - top 容器 iOS≥26 用玻璃时 12，<26 回退 8；
 * - top-plain 透明回退时 <26 归 0（透明无背景，圆角无意义）。
 * @param scene 材质场景
 * @param iosMajor iOS 主版本号（<26 走回退圆角）
 */
export function getCornerRadius(
  scene: MaterialScene,
  iosMajor: number
): number {
  const liquidGlassAvailable = iosMajor >= LIQUID_GLASS_MIN_IOS
  switch (scene) {
    // 背板：圆角恒 0
    case 'top-bar':
    case 'bottom-bar':
      return 0
    // 透明回退：≥26 为 12，<26 归 0
    case 'top-plain':
      return liquidGlassAvailable ? 12 : 0
    // 其余 top 容器：≥26 为 12，<26 回退 8
    case 'top-solid':
    case 'promotion-fair':
    case 'promotion-deep':
    case 'immersive':
      return liquidGlassAvailable ? 12 : 8
    default:
      return 0
  }
}

// 非 iOS 平台（安卓 / 鸿蒙 / 小程序 / h5）毛玻璃预设，透传给 JDFrostedGlassView。
// 参数唯一标准来自安卓 GlassStyle 表（非 iOS 专用，与 iOS 侧 getPreset 独立）。

/**
 * 非 iOS（安卓 / 鸿蒙）场景圆角。安卓与鸿蒙圆角完全一致，共用此函数（设计已对齐）：
 * - 悬浮容器（top-solid / top-plain / promotion-fair / promotion-deep / immersive）：8
 * - 背板（top-bar / bottom-bar）：0
 * 日夜一致、与平台/版本无关。iOS 圆角另走 getCornerRadius（按版本回退，规则不同）。
 * @param scene 材质场景
 */
export function getNonIOSCornerRadius(scene: MaterialScene): number {
  switch (scene) {
    // 背板：圆角 0
    case 'top-bar':
    case 'bottom-bar':
      return 0
    // 悬浮容器：圆角 8
    case 'top-solid':
    case 'top-plain':
    case 'promotion-fair':
    case 'promotion-deep':
    case 'immersive':
      return 8
    default:
      return 0
  }
}

/** @internal */
export interface FrostedPreset {
  /** 模糊半径 px */
  blurRadius: number
  /** 圆角 px（安卓/鸿蒙共用 getNonIOSCornerRadius，与 iOS getCornerRadius 规则不同） */
  borderRadius: number
  /** 叠加色（含 alpha），未设即不叠加背景色 */
  tintColor?: string
}

// 安卓默认叠加色（未显式指定 overlay 时按明暗取）
const OVERLAY_LIGHT = '255, 255, 255' // 0xFFFFFF
const OVERLAY_DARK = '31, 34, 38' // 0x1F2226

/**
 * 解析非 iOS 场景毛玻璃预设。
 * 对齐安卓 GlassStyle：blurRadius + borderRadius + 叠加色（tintColor = rgba(overlayRGB, alpha%)）。
 * 圆角为安卓专用：每场景定值、日夜一致、与 iOS 版本无关（bottom-bar 为 0，其余 12），
 * 不复用 iOS 的 getCornerRadius（后者按版本回退且 top-bar 恒 0，规则不同）。
 * @param scene 材质场景
 * @param dark 是否暗色（已由 theme 解析）
 */
export function getFrostedPreset(
  scene: MaterialScene,
  dark: boolean
): FrostedPreset {
  const borderRadius = getNonIOSCornerRadius(scene)
  switch (scene) {
    // 浅色背景：blur40，实色叠加（alpha 100%）——日 #FFFFFF / 夜 #2A2F36
    case 'top-solid':
      return {
        blurRadius: 40,
        borderRadius,
        tintColor: dark ? 'rgba(42, 47, 54, 1)' : 'rgba(255, 255, 255, 1)',
      }

    // 白色背景：透明容器，无模糊无填充（三端一致，仅 iOS≥26 走液态玻璃）
    case 'top-plain':
      return { blurRadius: 0, borderRadius }

    // 吸顶背板：blur40，alpha 90%，默认叠加色随明暗
    case 'top-bar':
      return {
        blurRadius: 40,
        borderRadius,
        tintColor: dark
          ? `rgba(${OVERLAY_DARK}, 0.9)`
          : `rgba(${OVERLAY_LIGHT}, 0.9)`,
      }

    // 浅色换肤：blur40，alpha 85%，日夜都用浅色叠加
    case 'promotion-fair':
      return {
        blurRadius: 40,
        borderRadius,
        tintColor: `rgba(${OVERLAY_LIGHT}, 0.85)`,
      }

    // 深色换肤：blur40，alpha 20%，日夜都用浅色叠加
    case 'promotion-deep':
      return {
        blurRadius: 40,
        borderRadius,
        tintColor: `rgba(${OVERLAY_LIGHT}, 0.2)`,
      }

    // 沉浸式：blur40，alpha 40%，日夜都用深色叠加
    case 'immersive':
      return {
        blurRadius: 40,
        borderRadius,
        tintColor: `rgba(${OVERLAY_DARK}, 0.4)`,
      }

    // 底部导航背板：blur50，alpha 80%，默认叠加色随明暗
    case 'bottom-bar':
      return {
        blurRadius: 50,
        borderRadius,
        tintColor: dark
          ? `rgba(${OVERLAY_DARK}, 0.8)`
          : `rgba(${OVERLAY_LIGHT}, 0.8)`,
      }

    default:
      return { blurRadius: 40, borderRadius }
  }
}

// 鸿蒙平台毛玻璃预设，透传给鸿蒙原生组件（blurScale 体系，非 backdropFilter）。
// 参数唯一标准来自鸿蒙设计规范表（与 Android 的 getFrostedPreset 独立）。
/** @internal */
export interface HarmonyPreset {
  /** 模糊强度比例 [0,1] */
  blurScale: number
  /** 圆角 px */
  borderRadius: number
  /** 颜色模式枚举（场景决定，非简单跟随系统）：鸿蒙主要靠此控制颜色 */
  colorMode: 'light' | 'dark'
  /** 叠加色（top-solid 实色底 / top-bar 半透白黑蒙层），落 CSS style.backgroundColor */
  overlayColor?: string
  /** 渐变蒙层（仅 bottom-bar），落 CSS style.background 的 linear-gradient */
  backgroundGradient?: string
  /** 阴影（仅 bottom-bar），落 CSS style.boxShadow */
  boxShadow?: string
}

// bottom-bar 底导渐变蒙层（对齐鸿蒙 .ets linearGradient，direction Bottom，7 色标）。
// light 白 / dark 黑，alpha 由 80% 渐隐到 30%。
function getBottomBarGradient(dark: boolean): string {
  const rgb = dark ? '0, 0, 0' : '255, 255, 255'
  return (
    `linear-gradient(to bottom, ` +
    `rgba(${rgb}, 0.8) 0%, ` +
    `rgba(${rgb}, 0.8) 56%, ` +
    `rgba(${rgb}, 0.78) 66%, ` +
    `rgba(${rgb}, 0.72) 76%, ` +
    `rgba(${rgb}, 0.62) 86%, ` +
    `rgba(${rgb}, 0.49) 94%, ` +
    `rgba(${rgb}, 0.3) 100%)`
  )
}

/**
 * 解析鸿蒙场景预设。blurScale / borderRadius / colorMode 透传鸿蒙原生 prop；
 * overlayColor 落 CSS style.backgroundColor（非原生属性）。
 * colorMode 由「场景」决定，而非简单跟随系统：
 * - promotion-fair / promotion-deep 恒 light；immersive 恒 dark；
 * - 其余场景（top-solid / top-plain / top-bar / bottom-bar）跟随系统明暗。
 * overlayColor 仅 top-solid 有（随明暗），其余场景颜色靠 colorMode 控制。
 * @param scene 材质场景
 * @param dark 是否暗色（已由 theme 解析，用于跟随系统的场景）
 */
export function getHarmonyPreset(
  scene: MaterialScene,
  dark: boolean
): HarmonyPreset {
  const followSystem: 'light' | 'dark' = dark ? 'dark' : 'light'
  const borderRadius = getNonIOSCornerRadius(scene)
  switch (scene) {
    // 浅色背景：blurScale 1.0，colorMode 跟随系统，实色叠加（light #FFFFFF / dark #2A2F36）
    case 'top-solid':
      return {
        blurScale: 1.0,
        borderRadius,
        colorMode: followSystem,
        overlayColor: dark ? '#2A2F36' : '#FFFFFF',
      }

    // 白色背景：blurScale 0，colorMode 跟随系统，无叠加色
    case 'top-plain':
      return { blurScale: 0.0, borderRadius, colorMode: followSystem }

    // 吸顶背板：blurScale 0.9，圆角 0，半透蒙层（对齐 .ets：light 0xCCFFFFFF=α0.8 / dark 0x4D000000=α0.3）
    case 'top-bar':
      return {
        blurScale: 0.9,
        borderRadius,
        colorMode: followSystem,
        overlayColor: dark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
      }

    // 浅色换肤：blurScale 0.85，colorMode 恒 light，无叠加色
    case 'promotion-fair':
      return { blurScale: 0.85, borderRadius, colorMode: 'light' }

    // 深色换肤：blurScale 0.2，colorMode 恒 light，无叠加色
    case 'promotion-deep':
      return { blurScale: 0.2, borderRadius, colorMode: 'light' }

    // 沉浸式：blurScale 0.4，colorMode 恒 dark，无叠加色
    case 'immersive':
      return { blurScale: 0.4, borderRadius, colorMode: 'dark' }

    // 底部导航背板：blurScale 0.2，圆角 0，线性渐变蒙层 + 阴影（对齐 .ets jdBottomBar）
    case 'bottom-bar':
      return {
        blurScale: 0.2,
        borderRadius,
        colorMode: followSystem,
        backgroundGradient: getBottomBarGradient(dark),
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
      }

    default:
      return { blurScale: 0, borderRadius, colorMode: followSystem }
  }
}

// ===== Web（Taro H5 / 小程序）场景预设 =====
// Taro demo 端不接原生材质能力，直接复用 H5 的 CSS 毛玻璃实现，
// 参数与 H5 端 scene-presets.ts 保持一致（同属 Joyspace 设计规范）。
// 注意：Taro 发布产物只收录 *.taro.* 文件，故这套 web 预设内联在本文件，
// 而不是从 scene-presets.ts 引入（该文件不会进入 taro 产物）。

/** @internal */
export interface H5FrostedPreset {
  /** 模糊半径（数值，消费侧拼为 blur(NPX)，大写 PX 防 postcss px→vw 转换） */
  blurRadius: number
  /** 圆角 px */
  borderRadius: number
  /** 叠加色（含 alpha），未设即不叠加背景色 */
  tintColor?: string
  /** 多层 inset 内发光阴影（对齐 H5 毛玻璃规范，换肤/透明场景不设） */
  boxShadow?: string
}

// H5 毛玻璃规范内发光阴影（对齐 Joyspace 设计稿，PX 大写防 postcss 转换）
const H5_SHADOW_LIGHT =
  '0 2PX 4PX rgba(0, 0, 0, 0.06), inset -0.5PX -0.5PX 0.5PX rgba(255, 255, 255, 0.4), inset 0.5PX 0.5PX 0.5PX #fff, inset 1PX 1PX 5PX rgba(45, 45, 45, 0.04)'
const H5_SHADOW_DARK =
  '0 2PX 4PX rgba(0,0,0,0.06), inset -0.5PX -0.5PX 0.5PX rgba(255,255,255,0.1), inset 0.5PX 0.5PX 0.5PX rgba(255,255,255,0.4), inset 1PX 1PX 5PX rgba(45,45,45,0.08)'

/**
 * 解析 web 端场景毛玻璃预设（与 H5 端 getH5FrostedPreset 完全一致）。
 * - blurRadius 统一 3（消费侧拼 PX 大写单位，防 px→vw 转换导致不同屏幕变形）
 * - 纯白/暗黑/沉浸式场景补 boxShadow 内发光；换肤/透明场景无阴影
 * @param scene 材质场景
 * @param dark 是否暗色（已由 theme 解析）
 */
export function getH5FrostedPreset(
  scene: MaterialScene,
  dark: boolean
): H5FrostedPreset {
  const borderRadius = getNonIOSCornerRadius(scene)
  switch (scene) {
    // 纯白（FG-Light）/ 暗黑（FG-Dark）：blur3 + 内发光
    case 'top-solid':
      return {
        blurRadius: 3,
        borderRadius,
        tintColor: dark ? 'rgba(20, 23, 26, 0.6)' : 'rgba(255, 255, 255, 0.65)',
        boxShadow: dark ? H5_SHADOW_DARK : H5_SHADOW_LIGHT,
      }

    // 白色背景：透明容器，无模糊无填充
    case 'top-plain':
      return { blurRadius: 0, borderRadius }

    // 吸顶背板：blur10，纯色叠加，无内发光高光，圆角 0
    case 'top-bar':
      return {
        blurRadius: 10,
        borderRadius: 0,
        tintColor: dark ? 'rgba(20, 23, 26, 0.85)' : 'rgba(255, 255, 255, 0.9)',
      }

    // 浅换肤（FG-Skin-L）：blur3，无内发光
    case 'promotion-fair':
      return {
        blurRadius: 3,
        borderRadius,
        tintColor: 'rgba(255, 255, 255, 0.85)',
      }

    // 深换肤（FG-Skin-D）：blur3，无内发光
    case 'promotion-deep':
      return {
        blurRadius: 3,
        borderRadius,
        tintColor: 'rgba(255, 255, 255, 0.2)',
      }

    // 沉浸式（FG-Dark，强制暗色）：blur3 + 内发光
    case 'immersive':
      return {
        blurRadius: 3,
        borderRadius,
        tintColor: 'rgba(20, 23, 26, 0.6)',
        boxShadow: H5_SHADOW_DARK,
      }

    // 底部导航背板：blur3，alpha 80%，随明暗叠加色，无内发光
    case 'bottom-bar':
      return {
        blurRadius: 3,
        borderRadius,
        tintColor: dark ? 'rgba(20, 23, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      }

    default:
      return { blurRadius: 3, borderRadius }
  }
}

/**
 * scene → web 端毛玻璃材质 className（对齐通天塔规范类名，与 H5 端一致）。
 * 暗色场景（immersive）恒返回 FG-Dark-PX；
 * top-solid 跟随 dark 参数切换 Light/Dark；
 * top-plain 为高透（FG-Clear-PX）；
 * top-bar / bottom-bar 无对应规范类名，返回 null 由 inline style 兜底。
 * @param scene 材质场景
 * @param dark 是否暗色（已由 theme 解析）
 */
export function getH5MaterialClassName(
  scene: MaterialScene,
  dark: boolean
): string | null {
  switch (scene) {
    case 'top-solid':
      return dark ? 'FG-Dark-PX' : 'FG-Light-PX'
    case 'top-plain':
      return 'FG-Clear-PX'
    case 'immersive':
      return 'FG-Dark-PX'
    case 'promotion-fair':
      return 'FG-Skin-L-PX'
    case 'promotion-deep':
      return 'FG-Skin-D-PX'
    default:
      return null
  }
}
