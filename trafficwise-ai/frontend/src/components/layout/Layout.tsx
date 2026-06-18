import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-navy">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
