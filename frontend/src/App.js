import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import shadcn components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Alert, AlertDescription } from './components/ui/alert';
import { Calendar, Clock, Users, Settings, CreditCard, BarChart3, ExternalLink, Plus, LogOut, Edit, Trash2, CalendarX } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tenant, setTenant] = useState(JSON.parse(localStorage.getItem('tenant') || 'null'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Validate token
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      // Token is valid, keep current state
      setLoading(false);
    } catch (error) {
      console.error('Token validation failed:', error);
      // Token is invalid, clear it
      logout();
    }
  };

  const login = (newToken, tenantData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('tenant', JSON.stringify(tenantData));
    setToken(newToken);
    setTenant(tenantData);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenant');
    setToken(null);
    setTenant(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ token, tenant, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">daylane</span>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <a href="/login">Anmelden</a>
            </Button>
            <Button asChild>
              <a href="/signup">Jetzt starten</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Termine einfach online buchen
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Die professionelle Terminbuchungsplattform für Schweizer Kleinbetriebe. 
            Einfach, sicher und DSGVO-konform.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <a href="/signup">14 Tage kostenlos testen</a>
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.open('/manual-test-salon/buchen', '_blank')}>
              Demo ansehen
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Warum daylane?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Calendar className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Einfache Terminbuchung</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Ihre Kunden buchen Termine direkt über Ihren personalisierten Link – ohne Registrierung.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Mitarbeiterverwaltung</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Verwalten Sie mehrere Mitarbeiter, Arbeitszeiten und Abwesenheiten zentral.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Übersichtliche Statistiken</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Behalten Sie den Überblick über Auslastung, Termine und Geschäftsentwicklung.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Preise</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Für kleine Betriebe</CardDescription>
                <div className="text-3xl font-bold">CHF 29<span className="text-lg font-normal">/Monat</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>✓ Bis zu 2 Mitarbeiter</li>
                  <li>✓ 200 Termine pro Monat</li>
                  <li>✓ Online-Buchungslink</li>
                  <li>✓ E-Mail-Bestätigungen</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-500 relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">Beliebt</Badge>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>Für wachsende Betriebe</CardDescription>
                <div className="text-3xl font-bold">CHF 49<span className="text-lg font-normal">/Monat</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>✓ Bis zu 3 Mitarbeiter</li>
                  <li>✓ 400 Termine pro Monat</li>
                  <li>✓ Erweiterte Statistiken</li>
                  <li>✓ API-Integration</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Kostenlos</CardTitle>
                <CardDescription>14 Tage testen</CardDescription>
                <div className="text-3xl font-bold">CHF 0<span className="text-lg font-normal">/14 Tage</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>✓ 1 Mitarbeiter</li>
                  <li>✓ 30 Termine total</li>
                  <li>✓ Alle Funktionen</li>
                  <li>✓ Keine Kreditkarte nötig</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calendar className="h-6 w-6" />
            <span className="text-xl font-bold">daylane</span>
          </div>
          <p className="text-gray-400 mb-6">Die Terminbuchungsplattform für die Schweiz</p>
          
          {/* Legal Links */}
          <div className="flex justify-center space-x-6 mb-4">
            <a href="/impressum" className="text-gray-400 hover:text-white transition-colors">
              Impressum
            </a>
            <a href="/agb" className="text-gray-400 hover:text-white transition-colors">
              AGB
            </a>
            <a href="/datenschutz" className="text-gray-400 hover:text-white transition-colors">
              Datenschutz
            </a>
          </div>
          
          <div className="text-sm text-gray-500">
            © 2025 Daylane GmbH. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Auth Components
const SignupPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting registration with:', formData);
      
      const response = await axios.post(`${API}/auth/register`, formData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('Registration successful:', response.data);
      
      if (response.data && response.data.access_token) {
        login(response.data.access_token, response.data.tenant);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError('Ungültige Serverantwort erhalten');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registrierung fehlgeschlagen';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 400) {
        errorMessage = 'E-Mail oder Slug bereits vergeben';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Zeitüberschreitung - Bitte versuchen Sie es erneut';
      } else if (!error.response) {
        errorMessage = 'Netzwerkfehler - Prüfen Sie Ihre Internetverbindung';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (e) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
    setFormData({...formData, slug});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold">daylane</span>
          </div>
          <CardTitle className="text-2xl text-center">Geschäft registrieren</CardTitle>
          <CardDescription className="text-center">
            Starten Sie Ihre 14-tägige Probezeit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Geschäftsname"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                placeholder="URL-Slug (z.B. mein-salon)"
                value={formData.slug}
                onChange={handleSlugChange}
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Ihr Buchungslink: <span className="font-mono">{window.location.origin}/{formData.slug}/buchen</span>
              </p>
            </div>
            <div>
              <Input
                type="email"
                placeholder="E-Mail-Adresse"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Passwort"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <div>
              <Input
                type="tel"
                placeholder="Telefon (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={loading}
              />
            </div>
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Wird erstellt...' : 'Jetzt registrieren'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a href="/login" className="text-sm text-blue-600 hover:underline">
              Bereits registriert? Hier anmelden
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData.email);
      
      const response = await axios.post(`${API}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('Login successful:', response.data);
      
      if (response.data && response.data.access_token) {
        // Use the AuthProvider login method
        login(response.data.access_token, response.data.tenant);
        
        // Navigate programmatically instead of window.location.href
        console.log('Navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      } else {
        setError('Ungültige Serverantwort erhalten');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Anmeldung fehlgeschlagen';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = 'Ungültige E-Mail oder Passwort';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Zeitüberschreitung - Bitte versuchen Sie es erneut';
      } else if (!error.response) {
        errorMessage = 'Netzwerkfehler - Prüfen Sie Ihre Internetverbindung';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold">daylane</span>
          </div>
          <CardTitle className="text-2xl text-center">Anmelden</CardTitle>
          <CardDescription className="text-center">
            Melden Sie sich in Ihrem Dashboard an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="E-Mail-Adresse"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Passwort"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Anmeldung läuft...' : 'Anmelden'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a href="/signup" className="text-sm text-blue-600 hover:underline">
              Noch kein Konto? Jetzt registrieren
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// NEW SIMPLE Calendar Components
const SimpleCalendarView = () => {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [specialClosures, setSpecialClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('day'); // 'day' or 'week'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Loading calendar data...');
      
      const [staffRes, servicesRes, appointmentsRes, closuresRes] = await Promise.all([
        axios.get(`${API}/staff`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/services`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/closures`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      console.log('✅ Raw data loaded:', {
        staff: staffRes.data,
        services: servicesRes.data,
        appointments: appointmentsRes.data,
        closures: closuresRes.data
      });
      
      setStaff(staffRes.data);
      setServices(servicesRes.data);
      setSpecialClosures(closuresRes.data);
      
      // Process appointments with error handling
      const processedAppointments = appointmentsRes.data.map(apt => ({
        ...apt,
        start_date: new Date(apt.start_at),
        end_date: new Date(apt.end_at)
      }));
      
      setAppointments(processedAppointments);
      console.log('✅ Processed appointments:', processedAppointments);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setAppointments([]);
      setSpecialClosures([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if staff member is working on a specific day
  const isStaffWorkingOnDay = (staffMember, date) => {
    if (!staffMember.working_hours) return true; // Default to working if no hours set
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = staffMember.working_hours[dayName];
    
    return dayHours && dayHours.is_working;
  };

  // Helper function to check if a time slot is within staff working hours
  const isTimeSlotAvailable = (staffMember, date, timeSlot) => {
    if (!staffMember.working_hours) return true; // Default to available if no hours set
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = staffMember.working_hours[dayName];
    
    if (!dayHours || !dayHours.is_working) return false;
    
    const startTime = dayHours.start_time || '09:00';
    const endTime = dayHours.end_time || '17:00';
    
    return timeSlot >= startTime && timeSlot < endTime;
  };

  // Helper function to check if a date has special closure for staff member
  const hasSpecialClosure = (staffId, date) => {
    const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    return specialClosures.some(closure => 
      closure.staff_id === staffId && closure.date === dateString
    );
  };

  // Helper function to get special closure for staff member on date
  const getSpecialClosure = (staffId, date) => {
    const dateString = date.toISOString().split('T')[0];
    return specialClosures.find(closure => 
      closure.staff_id === staffId && closure.date === dateString
    );
  };

  // Generate time slots (8 AM - 8 PM, 30 min intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get days to display based on view
  const getDisplayDays = () => {
    if (view === 'day') {
      return [currentDate];
    } else {
      // Week view - get Monday to Sunday
      const days = [];
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday
      startOfWeek.setDate(startOfWeek.getDate() + daysToMonday);
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
      return days;
    }
  };

  const displayDays = getDisplayDays();

  // Navigation functions
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get appointments for specific staff and date
  const getAppointmentsForStaffAndDate = (staffId, date) => {
    const targetDate = date.toDateString();
    const staffAppointments = appointments.filter(apt => 
      apt.staff_id === staffId && 
      apt.start_date.toDateString() === targetDate
    );
    
    console.log(`📅 Appointments for ${staffId} on ${targetDate}:`, staffAppointments.map(a => a.customer_name));
    return staffAppointments;
  };

  // Check if a time slot has an appointment
  const getAppointmentAtTime = (staffId, date, timeSlot) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hours, minutes, 0, 0);
    
    return appointments.find(apt => {
      const aptStart = apt.start_date;
      const aptEnd = apt.end_date;
      return apt.staff_id === staffId && 
             slotTime >= aptStart && 
             slotTime < aptEnd;
    });
  };

  const handleSlotClick = (staffId, date, timeSlot) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    setSelectedSlot({
      staffId,
      date: slotDateTime,
      timeSlot
    });
    setShowCreateModal(true);
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Format date range for display
  const getDateRangeDisplay = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('de-CH', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      const firstDay = displayDays[0];
      const lastDay = displayDays[6];
      return `${firstDay.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' })} - ${lastDay.toLocaleDateString('de-CH', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Kalender</h2>
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'day' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tagesansicht
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Wochenansicht
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Heute
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate(-1)}>
            ← {view === 'day' ? 'Vorheriger Tag' : 'Vorherige Woche'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate(1)}>
            {view === 'day' ? 'Nächster Tag' : 'Nächste Woche'} →
          </Button>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="text-center">
        <h3 className="text-xl font-semibold">
          {getDateRangeDisplay()}
        </h3>
      </div>

      {/* Calendar Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header Row */}
              <thead>
                <tr>
                  <th className="p-4 border-r border-b bg-gray-50 text-left font-semibold w-20">Zeit</th>
                  {displayDays.map(day => (
                    staff.map(staffMember => (
                      <th key={`${day.toISOString()}-${staffMember.id}`} className="p-4 border-r border-b bg-gray-50 text-center min-w-[200px]">
                        <div className="flex items-center justify-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: staffMember.color_tag || '#3B82F6' }}
                          ></div>
                          <span className="font-semibold">{staffMember.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {day.toLocaleDateString('de-CH', { 
                            weekday: view === 'week' ? 'short' : 'long', 
                            day: '2-digit', 
                            month: view === 'week' ? 'short' : 'long' 
                          })}
                        </div>
                        {/* Show if it's today */}
                        {day.toDateString() === new Date().toDateString() && (
                          <div className="text-xs text-blue-600 font-medium mt-1">Heute</div>
                        )}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              
              {/* Time Slots */}
              <tbody>
                {timeSlots.map((timeSlot, index) => (
                  <tr key={timeSlot} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {/* Time Column */}
                    <td className="p-3 border-r border-b font-medium text-gray-700 bg-gray-100 text-center">
                      {timeSlot}
                    </td>
                    
                    {/* Staff Columns for each day */}
                    {displayDays.map(day => (
                      staff.map(staffMember => {
                        const appointment = getAppointmentAtTime(staffMember.id, day, timeSlot);
                        
                        // Robust date comparison using time values
                        const now = new Date();
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Start of today
                        
                        const dayStart = new Date(day);
                        dayStart.setHours(0, 0, 0, 0); // Start of the selected day
                        
                        const isPast = dayStart.getTime() < today.getTime();
                        const isToday = dayStart.getTime() === today.getTime();
                        
                        // Only check for past time if it's today
                        let isPastTime = false;
                        if (isToday) {
                          const slotHour = parseInt(timeSlot.split(':')[0]);
                          const slotMinute = parseInt(timeSlot.split(':')[1]);
                          const currentHour = now.getHours();
                          const currentMinute = now.getMinutes();
                          
                          isPastTime = (slotHour < currentHour) || 
                                      (slotHour === currentHour && slotMinute <= currentMinute);
                        }
                        
                        // Check staff availability based on working hours and closures
                        const isStaffWorking = isStaffWorkingOnDay(staffMember, day);
                        const isTimeAvailable = isTimeSlotAvailable(staffMember, day, timeSlot);
                        const hasClosure = hasSpecialClosure(staffMember.id, day);
                        const closure = getSpecialClosure(staffMember.id, day);
                        
                        const isSlotUnavailable = !isStaffWorking || !isTimeAvailable || hasClosure;
                        
                        // Debug output for troubleshooting
                        if ((timeSlot === '09:00' || timeSlot === '10:00') && day.getDay() >= 1 && day.getDay() <= 6) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const dayStart = new Date(day);
                          dayStart.setHours(0, 0, 0, 0);
                          
                          console.log(`DEBUG: ${staffMember.name} - ${timeSlot} on ${day.toDateString()} (day ${day.getDay()}):`, {
                            dayTime: dayStart.getTime(),
                            todayTime: today.getTime(),
                            dayDate: dayStart.toISOString().split('T')[0],
                            todayDate: today.toISOString().split('T')[0],
                            isPast,
                            isToday,
                            isPastTime,
                            isStaffWorking,
                            isTimeAvailable,
                            hasClosure,
                            isSlotUnavailable,
                            dayName: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()],
                            workingHours: staffMember.working_hours
                          });
                        }
                        
                        // Debug logging for availability issues
                        if (timeSlot === '09:00' || timeSlot === '10:00') {
                          console.log(`Slot ${timeSlot} on ${day.toDateString()}:`, {
                            isStaffWorking,
                            isTimeAvailable,
                            hasClosure,
                            isSlotUnavailable,
                            staffWorkingHours: staffMember.working_hours
                          });
                        }
                        
                        return (
                          <td 
                            key={`${day.toISOString()}-${staffMember.id}-${timeSlot}`}
                            className="p-1 border-r border-b relative"
                            style={{ minHeight: '60px', width: '200px' }}
                          >
                            {appointment ? (
                              // APPOINTMENT BLOCK
                              <div
                                className="w-full h-full min-h-[50px] rounded-lg p-2 cursor-pointer shadow-md border-2 transition-all hover:scale-105"
                                style={{ 
                                  backgroundColor: staffMember.color_tag || '#3B82F6',
                                  borderColor: 'rgba(255,255,255,0.8)',
                                  color: 'white',
                                  opacity: isPast || isPastTime ? 0.6 : 1
                                }}
                                onClick={() => handleAppointmentClick(appointment)}
                              >
                                <div className="font-bold text-sm">
                                  {appointment.customer_name || 'Kunde'}
                                </div>
                                {appointment.service_name && (
                                  <div className="text-xs opacity-90 mt-1">
                                    {appointment.service_name}
                                  </div>
                                )}
                                <div className="text-xs opacity-80 mt-1">
                                  {appointment.start_date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} - 
                                  {appointment.end_date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            ) : (
                              // EMPTY SLOT
                              <div
                                className={`w-full h-full min-h-[50px] rounded-lg border-2 border-dashed transition-all flex items-center justify-center ${
                                  isSlotUnavailable ? 'border-red-200 bg-red-50 cursor-not-allowed' :
                                  isPast || isPastTime ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' :
                                  'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                                }`}
                                onClick={() => !isSlotUnavailable && !isPast && !isPastTime && handleSlotClick(staffMember.id, day, timeSlot)}
                                title={
                                  hasClosure ? `${closure.reason || 'Geschlossen'}` :
                                  !isStaffWorking ? 'Mitarbeiter arbeitet nicht an diesem Tag' :
                                  !isTimeAvailable ? 'Außerhalb der Arbeitszeiten' :
                                  isPast || isPastTime ? 'Vergangen' :
                                  'Termin erstellen'
                                }
                              >
                                {hasClosure ? (
                                  <div className="text-center">
                                    <CalendarX className="h-4 w-4 text-red-500 mx-auto" />
                                    <div className="text-xs text-red-600 mt-1">
                                      {closure.reason ? closure.reason.substring(0, 8) : 'Geschlossen'}
                                    </div>
                                  </div>
                                ) : !isStaffWorking ? (
                                  <div className="text-center">
                                    <Clock className="h-4 w-4 text-red-400 mx-auto" />
                                    <div className="text-xs text-red-500 mt-1">Frei</div>
                                  </div>
                                ) : !isTimeAvailable ? (
                                  <div className="text-center">
                                    <Clock className="h-4 w-4 text-orange-400 mx-auto" />
                                    <div className="text-xs text-orange-500 mt-1">Zu</div>
                                  </div>
                                ) : isPast || isPastTime ? (
                                  <div className="text-center text-gray-400 text-xs">
                                    Vergangen
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <Plus className="h-6 w-6 text-gray-400 mx-auto" />
                                    <div className="text-xs text-gray-500 mt-1">Termin</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Summary for selected date(s) */}
      <Card>
        <CardHeader>
          <CardTitle>
            Termine {view === 'day' ? 'heute' : 'diese Woche'} 
            ({appointments.filter(a => {
              const aptDate = a.start_date.toDateString();
              return displayDays.some(day => day.toDateString() === aptDate);
            }).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments
            .filter(a => displayDays.some(day => day.toDateString() === a.start_date.toDateString()))
            .sort((a, b) => a.start_date - b.start_date)
            .map(apt => (
              <div key={apt.id} className="flex items-center space-x-3 p-2 border rounded mb-2 cursor-pointer hover:bg-gray-50"
                   onClick={() => handleAppointmentClick(apt)}>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: staff.find(s => s.id === apt.staff_id)?.color_tag || '#3B82F6' }}
                ></div>
                <span className="font-medium">{apt.customer_name}</span>
                <span className="text-sm text-gray-600">{apt.service_name}</span>
                <span className="text-sm text-gray-500">
                  {apt.start_date.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
                <span className="text-sm text-gray-500">
                  {apt.start_date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {staff.find(s => s.id === apt.staff_id)?.name}
                </span>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateAppointmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedSlot={selectedSlot}
        staff={staff}
        services={services}
        onAppointmentCreated={(newAppointment) => {
          setAppointments([...appointments, {
            ...newAppointment,
            start_date: new Date(newAppointment.start_at),
            end_date: new Date(newAppointment.end_at)
          }]);
          setShowCreateModal(false);
        }}
      />

      <AppointmentDetailsModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        appointment={selectedAppointment}
        staff={staff}
        services={services}
        onAppointmentUpdated={(updatedAppointment) => {
          setAppointments(appointments.map(apt => 
            apt.id === updatedAppointment.id ? {
              ...updatedAppointment,
              start_date: new Date(updatedAppointment.start_at),
              end_date: new Date(updatedAppointment.end_at)
            } : apt
          ));
          setShowAppointmentModal(false);
        }}
        onAppointmentDeleted={(deletedId) => {
          setAppointments(appointments.filter(apt => apt.id !== deletedId));
          setShowAppointmentModal(false);
        }}
      />
    </div>
  );
};

// Create Appointment Modal Component
const CreateAppointmentModal = ({ isOpen, onClose, selectedSlot, staff, services, onAppointmentCreated }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    serviceId: '',
    staffId: selectedSlot?.staffId || '',
    startTime: '',
    endTime: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    status: 'confirmed'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSlot) {
      // Calculate end time based on default 30-minute duration
      const startTime = new Date(selectedSlot.date);
      const endTime = new Date(startTime.getTime() + 30 * 60000); // Add 30 minutes
      
      setFormData({
        ...formData,
        staffId: selectedSlot.staffId,
        startTime: selectedSlot.date.toTimeString().slice(0, 5),
        endTime: endTime.toTimeString().slice(0, 5)
      });
    }
  }, [selectedSlot]);

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service && selectedSlot) {
      const startTime = new Date(selectedSlot.date);
      const endTime = new Date(startTime.getTime() + (service.duration_minutes + (service.buffer_minutes || 0)) * 60000);
      
      setFormData({
        ...formData,
        serviceId,
        endTime: endTime.toTimeString().slice(0, 5)
      });
    } else {
      setFormData({
        ...formData,
        serviceId
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const appointmentData = {
        service_id: formData.serviceId,
        staff_id: formData.staffId,
        start_at: selectedSlot.date.toISOString(),
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        notes: formData.notes
      };

      // Create appointment via API
      const response = await axios.post(`${API}/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Appointment created:', response.data);
      
      // Add to local state for immediate display
      const service = services.find(s => s.id === formData.serviceId);
      const staffMember = staff.find(s => s.id === formData.staffId);
      
      const newAppointment = {
        ...response.data,
        start_at: new Date(response.data.start_at),
        end_at: new Date(response.data.end_at),
        service_name: service?.name || '',
        staff_name: staffMember?.name || '',
        price_chf: service?.price_chf || 0,
        duration_minutes: service?.duration_minutes || 30,
        staff_color: staffMember?.color_tag || '#3B82F6'
      };

      onAppointmentCreated(newAppointment);
      
      // Reset form
      setFormData({
        serviceId: '',
        staffId: selectedSlot?.staffId || '',
        startTime: '',
        endTime: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        notes: '',
        status: 'confirmed'
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      const errorMessage = error.response?.data?.detail || 'Fehler beim Erstellen des Termins';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle>Neuen Termin erstellen</CardTitle>
          <CardDescription>
            {selectedSlot && `${selectedSlot.date.toLocaleDateString('de-CH')} um ${selectedSlot.time}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dienstleistung *</label>
              <select
                value={formData.serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                required
                className="w-full p-3 border border-gray-200 rounded-lg"
              >
                <option value="">Service wählen</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} Min. - CHF {service.price_chf})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mitarbeiter *</label>
              <select
                value={formData.staffId}
                onChange={(e) => setFormData({...formData, staffId: e.target.value})}
                required
                className="w-full p-3 border border-gray-200 rounded-lg"
              >
                <option value="">Mitarbeiter wählen</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Startzeit</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Endzeit</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kundenname *</label>
              <Input
                placeholder="Vor- und Nachname"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">E-Mail</label>
              <Input
                type="email"
                placeholder="kunde@example.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <Input
                type="tel"
                placeholder="+41 79 123 45 67"
                value={formData.customerPhone}
                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notizen</label>
              <textarea
                placeholder="Zusätzliche Informationen..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none h-20"
              />
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Erstellen...' : 'Termin erstellen'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Staff Edit Modal Component
const StaffEditModal = ({ isOpen, onClose, staff, onStaffUpdated }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    color_tag: staff?.color_tag || '#3B82F6',
    active: staff?.active !== false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        color_tag: staff.color_tag,
        active: staff.active !== false
      });
    }
  }, [staff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, make API call to update staff
      // For now, simulate update
      const updatedStaff = { ...staff, ...formData };
      onStaffUpdated(updatedStaff);
      onClose();
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Fehler beim Aktualisieren des Mitarbeiters');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Mitarbeiter bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kalenderfarbe</label>
              <input
                type="color"
                value={formData.color_tag}
                onChange={(e) => setFormData({...formData, color_tag: e.target.value})}
                className="w-full h-10 rounded border"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
              <label htmlFor="active" className="text-sm">Aktiv</label>
            </div>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Working Hours Modal Component
const WorkingHoursModal = ({ isOpen, onClose, staff, onWorkingHoursUpdated }) => {
  const [workingHours, setWorkingHours] = useState({
    monday: { start: '09:00', end: '17:00', active: true },
    tuesday: { start: '09:00', end: '17:00', active: true },
    wednesday: { start: '09:00', end: '17:00', active: true },
    thursday: { start: '09:00', end: '17:00', active: true },
    friday: { start: '09:00', end: '17:00', active: true },
    saturday: { start: '09:00', end: '17:00', active: false },
    sunday: { start: '09:00', end: '17:00', active: false }
  });

  useEffect(() => {
    if (staff?.working_hours) {
      setWorkingHours(staff.working_hours);
    }
  }, [staff]);

  const dayNames = {
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag'
  };

  const handleSave = () => {
    onWorkingHoursUpdated(workingHours);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle>Arbeitszeiten - {staff?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(dayNames).map(([day, dayName]) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-20">
                  <input
                    type="checkbox"
                    id={day}
                    checked={workingHours[day]?.active || false}
                    onChange={(e) => setWorkingHours({
                      ...workingHours,
                      [day]: { ...workingHours[day], active: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <label htmlFor={day} className="text-sm font-medium">{dayName}</label>
                </div>
                <Input
                  type="time"
                  value={workingHours[day]?.start || '09:00'}
                  onChange={(e) => setWorkingHours({
                    ...workingHours,
                    [day]: { ...workingHours[day], start: e.target.value }
                  })}
                  disabled={!workingHours[day]?.active}
                  className="flex-1"
                />
                <span className="text-gray-500">bis</span>
                <Input
                  type="time"
                  value={workingHours[day]?.end || '17:00'}
                  onChange={(e) => setWorkingHours({
                    ...workingHours,
                    [day]: { ...workingHours[day], end: e.target.value }
                  })}
                  disabled={!workingHours[day]?.active}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          <div className="flex space-x-4 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Service Edit Modal Component  
const ServiceEditModal = ({ isOpen, onClose, service, onServiceUpdated }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration_minutes: service?.duration_minutes || 30,
    price_chf: service?.price_chf || 0,
    buffer_minutes: service?.buffer_minutes || 5,
    active: service?.active !== false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price_chf: service.price_chf,
        buffer_minutes: service.buffer_minutes || 5,
        active: service.active !== false
      });
    }
  }, [service]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, make API call to update service
      const updatedService = { ...service, ...formData };
      onServiceUpdated(updatedService);
      onClose();
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Fehler beim Aktualisieren der Dienstleistung');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Dienstleistung bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beschreibung</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dauer (Min.)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 30})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preis (CHF)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  value={formData.price_chf}
                  onChange={(e) => setFormData({...formData, price_chf: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pufferzeit (Min.)</label>
              <Input
                type="number"
                min="0"
                value={formData.buffer_minutes}
                onChange={(e) => setFormData({...formData, buffer_minutes: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="service-active"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
              <label htmlFor="service-active" className="text-sm">Aktiv</label>
            </div>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Staff Opening Hours Manager Component
const StaffOpeningHoursManager = ({ staff, onUpdate }) => {
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [workingHours, setWorkingHours] = useState({});
  const [specialClosures, setSpecialClosures] = useState([]);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [isAddingClosure, setIsAddingClosure] = useState(false);
  const [newClosure, setNewClosure] = useState({
    date: '',
    reason: '',
    all_day: true,
    start_time: '',
    end_time: ''
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Montag' },
    { key: 'tuesday', label: 'Dienstag' },
    { key: 'wednesday', label: 'Mittwoch' },
    { key: 'thursday', label: 'Donnerstag' },
    { key: 'friday', label: 'Freitag' },
    { key: 'saturday', label: 'Samstag' },
    { key: 'sunday', label: 'Sonntag' }
  ];

  // Load staff data when staff member is selected
  useEffect(() => {
    if (selectedStaffId) {
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (staffMember && staffMember.working_hours) {
        setWorkingHours(staffMember.working_hours);
      } else {
        // Set default working hours if none exist
        const defaultHours = {};
        daysOfWeek.forEach(day => {
          defaultHours[day.key] = {
            is_working: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.key),
            start_time: '09:00',
            end_time: '17:00'
          };
        });
        setWorkingHours(defaultHours);
      }
      loadSpecialClosures(selectedStaffId);
    }
  }, [selectedStaffId, staff]);

  const loadSpecialClosures = async (staffId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/staff/${staffId}/closures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpecialClosures(response.data);
    } catch (error) {
      console.error('Error loading special closures:', error);
      setSpecialClosures([]);
    }
  };

  const handleDayToggle = (dayKey) => {
    setWorkingHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        is_working: !prev[dayKey]?.is_working
      }
    }));
  };

  const handleTimeChange = (dayKey, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  const handleSaveWorkingHours = async () => {
    try {
      await onUpdate(selectedStaffId, workingHours);
      setIsEditingHours(false);
    } catch (error) {
      console.error('Error saving working hours:', error);
    }
  };

  const handleAddClosure = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/staff/${selectedStaffId}/closures`, newClosure, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reload closures
      await loadSpecialClosures(selectedStaffId);
      
      // Reset form
      setNewClosure({
        date: '',
        reason: '',
        all_day: true,
        start_time: '',
        end_time: ''
      });
      setIsAddingClosure(false);
      
    } catch (error) {
      console.error('Error adding closure:', error);
    }
  };

  const handleDeleteClosure = async (closureId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/staff/${selectedStaffId}/closures/${closureId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reload closures
      await loadSpecialClosures(selectedStaffId);
      
    } catch (error) {
      console.error('Error deleting closure:', error);
    }
  };

  if (staff.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Keine Mitarbeiter vorhanden</p>
        <p className="text-sm text-gray-500">Fügen Sie zuerst Mitarbeiter hinzu, um Öffnungszeiten zu verwalten.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mitarbeiter auswählen
        </label>
        <select
          value={selectedStaffId || ''}
          onChange={(e) => setSelectedStaffId(e.target.value || null)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Mitarbeiter wählen --</option>
          {staff.map(staffMember => (
            <option key={staffMember.id} value={staffMember.id}>
              {staffMember.name}
            </option>
          ))}
        </select>
      </div>

      {selectedStaffId && (
        <>
          {/* Working Hours Section */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Arbeitszeiten</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingHours(!isEditingHours)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditingHours ? 'Abbrechen' : 'Bearbeiten'}
              </Button>
            </div>

            <div className="space-y-3">
              {daysOfWeek.map(day => (
                <div key={day.key} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-24 font-medium">{day.label}</div>
                  
                  {isEditingHours ? (
                    <>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={workingHours[day.key]?.is_working || false}
                          onChange={() => handleDayToggle(day.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Geöffnet</span>
                      </label>
                      
                      {workingHours[day.key]?.is_working && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={workingHours[day.key]?.start_time || '09:00'}
                            onChange={(e) => handleTimeChange(day.key, 'start_time', e.target.value)}
                            className="p-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-500">bis</span>
                          <input
                            type="time"
                            value={workingHours[day.key]?.end_time || '17:00'}
                            onChange={(e) => handleTimeChange(day.key, 'end_time', e.target.value)}
                            className="p-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1">
                      {workingHours[day.key]?.is_working ? (
                        <span className="text-sm text-green-600">
                          {workingHours[day.key]?.start_time || '09:00'} - {workingHours[day.key]?.end_time || '17:00'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Geschlossen</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isEditingHours && (
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsEditingHours(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSaveWorkingHours}>
                  Speichern
                </Button>
              </div>
            )}
          </div>

          {/* Special Closures Section */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Schließungstage / Urlaub</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingClosure(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </div>

            {/* Add Closure Form */}
            {isAddingClosure && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Datum
                    </label>
                    <input
                      type="date"
                      value={newClosure.date}
                      onChange={(e) => setNewClosure({...newClosure, date: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grund (optional)
                    </label>
                    <input
                      type="text"
                      value={newClosure.reason}
                      onChange={(e) => setNewClosure({...newClosure, reason: e.target.value})}
                      placeholder="z.B. Urlaub, Feiertag"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsAddingClosure(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleAddClosure} disabled={!newClosure.date}>
                    Hinzufügen
                  </Button>
                </div>
              </div>
            )}

            {/* Closures List */}
            <div className="space-y-2">
              {specialClosures.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Schließungstage eingetragen</p>
              ) : (
                specialClosures.map(closure => (
                  <div key={closure.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium">{new Date(closure.date).toLocaleDateString('de-CH')}</div>
                      {closure.reason && (
                        <div className="text-sm text-gray-600">{closure.reason}</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClosure(closure.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Dashboard Component with Modern Dark Sidebar Design
const StaffCreateForm = ({ onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    color_tag: '#3B82F6'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neuer Mitarbeiter</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Name des Mitarbeiters"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Farbe für Kalender</label>
            <input
              type="color"
              value={formData.color_tag}
              onChange={(e) => setFormData({...formData, color_tag: e.target.value})}
              className="w-full h-10 rounded border"
            />
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Wird erstellt...' : 'Mitarbeiter hinzufügen'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Service Create Form Component
const ServiceCreateForm = ({ onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price_chf: 0,
    buffer_minutes: 5
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Dienstleistung</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Name der Dienstleistung"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <Input
              placeholder="Beschreibung (optional)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dauer (Minuten)</label>
              <Input
                type="number"
                min="1"
                max="480"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 30})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preis (CHF)</label>
              <Input
                type="number"
                min="0"
                step="0.50"
                value={formData.price_chf}
                onChange={(e) => setFormData({...formData, price_chf: parseFloat(e.target.value) || 0})}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pufferzeit (Minuten)</label>
            <Input
              type="number"
              min="0"
              max="60"
              value={formData.buffer_minutes}
              onChange={(e) => setFormData({...formData, buffer_minutes: parseInt(e.target.value) || 0})}
            />
            <p className="text-sm text-gray-500 mt-1">Zeit zwischen Terminen für Reinigung, Vorbereitung etc.</p>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Wird erstellt...' : 'Dienstleistung hinzufügen'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Dashboard Component with Modern Dark Sidebar Design
const Dashboard = () => {
  const { logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showStaffEdit, setShowStaffEdit] = useState(false);
  const [showWorkingHours, setShowWorkingHours] = useState(false);
  const [showServiceEdit, setShowServiceEdit] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchStaff();
    fetchServices();
    // Check for payment return parameters
    checkPaymentReturn();
  }, []);

  const checkPaymentReturn = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('payment_success');
    const paymentCancelled = urlParams.get('payment_cancelled');
    
    if (sessionId) {
      // Payment success - poll for status
      pollPaymentStatus(sessionId);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentCancelled) {
      setPaymentStatus({ type: 'error', message: 'Zahlung wurde abgebrochen.' });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000; // 2 seconds

    if (attempts >= maxAttempts) {
      setPaymentStatus({ 
        type: 'error', 
        message: 'Zahlungsstatus-Prüfung Zeitüberschreitung. Bitte überprüfen Sie Ihre E-Mails.' 
      });
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/checkout/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        setPaymentStatus({ 
          type: 'success', 
          message: 'Zahlung erfolgreich! Ihr Plan wurde aktualisiert.' 
        });
        // Reload dashboard data to reflect plan change
        fetchDashboardData();
        return;
      } else if (response.data.status === 'expired') {
        setPaymentStatus({ 
          type: 'error', 
          message: 'Zahlungssession abgelaufen. Bitte versuchen Sie es erneut.' 
        });
        return;
      }

      // If payment is still pending, continue polling
      setPaymentStatus({ 
        type: 'info', 
        message: 'Zahlung wird verarbeitet...' 
      });
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus({ 
        type: 'error', 
        message: 'Fehler beim Überprüfen des Zahlungsstatus.' 
      });
    }
  };

  const handlePlanUpgrade = async (packageId) => {
    setPaymentLoading(true);
    setPaymentStatus(null);
    
    try {
      const response = await axios.post(`${API}/payments/checkout/session`, {
        package_id: packageId,
        origin_url: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('Keine Checkout-URL erhalten');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Fehler beim Erstellen der Zahlung' 
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Möchten Sie Ihr Abonnement wirklich kündigen? Sie verlieren den Zugang zu allen Premium-Features.')) {
      return;
    }

    setActionLoading(true);
    setPaymentStatus(null);
    
    try {
      // For now, we'll downgrade to trial plan
      // In a real implementation, you might call a specific cancellation endpoint
      const response = await axios.post(`${API}/auth/cancel-subscription`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPaymentStatus({ 
        type: 'success', 
        message: 'Abonnement erfolgreich gekündigt. Ihr Account wurde auf den Probezeitraum zurückgesetzt.' 
      });
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Cancellation error:', error);
      setPaymentStatus({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Fehler beim Kündigen des Abonnements' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = () => {
    // In a real implementation, you would redirect to Stripe Customer Portal
    // For now, we'll show information about subscription management
    setPaymentStatus({ 
      type: 'info', 
      message: 'Stripe Kundenportal wird geöffnet... (Feature wird in der nächsten Version verfügbar sein)' 
    });
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API}/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const createStaff = async (staffData) => {
    setActionLoading(true);
    try {
      const response = await axios.post(`${API}/staff`, staffData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff([...staff, response.data]);
      setShowStaffForm(false);
      fetchDashboardData(); // Refresh overview
    } catch (error) {
      console.error('Error creating staff:', error);
      alert(error.response?.data?.detail || 'Fehler beim Erstellen des Mitarbeiters');
    } finally {
      setActionLoading(false);
    }
  };

  const createService = async (serviceData) => {
    setActionLoading(true);
    try {
      const response = await axios.post(`${API}/services`, serviceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices([...services, response.data]);
      setShowServiceForm(false);
      fetchDashboardData(); // Refresh overview
    } catch (error) {
      console.error('Error creating service:', error);
      alert(error.response?.data?.detail || 'Fehler beim Erstellen der Dienstleistung');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStaffEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowStaffEdit(true);
  };

  const handleWorkingHours = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowWorkingHours(true);
  };

  const handleServiceEdit = (service) => {
    setSelectedService(service);
    setShowServiceEdit(true);
  };

  const handleStaffUpdate = (updatedStaff) => {
    setStaff(staff.map(s => s.id === updatedStaff.id ? updatedStaff : s));
  };

  const handleStaffOpeningHoursUpdate = async (staffId, workingHours) => {
    try {
      setActionLoading(true);
      const response = await axios.put(
        `${API}/staff/${staffId}/working-hours`,
        workingHours,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update the staff list with the updated staff member
      setStaff(staff.map(s => s.id === staffId ? response.data : s));
      
      // Show success message
      setPaymentStatus({
        type: 'success',
        message: 'Öffnungszeiten erfolgreich aktualisiert'
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setPaymentStatus(null), 5000);
      
    } catch (error) {
      console.error('Error updating opening hours:', error);
      setPaymentStatus({
        type: 'error',
        message: 'Fehler beim Aktualisieren der Öffnungszeiten'
      });
      setTimeout(() => setPaymentStatus(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleServiceUpdate = (updatedService) => {
    setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const handleWorkingHoursUpdate = (newWorkingHours) => {
    const updatedStaff = { ...selectedStaff, working_hours: newWorkingHours };
    setStaff(staff.map(s => s.id === updatedStaff.id ? updatedStaff : s));
  };

  const copyBookingLink = () => {
    const tenantSlug = dashboardData?.tenant_slug || 'demo-salon';
    const bookingUrl = `${window.location.origin}/${tenantSlug}/buchen`;
    navigator.clipboard.writeText(bookingUrl).then(() => {
      alert('Buchungslink kopiert!');
    }).catch(() => {
      alert('Fehler beim Kopieren des Links');
    });
  };

  const openBookingLink = () => {
    const tenantSlug = dashboardData?.tenant_slug || 'demo-salon';
    window.open(`/${tenantSlug}/buchen`, '_blank');
  };

  // Plan configuration based on real data
  const getPlanConfig = (plan) => {
    const planConfigs = {
      trial: {
        name: 'Probezeitraum',
        displayName: 'Trial',
        maxStaff: 1,
        maxAppointments: 30,
        price: 'Kostenlos',
        color: 'orange'
      },
      starter: {
        name: 'Starter Plan',
        displayName: 'Starter',
        maxStaff: 2,
        maxAppointments: 200,
        price: 'CHF 29/Monat',
        color: 'blue'
      },
      pro: {
        name: 'Pro Plan',
        displayName: 'Pro',
        maxStaff: 3,
        maxAppointments: 400,
        price: 'CHF 59/Monat',
        color: 'purple'
      }
    };
    
    return planConfigs[plan] || planConfigs.trial;
  };

  const currentPlan = getPlanConfig(dashboardData?.plan || 'trial');

  const sidebarItems = [
    { id: 'overview', label: 'Übersicht', icon: BarChart3 },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'staff', label: 'Mitarbeiter', icon: Users },
    { id: 'services', label: 'Services', icon: Settings },
    { id: 'billing', label: 'Abrechnung', icon: CreditCard },
    { id: 'usage', label: 'Einstellungen', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Dark Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">daylane</h1>
              <p className="text-sm text-slate-400">{currentPlan.displayName}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-6">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <IconComponent className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-6 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg p-3 text-center transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Abmelden</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600">Willkommen zurück! Hier ist Ihre Übersicht für heute.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => setActiveTab('calendar')}>
                <Calendar className="h-4 w-4" />
                <span>Kalender</span>
              </Button>
              <Button className="flex items-center space-x-2" onClick={copyBookingLink}>
                <ExternalLink className="h-4 w-4" />
                <span>Buchungslink kopieren</span>
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Heute</p>
                        <p className="text-3xl font-bold text-blue-900">
                          {dashboardData?.termine_heute ?? 0}
                        </p>
                        <p className="text-blue-600 text-sm">Termine</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Dieser Monat</p>
                        <p className="text-3xl font-bold text-green-900">
                          {dashboardData?.termine_dieses_monat ?? 0}
                        </p>
                        <p className="text-green-600 text-sm">Termine</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Kunden</p>
                        <p className="text-3xl font-bold text-purple-900">
                          {dashboardData?.total_kunden ?? 0}
                        </p>
                        <p className="text-purple-600 text-sm">Gesamt</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-medium">Mitarbeiter</p>
                        <p className="text-3xl font-bold text-orange-900">
                          {dashboardData?.aktive_mitarbeiter ?? 0}
                        </p>
                        <p className="text-orange-600 text-sm">Aktiv</p>
                      </div>
                      <Users className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Two Column Layout */}
              <div>
                {/* Upcoming Appointments */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Termine heute</span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('calendar')}>
                      Alle anzeigen
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData?.naechste_termine && dashboardData.naechste_termine.length > 0 ? (
                        dashboardData.naechste_termine.map(appointment => (
                          <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{appointment.service_name || 'Service nicht verfügbar'}</p>
                              <p className="text-sm text-gray-600">
                                {appointment.customer_name} • {appointment.staff_name || 'Mitarbeiter nicht verfügbar'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(appointment.start_at).toLocaleDateString('de-CH', { 
                                  day: '2-digit', 
                                  month: '2-digit',
                                  year: new Date(appointment.start_at).getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
                                })}, {new Date(appointment.start_at).toLocaleTimeString('de-CH', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                              {appointment.status === 'confirmed' ? 'Bestätigt' : 'Storniert'}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">Keine Termine heute</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setActiveTab('calendar')}
                          >
                            Termin erstellen
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Mitarbeiter</h2>
                <Button onClick={() => setShowStaffForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Mitarbeiter hinzufügen
                </Button>
              </div>
              
              {showStaffForm && (
                <StaffCreateForm
                  onSubmit={createStaff}
                  onCancel={() => setShowStaffForm(false)}
                  loading={actionLoading}
                />
              )}
              
              <div className="grid gap-4">
                {staff.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: member.color_tag }}
                          ></div>
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-gray-600">
                              {member.active ? 'Aktiv' : 'Inaktiv'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleStaffEdit(member)}>
                            Bearbeiten
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleWorkingHours(member)}>
                            Arbeitszeiten
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {staff.length === 0 && !showStaffForm && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Noch keine Mitarbeiter hinzugefügt</p>
                      <Button className="mt-4" onClick={() => setShowStaffForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ersten Mitarbeiter hinzufügen
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Dienstleistungen</h2>
                <Button onClick={() => setShowServiceForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Dienstleistung hinzufügen
                </Button>
              </div>
              
              {showServiceForm && (
                <ServiceCreateForm
                  onSubmit={createService}
                  onCancel={() => setShowServiceForm(false)}
                  loading={actionLoading}
                />
              )}
              
              <div className="grid gap-4">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-gray-600">
                            {service.duration_minutes} Minuten • CHF {service.price_chf.toFixed(2)}
                          </p>
                          {service.description && (
                            <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                          )}
                          {service.buffer_minutes > 0 && (
                            <p className="text-xs text-gray-400">+ {service.buffer_minutes} Min. Pufferzeit</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleServiceEdit(service)}>
                            Bearbeiten
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {services.length === 0 && !showServiceForm && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Noch keine Dienstleistungen hinzugefügt</p>
                      <Button className="mt-4" onClick={() => setShowServiceForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Erste Dienstleistung hinzufügen
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && <SimpleCalendarView />}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Payment Status Alerts */}
              {paymentStatus && (
                <Alert className={
                  paymentStatus.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                  paymentStatus.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                  'bg-blue-50 text-blue-800 border-blue-200'
                }>
                  <AlertDescription>
                    {paymentStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Aktueller Plan</CardTitle>
                  <CardDescription>
                    Sie nutzen derzeit den {currentPlan.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    currentPlan.color === 'orange' 
                      ? 'bg-orange-50' 
                      : currentPlan.color === 'blue'
                        ? 'bg-blue-50'
                        : 'bg-purple-50'
                  }`}>
                    <h3 className={`font-semibold ${
                      currentPlan.color === 'orange' 
                        ? 'text-orange-900' 
                        : currentPlan.color === 'blue'
                          ? 'text-blue-900'
                          : 'text-purple-900'
                    }`}>
                      {currentPlan.name}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      currentPlan.color === 'orange' 
                        ? 'text-orange-700' 
                        : currentPlan.color === 'blue'
                          ? 'text-blue-700'
                          : 'text-purple-700'
                    }`}>
                      {dashboardData?.plan === 'trial' && dashboardData?.trial_end && 
                        `Endet am ${new Date(dashboardData.trial_end).toLocaleDateString('de-CH')}`}
                      {dashboardData?.plan === 'starter' && `${currentPlan.price} - Bis zu ${currentPlan.maxStaff} Mitarbeiter, ${currentPlan.maxAppointments} Termine`}
                      {dashboardData?.plan === 'pro' && `${currentPlan.price} - Bis zu ${currentPlan.maxStaff} Mitarbeiter, ${currentPlan.maxAppointments} Termine`}
                    </p>
                  </div>
                  
                  {dashboardData?.plan === 'trial' && (
                    <div className="space-y-3">
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Ihr Probezeitraum läuft bald ab. Upgraden Sie jetzt für unterbrechungsfreien Service.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Starter Plan</h4>
                          <p className="text-2xl font-bold text-blue-600 mb-1">CHF 29.00</p>
                          <p className="text-sm text-gray-600 mb-3">pro Monat</p>
                          <ul className="text-sm text-gray-600 mb-4 space-y-1">
                            <li>✓ Bis zu 2 Mitarbeiter</li>
                            <li>✓ 200 Termine pro Monat</li>
                            <li>✓ Kalender & Buchungslink</li>
                          </ul>
                          <Button 
                            className="w-full" 
                            onClick={() => handlePlanUpgrade('starter')}
                            disabled={paymentLoading}
                          >
                            {paymentLoading ? 'Wird geladen...' : 'Starter wählen'}
                          </Button>
                        </div>
                        
                        <div className="p-4 border border-blue-500 rounded-lg bg-blue-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Pro Plan</h4>
                            <Badge className="bg-blue-600">Beliebt</Badge>
                          </div>
                          <p className="text-2xl font-bold text-blue-600 mb-1">CHF 59.00</p>
                          <p className="text-sm text-gray-600 mb-3">pro Monat</p>
                          <ul className="text-sm text-gray-600 mb-4 space-y-1">
                            <li>✓ Bis zu 3 Mitarbeiter</li>
                            <li>✓ 400 Termine pro Monat</li>
                            <li>✓ Kalender & Buchungslink</li>
                            <li>✓ Prioritäts-Support</li>
                          </ul>
                          <Button 
                            className="w-full" 
                            onClick={() => handlePlanUpgrade('pro')}
                            disabled={paymentLoading}
                          >
                            {paymentLoading ? 'Wird geladen...' : 'Pro wählen'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(dashboardData?.plan === 'starter' || dashboardData?.plan === 'pro') && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-green-800 font-medium">✓ Aktiver Plan</p>
                        <p className="text-sm text-green-600">Sie haben vollen Zugriff auf alle Funktionen</p>
                      </div>
                      
                      {/* Subscription Management Section */}
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Abonnement verwalten</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={handleManageSubscription}
                            disabled={paymentLoading || actionLoading}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Rechnungen & Zahlungsmethoden
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            onClick={handleCancelSubscription}
                            disabled={paymentLoading || actionLoading}
                          >
                            {actionLoading ? 'Wird gekündigt...' : 'Abonnement kündigen'}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Upgrade Option for Starter Plan */}
                      {dashboardData?.plan === 'starter' && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Plan upgraden</h4>
                          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                            <div className="flex justify-between items-center mb-3">
                              <div>
                                <h5 className="font-medium text-blue-900">Pro Plan</h5>
                                <p className="text-sm text-blue-700">Mehr Mitarbeiter und Termine</p>
                              </div>
                              <span className="text-xl font-bold text-blue-600">CHF 59.00/Monat</span>
                            </div>
                            <ul className="text-sm text-blue-700 mb-3 space-y-1">
                              <li>✓ Bis zu 3 Mitarbeiter (statt 2)</li>
                              <li>✓ 400 Termine pro Monat (statt 200)</li>
                              <li>✓ Prioritäts-Support</li>
                            </ul>
                            <Button 
                              className="w-full"
                              onClick={() => handlePlanUpgrade('pro')}
                              disabled={paymentLoading || actionLoading}
                            >
                              {paymentLoading ? 'Wird geladen...' : 'Auf Pro upgraden'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verbrauch</CardTitle>
                  <CardDescription>
                    Übersicht über Ihre aktuelle Nutzung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Mitarbeiter</span>
                        <span>{dashboardData?.aktive_mitarbeiter || 0} / {currentPlan.maxStaff}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((dashboardData?.aktive_mitarbeiter || 0) / currentPlan.maxStaff) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Termine dieses Monat</span>
                        <span>{dashboardData?.termine_dieses_monat || 0} / {currentPlan.maxAppointments}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((dashboardData?.termine_dieses_monat || 0) / currentPlan.maxAppointments) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    {dashboardData?.plan === 'trial' && dashboardData?.trial_end && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Probezeitraum endet am {new Date(dashboardData.trial_end).toLocaleDateString('de-CH')}. 
                          <a href="#" className="ml-1 text-blue-600 hover:underline">Jetzt upgraden</a>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Öffentlicher Buchungslink</CardTitle>
                  <CardDescription>
                    Teilen Sie diesen Link mit Ihren Kunden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={`${window.location.origin}/${dashboardData?.tenant_slug || 'demo-salon'}/buchen`}
                      readOnly
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={copyBookingLink}
                    >
                      Kopieren
                    </Button>
                    <Button variant="outline" onClick={openBookingLink}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Ihre Kunden können über diesen Link direkt Termine buchen, ohne sich registrieren zu müssen.
                  </p>
                </CardContent>
              </Card>

              {/* Staff Opening Hours Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Öffnungszeiten verwalten</CardTitle>
                  <CardDescription>
                    Konfigurieren Sie die Arbeitszeiten für jeden Mitarbeiter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StaffOpeningHoursManager 
                    staff={staff}
                    onUpdate={handleStaffOpeningHoursUpdate}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Modals */}
        <StaffEditModal
          isOpen={showStaffEdit}
          onClose={() => setShowStaffEdit(false)}
          staff={selectedStaff}
          onStaffUpdated={handleStaffUpdate}
        />
        
        <WorkingHoursModal
          isOpen={showWorkingHours}
          onClose={() => setShowWorkingHours(false)}
          staff={selectedStaff}
          onWorkingHoursUpdated={handleWorkingHoursUpdate}
        />
        
        <ServiceEditModal
          isOpen={showServiceEdit}
          onClose={() => setShowServiceEdit(false)}
          service={selectedService}
          onServiceUpdated={handleServiceUpdate}
        />
      </div>
    </div>
  );
};

// Protected Route Component - Simplified
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  console.log('ProtectedRoute - Token:', token, 'Loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!token) {
    console.log('ProtectedRoute - No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('ProtectedRoute - Token found, rendering protected content');
  return children;
};

// Test API Connection Component
const ApiTestPage = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  const testApi = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Test basic API connectivity
      const response = await axios.get(`${API}/`, { timeout: 5000 });
      setResult(`✅ API Connected: ${JSON.stringify(response.data)}`);
      
      // Test registration
      const regData = {
        name: 'Test API Salon',
        slug: 'test-api-salon-' + Date.now(),
        email: 'testapi@salon.ch',
        password: 'TestPass123!',
        phone: '+41 44 123 45 67'
      };
      
      const regResponse = await axios.post(`${API}/auth/register`, regData, { timeout: 10000 });
      setResult(prev => prev + `\n✅ Registration: ${JSON.stringify(regResponse.data).substring(0, 200)}...`);
      
    } catch (error) {
      setResult(`❌ Error: ${error.message}\nStatus: ${error.response?.status}\nData: ${JSON.stringify(error.response?.data)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testApi} disabled={loading} className="mb-4">
            {loading ? 'Testing...' : 'Test API Connection'}
          </Button>
          <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
            API URL: {API}
            {result && `\n\nResult:\n${result}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

// Public Booking Page Component
const PublicBookingPage = () => {
  const { tenantSlug } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [specialClosures, setSpecialClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  useEffect(() => {
    fetchTenantInfo();
  }, [tenantSlug]);

  const fetchTenantInfo = async () => {
    try {
      const [infoResponse, closuresResponse] = await Promise.all([
        axios.get(`${API}/public/${tenantSlug}/info`),
        // Note: We can't access closures from public endpoint, so we'll handle this differently
        // For now, we'll fetch only the info and handle closures separately
        Promise.resolve({ data: [] })
      ]);
      
      setTenantInfo(infoResponse.data.tenant);
      setServices(infoResponse.data.services);
      setStaff(infoResponse.data.staff);
      setSpecialClosures(closuresResponse.data);
    } catch (error) {
      console.error('Error fetching tenant info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsForDate = async (date, staffId) => {
    try {
      // Fetch appointments for the specific date and staff
      const response = await axios.get(`${API}/public/${tenantSlug}/appointments`, {
        params: {
          date: date,
          staff_id: staffId
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  };

  // Helper function to check if staff member is working on a specific day
  const isStaffWorkingOnDay = (staffMember, date) => {
    if (!staffMember.working_hours) return true; // Default to working if no hours set
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = staffMember.working_hours[dayName];
    
    return dayHours && dayHours.is_working;
  };

  // Helper function to get staff working hours for a day
  const getStaffWorkingHours = (staffMember, date) => {
    if (!staffMember.working_hours) return { start_time: '09:00', end_time: '18:00' };
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = staffMember.working_hours[dayName];
    
    if (!dayHours || !dayHours.is_working) return null;
    
    return {
      start_time: dayHours.start_time || '09:00',
      end_time: dayHours.end_time || '18:00'
    };
  };

  // Helper function to check if a date has special closure for staff member
  const hasSpecialClosure = (staffId, date) => {
    const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    return specialClosures.some(closure => 
      closure.staff_id === staffId && closure.date === dateString
    );
  };

  const generateTimeSlots = async (selectedDate, staffId = null) => {
    const actualStaffId = staffId || booking.staffId;
    if (!actualStaffId) {
      setAvailableSlots([]);
      return;
    }

    const selectedStaff = staff.find(s => s.id === actualStaffId);
    if (!selectedStaff) {
      setAvailableSlots([]);
      return;
    }

    const bookingDate = new Date(selectedDate);
    
    // Check if staff is working on this day
    if (!isStaffWorkingOnDay(selectedStaff, bookingDate)) {
      setAvailableSlots([]);
      return;
    }

    // Check if there's a special closure
    if (hasSpecialClosure(actualStaffId, bookingDate)) {
      setAvailableSlots([]);
      return;
    }

    // Get working hours for the day
    const workingHours = getStaffWorkingHours(selectedStaff, bookingDate);
    if (!workingHours) {
      setAvailableSlots([]);
      return;
    }

    // Fetch existing appointments for conflict checking
    const existingAppointments = await fetchAppointmentsForDate(selectedDate, actualStaffId);
    
    // Get selected service duration
    const selectedService = services.find(s => s.id === booking.serviceId);
    const serviceDuration = selectedService ? selectedService.duration_minutes : 30;
    const bufferTime = selectedService ? selectedService.buffer_minutes || 0 : 0;
    const totalSlotDuration = serviceDuration + bufferTime;

    // Generate time slots within working hours
    const allSlots = [];
    const startHour = parseInt(workingHours.start_time.split(':')[0]);
    const startMinute = parseInt(workingHours.start_time.split(':')[1]);
    const endHour = parseInt(workingHours.end_time.split(':')[0]);
    const endMinute = parseInt(workingHours.end_time.split(':')[1]);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      allSlots.push(timeString);
      
      // Add 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }
    
    // Filter out slots that conflict with existing appointments
    const availableSlots = allSlots.filter(timeSlot => {
      // Check if this slot conflicts with any existing appointment
      return !hasConflict(timeSlot, selectedDate, existingAppointments, totalSlotDuration);
    });
    
    setAvailableSlots(availableSlots);
  };

  // Helper function to check if a time slot conflicts with existing appointments
  const hasConflict = (timeSlot, date, existingAppointments, duration) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = new Date(slotStart.getTime() + duration * 60000); // Add duration in milliseconds
    
    return existingAppointments.some(appointment => {
      const appointmentStart = new Date(appointment.start_at);
      const appointmentEnd = new Date(appointment.end_at);
      
      // Check if the new slot overlaps with existing appointment
      // Overlap occurs if: slot_start < appointment_end AND slot_end > appointment_start
      return slotStart < appointmentEnd && slotEnd > appointmentStart;
    });
  };

  // Filter staff based on service and working hours
  const getAvailableStaff = () => {
    if (!booking.date) return staff;
    
    const bookingDate = new Date(booking.date);
    return staff.filter(staffMember => {
      // Check if staff is working on the selected day
      if (!isStaffWorkingOnDay(staffMember, bookingDate)) return false;
      
      // Check if there's a special closure
      if (hasSpecialClosure(staffMember.id, bookingDate)) return false;
      
      return true;
    });
  };

  const handleServiceSelect = (serviceId) => {
    setBooking({...booking, serviceId});
    setCurrentStep(2);
  };

  const handleStaffSelect = async (staffId) => {
    setBooking({...booking, staffId});
    // If date is already selected, regenerate time slots for the new staff member
    if (booking.date) {
      await generateTimeSlots(booking.date, staffId);
    }
    setCurrentStep(3);
  };

  const handleDateSelect = async (date) => {
    setBooking({...booking, date});
    // Generate time slots with current staff selection
    if (booking.staffId) {
      await generateTimeSlots(date, booking.staffId);
    }
    setCurrentStep(4);
  };

  const handleTimeSelect = (time) => {
    setBooking({...booking, time});
    setCurrentStep(5);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedService = services.find(s => s.id === booking.serviceId);
      const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
      
      const appointmentData = {
        service_id: booking.serviceId,
        staff_id: booking.staffId,
        start_at: bookingDateTime.toISOString(),
        customer_name: booking.customerName,
        customer_email: booking.customerEmail,
        customer_phone: booking.customerPhone,
        notes: booking.notes
      };

      await axios.post(`${API}/public/${tenantSlug}/appointments`, appointmentData);
      setBookingComplete(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert(error.response?.data?.detail || 'Fehler beim Buchen des Termins');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Buchungsseite wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Geschäft nicht gefunden</h2>
            <p className="text-gray-600">Das angeforderte Geschäft konnte nicht gefunden werden.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Termin bestätigt!</h2>
            <p className="text-gray-600 mb-6">
              Vielen Dank! Ihr Termin wurde erfolgreich gebucht. Sie erhalten in Kürze eine Bestätigung per E-Mail.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h3 className="font-medium text-gray-900 mb-2">Termindetails:</h3>
              <p className="text-sm text-gray-600">
                <strong>Service:</strong> {services.find(s => s.id === booking.serviceId)?.name}<br/>
                <strong>Mitarbeiter:</strong> {staff.find(s => s.id === booking.staffId)?.name}<br/>
                <strong>Datum:</strong> {new Date(booking.date).toLocaleDateString('de-CH')}<br/>
                <strong>Uhrzeit:</strong> {booking.time}<br/>
                <strong>Kunde:</strong> {booking.customerName}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Termin buchen</h1>
          <p className="text-gray-600">bei {tenantInfo.name}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Dienstleistung wählen</h2>
                <div className="space-y-3">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service.id)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                          <p className="text-sm text-gray-500">{service.duration_minutes} Minuten</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">CHF {service.price_chf.toFixed(2)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Mitarbeiter wählen</h2>
                {booking.date && (
                  <p className="text-sm text-gray-600 mb-4">
                    Verfügbare Mitarbeiter für {new Date(booking.date).toLocaleDateString('de-CH')}
                  </p>
                )}
                <div className="space-y-3">
                  <button
                    onClick={() => handleStaffSelect('')}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">Egal welcher Mitarbeiter</h3>
                    <p className="text-sm text-gray-600">Automatische Zuteilung</p>
                  </button>
                  {(booking.date ? getAvailableStaff() : staff).map((member) => {
                    const isWorking = booking.date ? isStaffWorkingOnDay(member, new Date(booking.date)) : true;
                    const hasClosure = booking.date ? hasSpecialClosure(member.id, new Date(booking.date)) : false;
                    const workingHours = booking.date ? getStaffWorkingHours(member, new Date(booking.date)) : null;
                    
                    return (
                      <button
                        key={member.id}
                        onClick={() => handleStaffSelect(member.id)}
                        className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
                        disabled={booking.date && (!isWorking || hasClosure)}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: member.color_tag }}
                          ></div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{member.name}</h3>
                            {booking.date && workingHours && (
                              <p className="text-sm text-green-600">
                                Verfügbar: {workingHours.start_time} - {workingHours.end_time}
                              </p>
                            )}
                            {booking.date && !isWorking && (
                              <p className="text-sm text-red-600">Nicht verfügbar an diesem Tag</p>
                            )}
                            {booking.date && hasClosure && (
                              <p className="text-sm text-red-600">Geschlossen / Urlaub</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {booking.date && getAvailableStaff().length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Keine Mitarbeiter verfügbar an diesem Tag</p>
                      <p className="text-sm text-gray-500">Bitte wählen Sie einen anderen Tag</p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)} 
                  className="mt-4"
                >
                  Zurück
                </Button>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Datum wählen</h2>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className="mb-4"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(2)} 
                  className="mt-4"
                >
                  Zurück
                </Button>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Uhrzeit wählen</h2>
                <p className="text-gray-600 mb-4">
                  Verfügbare Zeiten am {new Date(booking.date).toLocaleDateString('de-CH')}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center transition-colors"
                    >
                      <span className="font-medium">{time}</span>
                    </button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(3)} 
                  className="mt-4"
                >
                  Zurück
                </Button>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Ihre Daten</h2>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Vor- und Nachname *"
                      value={booking.customerName}
                      onChange={(e) => setBooking({...booking, customerName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="E-Mail-Adresse *"
                      value={booking.customerEmail}
                      onChange={(e) => setBooking({...booking, customerEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Telefonnummer"
                      value={booking.customerPhone}
                      onChange={(e) => setBooking({...booking, customerPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Anmerkungen (optional)"
                      value={booking.notes}
                      onChange={(e) => setBooking({...booking, notes: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none h-20"
                    />
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Terminübersicht:</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Service:</strong> {services.find(s => s.id === booking.serviceId)?.name}</p>
                      <p><strong>Mitarbeiter:</strong> {booking.staffId ? staff.find(s => s.id === booking.staffId)?.name : 'Egal welcher'}</p>
                      <p><strong>Datum:</strong> {new Date(booking.date).toLocaleDateString('de-CH')}</p>
                      <p><strong>Uhrzeit:</strong> {booking.time}</p>
                      <p><strong>Preis:</strong> CHF {services.find(s => s.id === booking.serviceId)?.price_chf.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setCurrentStep(4)}
                      disabled={submitting}
                    >
                      Zurück
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? 'Wird gebucht...' : 'Termin bestätigen'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Appointment Details Modal Component
const AppointmentDetailsModal = ({ isOpen, onClose, appointment, staff, services, onAppointmentUpdated, onAppointmentDeleted }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
    status: 'confirmed'
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        customer_name: appointment.customer_name || '',
        customer_email: appointment.customer_email || '',
        customer_phone: appointment.customer_phone || '',
        notes: appointment.notes || '',
        status: appointment.status || 'confirmed'
      });
      setIsEditing(false);
    }
  }, [appointment]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updateData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        notes: formData.notes,
        status: formData.status
      };
      
      const response = await axios.put(
        `${API}/appointments/${appointment.id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      onAppointmentUpdated(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert(error.response?.data?.detail || 'Fehler beim Aktualisieren des Termins');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Möchten Sie diesen Termin wirklich löschen?')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API}/appointments/${appointment.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onAppointmentDeleted(appointment.id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert(error.response?.data?.detail || 'Fehler beim Löschen des Termins');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const appointmentService = services.find(s => s.id === appointment.service_id);
  const appointmentStaff = staff.find(s => s.id === appointment.staff_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Termindetails</CardTitle>
              <CardDescription>
                {new Date(appointment.start_at).toLocaleDateString('de-CH', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Abbrechen' : 'Bearbeiten'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Appointment Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Zeit</p>
                <p className="font-medium">
                  {new Date(appointment.start_at).toLocaleTimeString('de-CH', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - {new Date(appointment.end_at).toLocaleTimeString('de-CH', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dauer</p>
                <p className="font-medium">
                  {Math.round((new Date(appointment.end_at) - new Date(appointment.start_at)) / (1000 * 60))} Min.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-medium">{appointmentService?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mitarbeiter</p>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: appointmentStaff?.color_tag || '#3B82F6' }}
                  ></div>
                  <p className="font-medium">{appointmentStaff?.name || 'N/A'}</p>
                </div>
              </div>
              {appointmentService?.price_chf && (
                <div>
                  <p className="text-sm text-gray-500">Preis</p>
                  <p className="font-medium">CHF {appointmentService.price_chf.toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                  {appointment.status === 'confirmed' ? 'Bestätigt' : 'Storniert'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h4 className="font-semibold mb-3">Kundendaten</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Name</label>
                {isEditing ? (
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="Kundenname"
                  />
                ) : (
                  <p className="font-medium">{appointment.customer_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">E-Mail</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    placeholder="E-Mail-Adresse"
                  />
                ) : (
                  <p className="font-medium">{appointment.customer_email || 'Keine E-Mail hinterlegt'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Telefon</label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    placeholder="Telefonnummer"
                  />
                ) : (
                  <p className="font-medium">{appointment.customer_phone || 'Keine Telefonnummer hinterlegt'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Notizen</label>
                {isEditing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Notizen zum Termin..."
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none h-20"
                  />
                ) : (
                  <p className="font-medium">{appointment.notes || 'Keine Notizen'}</p>
                )}
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                  >
                    <option value="confirmed">Bestätigt</option>
                    <option value="cancelled">Storniert</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            {isEditing ? (
              <>
                <Button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Speichern...' : 'Speichern'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  {loading ? 'Löschen...' : 'Löschen'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Schließen
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Legal Pages Components

// Impressum (Legal Notice) Component
const ImpressumPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Impressum</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Angaben gemäss Art. 8 UWG</h2>
              <div className="text-gray-600">
                <p><strong>Daylane GmbH</strong></p>
                <p>Musterstrasse 123</p>
                <p>8001 Zürich</p>
                <p>Schweiz</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Kontakt</h2>
              <div className="text-gray-600">
                <p><strong>Telefon:</strong> +41 44 123 45 67</p>
                <p><strong>E-Mail:</strong> info@daylane.ch</p>
                <p><strong>Website:</strong> www.daylane.ch</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Handelsregister</h2>
              <div className="text-gray-600">
                <p><strong>Handelsregister-Nummer:</strong> CHE-123.456.789</p>
                <p><strong>Handelsregisteramt:</strong> Zürich</p>
                <p><strong>Mehrwertsteuer-Nummer:</strong> CHE-123.456.789 MWST</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Vertretungsberechtigte Person</h2>
              <div className="text-gray-600">
                <p><strong>Geschäftsführer:</strong> Max Mustermann</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Haftungsausschluss</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  <strong>Haftung für Inhalte:</strong> Die Inhalte unserer Seiten wurden mit grösster Sorgfalt erstellt. 
                  Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                </p>
                <p>
                  <strong>Haftung für Links:</strong> Unser Angebot enthält Links zu externen Webseiten Dritter, 
                  auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch 
                  keine Gewähr übernehmen.
                </p>
                <p>
                  <strong>Urheberrecht:</strong> Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen 
                  Seiten unterliegen dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung 
                  und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen 
                  Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Zurück
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// AGB (Terms of Service) Component  
const AGBPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Geltungsbereich</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Leistungen der Daylane GmbH 
                  (nachfolgend "Daylane" genannt) im Zusammenhang mit der Bereitstellung der Online-Plattform 
                  für Terminbuchungen und Salonverwaltung.
                </p>
                <p>
                  Mit der Nutzung unserer Dienste akzeptieren Sie diese AGB vollumfänglich. 
                  Abweichende Bedingungen des Kunden werden nur anerkannt, wenn diese ausdrücklich 
                  schriftlich vereinbart wurden.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Leistungsumfang</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Daylane stellt eine webbasierte Software-as-a-Service (SaaS) Lösung zur Verfügung, 
                  die es Friseursalons und ähnlichen Dienstleistern ermöglicht:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Online-Terminbuchungen von Kunden zu verwalten</li>
                  <li>Mitarbeiter- und Serviceverwaltung durchzuführen</li>
                  <li>Öffnungszeiten und Verfügbarkeiten zu konfigurieren</li>
                  <li>Kundendaten und Termine zu verwalten</li>
                  <li>Abrechnungen und Zahlungen abzuwickeln</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Vertragsabschluss und Laufzeit</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Der Vertrag kommt durch die Registrierung und Bestätigung des Accounts zustande. 
                  Neue Kunden erhalten eine 14-tägige kostenlose Testphase.
                </p>
                <p>
                  Nach Ablauf der Testphase ist ein kostenpflichtiges Abonnement erforderlich. 
                  Die Laufzeit beträgt wahlweise einen Monat oder ein Jahr, je nach gewähltem Plan.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Preise und Zahlungsbedingungen</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Die aktuellen Preise sind auf unserer Website ersichtlich. Alle Preise verstehen sich 
                  inklusive der gesetzlichen Mehrwertsteuer.
                </p>
                <p>
                  Die Abrechnung erfolgt im Voraus für den gewählten Abrechnungszeitraum. 
                  Bei Zahlungsverzug kann der Zugang zur Plattform gesperrt werden.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Pflichten des Kunden</h2>
              <div className="text-gray-600 space-y-3">
                <p>Der Kunde verpflichtet sich:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Die Plattform nur für rechtmässige Zwecke zu nutzen</li>
                  <li>Zugangs- und Passwortdaten sicher zu verwahren</li>
                  <li>Für die Richtigkeit der eingegebenen Daten zu sorgen</li>
                  <li>Datenschutzbestimmungen gegenüber seinen Kunden einzuhalten</li>
                  <li>Regelmässig Datensicherungen durchzuführen</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Datenschutz und Vertraulichkeit</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Daylane behandelt alle Kundendaten vertraulich und gemäss der Datenschutzerklärung. 
                  Der Kunde ist für die Einhaltung der Datenschutzbestimmungen gegenüber seinen 
                  eigenen Kunden verantwortlich.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Haftung</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Daylane haftet nur bei Vorsatz und grober Fahrlässigkeit. Die Haftung für leichte 
                  Fahrlässigkeit ist ausgeschlossen, soweit nicht Leib, Leben oder die Gesundheit betroffen sind.
                </p>
                <p>
                  Die Haftung für Datenverlust ist auf den typischen Wiederherstellungsaufwand beschränkt, 
                  der bei regelmässiger und gefahrentsprechender Anfertigung von Sicherungskopien eingetreten wäre.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Kündigung</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Beide Parteien können den Vertrag unter Einhaltung einer Frist von 30 Tagen zum 
                  Ende der gewählten Laufzeit kündigen. Die Kündigung bedarf der Schriftform.
                </p>
                <p>
                  Bei Verstoss gegen diese AGB kann Daylane den Vertrag fristlos kündigen und 
                  den Zugang sperren.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Anwendbares Recht und Gerichtsstand</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Es gilt ausschliesslich schweizerisches Recht unter Ausschluss des UN-Kaufrechts.
                </p>
                <p>
                  Gerichtsstand ist Zürich, Schweiz.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">10. Salvatorische Klausel</h2>
              <div className="text-gray-600">
                <p>
                  Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden, 
                  so wird dadurch die Wirksamkeit der übrigen Bestimmungen nicht berührt.
                </p>
              </div>
            </section>

            <div className="text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
              <p>Stand: September 2025</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Zurück
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Datenschutzrichtlinien (Privacy Policy) Component
const DatenschutzPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Datenschutzerklärung</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Datenschutz auf einen Blick</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
                  personenbezogenen Daten passiert, wenn Sie unsere Website besuchen oder unsere 
                  Dienste nutzen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Verantwortliche Stelle</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Daylane GmbH</strong></p>
                  <p>Musterstrasse 123</p>
                  <p>8001 Zürich, Schweiz</p>
                  <p>E-Mail: datenschutz@daylane.ch</p>
                  <p>Telefon: +41 44 123 45 67</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Datenerfassung auf unserer Website</h2>
              <div className="text-gray-600 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Registrierung und Account-Erstellung</h3>
                  <p>
                    Bei der Registrierung für unseren Service erfassen wir folgende Daten:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Name und Firmenbezeichnung</li>
                    <li>E-Mail-Adresse</li>
                    <li>Telefonnummer</li>
                    <li>Geschäftsadresse</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Terminbuchungen</h3>
                  <p>
                    Im Rahmen der Terminbuchung verarbeiten wir:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Kundendaten (Name, E-Mail, Telefon)</li>
                    <li>Termindetails (Datum, Zeit, Service)</li>
                    <li>Besondere Wünsche oder Anmerkungen</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Zweck der Datenverarbeitung</h2>
              <div className="text-gray-600 space-y-3">
                <p>Die Verarbeitung Ihrer Daten erfolgt zu folgenden Zwecken:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bereitstellung und Verwaltung Ihres Accounts</li>
                  <li>Durchführung von Terminbuchungen</li>
                  <li>Kommunikation bezüglich Ihrer Buchungen</li>
                  <li>Abrechnung und Zahlungsabwicklung</li>
                  <li>Kundensupport und technische Betreuung</li>
                  <li>Verbesserung unserer Dienste</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Rechtsgrundlage der Verarbeitung</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf Grundlage des 
                  schweizerischen Datenschutzgesetzes (DSG) und der EU-Datenschutz-Grundverordnung (DSGVO):
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</li>
                  <li>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</li>
                  <li>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Datensicherheit</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Wir verwenden geeignete technische und organisatorische Sicherheitsmassnahmen, 
                  um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, 
                  Zerstörung oder Zugriff unberechtigter Personen zu schützen.
                </p>
                <p>
                  Unsere Sicherheitsverfahren werden entsprechend der technologischen Entwicklung 
                  fortlaufend verbessert.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Datenweitergabe</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Ihre personenbezogenen Daten werden nur in folgenden Fällen an Dritte weitergegeben:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Sie haben ausdrücklich eingewilligt</li>
                  <li>Die Weitergabe ist zur Vertragserfüllung erforderlich</li>
                  <li>Gesetzliche Verpflichtungen erfordern die Weitergabe</li>
                  <li>An Auftragsverarbeiter (Cloud-Hosting, Zahlungsdienstleister)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Speicherdauer</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Ihre Daten werden nur so lange gespeichert, wie es für die Erfüllung der 
                  genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
                </p>
                <p>
                  Nach Beendigung des Vertragsverhältnisses werden Ihre Daten gelöscht, 
                  sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Ihre Rechte</h2>
              <div className="text-gray-600 space-y-3">
                <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Recht auf Auskunft über Ihre gespeicherten Daten</li>
                  <li>Recht auf Berichtigung unrichtiger Daten</li>
                  <li>Recht auf Löschung Ihrer Daten</li>
                  <li>Recht auf Einschränkung der Verarbeitung</li>
                  <li>Recht auf Datenübertragbarkeit</li>
                  <li>Recht auf Widerspruch gegen die Verarbeitung</li>
                  <li>Recht auf Widerruf der Einwilligung</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">10. Cookies und Tracking</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Unsere Website verwendet Cookies, um die Nutzererfahrung zu verbessern und 
                  die Funktionalität sicherzustellen. Sie können Cookies in Ihren Browser-Einstellungen 
                  deaktivieren, was jedoch die Funktionalität einschränken kann.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">11. Kontakt</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>E-Mail:</strong> datenschutz@daylane.ch</p>
                  <p><strong>Telefon:</strong> +41 44 123 45 67</p>
                  <p><strong>Post:</strong> Daylane GmbH, Musterstrasse 123, 8001 Zürich</p>
                </div>
              </div>
            </section>

            <div className="text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
              <p>Stand: September 2025</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Zurück
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/agb" element={<AGBPage />} />
            <Route path="/datenschutz" element={<DatenschutzPage />} />
            <Route path="/api-test" element={<ApiTestPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            {/* Public booking route - moved to end to avoid conflicts */}
            <Route path="/:tenantSlug/buchen" element={<PublicBookingPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;