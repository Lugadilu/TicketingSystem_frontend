// src/components/navigation/navigationItems.ts

export interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const dashboardIcon =
  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';

const ticketsIcon =
  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01';

const usersIcon =
  'M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M12 14a8 8 0 01-8-8m16 0a8 8 0 01-8 8m0 0l-1 4m1-4l1 4';

const analyticsIcon =
  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';

const settingsIcon =
  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z';

const createIcon = 'M12 4v16m8-8H4';

// WhatsApp chat bubble icon
const whatsappIcon =
  'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z';

// SuperAdmin Navigation
export const adminNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: dashboardIcon },
  { name: 'All Tickets', href: '/admin/tickets', icon: ticketsIcon },
  { name: 'Users', href: '/admin/users', icon: usersIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: analyticsIcon },
  { name: 'Settings', href: '/admin/settings', icon: settingsIcon },
];

// Team Lead Navigation
export const teamLeadNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/teamlead/dashboard', icon: dashboardIcon },
  { name: 'Team Tickets', href: '/teamlead/tickets', icon: ticketsIcon },
  { name: 'Team Members', href: '/teamlead/team-members', icon: usersIcon },
];

// Technician Navigation
export const technicianNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/technician/dashboard', icon: dashboardIcon },
  { name: 'Assigned Tickets', href: '/technician/assigned-tickets', icon: ticketsIcon },
];

// Support Navigation — includes WhatsApp Live Chat
export const supportNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/support/dashboard', icon: dashboardIcon },
  { name: 'Support Queue', href: '/support/tickets', icon: ticketsIcon },
  { name: 'Analytics', href: '/support/analytics', icon: analyticsIcon },
  { name: 'WhatsApp Chat', href: '/support/whatsapp', icon: whatsappIcon },
];

// Customer Navigation
export const customerNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: dashboardIcon },
  { name: 'My Tickets', href: '/customer/tickets', icon: ticketsIcon },
  { name: 'Create Ticket', href: '/create-ticket', icon: createIcon },
];




// // src/components/navigation/navigationItems.ts

// export interface NavItem {
//   name: string;
//   href: string;
//   icon: string;
// }

// const dashboardIcon =
//   'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';

// const ticketsIcon =
//   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01';

// const usersIcon =
//   'M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M12 14a8 8 0 01-8-8m16 0a8 8 0 01-8 8m0 0l-1 4m1-4l1 4';

// const analyticsIcon =
//   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';

// const settingsIcon =
//   'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z';

// const createIcon = 'M12 4v16m8-8H4';

// // SuperAdmin Navigation
// export const adminNavigation: NavItem[] = [
//   {
//     name: 'Dashboard',
//     href: '/admin/dashboard',
//     icon: dashboardIcon,
//   },
//   {
//     name: 'All Tickets',
//     href: '/admin/tickets',
//     icon: ticketsIcon,
//   },
//   {
//     name: 'Users',
//     href: '/admin/users',
//     icon: usersIcon,
//   },
//   {
//     name: 'Analytics',
//     href: '/admin/analytics',
//     icon: analyticsIcon,
//   },
//   {
//     name: 'Settings',
//     href: '/admin/settings',
//     icon: settingsIcon,
//   },
// ];

// // Team Lead Navigation
// // Team Leads manage technicians and team-assigned tickets.
// // They do NOT create customer tickets.
// export const teamLeadNavigation: NavItem[] = [
//   {
//     name: 'Dashboard',
//     href: '/teamlead/dashboard',
//     icon: dashboardIcon,
//   },
//   {
//     name: 'Team Tickets',
//     href: '/teamlead/tickets',
//     icon: ticketsIcon,
//   },
//   {
//     name: 'Team Members',
//     href: '/teamlead/team-members',
//     icon: usersIcon,
//   },
// ];

// // Technician Navigation
// export const technicianNavigation: NavItem[] = [
//   {
//     name: 'Dashboard',
//     href: '/technician/dashboard',
//     icon: dashboardIcon,
//   },
//   {
//     name: 'Assigned Tickets',
//     href: '/technician/assigned-tickets',
//     icon: ticketsIcon,
//   },
// ];

// // Support Navigation
// export const supportNavigation: NavItem[] = [
//   {
//     name: 'Dashboard',
//     href: '/support/dashboard',
//     icon: dashboardIcon,
//   },
//   {
//     name: 'Support Queue',
//     href: '/support/tickets',
//     icon: ticketsIcon,
//   },
//   {
//     name: 'Analytics',
//     href: '/support/analytics',
//     icon: analyticsIcon,
//   },
// ];

// // Customer Navigation
// // Only customers create tickets.
// export const customerNavigation: NavItem[] = [
//   {
//     name: 'Dashboard',
//     href: '/customer/dashboard',
//     icon: dashboardIcon,
//   },
//   {
//     name: 'My Tickets',
//     href: '/customer/tickets',
//     icon: ticketsIcon,
//   },
//   {
//     name: 'Create Ticket',
//     href: '/create-ticket',
//     icon: createIcon,
//   },
// ];


