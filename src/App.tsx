import { MapTestView } from './components/MapTestView';
import { DemoMap } from './components/map/DemoMap';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const isDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mapDemo') === '1';
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-950 text-white">
        {isDemo ? <DemoMap /> : <MapTestView />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
