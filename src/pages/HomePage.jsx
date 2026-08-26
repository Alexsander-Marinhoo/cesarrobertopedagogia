import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import AboutSection from '../components/AboutSection'
import ServicesSection from '../components/ServicesSection'
import CoursesSection from '../components/CoursesSection'
import BookingSection from '../components/BookingSection'
import TestimonialsSection from '../components/TestimonialsSection'
import MaterialsAndBlogSection from '../components/MaterialsAndBlogSection'
import FAQSection from '../components/FAQSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'
import ServiceDetailModal from '../components/ServiceDetailModal'
import MaterialDownloadModal from '../components/MaterialDownloadModal'
import ArticleModal from '../components/ArticleModal'
import PrivacyModal from '../components/PrivacyModal'
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton'
import { initLenis, smoothScrollTo } from '../utils/lenis'
import { useAuth } from '../context/AuthContext'
import { ScrollTrigger } from '../utils/gsapConfig'

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null)
  const [selectedMaterialDownload, setSelectedMaterialDownload] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [bookingAudience] = useState('b2c')
  const [bookingService, setBookingService] = useState('')

  useEffect(() => {
    initLenis()
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
      if (window.location.hash) {
        smoothScrollTo(window.location.hash, { offset: -80 })
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (location.hash) {
      const timer = setTimeout(() => {
        smoothScrollTo(location.hash, { offset: -80 })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [location.hash])

  const scrollToBooking = () => {
    smoothScrollTo('#agendamento', { offset: -70 })
  }

  const handleOpenBookingWithService = (serviceId) => {
    setBookingService(serviceId)
    scrollToBooking()
  }

  // Navega para a Dashboard se logado, ou para Login se visitante
  const handleOpenPortal = () => {
    if (user) {
      navigate('/portal/paciente')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] font-sans selection:bg-[#D4AF37] selection:text-[#002B49]">
      {/* Navigation */}
      <Navbar
        onOpenBooking={scrollToBooking}
        onOpenPortal={handleOpenPortal}
      />

      {/* Hero Section */}
      <Hero onOpenBooking={scrollToBooking} />

      {/* About Section */}
      <AboutSection />

      {/* Specialized Services Grid */}
      <ServicesSection
        onSelectService={(service) => setSelectedServiceDetail(service)}
        onOpenBookingWithService={handleOpenBookingWithService}
      />

      {/* Teacher Training & Courses Platform (Fase 2 AVA) */}
      <CoursesSection
        onOpenPortalWithTab={handleOpenPortal}
      />

      {/* Interactive Online Booking Section */}
      <BookingSection
        _preselectedAudience={bookingAudience}
        preselectedService={bookingService}
      />

      {/* Testimonials & Social Proof */}
      <TestimonialsSection />

      {/* Free Downloadable Guides & Blog Articles */}
      <MaterialsAndBlogSection
        onOpenDownloadModal={(material) => setSelectedMaterialDownload(material)}
        onOpenArticleModal={(article) => setSelectedArticle(article)}
      />

      {/* Frequently Asked Questions */}
      <FAQSection />

      {/* Official Contacts & Location */}
      <ContactSection />

      {/* Institutional Dark Footer */}
      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      {/* Modals */}
      <ServiceDetailModal
        service={selectedServiceDetail}
        onClose={() => setSelectedServiceDetail(null)}
        onBookThisService={(serviceId) => {
          setSelectedServiceDetail(null)
          handleOpenBookingWithService(serviceId)
        }}
      />

      <MaterialDownloadModal
        material={selectedMaterialDownload}
        onClose={() => setSelectedMaterialDownload(null)}
      />

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />


      {/* Floating WhatsApp Action Button */}
      <FloatingWhatsAppButton />
    </div>
  )
}
