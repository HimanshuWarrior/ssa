import React from 'react';

const themeYellow = '#fcd116';
const themeBlue = '#2563eb';


const ContactSection: React.FC = () => (
  <section className="py-20 bg-gradient-to-br from-blue-50 to-yellow-50">
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-4xl font-extrabold mb-8 text-center flex items-center justify-center gap-3">
        <svg width="36" height="36" fill="none" viewBox="0 0 24 24"><path d="M2 6.5A2.5 2.5 0 014.5 4h15A2.5 2.5 0 0122 6.5v11a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 17.5v-11z" stroke={themeBlue} strokeWidth="2"/><path d="M22 6.5l-10 7-10-7" stroke={themeYellow} strokeWidth="2"/></svg>
        <span style={{ color: themeBlue }}>Contact Us</span>
      </h2>
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        <div className="flex-1 bg-white rounded-2xl shadow-xl p-8 border-4 border-dashed" style={{ borderColor: themeYellow }}>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.5 11 9 11s9-5.75 9-11c0-4.97-4.03-9-9-9z" stroke={themeBlue} strokeWidth="2"/></svg>
              <span className="font-bold text-gray-900">Address:</span>
            </div>
            <span className="text-gray-700">Ami, Ambika Sthan, Dighwara, Saran, Bihar</span>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C6.48 21 3 17.52 3 13a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.21 1.11l-2.2 2.2z" stroke={themeBlue} strokeWidth="2"/></svg>
              <span className="font-bold text-gray-900">Phone:</span>
            </div>
            <span className="text-gray-700">+91 9771130097</span>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4z" stroke={themeBlue} strokeWidth="2"/><path d="M22 6.5l-10 7-10-7" stroke={themeYellow} strokeWidth="2"/></svg>
              <span className="font-bold text-gray-900">Email:</span>
            </div>
            <span className="text-gray-700">shaktishanti@ami.ac.in</span>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={themeBlue} strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke={themeYellow} strokeWidth="2"/></svg>
              <span className="font-bold text-gray-900">Website:</span>
            </div>
            <span className="text-gray-700">www.ssaami.ac.in</span>
          </div>
        </div>
        <form className="flex-1 bg-white rounded-2xl shadow-xl p-8 border-4 border-dashed flex flex-col gap-4" style={{ borderColor: themeBlue }}>
          <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: themeYellow }}>Send us a message</h3>
          <input type="text" placeholder="Your Name" className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" required />
          <input type="email" placeholder="Your Email" className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" required />
          <textarea placeholder="Your Message" className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none min-h-[100px]" required />
          <button type="submit" className="mt-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg hover:from-blue-500 hover:to-yellow-400 transition-all">Send Message</button>
        </form>
      </div>
    </div>
  </section>
);

export default ContactSection;
