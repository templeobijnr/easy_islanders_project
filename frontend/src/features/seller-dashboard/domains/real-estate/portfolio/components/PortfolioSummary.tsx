import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Card as HUCard, CardHeader as HUCardHeader, CardBody as HUCardBody } from '@heroui/react';

type MixItem = { label: string; count: number };
type Summary = { total_units?: number; short_term?: number; long_term?: number; both?: number };

// Incremental HeroUI adoption: more distinct premium look (emerald → sky)
const StatCard = ({ title, value }: { title: string; value: React.ReactNode }) => (
  <HUCard className="p-0 border border-emerald-100/70 bg-gradient-to-br from-emerald-50 to-sky-50">
    <HUCardHeader className="pb-0 pt-3 px-4 flex-col items-start">
      <p className="text-[11px] uppercase font-semibold text-emerald-700/80 tracking-wide">{title}</p>
    </HUCardHeader>
    <HUCardBody className="py-3 px-4">
      <div className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-sky-600 bg-clip-text text-transparent">{value}</div>
    </HUCardBody>
  </HUCard>
);

export default function PortfolioSummary({ summary, mix }: { summary?: Summary; mix?: MixItem[] }) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Units" value={summary?.total_units ?? 0} />
        <StatCard title="Short-term" value={summary?.short_term ?? 0} />
        <StatCard title="Long-term" value={summary?.long_term ?? 0} />
        <StatCard title="Both" value={summary?.both ?? 0} />
      </div>

      <div className="mt-4">
        <Card className="bg-gradient-to-br from-emerald-50/60 to-sky-50/60 border border-emerald-100/70">
          <CardHeader>
            <CardTitle className="text-sm bg-gradient-to-r from-emerald-700 to-sky-600 bg-clip-text text-transparent">Unit Mix</CardTitle>
          </CardHeader>
          <CardContent>
            {mix && mix.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {mix.map((m) => (
                  <div key={m.label} className="flex items-center justify-between border border-emerald-100 rounded-lg px-3 py-2">
                    <span className="capitalize text-slate-600">{m.label || 'Unknown'}</span>
                    <span className="font-semibold text-emerald-700">{m.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No mix data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
