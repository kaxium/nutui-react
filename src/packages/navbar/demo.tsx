import React from 'react'
import './demo.scss'
import { useTranslate } from '@/sites/assets/locale'
import Demo1 from './demos/h5/demo1'
import Demo3 from './demos/h5/demo3'

const NavBarDemo = () => {
  const [translated] = useTranslate({
    'zh-CN': {
      group1: 'iOS26以下/安卓鸿蒙',
      group2: 'iOS26以上',
      cat1: '标题型',
      cat2: '搜索型',
      cat3: '导航型',
      empty: '暂无示例，敬请期待',
    },
    'zh-TW': {
      group1: 'iOS26以下/安卓鴻蒙',
      group2: 'iOS26以上',
      cat1: '標題型',
      cat2: '搜尋型',
      cat3: '導航型',
      empty: '暫無示例，敬請期待',
    },
    'en-US': {
      group1: 'iOS 26 and below / Android & HarmonyOS',
      group2: 'iOS 26 and above',
      cat1: 'Title',
      cat2: 'Search',
      cat3: 'Navigation',
      empty: 'Coming soon',
    },
  })
  return (
    <>
      <div className="demo navbar-demo">
        <h2>{translated.group1}</h2>
        <h3>{translated.cat1}</h3>
        <Demo1 />
        <h3>{translated.cat2}</h3>
        <p className="navbar-demo-empty">{translated.empty}</p>
        <h3>{translated.cat3}</h3>
        <Demo3 />
        <h2>{translated.group2}</h2>
        <p className="navbar-demo-empty">{translated.empty}</p>
      </div>
    </>
  )
}

export default NavBarDemo
