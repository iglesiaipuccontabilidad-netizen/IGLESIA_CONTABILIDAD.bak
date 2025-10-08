// types.d.ts
import { TablerIconsProps } from '@tabler/icons-react'

declare module '@tabler/icons-react' {
  export interface TablerIconsProps {
    size?: number
    className?: string
    style?: React.CSSProperties
    width?: number
    height?: number
    stroke?: number
  }
}