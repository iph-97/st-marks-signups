// netlify/functions/send-reminders.js
// This runs once daily to check for upcoming events and send reminders

const { Client } = require('pg');

const getClient = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
};

// EmailJS configuration from environment variables
const EMAILJS_CONFIG = {
  serviceId: process.env.EMAILJS_SERVICE_ID,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
  templates: {
    guestReminder: process.env.EMAILJS_TEMPLATE_GUEST_REMINDER,
    hostReminder: process.env.EMAILJS_TEMPLATE_HOST_REMINDER
  }
};

// Send email via EmailJS REST API
async function sendEmail(templateId, templateParams, toEmail) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: EMAILJS_CONFIG.serviceId,
      template_id: templateId,
      user_id: EMAILJS_CONFIG.privateKey,
      template_params: {
        ...templateParams,
        to_email: toEmail
      }
    })
  });

  if (!response.ok) {
    throw new Error(`EmailJS API error: ${response.status}`);
  }

  return response.text();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function getSlotLabel(party, slotId) {
  if (!slotId) return 'General attendance';
  const slots = typeof party.slots === 'string' ? JSON.parse(party.slots) : (party.slots || []);
  const slot = slots.find(s => s.id === slotId);
  return slot ? slot.label : 'General attendance';
}

exports.handler = async (event, context) => {
  const client = await getClient();

  try {
    console.log('Running scheduled reminder check...');

    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(today.getDate() + 1);

    // Format dates for SQL query (YYYY-MM-DD)
    const sevenDaysDate = sevenDaysFromNow.toISOString().split('T')[0];
    const oneDayDate = oneDayFromNow.toISOString().split('T')[0];

    // Get parties happening in 7 days or 1 day
    const result = await client.query(
      `SELECT * FROM parties 
       WHERE date = $1 OR date = $2
       ORDER BY date ASC`,
      [sevenDaysDate, oneDayDate]
    );

    const parties = result.rows;
    console.log(`Found ${parties.length} parties needing reminders`);

    let emailsSent = 0;

    for (const party of parties) {
      const partyDate = new Date(party.date);
      const daysUntil = Math.ceil((partyDate - today) / (1000 * 60 * 60 * 24));

      console.log(`Processing party: ${party.title || 'Untitled'} - ${daysUntil} days away`);

      // Parse guests
      const guests = typeof party.guests === 'string' ? JSON.parse(party.guests) : (party.guests || []);

      if (daysUntil === 7 || daysUntil === 1) {
        // Send reminder to each guest
        for (const guest of guests) {
          const slotLabel = getSlotLabel(party, guest.slotId);
          
          await sendEmail(
            EMAILJS_CONFIG.templates.guestReminder,
            {
              guest_name: guest.name,
              event_title: party.title || 'Event',
              event_date: formatDate(party.date),
              event_location: party.location,
              host_name: party.host,
              host_email: party.host_email,
              slot_info: slotLabel,
              days_until: daysUntil,
              reminder_type: daysUntil === 7 ? 'one week' : '24 hours'
            },
            guest.email
          );
          
          emailsSent++;
          console.log(`Sent ${daysUntil}-day reminder to guest: ${guest.email}`);
        }

        // Send reminder to host with all guest info
        const guestList = guests.map(g => {
          const slotLabel = getSlotLabel(party, g.slotId);
          return `- ${g.name} (${g.email}) - ${slotLabel}${g.dietary ? ` - Dietary: ${g.dietary}` : ''}`;
        }).join('\n');

        await sendEmail(
          EMAILJS_CONFIG.templates.hostReminder,
          {
            host_name: party.host,
            event_title: party.title || 'Event',
            event_date: formatDate(party.date),
            event_location: party.location,
            total_guests: guests.length,
            max_guests: party.max_guests,
            guest_list: guestList,
            days_until: daysUntil,
            reminder_type: daysUntil === 7 ? 'one week' : '24 hours'
          },
          party.host_email
        );

        emailsSent++;
        console.log(`Sent ${daysUntil}-day reminder to host: ${party.host_email}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Reminders sent successfully',
        partiesProcessed: parties.length,
        emailsSent: emailsSent
      })
    };

  } catch (error) {
    console.error('Error sending reminders:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.end();
  }
};
