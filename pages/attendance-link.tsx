import React from 'react';

export default function AttendanceLink() {
  React.useEffect(() => {
    window.location.href = '/attendance';
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <p>Redirecting to attendance spreadsheet...</p>
      <p>If you're not redirected, <a href="/attendance">click here</a>.</p>
    </div>
  );
}