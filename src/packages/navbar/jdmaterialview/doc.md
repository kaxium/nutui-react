# JDMaterialView 材质视图

跨端液态玻璃 / 毛玻璃 / 渐变模糊组件。iOS 26+ 使用原生液态玻璃，iOS < 26 使用原生毛玻璃，Android / 鸿蒙 / H5 使用 CSS `backdrop-filter` 实现毛玻璃，参数由 `scene` 自动查表，业务无需关注平台差异。

## 引入

```tsx
import JDMaterialView from '@/packages/jdmaterialview'
import { JDMaterialsBlurTarget } from '@/packages/jdmaterialsblurtarget'
```

## 设计说明

### 各端实现方式

| 平台 | 模糊实现 | 叠加色 | 模糊源 |
| --- | --- | --- | --- |
| iOS 26+ | `liquidGlass` 原生液态玻璃 | tintColor（透传原生） | targetId（透传） |
| iOS < 26 | `frostedGlass` / `gradientBlur` 原生毛玻璃 | — | targetId（透传） |
| Android | CSS `backdropFilter` + `overlayColor` 原生属性 | overlayColor | targetId / blurId（必需） |
| 鸿蒙 | 原生 `blurScale` 属性 | overlayColor | targetId（透传） |
| H5 | CSS `backdrop-filter` | `background-color` | 不需要（CSS 自身实现） |

### 一码五端写法规范

只有 Android 需要独立的"模糊源"节点，其他端 `JDMaterialsBlurTarget` 是透明 wrapper，直接透传 children。为保持一套代码五端兼容：

- `JDMaterialView` 传 `targetId`，`JDMaterialsBlurTarget` 传相同值的 `blurId`
- H5 侧两者均忽略，不会渲染额外节点

```tsx
<JDMaterialsBlurTarget blurId="my-blur">
  {/* 背景内容 */}
</JDMaterialsBlurTarget>

<JDMaterialView scene="top-bar" targetId="my-blur">
  {/* 浮层内容 */}
</JDMaterialView>
```

### H5 毛玻璃规范说明

> 声明：由于渲染机制不同，H5 无法完全还原原生的液态玻璃效果。**当前 H5 版本仅支持 `top-solid`、`top-plain`、`top-bar` 三种常用场景**，其余场景暂为待办。

