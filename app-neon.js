document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('root');
  
  try {
    const response = await fetch('/.netlify/functions/series');
    const series = await response.json();
    
    if (series.length === 0) {
      root.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>St. Mark\'s Event Sign Ups</h1><p>No event series yet.</p></div>';
    } else {
      let html = '<div style="padding: 20px;"><h1>St. Mark\'s Event Sign Ups</h1><ul>';
      series.forEach(s => {
        html += '<li>' + s.title + ' (' + s.start_date + ' to ' + s.end_date + ')</li>';
      });
      html += '</ul></div>';
      root.innerHTML = html;
    }
  } catch (error) {
    root.innerHTML = '<div style="padding: 20px; color: red;"><h1>Error Loading Events</h1><p>' + error.message + '</p></div>';
  }
});
