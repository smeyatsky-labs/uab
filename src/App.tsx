import { useAppStore } from './presentation/store/app-store.ts';
import { ContainerProvider } from './presentation/store/container.tsx';
import { AppShell } from './presentation/components/layout/AppShell.tsx';
import { MarketplacePage } from './presentation/pages/MarketplacePage.tsx';
import { SystemComposerPage } from './presentation/pages/SystemComposerPage.tsx';
import { DashboardPage } from './presentation/pages/DashboardPage.tsx';
import { ProtocolExplorerPage } from './presentation/pages/ProtocolExplorerPage.tsx';

function AppContent() {
  const currentView = useAppStore(s => s.currentView);

  return (
    <AppShell>
      {currentView === 'marketplace' && <MarketplacePage />}
      {currentView === 'builder' && <SystemComposerPage />}
      {currentView === 'dashboard' && <DashboardPage />}
      {currentView === 'explorer' && <ProtocolExplorerPage />}
    </AppShell>
  );
}

export default function App() {
  return (
    <ContainerProvider>
      <AppContent />
    </ContainerProvider>
  );
}
