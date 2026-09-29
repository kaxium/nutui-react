import React, {
  FunctionComponent,
  useMemo,
  useState,
  useEffect,
  useCallback,
  CSSProperties,
} from 'react'
import classNames from 'classnames'
import Taro, { getEnv } from '@tarojs/taro'
import { View } from '@tarojs/components'
// import { JDIOSMaterialView } from '@jdtaro/ui'
import { ComponentDefaults } from '@/utils/typings'
import { JDMaterialViewProps, JDMaterialViewInternalProps } from './types'
import {
  getPreset,
  getHarmonyPreset,
  getFrostedPreset,
  getCornerRadius,
} from './scene-presets.taro'

const defaultProps = {
  ...ComponentDefaults,
} as JDMaterialViewInternalProps

// 是否鸿蒙端（与 src/index.taro.ts 的 harmony() 同逻辑，内联避免循环依赖）
function isHarmony(): boolean {
  return ['harmony', 'harmonyhybrid', 'jdharmony'].includes(
    getEnv().toLowerCase()
  )
}

function getSystemInfo() {
  try {
    const info = Taro.getSystemInfoSync()
    const platform = String(info?.platform || '').toLowerCase()
    const system = String(info?.system || '')
    const isIOS = platform === 'ios'
    const iosMajor = isIOS ? parseInt(system.match(/\d+/)?.[0] || '0', 10) : 0
    const dark =
      String((info as { theme?: string })?.theme || '').toLowerCase() === 'dark'
    return { isIOS, iosMajor, dark }
  } catch {
    return { isIOS: false, iosMajor: 0, dark: false }
  }
}

// 读取当前系统主题是否暗色（实时，供 onThemeChange 前的初值与回调兜底）
function readDark(): boolean {
  try {
    const info = Taro.getSystemInfoSync()
    return (
      String((info as { theme?: string })?.theme || '').toLowerCase() === 'dark'
    )
  } catch {
    return false
  }
}

// 鸿蒙端渲染：透传 blurScale / borderRadius / colorMode 原生 prop；叠加色落 style.backgroundColor
function renderHarmony(args: {
  scene?: string
  dark: boolean
  overlayColor?: string
  cls: string
  style?: CSSProperties
  children?: React.ReactNode
  rest: Record<string, any>
}) {
  const { scene, dark, overlayColor, cls, style, children, rest } = args
  const preset = scene ? getHarmonyPreset(scene as any, dark) : undefined
  const harmonyProps: Record<string, any> = {}
  if (preset) {
    harmonyProps.blurScale = preset.blurScale
    harmonyProps.borderRadius = preset.borderRadius
    // colorMode 由场景决定（promotion 恒 light、immersive 恒 dark、其余跟随系统），非无脑跟系统
    harmonyProps.colorMode = preset.colorMode
  } else {
    // 未指定 scene 时兜底跟随系统
    harmonyProps.colorMode = dark ? 'dark' : 'light'
  }
  // 圆角：业务在 style 里显式给了圆角则优先（透传原生 prop），否则用场景预设
  if (style?.borderRadius !== undefined) {
    harmonyProps.borderRadius = parseFloat(String(style.borderRadius))
  }

  // 叠加色：落到 CSS style.backgroundColor（不再走原生 overlayColor 属性）。
  // 优先级：业务 style.backgroundColor > 业务 overlayColor prop > 场景预设（top-solid/top-bar 有）
  const computedStyle: CSSProperties = { ...style }
  const resolvedOverlay = overlayColor ?? preset?.overlayColor
  if (resolvedOverlay && computedStyle.backgroundColor === undefined) {
    computedStyle.backgroundColor = resolvedOverlay
  }
  // 渐变蒙层（仅 bottom-bar）：落 CSS style.background，业务显式传 background 则优先
  if (
    preset?.backgroundGradient &&
    (computedStyle as any).background === undefined
  ) {
    ;(computedStyle as any).background = preset.backgroundGradient
  }
  // 阴影（仅 bottom-bar）：落 CSS style.boxShadow，业务显式传则优先
  if (preset?.boxShadow && computedStyle.boxShadow === undefined) {
    computedStyle.boxShadow = preset.boxShadow
  }

  return (
    <View className={cls} style={computedStyle} {...harmonyProps} {...rest}>
      {children}
    </View>
  )
}

