
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import Navbar from './components/Navbar'
import Signup from './components/Signup'
import AddFamilyMember from './components/Addfamilymember'

function App() {

  return (
    <>
        <Routes>
          <Route path="/" element={<Navbar />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/add" element={<AddFamilyMember />} />
        </Routes>
    </>
  )
}

export default App
