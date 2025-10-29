import React from 'react';

const themeYellow = '#fcd116';
const themeBlue = '#2563eb';

const AdmissionsSection: React.FC = () => (
  <section className="py-16 bg-white">
    <div className="max-w-3xl mx-auto px-4">
      <h2 className="text-3xl font-extrabold mb-8 text-center" style={{ color: themeBlue }}>Admissions</h2>
      <div className="bg-white rounded-xl shadow-lg p-8 border-4" style={{ borderColor: themeYellow }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: themeBlue }}>Admission Open for 2025-26!</h3>
        <p className="mb-4 text-gray-700">Give your child the best opportunity to learn and grow at Shakti Shanti Academy. We follow the CBSE curriculum and have a team of dedicated teachers to ensure holistic development.</p>
        <ul className="mb-4 list-disc pl-6 text-gray-800">
          <li>CBSE Curriculum</li>
          <li>Best Teachers</li>
          <li>Continuous Success</li>
        </ul>
        <a href="#" className="inline-block font-bold py-3 px-8 rounded-lg shadow transition-colors" style={{ background: themeYellow, color: themeBlue }}>Apply Now</a>
      </div>
    </div>
  </section>
);

export default AdmissionsSection;
