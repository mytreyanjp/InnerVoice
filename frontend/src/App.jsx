import  Home  from "@/pages/Home"
import SafeStreet from "@/pages/SafeStreet"
import Find from "@/pages/Find"



import { Route,Routes,BrowserRouter as Router } from 'react-router-dom'


function App() {
  

  return (
    <>
      
      <Router>
        <Routes>

            <Route path="/" element={<Home/>}/>
            <Route path="/Find" element={<Find/>}/>
            <Route path="/SafeStreet" element={<SafeStreet/>}/>
            
            
        </Routes>
      </Router>
    </>
  )
}

export default App