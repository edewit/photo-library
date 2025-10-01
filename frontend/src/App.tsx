import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import '@patternfly/react-core/dist/styles/base.css';
import 'leaflet/dist/leaflet.css';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { AppHeader } from './components/AppHeader';
import { HomePage } from './pages/HomePage';
import { EventPage } from './pages/EventPage';
import { PhotoPage } from './pages/PhotoPage';
import { PlacesPage } from './pages/PlacesPage';
import { SearchPage } from './pages/SearchPage';
import { PeoplePage } from './pages/PeoplePage';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />
            <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/places" element={<PlacesPage />} />
              <Route path="/events/:id" element={<EventPage />} />
              <Route path="/photos/:id" element={<PhotoPage />} />
            </Routes>
            </div>
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
