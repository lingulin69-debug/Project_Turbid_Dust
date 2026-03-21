import { MapTestView } from './components/MapTestView';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MapTestView />
    </ErrorBoundary>
  );
}

export default App;
