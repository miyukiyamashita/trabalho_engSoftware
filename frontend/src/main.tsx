import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/componentes.css'
import App from './App.tsx'
import './styles/responsivo.css'
import { AuthProvider } from "./contexts/AuthContext";
import { FeedbackProvider } from "./components/Feedback";
import { ConfirmProvider } from "./components/ConfirmDialog";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FeedbackProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </FeedbackProvider>
    </AuthProvider>
  </StrictMode>,
)
