import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, LogOut, LayoutDashboard, Newspaper, ArrowRight } from 'lucide-react';

const LandingDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleWorkspace = () => {
    navigate('/workspace');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-lg">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Facturador AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button 
                  onClick={handleWorkspace}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  <LayoutDashboard size={16} />
                  Workspace
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                <LogIn size={16} />
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
            Bienvenido a Facturador AI
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            La solución inteligente para la gestión de tu negocio. Facturación, inventario y reportes en un solo lugar.
          </p>
          
          {!user && (
             <div className="mt-8">
               <button 
                 onClick={handleLogin}
                 className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
               >
                 Comenzar Ahora <ArrowRight size={20} />
               </button>
             </div>
          )}
        </div>

        {/* News & Updates Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="col-span-full mb-4 flex items-center gap-2">
            <Newspaper className="text-indigo-600" />
            <h3 className="text-2xl font-bold text-gray-900">Novedades del Sistema</h3>
          </div>

          {/* Update Card 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Nueva Funcionalidad</div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Módulo de Gastos Automáticos</h4>
            <p className="text-gray-600 mb-4">
              Ahora el sistema genera automáticamente registros de gastos basados en el costo de tus ventas al crear facturas.
            </p>
            <span className="text-sm text-gray-400">21 Feb, 2026</span>
          </div>

          {/* Update Card 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Mejora</div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Reportes Avanzados</h4>
            <p className="text-gray-600 mb-4">
              Hemos actualizado el módulo de reportes para incluir gráficos interactivos y exportación a PDF más rápida.
            </p>
            <span className="text-sm text-gray-400">15 Feb, 2026</span>
          </div>

          {/* Update Card 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Sistema</div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Optimización de Rendimiento</h4>
            <p className="text-gray-600 mb-4">
              Mejoras en la carga de datos y sincronización con la nube para una experiencia más fluida.
            </p>
            <span className="text-sm text-gray-400">10 Feb, 2026</span>
          </div>
        </div>

      </main>
    </div>
  );
};

export default LandingDashboard;
