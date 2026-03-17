import { useState } from 'react'
import './App.css'
import ResumeTracker from './main_app'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ResumeTracker />
    </>
  )
}

export default App
