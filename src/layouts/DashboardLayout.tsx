import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { useAuthStore } from '../store/authStore';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Confirm Logout
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to log out?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// import { useState } from 'react';
// import { Outlet, useNavigate } from 'react-router-dom';
// import Sidebar from '../components/sidebar';
// import { ThemeToggle } from '../components/ui/theme-toggle';
// import { useAuthStore } from '../store/authStore';
// import { MessageCircle } from 'lucide-react';
// import WhatsAppLiveChatDashboard from '../components/WhatsAppLiveChatDashboard';

// export default function DashboardLayout() {
//   const navigate = useNavigate();
//   const { clearAuth } = useAuthStore();

//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
//   const [showWhatsAppChat, setShowWhatsAppChat] = useState(false);

//   const handleLogout = () => {
//     setIsLogoutModalOpen(true);
//   };

//   const confirmLogout = () => {
//     setIsLogoutModalOpen(false);
//     clearAuth();
//     navigate('/login');
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
//       <Sidebar
//         sidebarOpen={sidebarOpen}
//         setSidebarOpen={setSidebarOpen}
//         mobileMenuOpen={mobileMenuOpen}
//         setMobileMenuOpen={setMobileMenuOpen}
//         onLogout={handleLogout}
//       />

//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={() => setMobileMenuOpen(true)}
//               className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//               </svg>
//             </button>

//             <button
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="hidden lg:flex p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
//             >
//               <svg
//                 className={`w-5 h-5 transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`}
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
//               </svg>
//             </button>
//           </div>

//           <div className="flex items-center gap-3">
//             {/* WhatsApp Live Chat Button */}
//             <button
//               onClick={() => setShowWhatsAppChat(true)}
//               className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
//             >
//               <MessageCircle size={16} />
//               <span className="hidden sm:inline">WhatsApp Chat</span>
//             </button>

//             <ThemeToggle />
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto p-4 lg:p-8">
//           <Outlet />
//         </main>
//       </div>

//       {/* WhatsApp Live Chat Modal */}
//       <WhatsAppLiveChatDashboard
//         isOpen={showWhatsAppChat}
//         onClose={() => setShowWhatsAppChat(false)}
//       />

//       {isLogoutModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
//           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700 p-6">
//             <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
//               Confirm Logout
//             </h3>
//             <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
//               Are you sure you want to log out?
//             </p>

//             <div className="flex gap-3">
//               <button
//                 onClick={() => setIsLogoutModalOpen(false)}
//                 className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmLogout}
//                 className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


