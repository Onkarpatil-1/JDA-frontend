import { useState } from 'react';
import { ThemeProvider, createTheme, Box, CssBaseline, Container, Typography } from '@mui/material';
import Header from './components/Header';
import DataDistributionDashboard from './components/DataDistributionDashboard';

// import AIChatbot from './components/AIChatbot';

import Sidebar from './components/Sidebar';
import ApplicationsPage from './pages/ApplicationsPage';
// 
import AnomaliesPage from './pages/AnomaliesPage';
import JDAIntelligencePage from './pages/JDAIntelligencePage';
import TextAnalyticsDashboard from './components/TextAnalyticsDashboard';
import ProjectsPage from './pages/ProjectsPage';
import EmployeeAnalyticsPage from './pages/EmployeeAnalyticsPage'; // Add import
import TextAnalyticsPlayground from './pages/TextAnalyticsPlayground'; // Add import
import AIProgressOverlay from './components/AIProgressOverlay'; // Add import
import { ProjectProvider, useProject } from './context/ProjectContext';

const theme = createTheme({
  palette: {
    primary: { main: '#0f172a', dark: '#020617', light: '#f1f5f9' }, // Slate 900 (Navy-ish)
    secondary: { main: '#3b82f6' }, // Blue 500
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
    success: { main: '#10b981', light: '#d1fae5' }, // Emerald
    error: { main: '#ef4444', light: '#fee2e2' }, // Red
    warning: { main: '#f59e0b', light: '#fef3c7' }, // Amber
    info: { main: '#3b82f6', light: '#eff6ff' } // Blue
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '2rem' },
    h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.75rem' },
    h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.1rem' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.925rem', lineHeight: 1.5 },
    subtitle1: { fontSize: '1.1rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.95rem', fontWeight: 600 },
    caption: { fontSize: '0.8rem' },
    button: { fontSize: '0.9rem', fontWeight: 600 }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
    MuiCard: { styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 6px -1px rgba(0,0,0,0.03)' } } },
    MuiChip: { styleOverrides: { label: { fontSize: '0.8rem', fontWeight: 600 } } }
  }
});

function DashboardContent() {
  const { currentProject } = useProject();
  const [activePage, setActivePage] = useState('Data Distribution');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');

  // If no project selected, show Projects page
  if (!currentProject) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', p: 4 }}>
          <ProjectsPage selectedProvider={selectedProvider} onProviderChange={setSelectedProvider} />
          <AIProgressOverlay />
        </Box>
      </ThemeProvider>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      // case 'Dashboard':
      //   return (
      //     <>
      //       <Grid container spacing={3} sx={{ mb: 4 }}>
      //         {dashboardKPIs.map((kpi: any, index: number) => (
      //           <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
      //             <KPICard
      //               {...kpi}
      //               status={kpi.status as 'success' | 'warning' | 'error' | 'info'}
      //             />
      //           </Grid>
      //         ))}
      //       </Grid>

      //       {/* AI Insights Banner - After KPIs */}
      //       <AIInsightsBanner />

      //       {/* <Grid container spacing={4}>
      //         <Grid size={{ xs: 12 }}>

      //           <Box sx={{ mt: 3 }}>
      //             <SLARiskTable data={currentProject.statistics.riskApplications} />
      //           </Box>
      //         </Grid>
      //       </Grid> */}
      //     </>
      //   );
      case 'Applications':
        return <ApplicationsPage />;
      case 'Data Distribution':
        return <DataDistributionDashboard />;
      // case 'Risk Analysis':
      //   return <RiskAnalysisPage />;
      // case 'Analytics':
      //   return <AnalyticsPage />;
      case 'Anomalies':
        return <AnomaliesPage />;
      case 'Text Analytics':
        return <TextAnalyticsDashboard />;
      case 'Employee Analytics':
        return <EmployeeAnalyticsPage />;
      case 'JDA Intelligence':
        return <JDAIntelligencePage />;
      case 'Playground':
        return <TextAnalyticsPlayground />;
      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#0f172a' }}>
              {activePage} View
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This module is currently being populated with real-time JDA telemetry.
            </Typography>
          </Box>
        );
    }
  };

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = isSidebarCollapsed ? 80 : 260;

  // Project is selected, show full dashboard with sidebar
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          onCollapse={setIsSidebarCollapsed}
          currentProject={currentProject}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: `${sidebarWidth}px`,
            width: `calc(100% - ${sidebarWidth}px)`,
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Header />
          <Container maxWidth="xl" sx={{ mt: 3, mb: 4, px: { xs: 2, md: 3 } }}>
            {renderContent()}
          </Container>
        </Box>
        {/* <AIChatbot /> */}
        <AIProgressOverlay />
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ProjectProvider>
      <DashboardContent />
    </ProjectProvider>
  );
}

export default App;