// 安卓端渲染：blurRadius 出 CSS backdropFilter，叠加色落 overlayColor 属性（透传原生）。
// 参数唯一标准来自 getFrostedPreset（安卓 GlassStyle 表），与 iOS 侧 getPreset 独立。
function renderAndroid(args: {
  scene?: string
  dark: boolean
  targetId?: string
  overlayColor?: string
  cls: string
  style?: CSSProperties
  children?: React.ReactNode
  rest: Record<string, any>
}) {
  const { scene, dark, targetId, overlayColor, cls, style, children, rest } =
    args

  const preset = scene ? getFrostedPreset(scene as any, dark) : undefined

  const computedStyle: CSSProperties = { ...style }
  if (preset && preset.blurRadius > 0) {
    computedStyle.backdropFilter = `blur(${preset.blurRadius}px)`
  }
  // 圆角：安卓每场景定值（bottom-bar 0，其余 12），业务未显式传 borderRadius 时用预设
  if (preset && computedStyle.borderRadius === undefined) {
    computedStyle.borderRadius = `${preset.borderRadius}px`
  }

  // 叠加色：业务传入优先，否则用场景预设的 tintColor；落到 overlayColor 属性（非 CSS backgroundColor）
  const resolvedOverlayColor = overlayColor ?? preset?.tintColor

  const nativeProps: Record<string, any> = {}
  if (targetId) nativeProps.targetId = targetId
  if (scene) nativeProps.scene = scene
  if (resolvedOverlayColor) nativeProps.overlayColor = resolvedOverlayColor

  return (
    <View
      className={cls}
      style={computedStyle}
      {...nativeProps}
      {...(rest as any)}
    >
      {children}
    </View>
  )
}

export const JDMaterialView: FunctionComponent<
  JDMaterialViewProps & React.HTMLAttributes<HTMLDivElement>
> = (props) => {
  // 对外只暴露 JDMaterialViewProps（scene/targetId）；内部实现仍可接收 liquidGlass 等，
  // 故在函数体内按内部完整类型解构（业务传的对外 props 是其子集，安全）。
  const {
    className,
    style,
    children,
    scene,
    targetId,
    darkMode,
    liquidGlass,
    frostedGlass,
    gradientBlur,
    overlayColor,
    ...rest
  } = { ...defaultProps, ...props } as JDMaterialViewInternalProps &
    React.HTMLAttributes<HTMLDivElement>

  const classPrefix = 'nut-jdmaterialview'
  const cls = classNames(classPrefix, className)

  // 设备信息（平台/iOS 版本）不随主题变化，静态读取一次
  const { isIOS, iosMajor } = useMemo(() => getSystemInfo(), [])

  // 暗色主题动态响应：初值读当前系统主题，运行时监听 onThemeChange 自动更新，
  // 业务无需手动传 theme。某些端可能不支持 onThemeChange，用 try/catch 兜底。
  const [dark, setDark] = useState<boolean>(() => readDark())
  const handleThemeChange = useCallback((res: string | { theme?: string }) => {
    // 不同端回调形态不一：dynamic 直接传字符串 'dark'/'light'，
    // 标准类型定义为 { theme }。两种都兼容。
    const theme = typeof res === 'string' ? res : String(res?.theme || '')
    setDark(theme.toLowerCase() === 'dark')
  }, [])
  useEffect(() => {
    try {
      Taro.onThemeChange?.(handleThemeChange)
    } catch {
      // 当前端不支持 onThemeChange，忽略（保持初值）
    }
    return () => {
      try {
        Taro.offThemeChange?.(handleThemeChange)
      } catch {
        // 忽略
      }
    }
  }, [handleThemeChange])

  const activeDark = darkMode !== undefined ? darkMode : dark

  // 通过 scene 自动解析配置，手动传入的 props 优先
  const preset = useMemo(
    () => (scene ? getPreset(scene, activeDark, iosMajor) : undefined),
    [scene, activeDark, iosMajor]
  )

  // const resolvedLiquidGlass = liquidGlass ?? preset?.liquidGlass
  // const resolvedFrostedGlass = frostedGlass ?? preset?.frostedGlass
  // const resolvedGradientBlur = gradientBlur ?? preset?.gradientBlur

  // iOS 端：使用 JDIOSMaterialView 原生组件
  // 优先级：liquidGlass > frostedGlass > gradientBlur
  // liquidGlass 仅 iOS 26+ 响应，frostedGlass/gradientBlur 作为低版本降级
  if (isIOS) {
    const iosStyle: CSSProperties = { ...preset?.fallbackStyle, ...style }
    // 圆角：组件兜底给场景默认圆角（getCornerRadius 按 iOS 版本回退），
    // 业务在 style 里显式给了 borderRadius 则优先。原生从 style.borderRadius 读取圆角。
    if (scene && iosStyle.borderRadius === undefined) {
      iosStyle.borderRadius = `${getCornerRadius(scene, iosMajor)}px`
    }
    return (
      // <JDIOSMaterialView
      //   className={cls}
      //   style={iosStyle}
      //   liquidGlass={resolvedLiquidGlass}
      //   frostedGlass={resolvedFrostedGlass}
      //   gradientBlur={resolvedGradientBlur}
      //   {...rest}
      // >
      //   {children}
      // </JDIOSMaterialView>
      <View />
    )
  }

  // 鸿蒙端：透传 blurScale 体系给原生组件（不走 backdropFilter）
  if (isHarmony()) {
    return renderHarmony({
      scene,
      dark: activeDark,
      overlayColor,
      cls,
      style,
      children,
      rest,
    })
  }

  // 安卓端：CSS backdropFilter 出毛玻璃 + overlayColor 蒙层 + targetId 模糊源
  return renderAndroid({
    scene,
    dark: activeDark,
    targetId,
    overlayColor,
    cls,
    style,
    children,
    rest,
  })
}

JDMaterialView.displayName = 'NutJDMaterialView'
