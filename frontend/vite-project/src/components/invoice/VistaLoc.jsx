import React, { useState } from "react";

const VistaLoc = () => {
  const [selectedLocation, setSelectedLocation] = useState("");

  const locations = [
    {
      id: 1,
      name: "USA Head Office",
      address: `VISTA Engg Solutions Inc
1999 S, Bascom Ave, Ste 700
Campbell, California, USA 95008`,
    },
    {
      id: 2,
      name: "USA Regional Office",
      address: `VISTA Engg Solutions Inc
41 Hutchin Drive, Building 3, PMB# 9206
Portland, Maine, USA 04102`,
    },
    {
      id: 3,
      name: "Germany Office 1",
      address: `Wolframstr. 24,
70191 Stuttgart, Germany`,
    },
    {
      id: 4,
      name: "Germany Office 2",
      address: `Friedrichstrasse 15,
Stuttgart, Germany`,
    },
    {
      id: 5,
      name: "India ODC Office",
      address: `VISTA Engg Solutions Inc
IndiaLand Tech Park, CHIL-SEZ Campus
Coimbatore, Tamil Nadu - 641035, India`,
    },
    {
      id: 6,
      name: "India Sales Office",
      address: `VISTA Engg Solutions Inc
#677, 1st Floor, 13th Cross, 27th Main Rd, 1st Sector,
HSR Layout, Bengaluru, Karnataka 560102`,
    },
  ];

  const handleSelect = (e) => {
    setSelectedLocation(e.target.value);
  };

  const selectedOffice = locations.find((loc) => loc.id === Number(selectedLocation));

  return (
    <div className="max-w-lg mx-auto mt-16 bg-white shadow-lg rounded-xl border border-gray-200 p-6 text-center">
      <h2 className="text-2xl font-bold text-indigo-700 mb-4">
        Choose Office Location
      </h2>

      {/* Dropdown */}
      <select
        value={selectedLocation}
        onChange={handleSelect}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">-- Select Office Location --</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>

      {/* Selected Office Details */}
      {selectedOffice && (
        <div className="mt-6 text-left bg-gray-50 p-4 rounded-md shadow-inner">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {selectedOffice.name}
          </h3>
          <p className="text-gray-700 whitespace-pre-line">
            {selectedOffice.address}
          </p>
        </div>
      )}
    </div>
  );
};

export default VistaLoc;
