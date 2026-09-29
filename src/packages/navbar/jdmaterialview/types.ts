import { BasicComponent } from '@/utils/typings'

/** 材质场景（7 种，业务按场景选用）：
 * - top-solid    浅色背景悬浮容器
 * - top-plain    白色背景悬浮容器
 * - top-bar      吸顶背板
 * - promotion-fair  浅色换肤悬浮容器
 * - promotion-deep  深色换肤悬浮容器
 * - immersive    沉浸式悬浮容器
 * - bottom-bar   底部导航背板
 */
export type MaterialScene =
  | 'top-solid'
  | 'top-plain'
  | 'top-bar'
  | 'promotion-fair'
  | 'promotion-deep'
  | 'immersive'
  | 'bottom-bar'

/**
 * JDMaterialView 属性
 */
export interface JDMaterialViewProps extends BasicComponent {
  /** 材质场景，7 种见 MaterialScene */
  scene: MaterialScene
  /** 模糊源 targetId，与 JDMaterialsBlurTarget 的 blurId 对应 */
  targetId: string
  /** 暗色模式开关（可选，未设置时自动跟随系统主题） */
  darkMode?: boolean
}

// ===== 以下为组件内部实现类型，@internal 标记 + stripInternal 使其不进对外 .d.ts =====

/**
 * liquidGlass 液态玻璃配置（内部）
 * @internal
 */
export interface LiquidGlassConfig {
  /** "regular" 标准玻璃效果 | "clear" 清晰玻璃效果 */
  style: 'regular' | 'clear'
  tintColor?: string // 叠加色 支持rgba/hex
  interactive?: boolean // 是否开启交互高光（对应原生 UIGlassEffect.interactive）false
  darkMode?: boolean // 玻璃明暗开关：true=暗 / false=亮，原生据此写死 overrideUserInterfaceStyle（避免首帧闪白）。业务按主题动态传
  showTintOverlay?: boolean // 是否在液态玻璃上叠加一层调暗浮层 黑色，alpha 0.6
}

/**
 * FrostedGlassConfig 毛玻璃配置（内部）
 * iOS System 材质 5 组：ultra-thin 超薄 / thin 轻薄 / regular 常规 / thick 厚重 / chrome 控件，× light 亮 / dark 暗黑
 * @internal
 */
export interface FrostedGlassConfig {
  style:
    | 'ultra-thin-light'
    | 'ultra-thin-dark'
    | 'thin-light'
    | 'thin-dark'
    | 'regular-light'
    | 'regular-dark'
    | 'thick-light'
    | 'thick-dark'
    | 'chrome-light'
    | 'chrome-dark'
  alpha?: number // 透明度
}

/**
 * GradientBlurConfig 渐变模糊配置（内部）
 * @internal
 */
export interface GradientBlurConfig {
  /** 底端模糊强度比例 [0,1], 未设置为 0 */
  minBlur?: number
  /** 顶端模糊强度比例 [0,1]，未设置为 0（为 0 时不产生模糊） */
  maxBlur?: number
  /** 颜色渐变遮罩的透明度 [0,1]，未设置为 0（为 0 时不产生遮罩） */
  overlayAlpha?: number
  /** 颜色遮罩色值（未设置时由原生按明暗回退：亮色白、暗色黑） */
  overlayColor?: string
}

/**
 * 组件内部完整 props（含各端实现细节，不对外导出）
 * @internal
 */
export interface JDMaterialViewInternalProps extends BasicComponent {
  scene?: MaterialScene
  targetId: string
  darkMode?: boolean
  liquidGlass?: LiquidGlassConfig
  frostedGlass?: FrostedGlassConfig
  gradientBlur?: GradientBlurConfig
  overlayColor?: string
}
