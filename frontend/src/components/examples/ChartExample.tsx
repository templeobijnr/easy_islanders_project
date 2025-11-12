import React from "react";
import { ChartBarInteractive } from "../ui/shadcn-io/bar-chart-01";

/**
 * Example: Interactive Bar Chart
 *
 * This demonstrates the premium interactive chart component
 * with animations and hover effects.
 */
export default function ChartExample() {
  // Real estate category data
  const realEstateData = [
    { label: "Villas", value: 450, color: "from-blue-500 to-cyan-500" },
    { label: "Apartments", value: 380, color: "from-purple-500 to-pink-500" },
    { label: "Land", value: 280, color: "from-orange-500 to-red-500" },
    { label: "Commercial", value: 180, color: "from-green-500 to-emerald-500" },
    { label: "Offices", value: 120, color: "from-yellow-500 to-amber-500" },
  ];

  // Services category data
  const servicesData = [
    { label: "Construction", value: 320, color: "from-indigo-500 to-blue-500" },
    { label: "Renovation", value: 280, color: "from-pink-500 to-rose-500" },
    { label: "Cleaning", value: 240, color: "from-teal-500 to-cyan-500" },
    { label: "Maintenance", value: 190, color: "from-amber-500 to-orange-500" },
    { label: "Landscaping", value: 150, color: "from-lime-500 to-green-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-neutral-600">
            Track performance across all categories with premium interactive charts
          </p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Real Estate Chart */}
          <ChartBarInteractive
            data={realEstateData}
            title="Real Estate Listings"
            subtitle="Active listings by property type"
          />

          {/* Services Chart */}
          <ChartBarInteractive
            data={servicesData}
            title="Service Requests"
            subtitle="Requests by service category"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <StatCard
            title="Total Listings"
            value="1,410"
            change="+12%"
            trend="up"
            color="from-brand-500 to-cyan-500"
          />
          <StatCard
            title="Active Users"
            value="8,394"
            change="+23%"
            trend="up"
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            title="Revenue"
            value="€45.2K"
            change="+8%"
            trend="up"
            color="from-orange-500 to-red-500"
          />
        </div>
      </div>
    </div>
  );
}

// Premium Stat Card Component
function StatCard({
  title,
  value,
  change,
  trend,
  color,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg hover:shadow-xl transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-neutral-600">{title}</p>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center`}
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
      </div>
      <p className="text-3xl font-bold text-neutral-900 mb-2">{value}</p>
      <p
        className={`text-sm font-semibold ${
          trend === "up" ? "text-green-600" : "text-red-600"
        }`}
      >
        {change} from last month
      </p>
    </div>
  );
}
