// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { Send, BarChart3, TrendingUp, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sql?: string
  data?: { columns: string[]; rows: any[][] }
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6']

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverWaking, setServerWaking] = useState(true)

  // Ping Render service on mount to wake it up
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        const vannaUrl = process.env.NEXT_PUBLIC_VANNA_URL || 'http://localhost:8000'
        await fetch(`${vannaUrl}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(30000) // 30 second timeout
        })
        setServerWaking(false)
      } catch (error) {
        // If it fails, still set to false after timeout
        setTimeout(() => setServerWaking(false), 3000)
      }
    }
    
    wakeUpServer()
  }, [])

  // Detect if data should be visualized
  const shouldVisualize = (data: { columns: string[]; rows: any[][] }) => {
    if (!data || data.rows.length === 0) return null
    
    const cols = data.columns.map(c => c.toLowerCase())
    const hasNumeric = data.rows.some(row => row.some(cell => typeof cell === 'number' || !isNaN(parseFloat(cell))))
    
    // Time series detection (has date/time column + numeric column)
    const hasTime = cols.some(c => c.includes('date') || c.includes('month') || c.includes('year') || c.includes('time'))
    if (hasTime && hasNumeric && data.rows.length > 1) return 'line'
    
    // Aggregation detection (has count/sum/total + category)
    const hasAggregation = cols.some(c => c.includes('count') || c.includes('sum') || c.includes('total') || c.includes('amount') || c.includes('forecast'))
    if (hasAggregation && data.rows.length <= 20) return 'bar'
    
    // Pie chart for small categorical data
    if (data.rows.length <= 10 && data.columns.length === 2 && hasNumeric) return 'pie'
    
    return null
  }

  const renderChart = (data: { columns: string[]; rows: any[][] }) => {
    const chartType = shouldVisualize(data)
    if (!chartType) return null

    // Transform data for Recharts
    const chartData = data.rows.map(row => {
      const obj: any = {}
      data.columns.forEach((col, i) => {
        obj[col] = row[i]
      })
      return obj
    })

    const numericCols = data.columns.filter((col, i) => 
      data.rows.some(row => typeof row[i] === 'number' || !isNaN(parseFloat(row[i])))
    )
    const labelCol = data.columns.find(c => !numericCols.includes(c)) || data.columns[0]
    const valueCol = numericCols[0] || data.columns[1]

    if (chartType === 'pie') {
      return (
        // @ts-ignore - Type conflict between React versions
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4" />
              Distribution Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={chartData}
                  dataKey={valueCol}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )
    }

    if (chartType === 'line') {
      return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={labelCol} />
                <YAxis />
                <Tooltip />
                <Legend />
                {numericCols.map((col, idx) => (
                  <Line key={col} type="monotone" dataKey={col} stroke={COLORS[idx]} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )
    }

    if (chartType === 'bar') {
      return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Comparison Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={labelCol} />
                <YAxis />
                <Tooltip />
                <Legend />
                {numericCols.map((col, idx) => (
                  <Bar key={col} dataKey={col} fill={COLORS[idx]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  const getInsights = (data: { columns: string[]; rows: any[][] }) => {
    if (!data || data.rows.length === 0) return null

    const insights = []
    
    // Row count insight
    insights.push(`Found ${data.rows.length} record${data.rows.length !== 1 ? 's' : ''}`)
    
    // Find numeric columns and calculate totals
    const numericCols = data.columns.filter((col, i) => 
      data.rows.some(row => typeof row[i] === 'number' || !isNaN(parseFloat(row[i])))
    )
    
    numericCols.forEach(col => {
      const colIndex = data.columns.indexOf(col)
      const values = data.rows.map(row => parseFloat(row[colIndex]) || 0)
      const total = values.reduce((a, b) => a + b, 0)
      const avg = total / values.length
      
      if (col.toLowerCase().includes('amount') || col.toLowerCase().includes('total') || col.toLowerCase().includes('forecast')) {
        insights.push(`${col}: $${total.toFixed(2)} total, $${avg.toFixed(2)} average`)
      }
    })
    
    return insights.length > 1 ? insights : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: ChatMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat-with-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      })
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `Here are the results for: "${input}"`,
        sql: data.sql,
        data: { columns: data.columns || [], rows: data.rows || [] }
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error processing your query.'
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}. Please make sure the Vanna AI service is running on http://localhost:8000` 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat with Data</h2>
              <p className="text-sm text-gray-600">Ask questions about your analytics data in natural language.</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4 min-h-[500px] max-h-[600px] overflow-y-auto">
              {/* Server Waking Up Message */}
              {serverWaking && (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Waking up AI server...
                    <br />
                    <span className="text-xs">(First load may take 30 seconds)</span>
                  </p>
                </div>
              )}
              
              {!serverWaking && messages.length === 0 && (
                <div className="text-center mt-12">
                  <div className="text-muted-foreground mb-6">
                    <p className="text-lg font-semibold mb-2">Ask questions about your data</p>
                    <p className="text-sm">Natural language AI will generate SQL and visualizations</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    <button
                      onClick={() => setInput("Show me all invoices that need to be paid")}
                      className="p-4 text-left border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <div className="font-medium text-sm mb-1">Unpaid Invoices</div>
                      <div className="text-xs text-muted-foreground">Show invoices that need to be paid</div>
                    </button>
                    
                    <button
                      onClick={() => setInput("Top 5 vendors by total spending")}
                      className="p-4 text-left border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <div className="font-medium text-sm mb-1">Top Vendors</div>
                      <div className="text-xs text-muted-foreground">Highest spending by vendor</div>
                    </button>
                    
                    <button
                      onClick={() => setInput("Monthly invoice trends for the last 6 months")}
                      className="p-4 text-left border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <div className="font-medium text-sm mb-1">Monthly Trends</div>
                      <div className="text-xs text-muted-foreground">Invoice trends over time</div>
                    </button>
                    
                    <button
                      onClick={() => setInput("Show me upcoming payment forecasts")}
                      className="p-4 text-left border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <div className="font-medium text-sm mb-1">Payment Forecast</div>
                      <div className="text-xs text-muted-foreground">Upcoming collections prediction</div>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-secondary'}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    
                    {msg.sql && (
                      <div className="mt-2 text-left">
                        <Card className="bg-slate-950">
                          <CardContent className="p-3 text-xs font-mono text-slate-100">
                            <div className="text-slate-400 mb-1">Generated SQL:</div>
                            {msg.sql}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {msg.data && msg.data.rows.length > 0 && (
                      <div className="mt-2 text-left space-y-4">
                        {/* Insights Card */}
                        {getInsights(msg.data) && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                              <div className="text-sm font-semibold text-blue-900 mb-2">📊 Key Insights</div>
                              <ul className="text-sm text-blue-800 space-y-1">
                                {getInsights(msg.data)!.map((insight, i) => (
                                  <li key={i}>• {insight}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {/* Auto-generated Chart */}
                        {renderChart(msg.data)}
                        
                        {/* Data Table */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Data Table</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0 max-h-96 overflow-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-secondary sticky top-0">
                                <tr>
                                  {msg.data.columns.map((col, i) => (
                                    <th key={i} className="px-4 py-2 text-left font-semibold">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {msg.data.rows.slice(0, 50).map((row, i) => (
                                  <tr key={i} className="hover:bg-secondary/50">
                                    {row.map((cell, j) => (
                                      <td key={j} className="px-4 py-2">
                                        {typeof cell === 'number' ? cell.toLocaleString() : cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {msg.data.rows.length > 50 && (
                              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                                Showing 50 of {msg.data.rows.length} rows
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
