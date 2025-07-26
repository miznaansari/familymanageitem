
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import Navbar from './components/Navbar'
import Signup from './components/Signup'
import AddFamilyMember from './components/Addfamilymember'
import RequestedMember from './components/Requestedmember'

function App() {

  return (
    <>
    <Navbar />
        <Routes>
          {/* <Route path="/" element={} /> */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/add" element={<AddFamilyMember />} />
          <Route path="/request" element={<RequestedMember />} />
        </Routes>
    </>
  )
}

export default App
