
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, Users, Settings as SettingsIcon, Menu, LogOut, X, PieChart, Receipt, ChevronLeft, ChevronRight, Cloud, WifiOff, Wallet } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { isFirebaseInitialized } from './services/firebase';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { logout, user } = useAuth();

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Check inicial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar al navegar en móvil
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Panel' },
    { path: '/invoices', icon: FileText, label: 'Facturas' },
    { path: '/create-invoice', icon: FileText, label: 'Nueva Factura', highlight: true },
    { path: '/create-receipt', icon: Wallet, label: 'Nuevo Recibo' },
    { path: '/inventory', icon: Package, label: 'Inventario' },
    { path: '/customers', icon: Users, label: 'Clientes' },
    { path: '/expenses', icon: Receipt, label: 'Gastos' },
    { path: '/reports', icon: PieChart, label: 'Reportes' },
    { path: '/settings', icon: SettingsIcon, label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative isolate">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-black text-white transition-all duration-300 ease-in-out flex flex-col border-r border-gray-800
          ${sidebarOpen ? 'w-64 translate-x-0 shadow-2xl' : 'w-64 -translate-x-full shadow-none lg:w-20 lg:translate-x-0 lg:shadow-2xl'}
        `}
      >
        {/* Sidebar Header */}
        <div className={`p-4 flex items-center border-b border-gray-800 h-20 transition-all ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen ? (
             <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-black font-bold shadow-lg flex-shrink-0">
                  F
                </div>
                <h1 className="text-xl font-bold text-white whitespace-nowrap tracking-tight">
                  Facturador AI
                </h1>
             </div>
          ) : (
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg">
              FA
            </div>
          )}
          
          {/* Botón de Toggle (Desktop) */}
          {!isMobile && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`
                p-1.5 rounded-lg bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-all shadow-sm border border-gray-700
                ${!sidebarOpen ? 'absolute -right-3 top-7 z-50 bg-black text-white border-gray-600 hidden lg:flex' : ''}
              `}
              title={sidebarOpen ? "Contraer menú" : "Expandir menú"}
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          )}

          {/* Botón Cerrar (Mobile) */}
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white p-1 bg-gray-900 rounded-lg">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 overflow-x-hidden">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen && isMobile ? item.label : ''} 
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 whitespace-nowrap group
                  ${isActive ? 'bg-white text-black shadow-lg shadow-gray-900/50' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}
                  ${item.highlight && !isActive ? 'border border-gray-700 text-gray-300 bg-gray-900' : ''}
                  ${!sidebarOpen ? 'justify-center' : ''}
                `}
              >
                <div className="relative flex items-center justify-center flex-shrink-0">
                   <item.icon size={22} className={`min-w-[22px] ${isActive ? 'animate-pulse-once' : ''}`} />
                   {/* Tooltip flotante (Solo Desktop) */}
                   {!sidebarOpen && !isMobile && (
                     <div className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-800">
                       {item.label}
                     </div>
                   )}
                </div>
                
                <span className={`font-medium transition-all duration-200 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User */}
        <div className="p-4 border-t border-gray-800 bg-black">
          {/* Connection Status Indicator */}
           {sidebarOpen && (
            <div className={`mb-4 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold border ${isFirebaseInitialized ? 'bg-gray-900 text-gray-300 border-gray-700' : 'bg-gray-900 text-gray-500 border-gray-800'}`}>
              {isFirebaseInitialized ? <Cloud size={14} /> : <WifiOff size={14} />}
              <span>{isFirebaseInitialized ? 'Conectado (Cloud)' : 'Modo Local'}</span>
            </div>
          )}

          <button 
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-gray-900 hover:text-white transition-all whitespace-nowrap group ${!sidebarOpen ? 'justify-center' : ''}`}
            title="Cerrar Sesión"
          >
            <LogOut size={22} className="min-w-[22px]" />
            <span className={`font-medium transition-all duration-200 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
              Salir
            </span>
          </button>
          
          {sidebarOpen && (
            <div className="mt-4 flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <p className="text-[10px] text-gray-500 font-medium">Administrador</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full min-w-0 transition-all duration-300">
        {/* Top Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-30 relative h-16">
             <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-900 active:bg-gray-200">
                  <Menu size={24}/>
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">FA</div>
                  <span className="font-bold text-gray-900 text-lg">Facturador AI</span>
                </div>
             </div>
             <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-900 font-bold text-xs border border-gray-200">
               {user?.email?.charAt(0).toUpperCase()}
             </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8 scroll-smooth bg-gray-50">
          <div className="max-w-[1920px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
