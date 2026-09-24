import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Importação das folhas de estilo estruturadas
import './styles/global.css'
import './styles/component.css'
import './styles/game.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)