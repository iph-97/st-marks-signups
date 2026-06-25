// St. Mark's Event Sign Ups - Fresh Clean Build
const { useState, useEffect } = React;
const { Calendar, Users, Mail, Plus, Trash2, Edit2, Check, X } = lucide;

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const isPastDate = (dateString) => {
  const eventDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

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
    return response.json();
  },

  async updateParty(data) {
    const response = await fetch('/.netlify/functions/parties', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update party');
    return response.json();
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

// ============================================================================
// COMPONENTS
// ============================================================================

const SeriesForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-white rounded shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">Create Event Series</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Series Title *"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          rows="3"
        />
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          required
        />
        <input
          type="date"
          value={formData.end_date}
          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          required
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-red-700 text-white px-6 py-2 rounded hover:bg-red-800">Save Series</button>
          <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500">Cancel</button>
        </div>
      </form>
    </div>
  );
};

const PartyForm = ({ party, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: party?.title || '',
    date: party?.date || '',
    host: party?.host || '',
    host_email: party?.host_email || '',
    location: party?.location || '',
    max_guests: party?.max_guests || 8,
    kid_friendly: party?.kid_friendly || false,
    is_potluck: party?.is_potluck || false,
    description: party?.description || '',
    slots: party?.slots ? (typeof party.slots === 'string' ? JSON.parse(party.slots) : party.slots) : []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.host || !formData.host_email || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(formData);
  };

  const addSlot = () => {
    setFormData({
      ...formData,
      slots: [...formData.slots, { id: `slot-${Date.now()}`, label: '' }]
    });
  };

  const updateSlot = (index, label) => {
    const newSlots = [...formData.slots];
    newSlots[index].label = label;
    setFormData({...formData, slots: newSlots});
  };

  const removeSlot = (index) => {
    setFormData({
      ...formData,
      slots: formData.slots.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="bg-white rounded shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">{party ? 'Edit Event' : 'Create Event'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Event Title (optional)"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          required
        />
        <input
          type="text"
          placeholder="Host Name *"
          value={formData.host}
          onChange={(e) => setFormData({...formData, host: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          required
        />
        <input
          type="email"
          placeholder="Host Email *"
          value={formData.host_email}
          onChange={(e) => setFormData({...formData, host_email: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          required
        />
        <input
          type="text"
          placeholder="Location *"
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          required
        />
        <input
          type="number"
          placeholder="Max Guests"
          value={formData.max_guests}
          onChange={(e) => setFormData({...formData, max_guests: parseInt(e.target.value)})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          min="1"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.kid_friendly}
            onChange={(e) => setFormData({...formData, kid_friendly: e.target.checked})}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Kid-friendly home</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_potluck}
            onChange={(e) => setFormData({...formData, is_potluck: e.target.checked})}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">This is a potluck</span>
        </label>
        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2"
          rows="2"
        />

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700">Slot Labels (Optional)</label>
            <button
              type="button"
              onClick={addSlot}
              className="text-sm text-red-700 hover:text-red-800 flex items-center gap-1"
            >
              <Plus size={16} />
              Add Label
            </button>
          </div>
          {formData.slots.map((slot, index) => (
            <div key={slot.id} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Slot label"
                value={slot.label}
                onChange={(e) => updateSlot(index, e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeSlot(index)}
                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-red-700 text-white px-6 py-2 rounded hover:bg-red-800">Save Event</button>
          <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500">Cancel</button>
        </div>
      </form>
    </div>
  );
};

const PartyCard = ({ party, onEdit, onDelete, onUpdate }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({
    email: '',
    dietary: '',
    bringing: '',
    selectedSlots: [],
    slotNames: {}
  });

  const guests = typeof party.guests === 'string' ? JSON.parse(party.guests) : (party.guests || []);
  const slots = typeof party.slots === 'string' ? JSON.parse(party.slots) : (party.slots || []);
  const isPast = isPastDate(party.date);

  const handleSignup = (e) => {
    e.preventDefault();
    if (!signupForm.email || signupForm.selectedSlots.length === 0) {
      alert('Please enter email and select at least one slot');
      return;
    }

    const newGuests = signupForm.selectedSlots.map(slotId => ({
      id: `${Date.now()}-${slotId}`,
      name: signupForm.slotNames[slotId] || 'Guest',
      email: signupForm.email,
      dietary: signupForm.dietary,
      bringing: party.is_potluck ? signupForm.bringing : '',
      slotId: slotId.startsWith('general-') ? null : slotId,
      signedUpAt: new Date().toISOString()
    }));

    onUpdate({
      ...party,
      guests: [...guests, ...newGuests]
    }).then(() => {
      setShowSignup(false);
      setSignupForm({email: '', dietary: '', bringing: '', selectedSlots: [], slotNames: {}});
      alert('Successfully signed up!');
    });
  };

  const totalSlots = party.max_guests;
  const labeledSlots = slots.length;
  const generalSlots = totalSlots - labeledSlots;
  const filledSlotIds = guests.filter(g => g.slotId).map(g => g.slotId);
  const availableSlots = slots.filter(s => !filledSlotIds.includes(s.id));
  const generalGuestsCount = guests.filter(g => !g.slotId).length;
  const generalSlotsAvailable = Math.max(0, generalSlots - generalGuestsCount);
  const spotsLeft = availableSlots.length + generalSlotsAvailable;

  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-red-700 px-6 py-4">
        <h3 className="text-xl font-serif font-bold mb-2">{party.title || 'Event'}</h3>
        <p className="text-sm opacity-90">{formatDate(party.date)}</p>
      </div>

      <div className="px-6 py-4 space-y-2 text-sm">
        <p>📍 {party.location}</p>
        <p>👥 {guests.length}/{party.max_guests} guests</p>
        {party.kid_friendly && <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">👶 Kid-friendly</span>}
        {party.is_potluck && <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">🍽️ Potluck</span>}
      </div>

      <div className="px-6 py-4 border-t border-white border-opacity-20">
        {guests.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Signed Up:</p>
            <div className="space-y-2">
              {guests.map(guest => (
                <div key={guest.id} className="bg-white bg-opacity-10 p-2 rounded text-xs">
                  <p className="font-medium">{guest.name}</p>
                  <p className="text-gray-300">{guest.email}</p>
                  {guest.bringing && <p className="text-green-300">Bringing: {guest.bringing}</p>}
                  {guest.dietary && <p className="text-gray-300">Dietary: {guest.dietary}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isPast && (
          <button
            onClick={() => setShowSignup(!showSignup)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium mb-2"
          >
            {showSignup ? 'Cancel' : 'Sign Up for This Event'}
          </button>
        )}

        {!isPast && (
          <div className="flex gap-2">
            <button onClick={onEdit} className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 py-2 rounded text-sm flex items-center justify-center gap-1">
              <Edit2 size={16} />
              Edit
            </button>
            <button onClick={onDelete} className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 py-2 rounded text-sm flex items-center justify-center gap-1">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>

      {showSignup && (
        <div className="px-6 py-4 bg-gray-800 border-t border-white border-opacity-20">
          <form onSubmit={handleSignup} className="space-y-3">
            <input
              type="email"
              placeholder="Email *"
              value={signupForm.email}
              onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm"
              required
            />
            {party.is_potluck && (
              <input
                type="text"
                placeholder="What are you bringing? *"
                value={signupForm.bringing}
                onChange={(e) => setSignupForm({...signupForm, bringing: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm"
                required
              />
            )}
            <input
              type="text"
              placeholder="Dietary restrictions (optional)"
              value={signupForm.dietary}
              onChange={(e) => setSignupForm({...signupForm, dietary: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm"
            />
            <div className="text-xs">
              <p className="font-semibold mb-2">Select slots:</p>
              {availableSlots.map(slot => (
                <label key={slot.id} className="flex items-center gap-2 mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signupForm.selectedSlots.includes(slot.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSignupForm({
                          ...signupForm,
                          selectedSlots: [...signupForm.selectedSlots, slot.id]
                        });
                      } else {
                        setSignupForm({
                          ...signupForm,
                          selectedSlots: signupForm.selectedSlots.filter(id => id !== slot.id)
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span>{slot.label}</span>
                  <input
                    type="text"
                    placeholder="Name"
                    value={signupForm.slotNames[slot.id] || ''}
                    onChange={(e) => setSignupForm({
                      ...signupForm,
                      slotNames: {...signupForm.slotNames, [slot.id]: e.target.value}
                    })}
                    className="flex-1 border border-gray-400 rounded px-2 py-1 text-black"
                  />
                </label>
              ))}
              {generalSlotsAvailable > 0 && (
                <>
                  {Array.from({length: generalSlotsAvailable}, (_, i) => {
                    const slotId = `general-${i}`;
                    return (
                      <label key={slotId} className="flex items-center gap-2 mb-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signupForm.selectedSlots.includes(slotId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSignupForm({
                                ...signupForm,
                                selectedSlots: [...signupForm.selectedSlots, slotId]
                              });
                            } else {
                              setSignupForm({
                                ...signupForm,
                                selectedSlots: signupForm.selectedSlots.filter(id => id !== slotId)
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span>General Attendance</span>
                        <input
                          type="text"
                          placeholder="Name"
                          value={signupForm.slotNames[slotId] || ''}
                          onChange={(e) => setSignupForm({
                            ...signupForm,
                            slotNames: {...signupForm.slotNames, [slotId]: e.target.value}
                          })}
                          className="flex-1 border border-gray-400 rounded px-2 py-1 text-black"
                        />
                      </label>
                    );
                  })}
                </>
              )}
            </div>
            <button type="submit" className="w-full bg-red-700 hover:bg-red-800 py-2 rounded text-sm font-medium">Sign Up</button>
          </form>
        </div>
      )}
    </div>
  );
};

const DinnerPartyManager = () => {
  const [series, setSeries] = useState([]);
  const [currentSeries, setCurrentSeries] = useState(null);
  const [parties, setParties] = useState([]);
  const [showAddSeries, setShowAddSeries] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  useEffect(() => {
    loadSeries();
  }, []);

  useEffect(() => {
    if (currentSeries) {
      loadParties(currentSeries.id);
    }
  }, [currentSeries]);

  const loadSeries = async () => {
    try {
      const data = await api.getSeries();
      setSeries(data);
      if (data.length > 0) {
        setCurrentSeries(data[0]);
      }
    } catch (error) {
      console.error('Error loading series:', error);
      alert('Failed to load event series');
    }
  };

  const loadParties = async (seriesId) => {
    try {
      const data = await api.getParties(seriesId);
      setParties(data);
    } catch (error) {
      console.error('Error loading parties:', error);
      alert('Failed to load events');
    }
  };

  const saveSeries = async (data) => {
    try {
      const result = await api.createSeries(data);
      await loadSeries();
      setShowAddSeries(false);
    } catch (error) {
      console.error('Error saving series:', error);
      alert('Failed to save series');
    }
  };

  const saveParty = async (data) => {
    try {
      if (editingParty) {
        await api.updateParty({...data, id: editingParty.id});
        setEditingParty(null);
      } else {
        await api.createParty({...data, series_id: currentSeries.id});
      }
      await loadParties(currentSeries.id);
      setShowAddParty(false);
    } catch (error) {
      console.error('Error saving party:', error);
      alert('Failed to save event');
    }
  };

  const deleteParty = async (partyId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteParty(partyId);
      await loadParties(currentSeries.id);
    } catch (error) {
      console.error('Error deleting party:', error);
      alert('Failed to delete event');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {showAddSeries && <SeriesForm onSave={saveSeries} onCancel={() => setShowAddSeries(false)} />}
      {showAddParty && <PartyForm onSave={saveParty} onCancel={() => setShowAddParty(false)} />}
      {editingParty && <PartyForm party={editingParty} onSave={saveParty} onCancel={() => setEditingParty(null)} />}

      {!showAddSeries && !showAddParty && !editingParty && (
        <>
          <div className="bg-slate-800 text-white py-8 px-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl font-serif font-bold mb-2">St. Mark's Event Sign Ups</h1>
              <p className="text-gray-300">Welcome! Select an event series below.</p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto p-4">
            <button
              onClick={() => setShowAddSeries(true)}
              className="mb-6 bg-red-700 text-white px-6 py-3 rounded hover:bg-red-800 transition flex items-center gap-2 shadow-md mx-auto"
            >
              <Plus size={20} />
              Create New Event Series
            </button>

            {series.length === 0 ? (
              <div className="bg-white p-8 rounded shadow text-center text-gray-500">
                <p>No event series yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {series.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setCurrentSeries(s)}
                    className={`p-4 rounded shadow cursor-pointer transition ${currentSeries?.id === s.id ? 'bg-red-100 border-2 border-red-700' : 'bg-white hover:shadow-lg'}`}
                  >
                    <h2 className="text-xl font-bold text-slate-800">{s.title}</h2>
                    <p className="text-gray-600">{s.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(s.start_date)} to {formatDate(s.end_date)}</p>
                  </div>
                ))}
              </div>
            )}

            {currentSeries && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-serif font-bold text-slate-800">Events in {currentSeries.title}</h2>
                  <button
                    onClick={() => setShowAddParty(true)}
                    className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Event
                  </button>
                </div>

                {parties.length === 0 ? (
                  <div className="bg-white p-8 rounded shadow text-center text-gray-500">
                    <p>No events yet in this series. Add one to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parties.map(party => (
                      <PartyCard
                        key={party.id}
                        party={party}
                        onEdit={() => setEditingParty(party)}
                        onDelete={() => deleteParty(party.id)}
                        onUpdate={saveParty}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// RENDER
// ============================================================================

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(DinnerPartyManager));