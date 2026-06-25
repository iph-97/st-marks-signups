// St. Mark's Event Sign Ups - Vanilla JavaScript Version
// No React, no Babel - pure vanilla JS

class StMarksApp {
  constructor() {
    this.series = [];
    this.currentSeries = null;
    this.parties = [];
    this.editingParty = null;
    this.showingSignup = {};
    this.init();
  }

  async init() {
    this.loadSeries();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action]')) {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        this[action](id);
      }
    });
  }

  async loadSeries() {
    try {
      const response = await fetch('/.netlify/functions/series');
      this.series = await response.json();
      if (this.series.length > 0 && !this.currentSeries) {
        this.currentSeries = this.series[0];
        this.loadParties();
      }
      this.render();
    } catch (error) {
      console.error('Error loading series:', error);
      this.showError('Failed to load event series');
    }
  }

  async loadParties() {
    if (!this.currentSeries) return;
    try {
      const response = await fetch(`/.netlify/functions/parties?seriesId=${this.currentSeries.id}`);
      let data = await response.json();
      this.parties = data.map(p => ({
        ...p,
        guests: typeof p.guests === 'string' ? JSON.parse(p.guests) : (p.guests || []),
        slots: typeof p.slots === 'string' ? JSON.parse(p.slots) : (p.slots || [])
      }));
      this.render();
    } catch (error) {
      console.error('Error loading parties:', error);
      this.showError('Failed to load events');
    }
  }

  async createSeries(title, description, startDate, endDate) {
    try {
      const response = await fetch('/.netlify/functions/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, start_date: startDate, end_date: endDate })
      });
      if (!response.ok) throw new Error('Failed to create series');
      await this.loadSeries();
      this.showSuccess('Series created!');
    } catch (error) {
      console.error('Error:', error);
      this.showError('Failed to create series');
    }
  }

  async createParty(seriesId, data) {
    try {
      const response = await fetch('/.netlify/functions/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series_id: seriesId, ...data })
      });
      if (!response.ok) throw new Error('Failed to create party');
      await this.loadParties();
      this.showSuccess('Event created!');
    } catch (error) {
      console.error('Error:', error);
      this.showError('Failed to create event');
    }
  }

  async updateParty(partyId, data) {
    try {
      const response = await fetch('/.netlify/functions/parties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partyId, ...data })
      });
      if (!response.ok) throw new Error('Failed to update party');
      await this.loadParties();
      this.editingParty = null;
      this.showSuccess('Event updated!');
    } catch (error) {
      console.error('Error:', error);
      this.showError('Failed to update event');
    }
  }

  async deleteParty(partyId) {
    if (!confirm('Delete this event?')) return;
    try {
      const response = await fetch('/.netlify/functions/parties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partyId })
      });
      if (!response.ok) throw new Error('Failed to delete party');
      await this.loadParties();
      this.showSuccess('Event deleted!');
    } catch (error) {
      console.error('Error:', error);
      this.showError('Failed to delete event');
    }
  }

  selectSeries(seriesId) {
    this.currentSeries = this.series.find(s => s.id === seriesId);
    this.loadParties();
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  isPastDate(dateString) {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  }

  showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = message;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
  }

  showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
  }

  render() {
    const root = document.getElementById('root');
    root.innerHTML = this.renderHeader() + this.renderMain();
  }

  renderHeader() {
    return `
      <div class="header">
        <div class="container">
          <h1 class="title">St. Mark's Event Sign Ups</h1>
          <p class="subtitle">Welcome! Select an event series below.</p>
        </div>
      </div>
    `;
  }

  renderMain() {
    return `
      <div class="container">
        <button onclick="app.showSeriesModal()" class="btn btn-primary btn-center">
          ➕ Create New Event Series
        </button>

        <div class="series-list">
          ${this.series.length === 0 ? 
            '<p class="empty">No event series yet. Create one to get started!</p>' :
            this.series.map(s => this.renderSeriesItem(s)).join('')
          }
        </div>

        ${this.currentSeries ? this.renderEventsSection() : ''}
      </div>

      ${this.editingParty ? this.renderPartyModal(this.editingParty) : ''}
      ${document.getElementById('series-modal')?.innerHTML || ''}
    `;
  }

  renderSeriesItem(series) {
    const isActive = this.currentSeries?.id === series.id;
    return `
      <div class="series-item ${isActive ? 'active' : ''}" onclick="app.selectSeries('${series.id}')">
        <h2>${series.title}</h2>
        <p>${series.description || ''}</p>
        <p class="date-range">${this.formatDate(series.start_date)} to ${this.formatDate(series.end_date)}</p>
      </div>
    `;
  }

  renderEventsSection() {
    return `
      <div class="events-section">
        <div class="events-header">
          <h2>Events in ${this.currentSeries.title}</h2>
          <button onclick="app.showPartyModal()" class="btn btn-small">
            ➕ Add Event
          </button>
        </div>

        <div class="events-grid">
          ${this.parties.length === 0 ?
            '<p class="empty">No events yet in this series.</p>' :
            this.parties.map(p => this.renderPartyCard(p)).join('')
          }
        </div>
      </div>
    `;
  }

  renderPartyCard(party) {
    const guests = party.guests || [];
    const slots = party.slots || [];
    const isPast = this.isPastDate(party.date);
    const totalSlots = party.max_guests;
    const labeledSlots = slots.length;
    const generalSlots = totalSlots - labeledSlots;
    const filledSlotIds = guests.filter(g => g.slotId).map(g => g.slotId);
    const availableSlots = slots.filter(s => !filledSlotIds.includes(s.id));
    const generalGuestsCount = guests.filter(g => !g.slotId).length;
    const generalSlotsAvailable = Math.max(0, generalSlots - generalGuestsCount);

    return `
      <div class="party-card">
        <div class="party-header">
          <h3>${party.title || 'Event'}</h3>
          <p>${this.formatDate(party.date)}</p>
        </div>

        <div class="party-info">
          <p>📍 ${party.location}</p>
          <p>👥 ${guests.length}/${party.max_guests} guests</p>
          ${party.kid_friendly ? '<span class="badge">👶 Kid-friendly</span>' : ''}
          ${party.is_potluck ? '<span class="badge">🍽️ Potluck</span>' : ''}
        </div>

        ${guests.length > 0 ? `
          <div class="guests-list">
            <p class="label">Signed Up:</p>
            ${guests.map(g => `
              <div class="guest-item">
                <p><strong>${g.name}</strong></p>
                <p>${g.email}</p>
                ${g.bringing ? `<p class="bringing">Bringing: ${g.bringing}</p>` : ''}
                ${g.dietary ? `<p>Dietary: ${g.dietary}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="party-actions">
          ${!isPast ? `
            <button onclick="app.toggleSignup('${party.id}')" class="btn btn-full">
              ${this.showingSignup[party.id] ? 'Close Signup' : 'Sign Up'}
            </button>
            <button onclick="app.editParty('${party.id}')" class="btn btn-small">Edit</button>
            <button onclick="app.deleteParty('${party.id}')" class="btn btn-small btn-danger">Delete</button>
          ` : '<p class="past">This event has passed</p>'}
        </div>

        ${this.showingSignup[party.id] ? this.renderSignupForm(party, availableSlots, generalSlotsAvailable) : ''}
      </div>
    `;
  }

  renderSignupForm(party, availableSlots, generalSlotsAvailable) {
    return `
      <form class="signup-form" onsubmit="app.submitSignup(event, '${party.id}')">
        <input type="email" placeholder="Email *" name="email" required class="input">
        ${party.is_potluck ? `
          <input type="text" placeholder="What are you bringing? *" name="bringing" required class="input">
        ` : ''}
        <input type="text" placeholder="Dietary restrictions" name="dietary" class="input">
        
        <div class="slots-select">
          <p><strong>Select slots:</strong></p>
          ${availableSlots.map(s => `
            <label class="checkbox">
              <input type="checkbox" name="slots" value="${s.id}">
              <span>${s.label}</span>
              <input type="text" placeholder="Name" class="slot-name" data-slot="${s.id}">
            </label>
          `).join('')}
          ${generalSlotsAvailable > 0 ? Array.from({length: generalSlotsAvailable}, (_, i) => `
            <label class="checkbox">
              <input type="checkbox" name="slots" value="general-${i}">
              <span>General Attendance</span>
              <input type="text" placeholder="Name" class="slot-name" data-slot="general-${i}">
            </label>
          `).join('') : ''}
        </div>

        <button type="submit" class="btn btn-primary">Submit Signup</button>
      </form>
    `;
  }

  toggleSignup(partyId) {
    this.showingSignup[partyId] = !this.showingSignup[partyId];
    this.render();
  }

  async submitSignup(event, partyId) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const dietary = form.dietary.value;
    const bringing = form.bringing?.value || '';
    const selectedSlots = Array.from(form.querySelectorAll('input[name="slots"]:checked')).map(cb => cb.value);

    if (selectedSlots.length === 0) {
      alert('Please select at least one slot');
      return;
    }

    const party = this.parties.find(p => p.id === partyId);
    const newGuests = selectedSlots.map(slotId => ({
      id: `${Date.now()}-${slotId}`,
      name: form.querySelector(`input[data-slot="${slotId}"]`)?.value || 'Guest',
      email: email,
      dietary: dietary,
      bringing: party.is_potluck ? bringing : '',
      slotId: slotId.startsWith('general-') ? null : slotId,
      signedUpAt: new Date().toISOString()
    }));

    await this.updateParty(partyId, {
      ...party,
      guests: [...party.guests, ...newGuests]
    });

    this.showingSignup[partyId] = false;
  }

  editParty(partyId) {
    this.editingParty = this.parties.find(p => p.id === partyId);
    this.render();
  }

  showPartyModal() {
    this.editingParty = null;
    this.render();
  }

  showSeriesModal() {
    const title = prompt('Series Title:');
    if (!title) return;
    const description = prompt('Description:');
    const startDate = prompt('Start Date (YYYY-MM-DD):');
    const endDate = prompt('End Date (YYYY-MM-DD):');
    if (startDate && endDate) {
      this.createSeries(title, description, startDate, endDate);
    }
  }

  renderPartyModal(party) {
    return `
      <div class="modal" id="party-modal">
        <div class="modal-content">
          <h2>${party ? 'Edit Event' : 'Create Event'}</h2>
          <form onsubmit="app.submitPartyForm(event, '${party?.id || ''}')">
            <input type="text" placeholder="Event Title" value="${party?.title || ''}" name="title" class="input">
            <input type="date" value="${party?.date || ''}" name="date" required class="input">
            <input type="text" placeholder="Host Name" value="${party?.host || ''}" name="host" required class="input">
            <input type="email" placeholder="Host Email" value="${party?.host_email || ''}" name="hostEmail" required class="input">
            <input type="text" placeholder="Location" value="${party?.location || ''}" name="location" required class="input">
            <input type="number" placeholder="Max Guests" value="${party?.max_guests || 8}" name="maxGuests" min="1" class="input">
            <textarea placeholder="Description" name="description" class="input">${party?.description || ''}</textarea>
            
            <label class="checkbox">
              <input type="checkbox" name="kidFriendly" ${party?.kid_friendly ? 'checked' : ''}>
              <span>Kid-friendly home</span>
            </label>
            
            <label class="checkbox">
              <input type="checkbox" name="isPotluck" ${party?.is_potluck ? 'checked' : ''}>
              <span>This is a potluck</span>
            </label>

            <div>
              <p><strong>Slot Labels (Optional)</strong></p>
              <div id="slots-container">
                ${party?.slots?.map((s, i) => `
                  <input type="text" value="${s.label}" class="input slot-input" data-index="${i}">
                `).join('') || ''}
              </div>
              <button type="button" onclick="app.addSlotInput()" class="btn btn-small">Add Slot</button>
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn btn-primary">Save Event</button>
              <button type="button" onclick="app.editingParty = null; app.render();" class="btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  addSlotInput() {
    const container = document.getElementById('slots-container');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input slot-input';
    input.placeholder = 'Slot label';
    container.appendChild(input);
  }

  async submitPartyForm(event, partyId) {
    event.preventDefault();
    const form = event.target;
    
    const slots = Array.from(document.querySelectorAll('.slot-input'))
      .filter(input => input.value.trim())
      .map((input, i) => ({
        id: `slot-${Date.now()}-${i}`,
        label: input.value
      }));

    const data = {
      title: form.title.value,
      date: form.date.value,
      host: form.host.value,
      host_email: form.hostEmail.value,
      location: form.location.value,
      max_guests: parseInt(form.maxGuests.value),
      kid_friendly: form.kidFriendly.checked,
      is_potluck: form.isPotluck.checked,
      description: form.description.value,
      slots: slots,
      guests: this.editingParty?.guests || []
    };

    if (partyId) {
      await this.updateParty(partyId, data);
    } else {
      await this.createParty(this.currentSeries.id, data);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StMarksApp();
});
