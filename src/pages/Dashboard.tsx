import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllResi, getStats, ResiRecord } from '@/lib/db';
import { COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';

// Warna untuk setiap kurir
const COLORS = [
  '#FF6B35', // Shopee - Orange
  '#E53935', // JNT - Red
  '#00C853', // Goto - Green
  '#7B1FA2', // JNE - Purple
  '#FF9800', // Instan Sameday - Amber
  '#607D8B', // Lainnya - Gray
];

const Dashboard = () => {
  const [records, setRecords] = useState<ResiRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    duplicates: 0,
    byCategory: {} as Record<CourierCategory, number>,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allRecords, statsData] = await Promise.all([
        getAllResi(),
        getStats(),
      ]);
      setRecords(allRecords);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Data untuk Pie Chart (Kumulatif per Kurir)
  const pieChartData = useMemo(() => {
    return COURIER_CATEGORIES
      .map((cat, index) => ({
        name: cat.name,
        value: stats.byCategory[cat.id] || 0,
        color: COLORS[index % COLORS.length],
      }))
      .filter(item => item.value > 0);
  }, [stats.byCategory]);

  // Data untuk Bar Chart (Kumulatif per Kurir)
  const barChartData = useMemo(() => {
    return COURIER_CATEGORIES
      .map((cat, index) => ({
        name: cat.name.replace(' ', '\n'),
        shortName: cat.shortName,
        count: stats.byCategory[cat.id] || 0,
        fill: COLORS[index % COLORS.length],
      }))
      .filter(item => item.count > 0);
  }, [stats.byCategory]);

  // Data scan hari ini
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayRecords = records.filter(r => r.timestamp >= todayTimestamp);
    
    const byCategory: Record<string, number> = {};
    todayRecords.forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });

    return {
      total: todayRecords.length,
      byCategory,
    };
  }, [records]);

  // Data pie chart hari ini
  const todayPieData = useMemo(() => {
    return COURIER_CATEGORIES
      .map((cat, index) => ({
        name: cat.name,
        value: todayStats.byCategory[cat.id] || 0,
        color: COLORS[index % COLORS.length],
      }))
      .filter(item => item.value > 0);
  }, [todayStats.byCategory]);

  // Data trend 7 hari terakhir
  const weeklyTrend = useMemo(() => {
    const days: { date: string; count: number; label: string }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = records.filter(
        r => r.timestamp >= date.getTime() && r.timestamp < nextDate.getTime()
      ).length;

      days.push({
        date: date.toISOString().split('T')[0],
        count,
        label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      });
    }

    return days;
  }, [records]);

  // Format tanggal hari ini
  const todayLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Statistik & Analisis</p>
                </div>
              </div>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              🔄 Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Kumulatif</p>
                  <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hari Ini</p>
                  <p className="text-2xl font-bold">{todayStats.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rata-rata/Hari</p>
                  <p className="text-2xl font-bold">
                    {weeklyTrend.length > 0
                      ? Math.round(weeklyTrend.reduce((sum, d) => sum + d.count, 0) / 7)
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">⚠️</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duplikat</p>
                  <p className="text-2xl font-bold">{stats.duplicates.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Today */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Donut Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                📅 Scan Hari Ini
                <span className="text-xs font-normal text-muted-foreground">
                  ({todayLabel})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={todayPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {todayPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Belum ada data scan hari ini
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Trend Line Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📈 Trend 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8 }}
                    name="Jumlah Scan"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Cumulative */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cumulative Donut Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🍩 Total Kumulatif per Kurir</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cumulative Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📊 Perbandingan Jumlah per Kurir</CardTitle>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="shortName" 
                      width={60} 
                      fontSize={11}
                    />
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Bar 
                      dataKey="count" 
                      name="Jumlah"
                      radius={[0, 4, 4, 0]}
                    >
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📋 Detail per Kurir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Kurir</th>
                    <th className="text-right py-3 px-4 font-semibold">Hari Ini</th>
                    <th className="text-right py-3 px-4 font-semibold">Total</th>
                    <th className="text-right py-3 px-4 font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                {COURIER_CATEGORIES.map((cat, index) => {
                    const total = stats.byCategory[cat.id] || 0;
                    const today = todayStats.byCategory[cat.id] || 0;
                    const percentage = stats.total > 0 
                      ? ((total / stats.total) * 100).toFixed(1) 
                      : '0.0';
                    
                    if (total === 0 && today === 0) return null;
                    
                    return (
                      <tr key={cat.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {cat.name}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {today > 0 ? (
                            <span className="text-green-600">+{today}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="text-right py-3 px-4 font-bold">
                          {total.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-bold">
                    <td className="py-3 px-4">TOTAL</td>
                    <td className="text-right py-3 px-4 text-green-600">
                      +{todayStats.total.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      {stats.total.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
