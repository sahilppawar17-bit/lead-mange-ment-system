import { BrowserRouter, Routes, Route} from "react-router-dom"

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Leads from "./pages/Leads";
import AddLead from "./pages/AddLead"
import LeadDetails from "./pages/LeadDetails";
import EditLead from "./pages/EditLead";
import Settings from "./pages/Settings";

function DashboardLayout({ children }) {
  return (
    <div className="app">
      <Sidebar/>

      <div className="main-area">
        <Header/>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />}/>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard/>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route 
          path="/leads"   
          element={
           <ProtectedRoute>
             <DashboardLayout>
               <Leads />
             </DashboardLayout>
          </ProtectedRoute>
          }
        />

        <Route
          path="/leads/add"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AddLead />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
            path="/leads/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeadDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
        />

        <Route
            path="/leads/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EditLead />
                </DashboardLayout>
              </ProtectedRoute>
            }
        />

        <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings/>
                </DashboardLayout>
              </ProtectedRoute>
            }
        />

      </Routes>    
    </BrowserRouter>
  );
}

export default App;