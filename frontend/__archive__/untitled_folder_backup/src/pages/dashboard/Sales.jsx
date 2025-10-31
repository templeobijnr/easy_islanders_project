import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
// import { useAuth } from '../../contexts/AuthContext'; // Unused
// import axios from 'axios'; // Unused

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
// const [error, setError] = useState(null); // Currently unused

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      // Mock sales data for now
      const mockSales = [
        {
          id: 1,
          title: 'iPhone 12',
          buyer: 'John Doe',
          amount: 2000,
          date: '2025-10-21',
          status: 'completed'
        },
        {
          id: 2,
          title: 'MacBook Pro',
          buyer: 'Jane Smith',
          amount: 1500,
          date: '2025-10-20',
          status: 'pending'
        }
      ];
      setSales(mockSales);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const completedSales = sales.filter(s => s.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="Sales" subtitle="Track your sales and revenue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading sales data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Sales" subtitle="Track your sales and revenue" />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{totalRevenue}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Sales</p>
                <p className="text-2xl font-bold text-gray-900">{completedSales}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Sales</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length - completedSales}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Recent Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Buyer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{sale.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.buyer}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">€{sale.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sale.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sale.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
