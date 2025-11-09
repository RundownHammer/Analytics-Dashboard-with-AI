'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  totalSpendYTD: number
  totalInvoices: number
  documentsUploaded: number
  averageInvoiceValue: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(console.error)
  }, [])

  const cards = [
    {
      title: 'Total Spend',
      subtitle: '(YTD)',
      value: stats ? `€ ${Number(stats.totalSpendYTD).toLocaleString('de-DE', { minimumFractionDigits: 2 })}` : '...',
      change: '+8.2%',
      changeText: 'from last month',
      trend: 'up' as const,
    },
    {
      title: 'Total Invoices Processed',
      subtitle: '',
      value: stats?.totalInvoices.toString() || '...',
      change: '+8.2%',
      changeText: 'from last month',
      trend: 'up' as const,
    },
    {
      title: 'Documents Uploaded',
      subtitle: 'This Month',
      value: stats?.documentsUploaded.toString() || '...',
      change: '-8',
      changeText: 'less from last month',
      trend: 'down' as const,
    },
    {
      title: 'Average Invoice Value',
      subtitle: '',
      value: stats ? `€ ${Number(stats.averageInvoiceValue).toLocaleString('de-DE', { minimumFractionDigits: 2 })}` : '...',
      change: '+8.2%',
      changeText: 'from last month',
      trend: 'up' as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title} {card.subtitle && <span className="text-muted-foreground/60">{card.subtitle}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{card.value}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={card.trend === 'up' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {card.change}
              </span>
              <span>{card.changeText}</span>
              {card.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
