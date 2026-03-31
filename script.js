class SportsBookingApp {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.selectedSport = this.getSelectedSport();
        this.selectedTimeSlot = null;
        this.bookings = this.loadBookings();
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createFloatingShapes();
        this.initializePage();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().toLowerCase();
        
        if (filename.includes('login') || filename === '' || !this.currentUser) return 'login';
        if (filename.includes('booking')) return 'booking';
        return 'dashboard';
    }

    initializePage() {
        switch(this.currentPage) {
            case 'login':
                this.initializeLoginPage();
                break;
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'booking':
                this.initializeBookingPage();
                break;
        }
    }

    initializeLoginPage() {
        // Set up login form if it exists
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    initializeDashboard() {
        if (this.currentUser) {
            this.updateDashboardUserInfo();
            this.updateBookingStats();
            this.setupDashboardEventListeners();
        } else {
            this.redirectToLogin();
        }
    }

    initializeBookingPage() {
        if (this.currentUser && this.selectedSport) {
            this.updateBookingPageInfo();
            this.generateTimeSlots();
            this.setupBookingEventListeners();
        } else {
            this.redirectToDashboard();
        }
    }

    updateDashboardUserInfo() {
        const usernameElement = document.getElementById('displayUsername');
        const roleElement = document.getElementById('displayRole');
        
        if (usernameElement) usernameElement.textContent = this.currentUser.username;
        if (roleElement) roleElement.textContent = this.currentUser.type.charAt(0).toUpperCase() + this.currentUser.type.slice(1);
    }

    updateBookingStats() {
        const totalBookingsElement = document.getElementById('totalBookings');
        if (totalBookingsElement) {
            const userBookings = this.bookings.filter(b => b.user === this.currentUser.username);
            totalBookingsElement.textContent = userBookings.length;
        }
    }

    updateBookingPageInfo() {
        const sportIcon = document.getElementById('sportIcon');
        const sportName = document.getElementById('sportName');
        const userBadge = document.getElementById('userBadge');
        
        const sportIcons = {
            'pickleball': '🏓',
            'volleyball': '🏐',
            'football': '🏈',
            'cricket': '🏏',
            'tennis': '🎾'
        };
        
        if (sportIcon) sportIcon.textContent = sportIcons[this.selectedSport] || '🏆';
        if (sportName) sportName.textContent = this.selectedSport.charAt(0).toUpperCase() + this.selectedSport.slice(1);
        if (userBadge) userBadge.textContent = this.currentUser.type.charAt(0).toUpperCase() + this.currentUser.type.slice(1);
    }

    createFloatingShapes() {
        // Floating shapes are now in the HTML, no need to create them
    }

    // Navigation functions
    redirectToLogin() {
        window.location.href = 'login.html';
    }

    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }

    redirectToBooking(sport) {
        this.saveSelectedSport(sport);
        window.location.href = 'booking.html';
    }

    // Global functions for onclick handlers
    openBooking(sport) {
        this.redirectToBooking(sport);
    }

    goBack() {
        this.redirectToDashboard();
    }

    logout() {
        this.currentUser = null;
        this.saveCurrentUser(null);
        this.redirectToLogin();
        this.showNotification('Logged out successfully', 'info');
    }

    showBookings() {
        this.displayBookings();
        document.getElementById('bookingsModal').classList.add('show');
    }

    displayBookings() {
        const bookingsList = document.getElementById('bookingsList');
        if (!bookingsList) return;
        
        const userBookings = this.bookings.filter(b => b.user === this.currentUser.username);
        
        if (userBookings.length === 0) {
            bookingsList.innerHTML = '<p class="text-center">No bookings found</p>';
            return;
        }
        
        bookingsList.innerHTML = userBookings.map(booking => `
            <div class="glass-morphism p-3 mb-3">
                <h5>${booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)}</h5>
                <p>Date: ${booking.date} | Time: ${booking.time}</p>
                <p>Duration: ${booking.duration} hour(s) | Players: ${booking.players}</p>
                <small class="text-muted">Booked on: ${new Date(booking.createdAt).toLocaleDateString()}</small>
            </div>
        `).join('');
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username && password) {
            this.currentUser = {
                username: username,
                type: 'player',
                loginTime: new Date().toISOString()
            };
            
            this.saveCurrentUser(this.currentUser);
            this.redirectToDashboard();
            this.showNotification('Login successful!', 'success');
        }
    }

    // Booking page functions
    generateTimeSlots() {
        const timeSlotSelect = document.getElementById('timeSlotSelect');
        if (!timeSlotSelect) return;
        
        const startHour = 6;
        const endHour = 22;
        const timeSlots = ['<option value="">Select a time slot...</option>'];
        
        for (let hour = startHour; hour <= endHour; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            const isBooked = this.isTimeSlotBooked(this.selectedSport, time);
            const statusText = isBooked ? ' (Booked)' : '';
            
            if (!isBooked) {
                timeSlots.push(`<option value="${time}">${time}${statusText}</option>`);
            }
        }
        
        timeSlotSelect.innerHTML = timeSlots.join('');
        
        // Add change listener
        timeSlotSelect.addEventListener('change', () => {
            this.selectedTimeSlot = timeSlotSelect.value;
            this.updateBookingSummary();
        });
    }

    selectTimeSlot(time, available) {
        if (!available) return;
        
        // Remove previous selection
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Add selection to clicked slot
        event.target.closest('.time-slot').classList.add('selected');
        this.selectedTimeSlot = time;
        this.updateBookingSummary();
    }

    updateBookingSummary() {
        const date = document.getElementById('bookingDate')?.value;
        const duration = document.getElementById('duration')?.value;
        const players = document.getElementById('players')?.value;
        
        // Update summary elements
        const summarySport = document.getElementById('summarySport');
        const summaryDate = document.getElementById('summaryDate');
        const summaryTime = document.getElementById('summaryTime');
        const summaryDuration = document.getElementById('summaryDuration');
        const summaryPlayers = document.getElementById('summaryPlayers');
        const totalCost = document.getElementById('totalCost');
        
        if (summarySport) summarySport.textContent = this.selectedSport?.charAt(0).toUpperCase() + this.selectedSport?.slice(1) || '-';
        if (summaryDate) summaryDate.textContent = date || '-';
        if (summaryTime) summaryTime.textContent = this.selectedTimeSlot || '-';
        if (summaryDuration) summaryDuration.textContent = duration ? `${duration} hour(s)` : '-';
        if (summaryPlayers) summaryPlayers.textContent = players || '-';
        if (totalCost) totalCost.textContent = duration && players ? `$${duration * players * 10}` : '$0';
    }

    confirmBooking() {
        const date = document.getElementById('bookingDate')?.value;
        const duration = document.getElementById('duration')?.value;
        const players = document.getElementById('players')?.value;
        const specialRequests = document.getElementById('specialRequests')?.value;
        
        if (!this.selectedTimeSlot) {
            this.showNotification('Please select a time slot', 'warning');
            return;
        }

        const booking = {
            id: Date.now(),
            sport: this.selectedSport,
            date: date,
            time: this.selectedTimeSlot,
            duration: duration,
            players: players,
            specialRequests: specialRequests,
            user: this.currentUser.username,
            createdAt: new Date().toISOString()
        };

        this.bookings.push(booking);
        this.saveBookings();

        // Save latest booking for success page
        localStorage.setItem('latestBooking', JSON.stringify(booking));

        // Redirect to success page
        window.location.href = 'success.html';
        
        // Reset selection
        this.selectedSport = null;
        this.selectedTimeSlot = null;
        this.saveSelectedSport(null);
    }

    showSuccessModal(booking) {
        const successDetails = document.getElementById('successDetails');
        if (successDetails) {
            successDetails.innerHTML = `
                <div class="glass-morphism p-3">
                    <h5>${booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)}</h5>
                    <p>Date: ${booking.date} | Time: ${booking.time}</p>
                    <p>Duration: ${booking.duration} hour(s) | Players: ${booking.players}</p>
                    <p class="text-success">Booking ID: #${booking.id}</p>
                </div>
            `;
        }
        
        const modal = document.getElementById('successModal');
        if (modal) modal.classList.add('show');
        
        this.showNotification('Booking confirmed successfully!', 'success');
    }

    newBooking() {
        this.redirectToDashboard();
    }

    // Utility functions
    isTimeSlotBooked(sport, time, date = null) {
        const bookingDate = date || document.getElementById('bookingDate')?.value || new Date().toISOString().split('T')[0];
        return this.bookings.some(booking => 
            booking.sport === sport && 
            booking.time === time && 
            booking.date === bookingDate
        );
    }

    changePlayers(delta) {
        const playersInput = document.getElementById('players');
        if (playersInput) {
            const currentValue = parseInt(playersInput.value);
            const newValue = Math.max(1, Math.min(20, currentValue + delta));
            playersInput.value = newValue;
            this.updateBookingSummary();
        }
    }

    filterTimeSlots(period) {
        const allSlots = document.querySelectorAll('.time-slot');
        const buttons = document.querySelectorAll('.btn-time-filter');
        
        // Update active button
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Filter slots
        allSlots.forEach(slot => {
            const timeText = slot.querySelector('strong').textContent;
            const hour = parseInt(timeText.split(':')[0]);
            
            let show = false;
            switch(period) {
                case 'morning':
                    show = hour >= 6 && hour < 12;
                    break;
                case 'afternoon':
                    show = hour >= 12 && hour < 18;
                    break;
                case 'evening':
                    show = hour >= 18 && hour <= 22;
                    break;
                default:
                    show = true;
            }
            
            slot.style.display = show ? 'block' : 'none';
        });
    }

    // Storage functions
    saveCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    loadCurrentUser() {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    }

    saveSelectedSport(sport) {
        localStorage.setItem('selectedSport', sport);
    }

    getSelectedSport() {
        return localStorage.getItem('selectedSport');
    }

    // Event listeners setup
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Booking page listeners
        this.setupBookingEventListeners();
        
        // Dashboard listeners
        this.setupDashboardEventListeners();
    }

    setupBookingEventListeners() {
        // Date change listener
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.generateTimeSlots();
                this.updateBookingSummary();
            });
            
            // Set minimum date to today
            dateInput.min = new Date().toISOString().split('T')[0];
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // Duration and players listeners
        const durationSelect = document.getElementById('duration');
        const playersInput = document.getElementById('players');
        
        if (durationSelect) {
            durationSelect.addEventListener('change', () => this.updateBookingSummary());
        }
        
        if (playersInput) {
            playersInput.addEventListener('input', () => this.updateBookingSummary());
        }
    }

    setupDashboardEventListeners() {
        // Any dashboard-specific listeners can be added here
    }

    // Notification system
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }

    saveBookings() {
        localStorage.setItem('sportsBookings', JSON.stringify(this.bookings));
    }

    loadBookings() {
        const saved = localStorage.getItem('sportsBookings');
        return saved ? JSON.parse(saved) : [];
    }
}

// Global functions for onclick handlers
let app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new SportsBookingApp();
    
    // Make functions globally available for onclick handlers
    window.app = app;
    window.openBooking = (sport) => app.openBooking(sport);
    window.goBack = () => app.goBack();
    window.logout = () => app.logout();
    window.showBookings = () => app.showBookings();
    window.confirmBooking = () => app.confirmBooking();
    window.selectTimeSlot = (time, available) => app.selectTimeSlot(time, available);
    window.changePlayers = (delta) => app.changePlayers(delta);
    window.filterTimeSlots = (period) => app.filterTimeSlots(period);
    window.newBooking = () => app.newBooking();
});