H5 实现对齐 [H5 毛玻璃（Frosted Glass）样式规范](https://joyspace.jd.com/pages/GNhOW3GJKyQnFJXN9Bbc)（设计已验收）：

- **blur 半径**：统一 `3PX`（大写 `PX` 防止 postcss px→vw 转换导致不同屏幕尺寸效果变形）
- **叠加色 + 内发光**：纯白 / 暗黑 / 沉浸式场景补 `box-shadow` 多层 inset；吸顶背板 / 底部背板 / 换肤场景无阴影

#### 场景命名与规范对应说明

- **`top-solid`（带底色悬浮容器）**：对应设计规范中的 **FG-Light（亮）/ FG-Dark（暗）**，用于顶部带实色底（纯白或暗黑色）的搜索框/胶囊导航，带 4 层 inset 内发光高光阴影。
- **`top-plain`（无底色高透容器）**：对应设计规范中的 **FG-Clear（高透）**，用于顶部无实底、晶莹通透的轻量浮层或高透水晶胶囊容器。
- **`top-bar`（吸顶通栏背板）**：吸顶整个导航条通栏的纯色毛玻璃背板（圆角为 0，无发光阴影）。

各 scene 对应的 H5 规范材质与支持情况：

| scene | 语义说明 | H5 材质类名 | 亮色叠加色 | 暗色叠加色 | box-shadow | H5 支持状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `top-solid` | 带底色悬浮容器 | FG-Light / FG-Dark | `rgba(255,255,255,0.65)` | `rgba(20,23,26,0.6)` | 有（4层inset） | ✅ 支持 |
| `top-plain` | 无底色高透容器 | FG-Clear | 无效果 | 无效果 | 无 | ✅ 支持 |
| `top-bar` | 吸顶通栏背板 | 纯色背板 | `rgba(255,255,255,0.9)` | `rgba(20,23,26,0.85)` | 无 | ✅ 支持 |
| `immersive` | 沉浸式（强制暗色） | FG-Dark（强制暗） | — | `rgba(20,23,26,0.6)` | 有（4层inset） | 待办 |
| `promotion-fair` | 浅色换肤 | FG-Skin-L | `rgba(255,255,255,0.85)` | 同左 | 无 | 待办 |
| `promotion-deep` | 深色换肤 | FG-Skin-D | `rgba(255,255,255,0.2)` | 同左 | 无 | 待办 |
| `bottom-bar` | 底部导航背板 | 渐变背景 | `rgba(255,255,255,0.8)` | `rgba(20,23,26,0.8)` | 无 | 待办 |

## 示例代码

### 基础用法 - 毛玻璃（top-bar）

:::demo

<CodeBlock src='h5/demo1.tsx'></CodeBlock>

:::

### 液态玻璃 + 毛玻璃降级（immersive）

:::demo

<CodeBlock src='h5/demo2.tsx'></CodeBlock>

:::

### 渐变模糊（bottom-bar）

:::demo

<CodeBlock src='h5/demo3.tsx'></CodeBlock>

:::

### iOS 26+ 手动指定液态玻璃配置

```tsx
// liquidGlass 和 frostedGlass 可同时设置：
// iOS 26+ 使用 liquidGlass，低版本自动降级到 frostedGlass
<JDMaterialView
  targetId="my-blur"
  liquidGlass={{ style: 'regular', tintColor: 'rgba(0,0,0,0.2)' }}
  frostedGlass={{ style: 'regular-dark' }}
>
  <View>业务内容</View>
</JDMaterialView>

<JDMaterialsBlurTarget blurId="my-blur">
  <View>背景内容</View>
</JDMaterialsBlurTarget>
```

## JDMaterialView Props

| 属性 | 说明 | 类型 | 必填 | 默认值 |
| --- | --- | --- | --- | --- |
| scene | 材质场景，自动按平台查表输出对应效果 | `MaterialScene` | 是 | — |
| targetId | 模糊源 ID（与 `JDMaterialsBlurTarget` 的 `blurId` 对应，Android 必须，H5 忽略） | `string` | 否 | — |
| darkMode | 强制指定暗色模式（`true`: 暗色 / `false`: 亮色），未传时自动跟随系统/宿主环境主题 | `boolean` | 否 | 自动跟随系统 |
| style | 可覆盖 `borderRadius`、`backgroundColor`、`boxShadow` 等，组件仅补齐未显式设置的属性 | `CSSProperties` | 否 | — |
| className | 追加类名 | `string` | 否 | — |

## JDMaterialsBlurTarget Props

| 属性 | 说明 | 类型 | 必填 |
| --- | --- | --- | --- |
| blurId | 模糊源 ID，与 `JDMaterialView` 的 `targetId` 对应 | `string` | 是 |

## MaterialScene 取值

| 值 | 语义说明 | 对应设计规范 | 典型用途 | H5 支持状态 |
| --- | --- | --- | --- | --- |
| `top-solid` | 带底色悬浮容器（浅白 / 暗黑） | FG-Light / FG-Dark | 搜索框、胶囊导航（带背景底色 + 内发光） | ✅ 支持 |
| `top-plain` | 无底色高透悬浮容器 | FG-Clear（高透） | 轻量透明浮层、高透水晶胶囊 | ✅ 支持 |
| `top-bar` | 吸顶通栏背板 | 纯色背板 | 顶部吸顶通栏导航条 | ✅ 支持 |
| `promotion-fair` | 浅色换肤悬浮容器 | FG-Skin-L | 浅色皮肤活动页浮层 | 待办 |
| `promotion-deep` | 深色换肤悬浮容器 | FG-Skin-D | 深色皮肤活动页浮层 | 待办 |
| `immersive` | 沉浸式悬浮容器（强制暗色） | FG-Dark | 视频 / 沉浸页浮层 | 待办 |
| `bottom-bar` | 底部导航背板 | 渐变背景 | 底部 Tab 栏 | 待办 |

## 类型定义

### LiquidGlassConfig（iOS 26+）

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| style | `"regular"` 标准玻璃 \| `"clear"` 清晰玻璃 | `string` | **必填** |
| tintColor | 叠加色（rgba / hex） | `string` | — |
| interactive | 是否开启交互高光 | `boolean` | `false` |
| darkMode | 玻璃明暗开关（true=暗），按主题动态传，原生据此锁定明暗避免首帧闪白 | `boolean` | — |
| showTintOverlay | 是否叠加调暗浮层 | `boolean` | — |

### FrostedGlassConfig（iOS < 26 / Android）

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| style | `ultra-thin-light` / `thin-light` / `regular-light` / `thick-light` / `chrome-light` 及对应 `-dark` 版本 | `string` | **必填** |
| alpha | 透明度 | `number` | — |

### GradientBlurConfig（bottom-bar）

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| minBlur | 底端模糊强度比例 [0,1] | `number` | `0` |
| maxBlur | 顶端模糊强度比例 [0,1] | `number` | `0` |
| overlayAlpha | 颜色遮罩透明度 [0,1] | `number` | `0` |
| overlayColor | 颜色遮罩色值（未设时按明暗回退：亮白暗黑） | `string` | — |

## 辅助函数（高级用法）

| 函数 | 说明 |
| --- | --- |
| `getPreset(scene, dark, iosMajor)` | 获取 iOS 场景的完整材质配置（liquidGlass / frostedGlass / gradientBlur） |
| `getCornerRadius(scene, iosMajor)` | 获取 iOS 场景的圆角值（按版本回退） |
| `getFrostedPreset(scene, dark)` | 获取 Android 场景的毛玻璃预设（blurRadius / borderRadius / tintColor） |
| `getH5FrostedPreset(scene, dark)` | 获取 H5 场景的毛玻璃预设（blurRadius / borderRadius / tintColor / boxShadow） |
