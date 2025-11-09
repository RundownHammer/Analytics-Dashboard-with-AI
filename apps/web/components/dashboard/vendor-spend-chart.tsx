'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface VendorData {
  name: string
  spend: number
}

export function VendorSpendChart() {
  const [data, setData] = useState<VendorData[]>([])

  useEffect(() => {
    fetch('/api/vendors/top10')
      .then(res => res.json())
      .then(raw => {
        const formatted = raw.map((r: any) => ({
          name: r.name,
          spend: Number(r.spend)
        })).slice(0, 10)
        setData(formatted)
      })
      .catch(console.error)
  }, [])

  const maxSpend = data.length > 0 ? Math.max(...data.map((d: any) => d.spend)) : 1

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="text-xs text-gray-600 mb-1">{payload[0].payload.name}</div>
          <div className="text-sm font-bold text-blue-600">
            € {Number(payload[0].value).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Spend by Vendor (Top 10)</CardTitle>
        <CardDescription className="text-xs">Top 10 vendors by total spend.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-2">
        <div className="h-[288px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical"
              margin={{ left: -5, right: 5, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                tickFormatter={(value: any) => `€${value.toLocaleString()}`}
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={100}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="spend" 
                fill="#6366f1" 
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
