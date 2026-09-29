import React, {
  FunctionComponent,
  useMemo,
  useState,
  useEffect,
  CSSProperties,
} from 'react'
import classNames from 'classnames'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ComponentDefaults } from '@/utils/typings'
import {
  JDMaterialViewProps,
  JDMaterialViewInternalProps,
  FrostedGlassConfig,
  GradientBlurConfig,
} from './types'
import {
  getH5FrostedPreset,
  getH5MaterialClassName,
} from './scene-presets.taro'
import './jdmaterialview.scss'

// Taro 端实现说明：
// 当前 demo 只实现 web 渲染（H5 / 小程序），不接原生材质能力，
// 实现与 H5 端 jdmaterialview.tsx 对齐；iOS 26+ 的液态玻璃等原生效果由客户端 App 提供。

const defaultProps = {
  ...ComponentDefaults,
} as Partial<JDMaterialViewProps>

// 读取当前系统主题是否暗色（H5 / 小程序 / App 端均可用，取不到时按亮色兜底）
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

function getBlurRadius(config: FrostedGlassConfig): number {
  if (config.style.startsWith('thin')) return 10
  if (config.style.startsWith('thick')) return 40
  return 20
}

function getGradientStyle(config: GradientBlurConfig): CSSProperties {
  const s: CSSProperties = {}
  const max = config.maxBlur ?? 0
  if (max > 0) {
    s.backdropFilter = `blur(${max * 50}px)`
    s.WebkitBackdropFilter = `blur(${max * 50}px)`
  }
  if (config.overlayAlpha && config.overlayAlpha > 0) {
    const color = config.overlayColor || 'rgba(255,255,255,1)'
    s.backgroundColor = color
    s.opacity = config.overlayAlpha
  }
  return s
}

export const JDMaterialView: FunctionComponent<
  Partial<JDMaterialViewProps> & React.HTMLAttributes<HTMLDivElement>
> = (props) => {
  const {
    className,
    style,
    children,
    scene,
    targetId,
    darkMode,
    frostedGlass,
    gradientBlur,
    overlayColor,
    liquidGlass: _liquidGlass,
    ...rest
  } = { ...defaultProps, ...props } as JDMaterialViewInternalProps &
    React.HTMLAttributes<HTMLDivElement>

  // 暗色主题：业务显式传 darkMode 时以业务为准，否则跟随系统主题。
  // 初值读一次当前系统主题，运行时监听 onThemeChange 动态更新；
  // 部分端不支持 onThemeChange，用 try/catch 兜底。
  const [systemDark, setSystemDark] = useState<boolean>(readDark)
  useEffect(() => {
    const handleThemeChange = (res: string | { theme?: string }) => {
      // 不同端回调形态不一：直接传字符串 'dark'/'light'，或 { theme }
      const theme = typeof res === 'string' ? res : String(res?.theme || '')
      setSystemDark(theme.toLowerCase() === 'dark')
    }
    try {
      Taro.onThemeChange?.(handleThemeChange)
    } catch {
      // 当前端不支持 onThemeChange，保持初值
    }
    return () => {
      try {
        Taro.offThemeChange?.(handleThemeChange)
      } catch {
        // 忽略
      }
    }
  }, [])

  const dark = darkMode !== undefined ? darkMode : systemDark

  const classPrefix = 'nut-jdmaterialview'
  // scene 有对应规范类名时挂 className，否则 inline style 兜底（bottom-bar）
  const materialCls = scene ? getH5MaterialClassName(scene, dark) : null
  const cls = classNames(classPrefix, materialCls, className)

  const computedStyle = useMemo<CSSProperties>(() => {
    const s: CSSProperties = { ...style }

    if (scene) {
      const preset = getH5FrostedPreset(scene, dark)

      // 有规范 className 的场景：样式由 SCSS class 覆盖，inline 只补 borderRadius
      // 无 className（bottom-bar）：完整 inline 兜底
      if (!materialCls) {
        if (preset.blurRadius > 0) {
          s.backdropFilter = `blur(${preset.blurRadius}PX)`
          s.WebkitBackdropFilter = `blur(${preset.blurRadius}PX)`
        }
        if (preset.tintColor !== undefined && s.backgroundColor === undefined) {
          s.backgroundColor = preset.tintColor
        }
        if (preset.boxShadow !== undefined && s.boxShadow === undefined) {
          s.boxShadow = preset.boxShadow
        }
      }
      if (s.borderRadius === undefined) {
        s.borderRadius = `${preset.borderRadius}px`
      }
    } else if (frostedGlass) {
      const radius = getBlurRadius(frostedGlass)
      s.backdropFilter = `blur(${radius}px)`
      s.WebkitBackdropFilter = `blur(${radius}px)`
      if (frostedGlass.alpha !== undefined) {
        s.opacity = frostedGlass.alpha
      }
      const isDark = frostedGlass.style.endsWith('-dark')
      if (!s.backgroundColor) {
        s.backgroundColor = isDark
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.3)'
      }
    } else if (gradientBlur) {
      Object.assign(s, getGradientStyle(gradientBlur))
    }

    if (overlayColor) {
      s.backgroundColor = overlayColor
    }

    return s
  }, [
    style,
    scene,
    dark,
    materialCls,
    frostedGlass,
    gradientBlur,
    overlayColor,
  ])

  return (
    <View
      className={cls}
      style={computedStyle}
      // 与 H5 侧保持一致：保留模糊源标记，供原生端（客户端）按 targetId 取源
      {...({ 'data-target-id': targetId } as Record<string, any>)}
      {...(rest as Record<string, any>)}
    >
      {children}
    </View>
  )
}

JDMaterialView.displayName = 'NutJDMaterialView'
