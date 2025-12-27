// Map Initialization
let map;
let markers = [];

function initializeMap(bridges) {
    // Initialize map if not already done
    if (!map) {
        map = L.map('map').setView([40.7128, -74.0060], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Add new markers
    bridges.forEach(bridge => {
        const riskClass = getRiskClass(bridge.fpi);
        const iconColor = riskClass === 'high' ? 'red' : riskClass === 'medium' ? 'orange' : 'green';
        
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-${riskClass}">
                     <i class="fas fa-bridge"></i>
                     <span class="marker-label">${bridge.fpi}</span>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        const marker = L.marker([bridge.location.lat, bridge.location.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <div class="map-popup">
                    <h3>${bridge.name}</h3>
                    <p><strong>Risk:</strong> <span class="${riskClass}">${riskClass.toUpperCase()}</span></p>
                    <p><strong>FPI:</strong> ${bridge.fpi}/100</p>
                    <p><strong>Location:</strong> ${bridge.area}</p>
                    <button onclick="showDetails('${bridge.id}')" class="popup-btn">
                        View Details
                    </button>
                </div>
            `);
        
        markers.push(marker);
    });
    
    // Add CSS for markers
    const style = document.createElement('style');
    style.textContent = `
        .marker-high {
            background: #dc2626;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            border: 3px solid white;
        }
        .marker-medium {
            background: #f59e0b;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            border: 3px solid white;
        }
        .marker-low {
            background: #059669;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            border: 3px solid white;
        }
        .marker-label {
            font-size: 10px;
            font-weight: bold;
        }
        .map-popup {
            padding: 10px;
            min-width: 200px;
        }
        .map-popup h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .map-popup p {
            margin: 5px 0;
            font-size: 14px;
        }
        .popup-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            width: 100%;
        }
        .high { color: #dc2626; font-weight: bold; }
        .medium { color: #f59e0b; font-weight: bold; }
        .low { color: #059669; font-weight: bold; }
    `;
    document.head.appendChild(style);
}

// Global function for popup button
window.showDetails = async function(bridgeId) {
    try {
        const response = await fetch(`http://localhost:3000/api/bridges/${bridgeId}`);
        const bridge = await response.json();
        showAssetDetails(bridge);
    } catch (error) {
        console.error('Error fetching bridge details:', error);
    }
};

function getRiskClass(fpi) {
    if (fpi >= 70) return 'high';
    if (fpi >= 40) return 'medium';
    return 'low';
}