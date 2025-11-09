'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface TrendData {
  month: string
  count: number
  spend: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function InvoiceTrendChart() {
  const [data, setData] = useState<TrendData[]>([])

  useEffect(() => {
    fetch('/api/invoice-trends')
      .then(res => res.json())
      .then(raw => {
        const formatted = raw.map((r: any) => {
          const date = new Date(r.month)
          return {
            month: MONTH_NAMES[date.getMonth()],
            count: Number(r.invoice_count),
            spend: Number(r.total_spend)
          }
        })
        setData(formatted)
      })
      .catch(console.error)
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const monthData = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
          <div className="text-xs text-gray-600 mb-2">{monthData.month} 2025</div>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline gap-4">
              <span className="text-xs text-gray-500">Invoice count:</span>
              <span className="text-lg font-bold text-blue-600">{monthData.count}</span>
            </div>
            <div className="flex justify-between items-baseline gap-4">
              <span className="text-xs text-gray-500">Total Spend:</span>
              <span className="text-lg font-bold text-blue-600">
                € {Number(monthData.spend).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Invoice Volume + Value Trend</CardTitle>
        <CardDescription className="text-xs">Invoice count and total spend over 12 months.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-2">
        <div className="h-[288px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="spend" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
              <Line type="monotone" dataKey="count" stroke="#94a3b8" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
