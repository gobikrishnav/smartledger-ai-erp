import React from 'react';

export default function Register() {
  return (
    <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
      <div className="bg-white border border-black max-w-lg w-full p-8 rounded shadow-lg">
        <h1 className="text-3xl font-bold text-black mb-6 text-center">Register New User</h1>
        <form className="space-y-4">
          {/* Implement full form later, skeleton for now */}
          <p className="text-gray-500 italic">Registration currently disabled in demo mode.</p>
        </form>
      </div>
    </div>
  );
}
