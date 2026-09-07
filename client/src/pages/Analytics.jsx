import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Filter, Loader2, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { api } from '../services/api';

const CITIES = ['All', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];
const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Analytics() {
  const [predictions, setPredictions] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('All');
  const [bloodGroup, setBloodGroup] = useState('All');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (city !== 'All') params.city = city;
    if (bloodGroup !== 'All') params.bloodGroup = bloodGroup;

    Promise.all([
      api.getPredictions(params),
      api.getPredictionAccuracy(params),
    ])
      .then(([predData, accData]) => {
        setPredictions(predData);
        setAccuracy(accData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city, bloodGroup]);

  // Aggregate data by date for chart
  const chartData = {};
  predictions.forEach((p) => {
    if (!chartData[p.date]) {
      chartData[p.date] = { date: p.date.slice(5), demand: 0, fulfilled: 0 };
    }
    chartData[p.date].demand += p.predictedDemand;
    chartData[p.date].fulfilled += p.predictedFulfillment;
  });
  const chartArray = Object.values(chartData).sort((a, b) => a.date.localeCompare(b.date));

  // Aggregate by blood group
  const bgData = {};
  predictions.forEach((p) => {
    if (!bgData[p.bloodGroup]) {
      bgData[p.bloodGroup] = { bloodGroup: p.bloodGroup, demand: 0, fulfilled: 0, gap: 0 };
    }
    bgData[p.bloodGroup].demand += p.predictedDemand;
    bgData[p.bloodGroup].fulfilled += p.predictedFulfillment;
    bgData[p.bloodGroup].gap += p.gap;
  });
  const bgArray = Object.values(bgData).sort((a, b) => b.demand - a.demand);

  // Risk summary
  const shortageCount = predictions.filter((p) => p.riskLevel === 'shortage').length;
  const avgFulfillment = predictions.length > 0
    ? (predictions.reduce((s, p) => s + p.fulfillmentRate, 0) / predictions.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        <span className="ml-3 text-red-600">Loading AI predictions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-600" />
            AI Demand Predictions
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            7-day forecast (weighted moving average + trend) — model accuracy is backtested daily against real demand
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">Filter:</span>
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>
            ))}
          </select>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg === 'All' ? 'All Blood Groups' : bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {chartArray.reduce((s, d) => s + d.demand, 0)}
          </p>
          <p className="text-xs text-gray-500">Predicted Demand (7 days)</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <BarChart3 className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{avgFulfillment}%</p>
          <p className="text-xs text-gray-500">Avg Fulfillment Rate</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-600">{shortageCount}</p>
          <p className="text-xs text-gray-500">Shortage Warnings</p>
        </div>
        <div
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center"
          title={`The forecast model is re-run on past days using only prior history, then compared with what actually happened (MAPE-based accuracy, last ${accuracy?.testDays ?? 14} days).`}
        >
          <Target className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {accuracy?.accuracy != null ? `${accuracy.accuracy}%` : '—'}
          </p>
          <p className="text-xs text-gray-500">
            Backtested Accuracy{accuracy?.samples ? ` (${accuracy.samples} forecasts)` : ''}
          </p>
        </div>
      </div>

      {/* Demand vs Fulfillment Line Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Demand vs Fulfillment (Next 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartArray}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="demand" name="Predicted Demand" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="fulfilled" name="Predicted Fulfillment" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Blood Group Breakdown Bar Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Demand by Blood Group</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bgArray}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bloodGroup" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="demand" name="Demand" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fulfilled" name="Fulfillment" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Detailed Predictions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-2.5 px-4 text-gray-500 font-medium">City</th>
                <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Blood</th>
                <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Demand</th>
                <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Fulfillment</th>
                <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Gap</th>
                <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Risk</th>
                <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {predictions.slice(0, 30).map((p, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-700">{p.date}</td>
                  <td className="py-2 px-4 text-gray-700">{p.city}</td>
                  <td className="py-2 px-4">
                    <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-bold">{p.bloodGroup}</span>
                  </td>
                  <td className="py-2 px-4 font-medium">{p.predictedDemand}</td>
                  <td className="py-2 px-4">{p.predictedFulfillment}</td>
                  <td className={`py-2 px-4 font-medium ${p.gap > 3 ? 'text-red-600' : 'text-green-600'}`}>{p.gap}</td>
                  <td className="py-2 px-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.riskLevel === 'shortage' ? 'bg-red-100 text-red-700' :
                      p.riskLevel === 'surplus' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`text-xs ${
                      p.trend === 'rising' ? 'text-red-600' : p.trend === 'falling' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {p.trend === 'rising' ? '↑' : p.trend === 'falling' ? '↓' : '→'} {p.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
