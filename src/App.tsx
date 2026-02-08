import { MapTestView } from './components/MapTestView';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-950 text-white">
        <MapTestView />
      </div>
    </ErrorBoundary>
  );
}

export default App;
