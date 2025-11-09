declare module 'recharts' {
  import * as React from 'react'

  export interface CartesianGridProps {
    strokeDasharray?: string
    stroke?: string
  }
  
  export interface XAxisProps {
    dataKey?: string
    tick?: any
    stroke?: string
    angle?: number
    textAnchor?: string
    height?: number
    type?: string
    tickFormatter?: (value: any) => string
    axisLine?: boolean
  }
  
  export interface YAxisProps {
    tick?: any
    stroke?: string
    width?: number
    tickFormatter?: (value: any) => string
    type?: string
    dataKey?: string
    axisLine?: boolean
  }
  
  export interface TooltipProps<TValue = any, TName = any> {
    content?: any
  }
  
  export interface AreaProps {
    type?: string
    dataKey?: string
    stroke?: string
    fillOpacity?: number
    fill?: string
    strokeWidth?: number
  }
  
  export interface LineProps {
    type?: string
    dataKey?: string
    stroke?: string
    strokeWidth?: number
    dot?: boolean
  }
  
  export interface BarProps {
    dataKey?: string
    fill?: string
    radius?: number[]
    maxBarSize?: number
  }
  
  export interface PieProps {
    data?: any[]
    cx?: string | number
    cy?: string | number
    innerRadius?: number
    outerRadius?: number
    fill?: string
    paddingAngle?: number
    dataKey?: string
    children?: React.ReactNode
  }
  
  export interface CellProps {
    fill?: string
  }
  
  export const ResponsiveContainer: React.FC<{
    width?: string | number
    height?: string | number
    children?: React.ReactNode
  }>
  
  export const AreaChart: React.FC<{
    data?: any[]
    children?: React.ReactNode
    margin?: { left?: number; right?: number; top?: number; bottom?: number }
  }>
  
  export const LineChart: React.FC<{
    data?: any[]
    children?: React.ReactNode
    margin?: { left?: number; right?: number; top?: number; bottom?: number }
  }>
  
  export const BarChart: React.FC<{
    data?: any[]
    children?: React.ReactNode
    layout?: string
    margin?: { left?: number; right?: number; top?: number; bottom?: number }
  }>
  
  export const PieChart: React.FC<{
    children?: React.ReactNode
  }>
  
  export const CartesianGrid: React.FC<CartesianGridProps>
  export const XAxis: React.FC<XAxisProps>
  export const YAxis: React.FC<YAxisProps>
  export const Tooltip: React.FC<TooltipProps>
  export const Area: React.FC<AreaProps>
  export const Line: React.FC<LineProps>
  export const Bar: React.FC<BarProps>
  export const Pie: React.FC<PieProps>
  export const Cell: React.FC<CellProps>
  export const Legend: React.FC<any>
}
