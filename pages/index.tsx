import React from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Welcome to TorqueEd</h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        Automotive Education Management System
      </p>
      
      <div style={{ marginBottom: '40px' }}>
        <button
          onClick={() => router.push('/attendance')}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            fontSize: '18px',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          📊 Open Attendance Spreadsheet
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f3f4f6', 
        padding: '20px', 
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h3>Quick Links</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>
            <a href="/attendance" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              📊 Attendance Spreadsheet
            </a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a href="/classes" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              📚 Manage Classes
            </a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a href="/students" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              👥 Manage Students
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}