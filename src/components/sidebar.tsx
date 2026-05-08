// src/components/Sidebar.tsx - COMPLETE STANDALONE COMPONENT

import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRoleCheck } from '../hooks/useRoleCheck';
import {
  adminNavigation,
  teamLeadNavigation,
  technicianNavigation,
  supportNavigation,
  customerNavigation,
} from './navigation/navigationItems';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { isAdmin, isTeamLead, isTechnician, isSupport, isCustomer } = useRoleCheck();

  const getNavigation = () => {
    if (isAdmin()) return adminNavigation;
    if (isTeamLead()) return teamLeadNavigation;
    if (isTechnician()) return technicianNavigation;
    if (isSupport()) return supportNavigation;
    if (isCustomer()) return customerNavigation;

    return customerNavigation;
  };

  const navigation = getNavigation();

  const getRoleBadgeColor = () => {
    if (isAdmin()) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (isTeamLead()) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (isTechnician()) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (isSupport()) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    if (isCustomer()) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';

    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getRoleName = () => {
    if (isAdmin()) return 'Admin';
    if (isTeamLead()) return 'Team Lead';
    if (isTechnician()) return 'Technician';
    if (isSupport()) return 'Support';
    if (isCustomer()) return 'Customer';

    return 'User';
  };

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'} flex flex-col`}
      >
        <div className={`h-16 flex items-center border-b border-gray-200 dark:border-slate-800 ${sidebarOpen ? 'px-6' : 'lg:px-5 px-6'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <span className={`font-bold text-xl text-gray-900 dark:text-white transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
              TicketHub
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '#' && location.pathname.startsWith(item.href));

            if (item.href === '#') {
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-400 dark:text-gray-500 cursor-not-allowed ${
                    !sidebarOpen && 'lg:justify-center'
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                  disabled
                >
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>

                  <span className={`ml-3 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                    {item.name}
                  </span>
                </button>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                } ${!sidebarOpen && 'lg:justify-center'}`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <svg
                  className={`flex-shrink-0 w-5 h-5 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>

                <span className={`ml-3 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className={`border-t border-gray-200 dark:border-slate-800 p-4 ${!sidebarOpen && 'lg:p-2 lg:flex lg:justify-center'}`}>
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:flex-col lg:gap-1'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>

            <div className={`flex-1 min-w-0 ${!sidebarOpen && 'lg:hidden'}`}>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>

              <div className="mt-2">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor()}`}>
                  {getRoleName()}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className={`p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${!sidebarOpen && 'lg:p-1.5'}`}
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}




// // src/components/Sidebar.tsx - COMPLETE STANDALONE COMPONENT

// import { useLocation, useNavigate } from 'react-router-dom';
// import { useAuthStore } from '../store/authStore';
// import { useRoleCheck } from '../hooks/useRoleCheck';
// import {
//   adminNavigation,
//   teamLeadNavigation,
//   technicianNavigation,
//   supportNavigation,
//   customerNavigation,
// } from './navigation/navigationItems';

// interface SidebarProps {
//   sidebarOpen: boolean;
//   setSidebarOpen: (open: boolean) => void;
//   mobileMenuOpen: boolean;
//   setMobileMenuOpen: (open: boolean) => void;
//   onLogout: () => void;
// }

// export default function Sidebar({
//   sidebarOpen,
//   setSidebarOpen,
//   mobileMenuOpen,
//   setMobileMenuOpen,
//   onLogout,
// }: SidebarProps) {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { user } = useAuthStore();
//   const { isAdmin, isTeamLead, isTechnician, isSupport, isCustomer } = useRoleCheck();

//   // Get navigation based on user role
//   const getNavigation = () => {
//     if (isAdmin()) {
//       return adminNavigation;
//     } else if (isTeamLead()) {
//       return teamLeadNavigation;
//     } else if (isTechnician()) {
//       return technicianNavigation;
//     } else if (isSupport()) {
//       return supportNavigation;
//     } else if (isCustomer()) {
//       return customerNavigation;
//     }
//     return customerNavigation; // default
//   };

//   const navigation = getNavigation();

//   // Get role badge color
//   const getRoleBadgeColor = () => {
//     if (isAdmin()) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
//     if (isTeamLead()) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
//     if (isTechnician()) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
//     if (isSupport()) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
//     if (isCustomer()) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
//     return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
//   };

//   // Get role name
//   const getRoleName = () => {
//     if (isAdmin()) return 'Admin';
//     if (isTeamLead()) return 'Team Lead';
//     if (isTechnician()) return 'Technician';
//     if (isSupport()) return 'Support';
//     if (isCustomer()) return 'Customer';
//     return 'User';
//   };

//   return (
//     <>
//       {/* Mobile Sidebar Overlay */}
//       {mobileMenuOpen && (
//         <div 
//           className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
//           onClick={() => setMobileMenuOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside 
//         className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${
//           mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
//         } ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'} flex flex-col`}
//       >
//         {/* Logo Area */}
//         <div className={`h-16 flex items-center border-b border-gray-200 dark:border-slate-800 ${sidebarOpen ? 'px-6' : 'lg:px-5 px-6'}`}>
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
//               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//               </svg>
//             </div>
//             <span className={`font-bold text-xl text-gray-900 dark:text-white transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
//               TicketHub
//             </span>
//           </div>
//         </div>

//         {/* Navigation - DYNAMIC BASED ON ROLE */}
//         <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
//           {navigation.map((item) => {
//             const isActive = location.pathname === item.href || (item.href !== '#' && location.pathname.startsWith(item.href));
//             return (
//               <a
//                 key={item.name}
//                 href={item.href}
//                 onClick={(e) => {
//                   if (item.href === '#') {
//                     e.preventDefault();
//                     return;
//                   }
//                   setMobileMenuOpen(false);
//                 }}
//                 className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
//                   isActive 
//                     ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400' 
//                     : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
//                 } ${!sidebarOpen && 'lg:justify-center'}`}
//                 title={!sidebarOpen ? item.name : undefined}
//               >
//                 <svg 
//                   className={`flex-shrink-0 w-5 h-5 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} 
//                   fill="none" 
//                   stroke="currentColor" 
//                   viewBox="0 0 24 24"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
//                 </svg>
//                 <span className={`ml-3 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
//                   {item.name}
//                 </span>
//               </a>
//             );
//           })}
//         </nav>

//         {/* User Profile Section */}
//         <div className={`border-t border-gray-200 dark:border-slate-800 p-4 ${!sidebarOpen && 'lg:p-2 lg:flex lg:justify-center'}`}>
//           <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:flex-col lg:gap-1'}`}>
//             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
//               {user?.firstName?.[0]}{user?.lastName?.[0]}
//             </div>
//             <div className={`flex-1 min-w-0 ${!sidebarOpen && 'lg:hidden'}`}>
//               <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
//                 {user?.firstName} {user?.lastName}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
//                 {user?.email}
//               </p>
//               {/* Role Badge - Uses function, NO user variable needed! */}
//               <div className="mt-2">
//                 <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor()}`}>
//                   {getRoleName()}
//                 </span>
//               </div>
//             </div>
//             <button 
//               onClick={onLogout}
//               className={`p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${!sidebarOpen && 'lg:p-1.5'}`}
//               title="Logout"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// }
