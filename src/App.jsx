
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import Navbar from './components/Navbar'
import Signup from './components/Signup'

function App() {

  return (
    <>
        <Routes>
          <Route path="/" element={<Navbar />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
    </>
  )
}

export default App
