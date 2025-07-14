import React, { useState, useEffect } from 'react';

// A mock function to simulate fetching new data from a server or source.
// In a real application, this would be an API call, a WebSocket message, etc.
const fetchNewDataPoint = () => {
  const newPoint = {
    id: new Date().getTime(), // Unique ID based on timestamp
    value: Math.floor(Math.random() * 100) + 1, // Random value between 1 and 100
    timestamp: new Date().toLocaleTimeString(),
  };
  return newPoint;
};

export default function App() {
  // --- State ---
  // 1. We use `useState` to store our array of data points.
  // We're initializing it with some "old" data.
  const [dataPoints, setDataPoints] = useState([
    { id: 0, value: 15, timestamp: 'Initial' },
    { id: 1, value: 28, timestamp: 'Initial' },
  ]);

  // --- Effect for Continuous Fetching ---
  // 2. We use `useEffect` to set up and tear down the data fetching interval.
  useEffect(() => {
    // This function will run after the component mounts (is first rendered).

    // We use `setInterval` to simulate a continuous stream of new data.
    const intervalId = setInterval(() => {
      const newData = fetchNewDataPoint();

      // 3. This is the key part: "recording" the new data.
      // We use the function form of the state setter. This ensures we always
      // have the most up-to-date previous state.
      // We create a NEW array by spreading the `prevDataPoints` and adding the `newData`.
      // This immutable update tells React to re-render efficiently.
      setDataPoints(prevDataPoints => [...prevDataPoints, newData]);

    }, 2000); // Fetch new data every 2 seconds.

    // 4. This is the "cleanup" function.
    // React runs this when the component is about to unmount (disappear).
    // It's crucial for preventing memory leaks by stopping the interval.
    return () => {
      clearInterval(intervalId);
    };

    // The empty dependency array `[]` means this effect runs only once
    // when the component mounts and cleans up when it unmounts.
  }, []);

  // --- Render ---
  // When `dataPoints` is updated, React re-renders this component.
  // It efficiently updates the list below, only adding the new item to the DOM
  // instead of re-creating the whole list from scratch.
  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2 text-center">Live Data Feed</h1>
        <p className="text-gray-400 mb-6 text-center">This component "records" new data points every 2 seconds without replacing the old data.</p>
        
        <div className="bg-gray-800 rounded-lg shadow-2xl p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Recorded Values:</h2>
          <ul className="space-y-3 h-96 overflow-y-auto pr-2">
            {dataPoints.map(point => (
              <li 
                key={point.id} 
                className="bg-gray-700 p-3 rounded-md flex justify-between items-center shadow-lg animate-fade-in"
              >
                <span className="text-lg text-white">Value: <span className="font-bold text-green-400">{point.value}</span></span>
                <span className="text-sm text-gray-400">Time: {point.timestamp}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-center mt-6 text-gray-500">Total data points: {dataPoints.length}</p>
      </div>
    </div>
  );
}

// Simple CSS for fade-in animation
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);
