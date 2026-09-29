import React, {
  FunctionComponent,
  useMemo,
  useState,
  useEffect,
  CSSProperties,
} from 'react'
import classNames from 'classnames'
import { ComponentDefaults } from '@/utils/typings'
import {
  JDMaterialViewProps,
  FrostedGlassConfig,
  GradientBlurConfig,
} from './types'
import { getH5FrostedPreset, getH5MaterialClassName } from './scene-presets'
import './jdmaterialview.scss'

const defaultProps = {
  ...ComponentDefaults,
} as Partial<JDMaterialViewProps>

function readDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
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

export interface JDMaterialViewInternalProps extends Partial<JDMaterialViewProps> {
  liquidGlass?: any
  frostedGlass?: FrostedGlassConfig
  gradientBlur?: GradientBlurConfig
  overlayColor?: string
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

  const [systemDark, setSystemDark] = useState<boolean>(readDark)
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
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
    <div
      className={cls}
      style={computedStyle}
      data-target-id={targetId}
      {...rest}
    >
      {children}
    </div>
  )
}

JDMaterialView.displayName = 'NutJDMaterialView'
