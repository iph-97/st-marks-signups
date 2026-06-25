const { useState, useEffect } = React;
const { Calendar, Users, Mail, Plus, Trash2, Edit2, Check, X } = lucide;

// Date formatting helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// EmailJS Configuration - UPDATE THESE VALUES after EmailJS setup
const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID',           // From EmailJS dashboard
  publicKey: 'YOUR_PUBLIC_KEY',           // From EmailJS dashboard
  templates: {
    guestConfirmation: 'template_guest_confirmation',
    hostNewSignup: 'template_host_new_signup'
  }
};

// Email helper functions
const emailHelpers = {
  getSlotLabel(party, slotId) {
    if (!slotId) return 'General attendance';
    const slots = typeof party.slots === 'string' ? JSON.parse(party.slots) : (party.slots || []);
    const slot = slots.find(s => s.id === slotId);
    return slot ? slot.label : 'General attendance';
  },

  async sendGuestConfirmation(guest, party, seriesTitle) {
    // Only send if EmailJS is configured
    if (EMAILJS_CONFIG.serviceId === 'YOUR_SERVICE_ID') {
      console.log('EmailJS not configured yet - skipping confirmation email');
      return;
    }

    const slotInfo = this.getSlotLabel(party, guest.slotId);
    
    const templateParams = {
      to_email: guest.email,
      guest_name: guest.name,
      event_title: party.title || 'Event',
      event_date: formatDate(party.date),
      event_location: party.location,
      host_name: party.host,
      host_email: party.host_email,
      slot_info: slotInfo,
      dietary_restrictions: guest.dietary || 'None specified',
      series_name: seriesTitle
    };

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.guestConfirmation,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );
      console.log('✓ Confirmation email sent to:', guest.email);
    } catch (error) {
      console.error('✗ Failed to send confirmation email:', error);
    }
  },

  async sendHostNewSignup(guest, party, seriesTitle) {
    // Only send if EmailJS is configured
    if (EMAILJS_CONFIG.serviceId === 'YOUR_SERVICE_ID') {
      console.log('EmailJS not configured yet - skipping host notification');
      return;
    }

    const slotInfo = this.getSlotLabel(party, guest.slotId);
    
    const templateParams = {
      to_email: party.host_email,
      host_name: party.host,
      event_title: party.title || 'Event',
      event_date: formatDate(party.date),
      guest_name: guest.name,
      guest_email: guest.email,
      slot_info: slotInfo,
      dietary_restrictions: guest.dietary || 'None',
      current_count: party.guests.length,
      max_guests: party.max_guests,
      spots_remaining: party.max_guests - party.guests.length
    };

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.hostNewSignup,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );
      console.log('✓ Host notification sent to:', party.host_email);
    } catch (error) {
      console.error('✗ Failed to send host notification:', error);
    }
  }
};

