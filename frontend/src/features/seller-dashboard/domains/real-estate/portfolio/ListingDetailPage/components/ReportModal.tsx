/**
 * ReportModal - Property report modal for listing detail page
 * Provides analytics and performance reporting for the listing
 */

import React, { useState } from 'react';
import { X, Download, TrendingUp, Eye, Users, Calendar, DollarSign, BarChart3, FileText } from 'lucide-react';

interface ReportModalProps {
  listing: {
    id?: number;
    title: string;
    base_price: string;
    currency: string;
    created_at?: string;
    reference_code?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ listing, isOpen, onClose }) => {
  const [reportType, setReportType] = useState<'performance' | 'analytics' | 'financial'>('performance');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  if (!isOpen || !listing) return null;

  const generateReport = () => {
    // Simulate report generation
    const reportData = {
      views: Math.floor(Math.random() * 1000) + 100,
      enquiries: Math.floor(Math.random() * 50) + 10,
      bookings: Math.floor(Math.random() * 20) + 5,
      conversion_rate: (Math.random() * 10 + 2).toFixed(1),
      avg_response_time: Math.floor(Math.random() * 24) + 1,
      revenue: (Math.random() * 10000 + 1000).toFixed(2),
    };
    return reportData;
  };

  const reportData = generateReport();

  const downloadReport = () => {
    // Simulate report download
    const reportContent = `
Property Report: ${listing.title}
Reference: ${listing.reference_code || 'N/A'}
Date Range: ${dateRange}
Generated: ${new Date().toLocaleDateString()}

Performance Metrics:
- Views: ${reportData.views}
- Enquiries: ${reportData.enquiries}
- Bookings: ${reportData.bookings}
- Conversion Rate: ${reportData.conversion_rate}%
- Average Response Time: ${reportData.avg_response_time} hours
- Revenue: ${listing.currency} ${reportData.revenue}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-report-${listing.reference_code || 'listing'}-${dateRange}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Property Report</h2>
              <p className="text-sm text-slate-600">{listing.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Report Type */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="performance">Performance Report</option>
                <option value="analytics">Analytics Report</option>
                <option value="financial">Financial Report</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Download Button */}
            <div className="flex items-end">
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Views</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{reportData.views}</p>
                  <p className="text-xs text-slate-600 mt-1">Total views</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Enquiries</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{reportData.enquiries}</p>
                  <p className="text-xs text-slate-600 mt-1">Total enquiries</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Bookings</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{reportData.bookings}</p>
                  <p className="text-xs text-slate-600 mt-1">Confirmed bookings</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Conversion</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{reportData.conversion_rate}%</p>
                  <p className="text-xs text-slate-600 mt-1">Conversion rate</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Response Time</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{reportData.avg_response_time}h</p>
                  <p className="text-xs text-slate-600 mt-1">Average response</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{listing.currency} {reportData.revenue}</p>
                  <p className="text-xs text-slate-600 mt-1">Total revenue</p>
                </div>
              </div>
            </div>

            {/* Performance Trends */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Trends</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Listing Quality Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-brand-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-900">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Photo Quality</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-900">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Description Quality</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-amber-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-900">78%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recommendations</h3>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg mt-0.5">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Improve Photos</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Adding more high-quality photos can increase views by up to 40%.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-green-100 rounded-lg mt-0.5">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Update Description</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Consider adding more details about amenities and nearby attractions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Report generated on {new Date().toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={downloadReport}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;