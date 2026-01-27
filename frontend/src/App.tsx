import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProfilesPage from './pages/ProfilesPage';
import AutomationPage from './pages/AutomationPage';
import TemplatesPage from './pages/TemplatesPage';
import FieldMappingsPage from './pages/FieldMappingsPage';
import LogViewer from './components/LogViewer';
import ExportImport from './components/ExportImport';
import LogStatus from './components/LogStatus';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Apply Matrix</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Profiles
                  </Link>
                  <Link
                    to="/automation"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Automation
                  </Link>
                  <Link
                    to="/templates"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Templates
                  </Link>
                  <Link
                    to="/field-mappings"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Field Mappings
                  </Link>
                  <Link
                    to="/logs"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Logs
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <ExportImport />
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 min-h-screen">
          <Routes>
            <Route path="/" element={<ProfilesPage />} />
            <Route path="/automation" element={<AutomationPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/field-mappings" element={<FieldMappingsPage />} />
            <Route path="/logs" element={<LogViewer />} />
          </Routes>
        </main>
        <LogStatus />
      </div>
    </Router>
  );
}

export default App;