// API helper functions
const api = {
  async getSeries() {
    const response = await fetch('/.netlify/functions/series');
    if (!response.ok) throw new Error('Failed to fetch series');
    return response.json();
  },

  async createSeries(data) {
    const response = await fetch('/.netlify/functions/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create series');
    return response.json();
  },

  async updateSeries(data) {
    const response = await fetch('/.netlify/functions/series', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update series');
    return response.json();
  },

  async deleteSeries(id) {
    const response = await fetch('/.netlify/functions/series', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error('Failed to delete series');
    return response.json();
  },

  async getParties(seriesId) {
    const response = await fetch(`/.netlify/functions/parties?seriesId=${seriesId}`);
    if (!response.ok) throw new Error('Failed to fetch parties');
    const parties = await response.json();
    // Parse JSON fields back to arrays/objects
    return parties.map(p => ({
      ...p,
      guests: typeof p.guests === 'string' ? JSON.parse(p.guests) : (p.guests || []),
      slots: typeof p.slots === 'string' ? JSON.parse(p.slots) : (p.slots || [])
    }));
  },

  async createParty(data) {
    const response = await fetch('/.netlify/functions/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create party');
    const party = await response.json();
    return {
      ...party,
      guests: typeof party.guests === 'string' ? JSON.parse(party.guests) : (party.guests || []),
      slots: typeof party.slots === 'string' ? JSON.parse(party.slots) : (party.slots || [])
    };
  },

  async updateParty(data) {
    const response = await fetch('/.netlify/functions/parties', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update party');
    const party = await response.json();
    return {
      ...party,
      guests: typeof party.guests === 'string' ? JSON.parse(party.guests) : (party.guests || []),
      slots: typeof party.slots === 'string' ? JSON.parse(party.slots) : (party.slots || [])
    };
  },

  async deleteParty(id) {
    const response = await fetch('/.netlify/functions/parties', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error('Failed to delete party');
    return response.json();
  }
};

const DinnerPartyManager = () => {
  const [series, setSeries] = useState([]);
  const [currentSeries, setCurrentSeries] = useState(null);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddParty, setShowAddParty] = useState(false);
  const [showAddSeries, setShowAddSeries] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [editingSeries, setEditingSeries] = useState(null);

  // Load series on mount
  useEffect(() => {
    loadSeries();
  }, []);

  // Load parties when series changes
  useEffect(() => {
    if (currentSeries) {
      loadParties(currentSeries.id);
    }
  }, [currentSeries]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSeries();
      if (currentSeries) {
        loadParties(currentSeries.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSeries]);

  const loadSeries = async () => {
    try {
      const data = await api.getSeries();
      setSeries(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading series:', error);
      setLoading(false);
    }
  };

  const loadParties = async (seriesId) => {
    try {
      const data = await api.getParties(seriesId);
      setParties(data);
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const saveSeries = async (seriesData) => {
    try {
      if (seriesData.id) {
        await api.updateSeries(seriesData);
      } else {
        await api.createSeries(seriesData);
      }
      await loadSeries();
    } catch (error) {
      console.error('Error saving series:', error);
      alert('Failed to save series. Please try again.');
    }
  };

  const deleteSeries = async (seriesId) => {
    if (!confirm('Are you sure you want to delete this series? All associated dinner parties will also be deleted.')) return;
    
    try {
      await api.deleteSeries(seriesId);
      if (currentSeries?.id === seriesId) {
        setCurrentSeries(null);
      }
      await loadSeries();
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Failed to delete series. Please try again.');
    }
  };

  const saveParty = async (party) => {
    try {
      // Transform snake_case database fields to camelCase for API
      const partyData = {
        id: party.id,
        seriesId: party.series_id || party.seriesId,
        title: party.title,
        date: party.date,
        host: party.host,
        hostEmail: party.host_email || party.hostEmail,
        location: party.location,
        maxGuests: party.max_guests || party.maxGuests,
        kidFriendly: party.kid_friendly !== undefined ? party.kid_friendly : party.kidFriendly,
        isPotluck: party.is_potluck !== undefined ? party.is_potluck : party.isPotluck,
        description: party.description,
        guests: party.guests,
        slots: party.slots
      };

      if (partyData.id) {
        await api.updateParty(partyData);
      } else {
        await api.createParty(partyData);
      }
      await loadParties(currentSeries.id);
    } catch (error) {
      console.error('Error saving party:', error);
      alert('Failed to save party. Please try again.');
    }
  };

  const deleteParty = async (partyId) => {
    if (!confirm('Are you sure you want to delete this dinner party?')) return;
    
    try {
      await api.deleteParty(partyId);
      await loadParties(currentSeries.id);
    } catch (error) {
      console.error('Error deleting party:', error);
      alert('Failed to delete party. Please try again.');
    }
  };

  const selectSeries = (seriesData) => {
    setCurrentSeries(seriesData);
  };

  const duplicateParty = (party) => {
    // Pre-fill form with all data from original party except date
    setEditingParty({
      ...party,
      id: null, // Clear ID so it creates a new party
      date: '', // Clear date so user must choose new one
      guests: [] // Clear guests for new party
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Home page - series selection
  if (!currentSeries) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-slate-800 text-white py-8 shadow-md">
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-4xl font-serif mb-2">
              St. Mark's Event Sign Ups
            </h1>
            <p className="text-gray-200">Connecting our community through shared meals</p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={() => setShowAddSeries(true)}
            className="mb-6 bg-red-700 text-white px-6 py-3 rounded hover:bg-red-800 transition flex items-center gap-2 shadow-md mx-auto"
          >
            <Plus size={20} />
            Create New Event Series
          </button>

          {showAddSeries && (
            <SeriesForm
              onSave={async (seriesData) => {
                await saveSeries(seriesData);
                setShowAddSeries(false);
              }}
              onCancel={() => setShowAddSeries(false)}
            />
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.length === 0 ? (
              <div className="col-span-full bg-white rounded shadow-md p-12 text-center border border-gray-200">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 text-lg font-serif">No event series created yet</p>
                <p className="text-gray-500">Click the button above to create your first series!</p>
              </div>
            ) : (
              series.map(s => (
                <SeriesCard
                  key={s.id}
                  series={s}
                  onSelect={() => selectSeries(s)}
                  onEdit={() => setEditingSeries(s)}
                  onDelete={() => deleteSeries(s.id)}
                />
              ))
            )}
          </div>

          {editingSeries && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <SeriesForm
                  series={editingSeries}
                  onSave={async (updatedData) => {
                    await saveSeries({ ...editingSeries, ...updatedData });
                    setEditingSeries(null);
                  }}
                  onCancel={() => setEditingSeries(null)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Series detail page - party management
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-800 text-white py-6 shadow-md">
        <div className="max-w-6xl mx-auto px-6">
          <button
            onClick={() => setCurrentSeries(null)}
            className="text-gray-200 hover:text-white mb-3 flex items-center gap-2"
          >
            ← Back to All Series
          </button>
          <h1 className="text-3xl font-serif mb-1">{currentSeries.title}</h1>
          <p className="text-gray-300 text-sm">{currentSeries.description}</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-2">
                Event window: {formatDate(currentSeries.start_date)} - {formatDate(currentSeries.end_date)}
              </p>
            </div>
            <button
              onClick={() => setEditingSeries(currentSeries)}
              className="text-red-700 hover:text-red-800 p-2"
              title="Edit series"
            >
              <Edit2 size={20} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAddParty(true)}
          className="mb-6 bg-red-700 text-white px-6 py-3 rounded hover:bg-red-800 transition flex items-center gap-2 shadow-md"
        >
          <Plus size={20} />
          Sign Up to Host an Event
        </button>

        {showAddParty && (
          <PartyForm
            series={currentSeries}
            onSave={async (party) => {
              const newParty = {
                ...party,
                seriesId: currentSeries.id,
                guests: []
              };
              await saveParty(newParty);
              setShowAddParty(false);
            }}
            onCancel={() => setShowAddParty(false)}
          />
        )}

        <div className="grid gap-6">
          {parties.length === 0 ? (
            <div className="bg-white rounded shadow-md p-12 text-center border border-gray-200">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg font-serif">No events scheduled yet</p>
              <p className="text-gray-500">Click the button above to host the first one!</p>
            </div>
          ) : (
            parties.map(party => (
              <PartyCard
                key={party.id}
                party={party}
                onDelete={() => deleteParty(party.id)}
                onEdit={() => setEditingParty(party)}
                onUpdate={saveParty}
                onDuplicate={duplicateParty}
                seriesTitle={currentSeries.title}
              />
            ))
          )}
        </div>

        {editingParty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <PartyForm
                series={currentSeries}
                party={editingParty}
                onSave={async (updatedParty) => {
                  await saveParty({ ...editingParty, ...updatedParty });
                  setEditingParty(null);
                }}
                onCancel={() => setEditingParty(null)}
              />
            </div>
          </div>
        )}

        {editingSeries && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <SeriesForm
                series={editingSeries}
                onSave={async (updatedData) => {
                  await saveSeries({ ...editingSeries, ...updatedData });
                  setEditingSeries(null);
                }}
                onCancel={() => setEditingSeries(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// SeriesForm, SeriesCard, PartyForm, and PartyCard components remain the same as before
// (Copy from the previous app.js - they don't need changes for the database switch)

const SeriesForm = ({ series, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: series?.title || '',
    description: series?.description || '',
    startDate: series?.start_date || '',
    endDate: series?.end_date || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('End date must be after start date');
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow-md p-6 mb-6 max-w-2xl mx-auto border border-gray-200">
      <h2 className="text-2xl font-serif mb-2 text-gray-800">{series ? 'Edit' : 'Create New'} Event Series</h2>
      <p className="text-gray-600 mb-4">Set up a series of events with a specific time window</p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Series Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Spring 2025 Newcomer Dinners"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What is this series about? Who should participate?"
          rows="3"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
            required
          />
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Hosts will only be able to schedule events within this date range
      </p>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-red-700 text-white px-6 py-2 rounded hover:bg-red-800 transition flex items-center gap-2"
        >
          <Check size={18} />
          {series ? 'Save Changes' : 'Create Series'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition flex items-center gap-2"
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    </form>
  );
};

const SeriesCard = ({ series, onSelect, onEdit, onDelete }) => {
  const startDate = new Date(series.start_date);
  const endDate = new Date(series.end_date);
  const now = new Date();
  const isActive = now >= startDate && now <= endDate;
  const isPast = now > endDate;
  const isFuture = now < startDate;

  return (
    <div 
      className={`bg-white rounded shadow-md overflow-hidden cursor-pointer transition hover:shadow-lg border border-gray-200 ${isPast ? 'opacity-75' : ''}`}
      onClick={onSelect}
    >
      <div className="bg-slate-800 text-white p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-serif">{series.title}</h3>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-1.5 rounded transition"
              title="Edit series"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-1.5 rounded transition"
              title="Delete series"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {isActive && (
          <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
            Active
          </span>
        )}
        {isFuture && (
          <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
            Upcoming
          </span>
        )}
        {isPast && (
          <span className="inline-block bg-gray-500 text-white text-xs px-2 py-1 rounded font-medium">
            Completed
          </span>
        )}
      </div>
      
      <div className="p-4">
        {series.description && (
          <p className="text-gray-600 text-sm mb-3">{series.description}</p>
        )}
        <div className="text-sm text-gray-500">
          <p className="flex items-center gap-2 mb-1">
            <Calendar size={16} />
            {formatDate(series.start_date)} - {formatDate(series.end_date)}
          </p>
        </div>
      </div>
    </div>
  );
};

const PartyForm = ({ party, series, onSave, onCancel }) => {
  // Ensure slots is always an array
  const parseSlots = (slots) => {
    if (!slots) return [];
    if (typeof slots === 'string') {
      try {
        return JSON.parse(slots);
      } catch {
        return [];
      }
    }
    return Array.isArray(slots) ? slots : [];
  };

  const [formData, setFormData] = useState({
    title: party?.title || '',
    date: party?.date || '',
    host: party?.host || '',
    hostEmail: party?.host_email || '',
    location: party?.location || '',
    maxGuests: party?.max_guests || 8,
    kidFriendly: party?.kid_friendly || false,
    isPotluck: party?.is_potluck || false,
    description: party?.description || '',
    slots: parseSlots(party?.slots)
  });

  const addSlot = () => {
    setFormData({
      ...formData,
      slots: [...formData.slots, { id: Date.now().toString(), label: '', filled: false }]
    });
  };

  const updateSlot = (id, label) => {
    setFormData({
      ...formData,
      slots: formData.slots.map(slot => 
        slot.id === id ? { ...slot, label } : slot
      )
    });
  };

  const removeSlot = (id) => {
    setFormData({
      ...formData,
      slots: formData.slots.filter(slot => slot.id !== id)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.host || !formData.hostEmail || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (series) {
      const partyDate = new Date(formData.date);
      const seriesStart = new Date(series.start_date);
      const seriesEnd = new Date(series.end_date);
      
      if (partyDate < seriesStart || partyDate > seriesEnd) {
        alert(`Event date must be between ${formatDate(series.start_date)} and ${formatDate(series.end_date)}`);
        return;
      }
    }

    // Filter out empty slots
    const cleanedSlots = formData.slots.filter(slot => slot.label.trim() !== '');
    
    onSave({ ...formData, slots: cleanedSlots });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow-md p-6 mb-6 border border-gray-200">
      <h2 className="text-2xl font-serif mb-2 text-gray-800">{party ? 'Edit' : 'Host an'} Event</h2>
      <p className="text-gray-600 mb-4">Sign up to host an event at your home</p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Title (Optional)</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., 'Summer BBQ' or 'Game Night'"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
          <input
            type="text"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            placeholder="Your name"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Email *</label>
          <input
            type="email"
            value={formData.hostEmail}
            onChange={(e) => setFormData({ ...formData, hostEmail: e.target.value })}
            placeholder="your@email.com"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={series?.start_date}
            max={series?.end_date}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
            required
          />
          {series && (
            <p className="text-xs text-gray-500 mt-1">
              Must be between {formatDate(series.start_date)} - {formatDate(series.end_date)}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How many guests can you accommodate? *</label>
          <input
            type="number"
            value={formData.maxGuests}
            onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) })}
            min="1"
            max="50"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Location/Address *</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Your address or general area (e.g., 'Capitol Hill')"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1">You can share exact address with guests later</p>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.kidFriendly}
            onChange={(e) => setFormData({ ...formData, kidFriendly: e.target.checked })}
            className="w-4 h-4 text-red-700 border-gray-300 rounded focus:ring-red-700"
          />
          <span className="text-sm font-medium text-gray-700">
            Kid-friendly home (children welcome)
          </span>
        </label>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isPotluck}
            onChange={(e) => setFormData({ ...formData, isPotluck: e.target.checked })}
            className="w-4 h-4 text-red-700 border-gray-300 rounded focus:ring-red-700"
          />
          <span className="text-sm font-medium text-gray-700">
            This is a potluck (guests will bring food/drinks)
          </span>
        </label>
      </div>

      {/* Slot Label Management Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Slot Labels (Optional)
          </label>
          <button
            type="button"
            onClick={addSlot}
            className="text-sm text-red-700 hover:text-red-800 flex items-center gap-1"
          >
            <Plus size={16} />
            Add Label
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Add optional labels for specific roles or seats (e.g., "Table 1", "Couple", "Single")
        </p>

        {formData.slots.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No slots created. Guests will sign up for general attendance.</p>
        ) : (
          <div className="space-y-2">
            {formData.slots.map((slot, index) => (
              <div key={slot.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={slot.label}
                  onChange={(e) => updateSlot(slot.id, e.target.value)}
                  placeholder={`Slot ${index + 1} (e.g., "Main Dish")`}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-red-700 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Remove slot"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details (Optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Theme, menu ideas, parking info, dietary accommodations, pet info, etc."
          rows="3"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-700 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-red-700 text-white px-6 py-2 rounded hover:bg-red-800 transition flex items-center gap-2"
        >
          <Check size={18} />
          {party ? 'Save Changes' : 'Sign Up to Host'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition flex items-center gap-2"
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    </form>
  );
};

// NEW PartyCard Component with Multi-Slot Signup and Duplicate Button
// Replace the existing PartyCard in app-neon.js with this version

const PartyCard = ({ party, onDelete, onEdit, onUpdate, onDuplicate, seriesTitle }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({ 
    email: '', 
    dietary: '',
    bringing: '',      // What they're bringing if potluck
    selectedSlots: [],  // Array of slot IDs
    slotNames: {},      // {slotId: "Person Name"}
    generalName: ''     // For general attendance (no slot)
  });

  const partyDate = new Date(party.date);
  const isPast = partyDate < new Date();
  
  // Parse slots and guests
  const slots = typeof party.slots === 'string' ? JSON.parse(party.slots) : (party.slots || []);
  const guests = typeof party.guests === 'string' ? JSON.parse(party.guests) : (party.guests || []);
  
  // Calculate available slots
  const totalSlots = party.max_guests;
  const labeledSlots = slots.length;
  const generalSlots = totalSlots - labeledSlots;
  
  // Track which slots are filled
  const filledSlotIds = guests.filter(g => g.slotId).map(g => g.slotId);
  const availableSlots = slots.filter(s => !filledSlotIds.includes(s.id));
  const generalGuestsCount = guests.filter(g => !g.slotId).length;
  const generalSlotsAvailable = generalSlots - generalGuestsCount;
  
  const spotsLeft = availableSlots.length + generalSlotsAvailable;

  const handleSlotToggle = (slotId) => {
    const newSelected = signupForm.selectedSlots.includes(slotId)
      ? signupForm.selectedSlots.filter(id => id !== slotId)
      : [...signupForm.selectedSlots, slotId];
    
    setSignupForm({ ...signupForm, selectedSlots: newSelected });
  };

  const handleSlotNameChange = (slotId, name) => {
    setSignupForm({
      ...signupForm,
      slotNames: { ...signupForm.slotNames, [slotId]: name }
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!signupForm.email) {
      alert('Please enter an email address');
      return;
    }

    // Validate all selected slots have names
    for (const slotId of signupForm.selectedSlots) {
      if (!signupForm.slotNames[slotId] || !signupForm.slotNames[slotId].trim()) {
        alert('Please enter a name for each selected slot');
        return;
      }
    }

    // Check if at least one slot is selected
    if (signupForm.selectedSlots.length === 0) {
      alert('Please select at least one slot');
      return;
    }

    // Create a guest entry for each selected slot
    const newGuests = signupForm.selectedSlots.map(slotId => {
      // General slots have IDs like "general-0", "general-1"
      const isGeneralSlot = slotId.startsWith('general-');
      
      return {
        id: `${Date.now()}-${slotId}`,
        name: signupForm.slotNames[slotId],
        email: signupForm.email,
        dietary: signupForm.dietary,
        bringing: party.is_potluck ? signupForm.bringing : '', // Only if potluck
        slotId: isGeneralSlot ? null : slotId, // null for general attendance
        signedUpAt: new Date().toISOString()
      };
    });

    const updatedParty = {
      ...party,
      guests: [...guests, ...newGuests]
    };

    try {
      await onUpdate(updatedParty);
      
      // Send confirmation emails to each new guest and notification to host
      for (const guest of newGuests) {
        // Send confirmation to guest
        await emailHelpers.sendGuestConfirmation(guest, updatedParty, seriesTitle);
        
        // Send notification to host
        await emailHelpers.sendHostNewSignup(guest, updatedParty, seriesTitle);
      }
      
      setSignupForm({ email: '', dietary: '', bringing: '', selectedSlots: [], slotNames: {}, generalName: '' });
      setShowSignup(false);
      alert('Successfully signed up! You\'ll receive a confirmation email shortly.');
    } catch (error) {
      console.error('Signup error:', error);
      alert('Failed to sign up. Please try again.');
    }
  };

  const removeGuest = async (guestId) => {
    if (!confirm('Remove this guest from the event?')) return;
    
    const updatedParty = {
      ...party,
      guests: guests.filter(g => g.id !== guestId)
    };
    await onUpdate(updatedParty);
  };

  const getSlotLabel = (slotId) => {
    const slot = slots.find(s => s.id === slotId);
    return slot ? slot.label : null;
  };

  return (
    <div className={`bg-white rounded shadow-md overflow-hidden border border-gray-200 ${isPast ? 'opacity-75' : ''}`}>
      <div className="bg-slate-800 text-white p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            {party.title && (
              <h2 className="text-3xl font-serif mb-1">{party.title}</h2>
            )}
            <h3 className={`${party.title ? 'text-xl' : 'text-2xl'} font-serif ${party.title ? 'text-gray-300' : 'mb-1'}`}>
              {formatDate(party.date)}
            </h3>
            <p className="text-gray-300">Hosted by {party.host}{party.host_email ? ` (${party.host_email})` : ''}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDuplicate(party)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded transition text-sm font-medium"
              title="Duplicate event"
            >
              ⧉
            </button>
            <button
              onClick={onEdit}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded transition"
              title="Edit event"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={onDelete}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded transition"
              title="Delete event"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span>📍 {party.location}</span>
          <span>👥 {guests.length}/{party.max_guests} guests</span>
          {party.kid_friendly && (
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-medium">
              👶 Kid-friendly
            </span>
          )}
          {party.is_potluck && (
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-medium">
              🍽️ Potluck
            </span>
          )}
          {slots.length > 0 && (
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-medium">
              🏷️ Labeled slots
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {party.description && (
          <p className="text-gray-600 mb-4 italic">{party.description}</p>
        )}

        {/* Show Potluck Slots if they exist */}
        {slots.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-2">Potluck Slots</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {slots.map(slot => {
                const guest = guests.find(g => g.slotId === slot.id);
                return (
                  <div key={slot.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">{slot.label}</span>
                    {guest ? (
                      <span className="text-xs text-green-600 font-medium">✓ {guest.name}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Available</span>
                    )}
                  </div>
                );
              })}
            </div>
            {generalSlots > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Plus {generalSlots} general {generalSlots === 1 ? 'spot' : 'spots'} ({generalSlotsAvailable} available)
              </p>
            )}
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">Guest List</h4>
            {spotsLeft > 0 && !isPast && (
              <span className="text-sm text-green-600 font-medium">{spotsLeft} spots left</span>
            )}
          </div>

          {guests.length === 0 ? (
            <p className="text-gray-400 text-sm">No guests signed up yet</p>
          ) : (
            <div className="space-y-2">
              {guests.map(guest => {
                const slotLabel = getSlotLabel(guest.slotId);
                return (
                  <div key={guest.id} className="flex justify-between items-start bg-gray-50 p-3 rounded border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-800">
                        {guest.name}
                        {slotLabel && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {slotLabel}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{guest.email}</p>
                      {guest.bringing && (
                        <p className="text-sm text-green-600 mt-1">Bringing: {guest.bringing}</p>
                      )}
                      {guest.dietary && (
                        <p className="text-sm text-gray-600 mt-1">Dietary: {guest.dietary}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeGuest(guest.id)}
                      className="text-red-700 hover:text-red-800 p-1"
                      title="Remove guest"
                    >
                      <X size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isPast && spotsLeft > 0 && (
          <>
            {!showSignup ? (
              <button
                onClick={() => setShowSignup(true)}
                className="w-full bg-red-700 text-white py-3 rounded hover:bg-red-800 transition font-medium"
              >
                Sign Up for This Event
              </button>
            ) : (
              <form onSubmit={handleSignup} className="bg-gray-50 p-4 rounded border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-3">Sign Up</h5>
                
                {/* All Slots - Both Labeled and General */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select slot(s) to attend:
                  </label>
                  
                  {/* Labeled slots */}
                  {availableSlots.map(slot => (
                    <div key={slot.id} className="mb-3">
                      <label className="flex items-start gap-2 cursor-pointer mb-1">
                        <input
                          type="checkbox"
                          checked={signupForm.selectedSlots.includes(slot.id)}
                          onChange={() => handleSlotToggle(slot.id)}
                          className="mt-1 w-4 h-4 text-red-700 border-gray-300 rounded focus:ring-red-700"
                        />
                        <span className="text-sm font-medium text-gray-700">{slot.label}</span>
                      </label>
                      {signupForm.selectedSlots.includes(slot.id) && (
                        <input
                          type="text"
                          placeholder="Name for this slot *"
                          value={signupForm.slotNames[slot.id] || ''}
                          onChange={(e) => handleSlotNameChange(slot.id, e.target.value)}
                          className="ml-6 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          required
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* General attendance slots */}
                  {Array.from({ length: generalSlotsAvailable }, (_, i) => {
                    const generalSlotId = `general-${i}`;
                    return (
                      <div key={generalSlotId} className="mb-3">
                        <label className="flex items-start gap-2 cursor-pointer mb-1">
                          <input
                            type="checkbox"
                            checked={signupForm.selectedSlots.includes(generalSlotId)}
                            onChange={() => handleSlotToggle(generalSlotId)}
                            className="mt-1 w-4 h-4 text-red-700 border-gray-300 rounded focus:ring-red-700"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            General Attendance {generalSlotsAvailable > 1 ? `(Slot ${i + 1})` : ''}
                          </span>
                        </label>
                        {signupForm.selectedSlots.includes(generalSlotId) && (
                          <input
                            type="text"
                            placeholder="Your name *"
                            value={signupForm.slotNames[generalSlotId] || ''}
                            onChange={(e) => handleSlotNameChange(generalSlotId, e.target.value)}
                            className="ml-6 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            required
                          />
                        )}
                      </div>
                    );
                  })}
                  
                  {(availableSlots.length === 0 && generalSlotsAvailable === 0) && (
                    <p className="text-sm text-gray-500">No slots available</p>
                  )}
                </div>
                
                <input
                  type="email"
                  placeholder="Email (for all people) *"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                  required
                />
                
                {party.is_potluck && (
                  <input
                    type="text"
                    placeholder="What are you bringing? *"
                    value={signupForm.bringing}
                    onChange={(e) => setSignupForm({ ...signupForm, bringing: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                    required
                  />
                )}
                
                <input
                  type="text"
                  placeholder="Dietary restrictions (optional)"
                  value={signupForm.dietary}
                  onChange={(e) => setSignupForm({ ...signupForm, dietary: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                />
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-red-700 text-white py-2 rounded hover:bg-red-800 transition"
                  >
                    Confirm Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignup(false);
                      setSignupForm({ email: '', dietary: '', bringing: '', selectedSlots: [], slotNames: {}, generalName: '' });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {isPast && (
          <div className="bg-gray-100 text-gray-600 py-2 px-4 rounded text-center">
            This event has already occurred
          </div>
        )}

        {!isPast && spotsLeft === 0 && (
          <div className="bg-yellow-50 text-yellow-800 py-2 px-4 rounded text-center font-medium border border-yellow-200">
            This event is full
          </div>
        )}
      </div>
    </div>
  );
};
// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(DinnerPartyManager));