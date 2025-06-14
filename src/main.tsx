import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MelonChart from './melonChart'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MelonChart />
  </StrictMode>,
)
