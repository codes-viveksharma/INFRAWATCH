// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    fetchBridges();
    setupEventListeners();
    
    // Setup event listeners
    function setupEventListeners() {
        document.getElementById('refresh-btn').addEventListener('click', fetchBridges);
        document.getElementById('simulate-btn').addEventListener('click', runSimulation);
        document.getElementById('budget-slider').addEventListener('input', updateBudget);
        document.querySelector('.close-modal').addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeModal();
            }
        });
    }
    
    // Fetch bridges data
    async function fetchBridges() {
        try {
            const response = await fetch('http://localhost:3000/api/bridges');
            const bridges = await response.json();
            updateDashboard(bridges);
            initializeMap(bridges);
            updateAssetList(bridges);
        } catch (error) {
            console.error('Error fetching bridges:', error);
            // Use sample data if server is down
            const sampleBridges = getSampleBridges();
            updateDashboard(sampleBridges);
            updateAssetList(sampleBridges);
        }
    }
    
    // Update dashboard stats
    function updateDashboard(bridges) {
        const highRisk = bridges.filter(b => b.fpi >= 70).length;
        const mediumRisk = bridges.filter(b => b.fpi >= 40 && b.fpi < 70).length;
        const lowRisk = bridges.filter(b => b.fpi < 40).length;
        const totalRisk = bridges.reduce((sum, b) => sum + b.fpi, 0);
        
        document.getElementById('high-risk-count').textContent = highRisk;
        document.getElementById('medium-risk-count').textContent = mediumRisk;
        document.getElementById('low-risk-count').textContent = lowRisk;
        document.getElementById('total-risk').textContent = totalRisk;
        
        // Update recommendation
        updateRecommendation(bridges);
    }
    
    // Update asset list
    function updateAssetList(bridges) {
        const assetList = document.getElementById('asset-list');
        assetList.innerHTML = '';
        
        bridges.forEach(bridge => {
            const riskClass = getRiskClass(bridge.fpi);
            const riskLabel = getRiskLabel(bridge.fpi);
            
            const assetItem = document.createElement('div');
            assetItem.className = `asset-item ${riskClass}`;
            assetItem.innerHTML = `
                <div class="asset-header">
                    <span class="asset-name">${bridge.name}</span>
                    <span class="risk-badge ${riskClass}">${riskLabel} (${bridge.fpi})</span>
                </div>
                <div class="asset-details">
                    <span><i class="fas fa-map-marker-alt"></i> ${bridge.area}</span>
                    <span><i class="fas fa-calendar"></i> Age: ${bridge.age_years} years</span>
                    <span><i class="fas fa-car"></i> Traffic: ${bridge.traffic_load_index}/100</span>
                    <span><i class="fas fa-truck"></i> Trucks: ${bridge.heavy_vehicle_percentage}%</span>
                </div>
            `;
            
            assetItem.addEventListener('click', () => showAssetDetails(bridge));
            assetList.appendChild(assetItem);
        });
    }
    
    // Update recommendation
    function updateRecommendation(bridges) {
        const recommendedAssets = document.getElementById('recommended-assets');
        const sortedBridges = [...bridges].sort((a, b) => b.fpi - a.fpi).slice(0, 3);
        
        recommendedAssets.innerHTML = '';
        sortedBridges.forEach(bridge => {
            const assetRec = document.createElement('div');
            assetRec.className = 'asset-rec';
            assetRec.innerHTML = `
                <div class="asset-rec-header">
                    <span class="asset-name">${bridge.name}</span>
                    <span class="fpi">FPI: ${bridge.fpi}</span>
                </div>
                <div class="asset-reason">
                    ${generateShortReason(bridge)}
                </div>
            `;
            recommendedAssets.appendChild(assetRec);
        });
        
        // Calculate and update risk reduction
        calculateRiskReduction(bridges);
    }
    
    // Calculate risk reduction
    function calculateRiskReduction(bridges, repairCount = 3) {
        const sortedBridges = [...bridges].sort((a, b) => b.fpi - a.fpi);
        const toRepair = sortedBridges.slice(0, repairCount);
        
        const currentTotalRisk = bridges.reduce((sum, b) => sum + b.fpi, 0);
        const repairedAssets = bridges.map(bridge => {
            if (toRepair.find(r => r.id === bridge.id)) {
                return { ...bridge, fpi: 20 }; // Reduced after repair
            }
            return bridge;
        });
        const newTotalRisk = repairedAssets.reduce((sum, b) => sum + b.fpi, 0);
        const riskReduction = ((currentTotalRisk - newTotalRisk) / currentTotalRisk * 100).toFixed(1);
        
        document.getElementById('risk-reduction').textContent = `${riskReduction}%`;
        document.getElementById('cost-benefit').textContent = `${(riskReduction / repairCount).toFixed(1)}x`;
    }
    
    // Run simulation
    async function runSimulation() {
        const budget = parseInt(document.getElementById('budget-slider').value);
        const bridges = await fetch('http://localhost:3000/api/bridges').then(r => r.json());
        
        try {
            const response = await fetch('http://localhost:3000/api/optimize-repairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ budget, assets: bridges })
            });
            
            const result = await response.json();
            alert(`AI Recommendation: ${result.message}\nRisk Reduction: ${result.riskReduction}%`);
            
            // Update UI with simulation results
            updateRecommendation(bridges);
        } catch (error) {
            console.error('Error running simulation:', error);
            // Fallback calculation
            calculateRiskReduction(bridges, budget);
            alert(`Simulation complete! Fixing ${budget} assets reduces risk significantly.`);
        }
    }
    
    // Update budget display
    function updateBudget(e) {
        document.getElementById('budget-value').textContent = e.target.value;
        // Recalculate with new budget
        fetchBridges().then(() => {
            const bridges = getCurrentBridges();
            calculateRiskReduction(bridges, parseInt(e.target.value));
        });
    }
    
    // Show asset details modal
    function showAssetDetails(bridge) {
        const modal = document.getElementById('asset-modal');
        const content = document.getElementById('modal-content');
        
        const riskClass = getRiskClass(bridge.fpi);
        const riskLabel = getRiskLabel(bridge.fpi);
        
        content.innerHTML = `
            <div class="modal-header">
                <h2>${bridge.name}</h2>
                <span class="risk-badge ${riskClass} large">${riskLabel} Risk (FPI: ${bridge.fpi}/100)</span>
            </div>
            
            <div class="modal-grid">
                <div class="modal-section">
                    <h3><i class="fas fa-info-circle"></i> Basic Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Location</span>
                            <span class="info-value">${bridge.area}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Age</span>
                            <span class="info-value">${bridge.age_years} years</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Last Maintenance</span>
                            <span class="info-value">${bridge.last_maintenance_date}</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3><i class="fas fa-chart-line"></i> Risk Factors</h3>
                    <div class="factors-grid">
                        <div class="factor ${bridge.traffic_load_index > 70 ? 'high' : ''}">
                            <span>Traffic Load</span>
                            <span class="factor-value">${bridge.traffic_load_index}/100</span>
                        </div>
                        <div class="factor ${bridge.heavy_vehicle_percentage > 20 ? 'high' : ''}">
                            <span>Heavy Vehicles</span>
                            <span class="factor-value">${bridge.heavy_vehicle_percentage}%</span>
                        </div>
                        <div class="factor ${bridge.flood_exposure_index > 60 ? 'high' : ''}">
                            <span>Flood Risk</span>
                            <span class="factor-value">${bridge.flood_exposure_index}/100</span>
                        </div>
                        <div class="factor ${bridge.heat_stress_index > 70 ? 'high' : ''}">
                            <span>Heat Stress</span>
                            <span class="factor-value">${bridge.heat_stress_index}/100</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3><i class="fas fa-exclamation-triangle"></i> Risk Explanation</h3>
                    <p class="explanation">${generateDetailedReason(bridge)}</p>
                </div>
                
                <div class="modal-section">
                    <h3><i class="fas fa-tools"></i> Recommended Actions</h3>
                    <ul class="actions-list">
                        <li>Immediate structural inspection</li>
                        <li>Traffic diversion planning</li>
                        <li>Priority maintenance scheduling</li>
                        <li>Environmental stress monitoring</li>
                    </ul>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    // Helper functions
    function getRiskClass(fpi) {
        if (fpi >= 70) return 'high';
        if (fpi >= 40) return 'medium';
        return 'low';
    }
    
    function getRiskLabel(fpi) {
        if (fpi >= 70) return 'High';
        if (fpi >= 40) return 'Medium';
        return 'Low';
    }
    
    function generateShortReason(bridge) {
        const reasons = [];
        if (bridge.age_years > 40) reasons.push('Aging');
        if (bridge.traffic_load_index > 70) reasons.push('High Traffic');
        if (bridge.flood_exposure_index > 60) reasons.push('Flood Risk');
        if (bridge.incident_reports_count > 10) reasons.push('Incidents');
        return reasons.join(' • ');
    }
    
    function generateDetailedReason(bridge) {
        const reasons = [];
        if (bridge.age_years > 40) reasons.push(`Structure is ${bridge.age_years} years old`);
        
        const lastMaintenance = new Date(bridge.last_maintenance_date);
        const gapYears = (new Date() - lastMaintenance) / (1000 * 60 * 60 * 24 * 365.25);
        if (gapYears > 5) reasons.push(`${gapYears.toFixed(1)} years since last maintenance`);
        
        if (bridge.traffic_load_index > 70) reasons.push(`Heavy daily traffic (${bridge.traffic_load_index}/100)`);
        if (bridge.heavy_vehicle_percentage > 20) reasons.push(`High percentage of heavy vehicles (${bridge.heavy_vehicle_percentage}%)`);
        if (bridge.incident_reports_count > 10) reasons.push(`Multiple incident reports (${bridge.incident_reports_count})`);
        if (bridge.flood_exposure_index > 60) reasons.push(`Located in flood-prone area (${bridge.flood_exposure_index}/100)`);
        if (bridge.heat_stress_index > 70) reasons.push(`Exposed to heat stress (${bridge.heat_stress_index}/100)`);
        if (bridge.earthquake_zone_index > 50) reasons.push(`Seismic risk zone (${bridge.earthquake_zone_index}/100)`);
        
        return reasons.join('. ') + '.';
    }
    
    function closeModal() {
        document.getElementById('asset-modal').style.display = 'none';
    }
    
    function getCurrentBridges() {
        // In a real app, this would fetch current data
        return getSampleBridges();
    }
    
    function getSampleBridges() {
        return [
            {
                id: "B-101",
                name: "Downtown Artery Bridge",
                area: "Central District",
                age_years: 45,
                traffic_load_index: 88,
                heavy_vehicle_percentage: 32,
                flood_exposure_index: 75,
                incident_reports_count: 17,
                last_maintenance_date: "2015-03-15",
                fpi: 88
            },
            {
                id: "B-102",
                name: "Northside Overpass",
                area: "North Industrial Area",
                age_years: 38,
                traffic_load_index: 95,
                heavy_vehicle_percentage: 28,
                flood_exposure_index: 30,
                incident_reports_count: 23,
                last_maintenance_date: "2013-08-22",
                fpi: 92
            },
            {
                id: "B-103",
                name: "Rivercross Viaduct",
                area: "Riverside",
                age_years: 28,
                traffic_load_index: 70,
                heavy_vehicle_percentage: 18,
                flood_exposure_index: 85,
                incident_reports_count: 12,
                last_maintenance_date: "2019-11-10",
                fpi: 76
            },
            {
                id: "B-104",
                name: "Westgate Bridge",
                area: "West Suburbs",
                age_years: 30,
                traffic_load_index: 65,
                heavy_vehicle_percentage: 15,
                flood_exposure_index: 20,
                incident_reports_count: 5,
                last_maintenance_date: "2020-05-15",
                fpi: 42
            }
        ];
    }
});