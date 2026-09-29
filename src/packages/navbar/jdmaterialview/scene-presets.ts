import type { MaterialScene } from './types'

// 非 iOS 场景圆角（悬浮容器 8、背板 0）
export function getNonIOSCornerRadius(scene: MaterialScene): number {
  switch (scene) {
    case 'top-bar':
    case 'bottom-bar':
      return 0
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

export function getCornerRadius(
  scene: MaterialScene,
  _iosMajor?: number
): number {
  return getNonIOSCornerRadius(scene)
}

/** @internal */
export interface FrostedPreset {
  /** 模糊半径（数值，消费侧拼为 blur(NPX)，大写 PX 防 postcss px→vw 转换） */
  blurRadius: number
  /** 圆角 px */
  borderRadius: number
  /** 叠加色（含 alpha），未设即不叠加背景色 */
  tintColor?: string
  /** 多层 inset 内发光阴影（对齐 H5 毛玻璃规范，换肤/透明场景不设） */
  boxShadow?: string
}

export type H5FrostedPreset = FrostedPreset

// H5 毛玻璃规范内发光阴影（对齐 Joyspace 设计稿，PX 大写防 postcss 转换）
const SHADOW_LIGHT =
  '0 2PX 4PX rgba(0, 0, 0, 0.06), inset -0.5PX -0.5PX 0.5PX rgba(255, 255, 255, 0.4), inset 0.5PX 0.5PX 0.5PX #fff, inset 1PX 1PX 5PX rgba(45, 45, 45, 0.04)'
const SHADOW_DARK =
  '0 2PX 4PX rgba(0,0,0,0.06), inset -0.5PX -0.5PX 0.5PX rgba(255,255,255,0.1), inset 0.5PX 0.5PX 0.5PX rgba(255,255,255,0.4), inset 1PX 1PX 5PX rgba(45,45,45,0.08)'
const SHADOW_CLEAR =
  '0 2PX 4PX rgba(0,0,0,0.06), inset -0.5PX -0.5PX 0.5PX rgba(255,255,255,0.4), inset 0.5PX 0.5PX 0.5PX rgba(255,255,255,0.6), inset 1PX 1PX 5PX rgba(45,45,45,0.08)'

/**
 * 解析 H5 场景毛玻璃预设。
 * 对齐 H5 毛玻璃规范（Joyspace 设计稿）：
 * - blurRadius 统一 3（消费侧拼 PX 大写单位，防 postcss px→vw 转换导致不同屏幕效果变形）
 * - 纯白/暗黑/沉浸式场景补 boxShadow 内发光；换肤/透明场景无阴影
 * @param scene 材质场景
 * @param dark 是否暗色（已由 theme 解析）
 */
export function getFrostedPreset(
  scene: MaterialScene,
  dark: boolean
): FrostedPreset {
  const borderRadius = getNonIOSCornerRadius(scene)
  switch (scene) {
    // 纯白（FG-Light）/ 暗黑（FG-Dark）：blur3 + 内发光
    case 'top-solid':
      return {
        blurRadius: 3,
        borderRadius,
        tintColor: dark ? 'rgba(20, 23, 26, 0.6)' : 'rgba(255, 255, 255, 0.65)',
        boxShadow: dark ? SHADOW_DARK : SHADOW_LIGHT,
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
        boxShadow: SHADOW_DARK,
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

export const getH5FrostedPreset = getFrostedPreset
export const getPreset = getFrostedPreset

/**
 * scene → H5 毛玻璃材质 className（对齐通天塔规范类名）。
 * 暗色场景（immersive）恒返回 FG-Dark-PX；
 * top-solid 跟随 dark 参数切换 Light/Dark；
 * top-plain 为高透（FG-Clear-PX）；
 * top-bar / bottom-bar 无对应规范类名，返回 null 由 inline style 兜底。
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
