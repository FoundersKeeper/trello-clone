import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BoardPage from './pages/BoardPage'
import PlannerPage from './pages/PlannerPage'
import DocsPage from './pages/DocsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:pageId" element={<DocsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
