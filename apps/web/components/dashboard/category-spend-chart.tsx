'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const COLORS = ['#3b82f6', '#f97316', '#fbbf24', '#10b981', '#8b5cf6', '#ec4899']

export function CategorySpendChart() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/category-spend')
      .then(res => res.json())
      .then(raw => {
        // Show all categories from the API
        const formatted = raw.map((r: any) => ({
          name: r.category,
          value: Number(r.spend)
        }))
        setData(formatted)
      })
      .catch(console.error)
  }, [])

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 pt-4 px-4 flex-shrink-0">
        <CardTitle className="text-sm font-semibold text-gray-900 leading-tight">Spend by Category</CardTitle>
        <CardDescription className="text-xs text-gray-600 leading-tight mt-0.5">Spending distribution.</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-2 flex flex-col overflow-hidden">
        <div className="h-[180px] w-full flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1 overflow-y-auto flex-1">
          {data.map((item: any, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-muted-foreground text-xs truncate">{item.name}</span>
              </div>
              <span className="font-semibold text-xs ml-2 flex-shrink-0">€{Number(item.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
