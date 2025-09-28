import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../Components/Sidebar'
import AppointmentBooking from '../../Components/AppointmentBooking'
import { FaSearch, FaFilter, FaStar, FaClock, FaVideo, FaMapPin, FaCalendar, FaUser, FaStethoscope, FaHeart, FaPhone, FaEnvelope, FaUserMd } from 'react-icons/fa'
import { FaUserDoctor } from "react-icons/fa6";
import axios from 'axios'
import { getNotificationService } from '../../utils/real-time-notifications'
import { VideoCallService, initializeVideoCallService } from '../../utils/video-call'

interface Doctor {
  _id: string;
  doctorId: string;
  fullname: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: string;
  location: string;
  medicalRegNo: string;
  specialization: string;
  password?: string;
  profileImage?: string;
  qualification?: string;
  experience?: number;
  consultationFee?: number;
  about?: string;
  rating?: number;
  totalRatings?: number;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  // Frontend display fields (computed)
  id: string;
  name: string;
  totalPatients: number;
  languages: string[];
  education: string;
  hospital: string;
  image: string;
  bio: string;
}

const DoctorsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'experience' | 'rating' | 'fee'>('rating');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Extract specialization from URL if provided
  useEffect(() => {
    const urlSpecialization = searchParams.get('specialization');
    if (urlSpecialization) {
      setSelectedSpecialization(urlSpecialization);
    }
  }, [searchParams]);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [videoCallService, setVideoCallService] = useState<VideoCallService | null>(null);
  const [isCallingDoctor, setIsCallingDoctor] = useState<string | null>(null);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'requesting' | 'waiting' | 'accepted' | 'rejected'>('idle');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(6);

  useEffect(() => {
    fetchDoctors();
    initializeVideoCall();
    
    // Cleanup
    return () => {
      if (videoCallService) {
        videoCallService.disconnect();
      }
    };
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSpecialization]);

  const initializeVideoCall = async () => {
    try {
      let patientId: string | null = null;
      
      // Try to get patient ID from localStorage/sessionStorage first
      const storedPatientId = localStorage.getItem('patientId') || sessionStorage.getItem('patientId') || localStorage.getItem('userId') || sessionStorage.getItem('userId');
      console.log('🔥 PATIENT: Trying stored patient ID:', storedPatientId);
      
      if (storedPatientId) {
        patientId = storedPatientId;
      } else {
        // Fallback: try API
        try {
          const response = await axios.get(`${(import.meta as any).env.VITE_BACKEND_URL}/api/patients/me`, {
            withCredentials: true
          });
          patientId = response.data.patientId || response.data._id || response.data.id;
          console.log('🔥 PATIENT: Got patient ID from API:', patientId);
        } catch (apiError) {
          console.log('🔥 PATIENT: API failed, using test patient ID');
          // For testing: use a hardcoded patient ID (custom patientId, not MongoDB ObjectId)
          patientId = 'PATIENT001'; // Use custom patient ID for testing
        }
      }
      
      if (!patientId) {
        console.error('❌ PATIENT: No patient ID found');
        return;
      }
      
      console.log('🔥 PATIENT: Initializing video call service with ID:', patientId);
      const service = initializeVideoCallService(patientId, 'patient');
      setVideoCallService(service);
      
      // Set up event listeners
      service.onCallRequestSent((data) => {
        console.log('🔥 PATIENT: Call request sent:', data);
        setCallStatus('waiting');
      });
      
      service.onCallAccepted((data) => {
        console.log('🔥 PATIENT: Call accepted:', data);
        setCallStatus('accepted');
        setShowVideoCallModal(false);
        // Navigate to video call page
        navigate(`/patient/video-call/${data.callId}`);
      });
      
      service.onCallRejected((data) => {
        console.log('🔥 PATIENT: Call rejected:', data);
        setCallStatus('rejected');
        setTimeout(() => {
          setShowVideoCallModal(false);
          setCallStatus('idle');
          setIsCallingDoctor(null);
        }, 3000);
      });
      
      service.onCallError((data) => {
        console.error('🔥 PATIENT: Call error:', data);
        // Don't show alert for minor errors, just log them
        setCallStatus('idle');
        setShowVideoCallModal(false);
        setIsCallingDoctor(null);
      });
      
    } catch (error) {
      console.error('Failed to initialize video call service:', error);
    }
  };


  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${(import.meta as any).env.VITE_BACKEND_URL}/api/doctors`, {
        withCredentials: true
      });
      
      // Transform the database doctors to match frontend interface
      const transformedDoctors: Doctor[] = response.data.map((doctor: any, index: number) => ({
        // Keep all original schema fields
        _id: doctor._id,
        doctorId: doctor.doctorId,
        fullname: doctor.fullname,
        email: doctor.email,
        phone: doctor.phone,
        dateOfBirth: doctor.dateOfBirth,
        gender: doctor.gender,
        location: doctor.location,
        medicalRegNo: doctor.medicalRegNo,
        specialization: doctor.specialization,
        profileImage: doctor.profileImage,
        qualification: doctor.qualification,
        experience: doctor.experience || 0,
        consultationFee: doctor.consultationFee || 100,
        about: doctor.about,
        rating: doctor.rating || 4.5,
        totalRatings: doctor.totalRatings || 0,
        isVerified: doctor.isVerified || false,
        lastLogin: doctor.lastLogin,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
        // Computed frontend display fields
        id: doctor._id,
        name: doctor.fullname,
        totalPatients: doctor.totalRatings || 0,
        languages: ["English"], // Default for now
        education: doctor.qualification || "Medical Degree",
        hospital: doctor.location || "Medical Center",
        image: doctor.profileImage || `user1.jpg`,
        bio: doctor.about || `Experienced ${doctor.specialization} with ${doctor.experience || 0} years of practice.`
      }));
      
      setDoctors(transformedDoctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const getDoctorImageId = (index: number) => {
    const imageIds = [
      '559839734-2b71ea197ec2',
      '612349317150-e413f6a5b16d',
      '594824373639-9b5b4b8b8b8b',
      '1582750433-7c75a6da9b21',
      '1559757148-5c350d0d426c'
    ];
    return imageIds[index % imageIds.length];
  };

  // Add loading and error handling to the JSX
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Sidebar />
        <main className="lg:ml-80 p-4 lg:p-8 xl:p-12 overflow-y-auto min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading doctors...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Sidebar />
        <main className="lg:ml-80 p-4 lg:p-8 xl:p-12 overflow-y-auto min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-xl mb-4">⚠️ Error Loading Doctors</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchDoctors}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const specializations = ['all', ...Array.from(new Set(doctors.map(d => d.specialization)))];

  const filteredDoctors = doctors
    .filter(doctor => 
      // Only search by doctor name
      doctor.fullname.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(doctor => 
      selectedSpecialization === 'all' || doctor.specialization === selectedSpecialization
    )
    .sort((a, b) => {
      // If specialization is selected, sort by experience in decreasing order
      if (selectedSpecialization !== 'all') {
        return (b.experience || 0) - (a.experience || 0);
      }
      // Default sorting
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'experience') return (b.experience || 0) - (a.experience || 0);
      if (sortBy === 'fee') return (a.consultationFee || 0) - (b.consultationFee || 0);
      if (sortBy === 'name') return a.fullname.localeCompare(b.fullname);
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);
  const startIndex = (currentPage - 1) * doctorsPerPage;
  const endIndex = startIndex + doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  const openModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDoctor(null);
  };

  const openBookingModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedDoctor(null);
  };

  const handleBookingSuccess = (appointmentId: string) => {
    alert(`Appointment booked successfully! Appointment ID: ${appointmentId}`);
    // You could navigate to appointments page or show a success message
  };

  const startVideoCall = async (doctor: Doctor) => {
    if (!videoCallService) {
      alert('Video call service not initialized. Please refresh the page.');
      return;
    }

    try {
      setIsCallingDoctor(doctor.doctorId);
      setSelectedDoctor(doctor);
      setCallStatus('requesting');
      setShowVideoCallModal(true);
      
      // Get current user info
        const response = await axios.get(`${(import.meta as any).env.VITE_BACKEND_URL}/api/auth/me`, {
        withCredentials: true
      });
      console.log(response)
      
      const patientName = response.data.user.fullname || 'Patient';
      console.log('🔥 PATIENT: Starting video call with doctor:', doctor.fullname);
      console.log('🔥 PATIENT: Patient name:', patientName);

      // For immediate video calls, we don't need to create an appointment upfront
      // The appointment can be created after the call if needed
      console.log('🔥 PATIENT: Starting immediate video call - no appointment needed upfront');
      
      // Request video call
      console.log('🔥 PATIENT: About to request video call with doctor:', {
        doctorId: doctor._id,
        doctorName: doctor.fullname,
        patientName: patientName,
        specialization: doctor.specialization
      });
      
      console.log('🔥 PATIENT: Video call service status:', {
        service: !!videoCallService,
        connected: videoCallService?.isServiceConnected()
      });
      
      if (!videoCallService) {
        alert('Video call service not initialized! Please refresh the page.');
        return;
      }
      
      if (!videoCallService.isServiceConnected()) {
        alert('Video call service not connected! Please check your internet connection.');
        return;
      }
      
      const callResult = videoCallService.requestVideoCall({
        doctorId: doctor._id,
        doctorName: doctor.fullname,
        patientName: patientName,
        specialization: doctor.specialization
      });
      
      console.log('🔥 PATIENT: Video call request result:', callResult);
      
      if (callResult) {
        alert(`Video call request sent to Dr. ${doctor.fullname}! Call ID: ${callResult}`);
      } else {
        alert('Failed to send video call request!');
      }
      
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please try again.');
      setCallStatus('idle');
      setShowVideoCallModal(false);
      setIsCallingDoctor(null);
    }
  };

  const cancelVideoCall = () => {
    setShowVideoCallModal(false);
    setCallStatus('idle');
    setIsCallingDoctor(null);
    setSelectedDoctor(null);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Sidebar />
      <main className="lg:ml-80 p-4 lg:p-6 overflow-y-auto min-h-screen">
        {/* Header Section - My Appointments */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 mb-8 relative overflow-hidden">
          {/* Background decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-green-200/20 rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-200/20 rounded-full translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10">
            {/* Title with Calendar Icon */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-teal-300 rounded-full flex items-center justify-center">
                <FaUserDoctor className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">Doctors Lists</h1>
                <p className="text-teal-100 text-lg">Browse and connect with top doctors for your healthcare needs</p>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by doctor name..."
                  className="w-full px-6 py-4 rounded-full bg-white/90 backdrop-blur-sm border-0 text-gray-800 placeholder-gray-500 outline-none transition-all duration-300 text-lg shadow-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Specialization Dropdown */}
              <div className="flex gap-3">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full border-0 outline-none transition-all duration-300 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px',
                    paddingRight: '40px'
                  }}
                >
                  <option value="all" className="text-gray-800">All Types</option>
                  {specializations.filter(spec => spec !== 'all').map(spec => (
                    <option key={spec} value={spec} className="text-gray-800">
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
              {/* Profile Section */}
              <div className="p-6 text-center">
                {/* Profile Avatar */}
                <div className="relative mx-auto mb-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
                    <FaUserDoctor className="text-3xl text-white" />
                  </div>
                </div>
                
                {/* Doctor Info */}
                <h3 className="text-lg font-bold text-gray-800 mb-1">{doctor.fullname}</h3>
                <p className="text-emerald-600 font-medium text-sm mb-3">{doctor.specialization}</p>
                
                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-3">
                  <FaStar className="text-yellow-500 text-sm" />
                  <span className="text-sm font-medium text-gray-700">{doctor.rating || 4.5}</span>
                  <span className="text-xs text-gray-500">({doctor.totalRatings || 0}+ ratings)</span>
                </div>
                
                {/* Experience */}
                <div className="flex items-center justify-center gap-1 mb-3">
                  <FaStethoscope className="text-gray-400 text-sm" />
                  <span className="text-sm text-gray-600">{doctor.experience || 0} years experience</span>
                </div>
                
                {/* Location */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  <FaMapPin className="text-gray-400 text-sm" />
                  <span className="text-sm text-gray-600 truncate">{doctor.location}</span>
                </div>
                
                {/* Fee */}
                <div className="mb-4">
                  <span className="text-xl font-bold text-emerald-600">₹{doctor.consultationFee || 100}</span>
                  <span className="text-sm text-gray-500"> /consultation</span>
                </div>
                
                {/* Action Button */}
                <button
                  onClick={() => startVideoCall(doctor)}
                  disabled={isCallingDoctor === doctor.doctorId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <FaVideo className="text-sm" />
                  {isCallingDoctor === doctor.doctorId ? 'Calling...' : 'Start Video Call'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDoctors.length === 0 && !loading && (
          <div className="text-center py-16">
            <FaUserMd className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No doctors found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters</p>
          </div>
        )}

        {/* Pagination */}
        {filteredDoctors.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === page
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        )}

        {/* Results Info */}
        {filteredDoctors.length > 0 && (
          <div className="text-center mt-4 text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length} doctors
          </div>
        )}

        {/* Doctor Detail Modal */}
        {isModalOpen && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Doctor Profile</h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-start gap-6 mb-6">
                  <img 
                    src={selectedDoctor.image} 
                    alt={selectedDoctor.name}
                    className="w-32 h-32 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedDoctor.fullname}</h3>
                    <p className="text-emerald-600 font-medium mb-2">{selectedDoctor.specialization}</p>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-500" />
                        <span className="font-medium">{selectedDoctor.rating || 4.5}</span>
                      </div>
                      <span className="text-gray-600">{selectedDoctor.totalRatings || 0}+ ratings</span>
                    </div>
                    <p className="text-gray-600">{selectedDoctor.qualification || 'Medical Degree'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Experience</h4>
                    <p className="text-gray-600">{selectedDoctor.experience || 0} years</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Location</h4>
                    <p className="text-gray-600">{selectedDoctor.location}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Medical Reg. No.</h4>
                    <p className="text-gray-600">{selectedDoctor.medicalRegNo}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Consultation Fee</h4>
                    <p className="text-emerald-600 font-bold text-xl">₹{selectedDoctor.consultationFee || 100}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">About</h4>
                  <p className="text-gray-600">{selectedDoctor.about || `Experienced ${selectedDoctor.specialization} specialist.`}</p>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      closeModal();
                      openBookingModal(selectedDoctor);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-300"
                  >
                    <FaVideo />
                    Book Video Consultation
                  </button>
                  <button 
                    onClick={() => {
                      closeModal();
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-300"
                  >
                    <FaPhone />
                    Contact Doctor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Booking Modal */}
        {isBookingModalOpen && selectedDoctor && (
          <AppointmentBooking
            doctor={selectedDoctor}
            isOpen={isBookingModalOpen}
            onClose={closeBookingModal}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {/* Video Call Modal */}
        {showVideoCallModal && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
              <div className="mb-4">
                <img 
                  src={selectedDoctor.image} 
                  alt={selectedDoctor.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedDoctor.fullname}</h3>
                <p className="text-emerald-600 font-medium">{selectedDoctor.specialization}</p>
              </div>

              {callStatus === 'requesting' && (
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Sending call request...</p>
                </div>
              )}

              {callStatus === 'waiting' && (
                <div className="mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="animate-pulse bg-blue-600 rounded-full h-4 w-4 mx-1"></div>
                    <div className="animate-pulse bg-blue-600 rounded-full h-4 w-4 mx-1" style={{animationDelay: '0.2s'}}></div>
                    <div className="animate-pulse bg-blue-600 rounded-full h-4 w-4 mx-1" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <p className="text-gray-800 font-medium">Calling Dr. {selectedDoctor.fullname}...</p>
                  <p className="text-gray-600 text-sm mt-2">Waiting for the doctor to respond</p>
                </div>
              )}

              {callStatus === 'accepted' && (
                <div className="mb-6">
                  <div className="text-green-600 text-4xl mb-4">✅</div>
                  <p className="text-green-600 font-medium">Call Accepted!</p>
                  <p className="text-gray-600 text-sm">Joining video call...</p>
                </div>
              )}

              {callStatus === 'rejected' && (
                <div className="mb-6">
                  <div className="text-red-600 text-4xl mb-4">❌</div>
                  <p className="text-red-600 font-medium">Call Declined</p>
                  <p className="text-gray-600 text-sm">Dr. {selectedDoctor.fullname} is not available right now</p>
                  <p className="text-gray-500 text-xs mt-2">Try booking an appointment instead</p>
                </div>
              )}

              <div className="flex gap-3">
                {callStatus === 'waiting' && (
                  <button
                    onClick={cancelVideoCall}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancel Call
                  </button>
                )}
                
                {(callStatus === 'rejected' || callStatus === 'requesting') && (
                  <>
                    <button
                      onClick={cancelVideoCall}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300"
                    >
                      Close
                    </button>
                    {callStatus === 'rejected' && (
            <button 
              onClick={() => {
                          cancelVideoCall();
                          openBookingModal(selectedDoctor);
              }}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-300"
            >
                        Book Appointment
            </button>
                    )}
                  </>
                )}
              </div>

              {callStatus === 'waiting' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Tip:</strong> The doctor will receive a notification and can join the call
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default DoctorsList;