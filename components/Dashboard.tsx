import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Invoice, Product } from '../types';
import { GeminiService } from '../services/geminiService';
import { Sparkles, TrendingUp, DollarSign, Package, FileText, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  products: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, products }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Calculate Stats
  const totalRevenue = useMemo(() => invoices.reduce((acc, curr) => acc + curr.total, 0), [invoices]);
  const paidInvoices = useMemo(() => invoices.filter(i => i.status === 'paid').length, [invoices]);
  const pendingInvoices = useMemo(() => invoices.filter(i => i.status === 'pending').length, [invoices]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock < 5).length, [products]);

  // Chart Data
  const chartData = useMemo(() => {
    return invoices.slice(-7).map(inv => ({
      name: new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: inv.total
    }));
  }, [invoices]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await GeminiService.analyzeBusinessData(invoices, products);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-current`}>
          <Icon size={24} />
        </div>
        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <ArrowUpRight size={12} className="mr-1" /> +2.5%
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Panel de Control</h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">Resumen general de tu negocio</p>
        </div>
        <button
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-70 shadow-lg shadow-slate-200 active:scale-95"
        >
          <Sparkles size={18} className={loadingAi ? "animate-spin" : ""} />
          {loadingAi ? 'Analizando...' : 'Insights IA'}
        </button>
      </div>

      {/* AI Analysis Result */}
      {aiAnalysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-200 rounded-full blur-3xl opacity-50"></div>
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-4 relative z-10">
            <Sparkles size={20} className="text-indigo-600" /> Análisis Inteligente
          </h3>
          <div className="prose prose-sm prose-indigo max-w-none text-gray-700 relative z-10 bg-white/60 p-4 rounded-xl backdrop-blur-sm">
            {aiAnalysis.split('\n').map((line, i) => (
              <p key={i} className="my-1">{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos Totales" 
          value={`$${totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          colorClass="text-green-600 bg-green-500"
          subtext="Actualizado hoy"
        />
        <StatCard 
          title="Facturas Pagadas" 
          value={paidInvoices} 
          icon={FileText} 
          colorClass="text-blue-600 bg-blue-500"
          subtext="En el último mes"
        />
        <StatCard 
          title="Pendientes" 
          value={pendingInvoices} 
          icon={TrendingUp} 
          colorClass="text-yellow-600 bg-yellow-500"
          subtext="Requieren atención"
        />
        <StatCard 
          title="Stock Bajo" 
          value={lowStockCount} 
          icon={Package} 
          colorClass="text-red-600 bg-red-500"
          subtext="Productos por agotar"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800">Ventas Recientes</h3>
             <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Últimos 7 días</span>
          </div>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, dy: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                    itemStyle={{color: '#fff'}}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800">Tendencia de Ingresos</h3>
             <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Tiempo Real</span>
           </div>
           <div className="h-72 w-full">
             {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, dy: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{r: 4, fill: '#fff', strokeWidth: 2}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                  />
                </LineChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No hay datos suficientes
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;