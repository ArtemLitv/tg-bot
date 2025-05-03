import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BotControl from './pages/BotControl';
import EnvConfig from './pages/EnvConfig';
import MenuEditor from './pages/MenuEditor';
import LogViewer from './pages/LogViewer';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bot" element={<BotControl />} />
          <Route path="/env" element={<EnvConfig />} />
          <Route path="/menu" element={<MenuEditor />} />
          <Route path="/logs" element={<LogViewer />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default App;