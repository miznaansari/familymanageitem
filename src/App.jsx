
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import Navbar from './components/Navbar'
import Signup from './components/Signup'
import AddFamilyMember from './components/Addfamilymember'
import RequestedMember from './components/Requestedmember'
import GroupAdd from './components/Groupadd'
import Familygroup from './components/Familygroup'

function App() {

  return (
    <>
    <Navbar />
        <Routes>
          {/* <Route path="/" element={} /> */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/add" element={<AddFamilyMember />} />
          <Route path="/group" element={<GroupAdd />} />
          <Route path="/request" element={<RequestedMember />} />
          <Route path="/family" element={<Familygroup />} />
        </Routes>
    </>
  )
}

export default App
