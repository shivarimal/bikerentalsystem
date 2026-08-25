import './App.css'
import React from 'react'
import LogInPage from './components/LogInPage'
import HomePage from './components/HomePage'
import RecommendationPage from './components/RecommendationPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProfilePage from './components/ProfilePage'
import AdminPage from './components/AdminPage/AdminPage'
import AboutPage from './components/AboutPage'
import ContactPage from './components/ContactPage'
import PaymentPage from './components/PaymentPage'

const App: React.FC = (): JSX.Element => {
    return (
        <div className='container-fluid d-grid align-items-start w-100 p-0' style={{ height: '100vh', zIndex: -5 }}>
            <img src="bg3.jpg" alt="Bike" className="w-100 h-100 position-fixed" style={{ zIndex: -5 }} />
            <BrowserRouter>
                <Routes>
                    <Route path="/Home" element={<HomePage />} />
                    <Route path="/recommendations" element={<RecommendationPage />} />
                    <Route path="/Profile" element={<ProfilePage />} />
                    <Route path="/" element={<LogInPage />} />

                    <Route path="/Admin" element={<AdminPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                </Routes>
            </BrowserRouter>
        </div >
    )
}

export default App
