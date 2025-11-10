// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function CashOutflowChart() {
  const [data, setData] = useState<Array<{ bucket: string; cash_outflow: string }>>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/cash-outflow')
      .then(async res => {
        if (!res.ok) { setError(`HTTP ${res.status}`); return [] }
        try { return await res.json() } catch { setError('Invalid JSON'); return [] }
      })
      .then(raw => {
        if (!Array.isArray(raw)) { setData([]); return }
        setData(raw)
      })
      .catch(() => { setData([]); setError('Network error') })
      .finally(() => setLoading(false))
  }, [])

  // Compute max value for chart data
  const safeData = Array.isArray(data) ? data : []
  const maxValue = Math.max(...safeData.map(d => Number(d.cash_outflow || 0)), 1)
  
  // Map the buckets to match display labels (use API bucket names directly)
  const orderedBuckets = ['Overdue', '0-7 days', '8-30 days', '31-60 days', '60+ days']
  
  const chartData = orderedBuckets.map(bucket => {
    const item = safeData.find(d => d.bucket === bucket)
    const value = item ? Number(item.cash_outflow) : 0
    return {
      range: bucket,
      amount: value,
    }
  })

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="text-xs text-gray-600 mb-1">{item.payload.range}</div>
          <div className="text-sm font-bold text-blue-600">
            € {Number(item.value).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 pt-4 px-4 flex-shrink-0">
        <CardTitle className="text-sm font-semibold text-gray-900 leading-tight">
          Cash Outflow Forecast
        </CardTitle>
        <CardDescription className="text-xs text-gray-600 leading-tight mt-0.5">
          Expected payment obligations grouped by due date ranges.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-2">
        <div className="h-[265px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading…</div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -20, right: 5, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 11, fill: '#6B7280' }} 
                angle={-45} 
                textAnchor="end" 
                height={60}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                // domain prop suppressed due to Recharts TS mismatch; scale computed implicitly
                tickFormatter={(value: any) => `€${Number(value).toLocaleString()}`}
                width={80}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Single dark indigo bars - full width */}
              <Bar 
                dataKey="amount" 
                fill="#312E81" 
                radius={[4, 4, 0, 0]}
                maxBarSize={80}
              />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
