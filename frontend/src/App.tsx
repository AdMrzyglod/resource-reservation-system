import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProviders } from './app/providers';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResourceList from './pages/ResourceList';
import ResourceForm from './pages/ResourceForm';
import ResourceDetails from './pages/ResourceDetails';
import CreatorResourceDetails from './pages/CreatorResourceDetails';
import OrderDetails from './pages/OrderDetails';

function App() {
  return (
      <Router>
        <AppProviders>
          <div className="flex flex-col min-h-screen font-sans text-slate-900 bg-slate-50">
            <Navbar />
            <main className="flex-grow pt-16 pb-12">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders/:id" element={<OrderDetails />} />

                <Route path="/list" element={<ResourceList />} />
                <Route path="/resources/:id" element={<ResourceDetails />} />

                <Route path="/resources/create" element={<ResourceForm />} />
                <Route path="/creator/map/:id/edit" element={<ResourceForm />} />
                <Route path="/creator/map/:id" element={<CreatorResourceDetails />} />

                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <h1 className="text-4xl font-black text-slate-900">404</h1>
                    <p className="text-slate-500 font-medium">Page not found</p>
                  </div>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </AppProviders>
      </Router>
  );
}
export default App;