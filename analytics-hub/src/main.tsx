import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PlatformShell } from '@/app/PlatformShell';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlatformShell />
  </StrictMode>,
);
