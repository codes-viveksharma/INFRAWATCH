const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Add a root route
app.get('/', (req, res) => {
    res.json({
        message: "InfraWatch++ Backend API",
        endpoints: {
            "/api/bridges": "GET - Get all bridges",
            "/api/bridges/:id": "GET - Get specific bridge",
            "/api/calculate-risk": "POST - Calculate FPI score",
            "/api/optimize-repairs": "POST - Get repair recommendations"
        }
    });
});

// Sample data
const bridges = [
    {
        id: "B-101",
        name: "Downtown Artery Bridge",
        location: { lat: 40.7128, lng: -74.0060 },
        area: "Central District",
        last_maintenance_date: "2015-03-15",
        maintenance_frequency: 84,
        age_years: 45,
        traffic_load_index: 88,
        heavy_vehicle_percentage: 32,
        incident_reports_count: 17,
        flood_exposure_index: 75,
        heat_stress_index: 65,
        earthquake_zone_index: 40,
        fpi: 88,
        risk_category: "high"
    },
    {
        id: "B-102",
        name: "Northside Overpass",
        location: { lat: 40.7589, lng: -73.9851 },
        area: "North Industrial Area",
        last_maintenance_date: "2013-08-22",
        maintenance_frequency: 120,
        age_years: 38,
        traffic_load_index: 95,
        heavy_vehicle_percentage: 28,
        incident_reports_count: 23,
        flood_exposure_index: 30,
        heat_stress_index: 85,
        earthquake_zone_index: 25,
        fpi: 92,
        risk_category: "high"
    }
];

// API Routes
app.get('/api/bridges', (req, res) => {
    res.json(bridges);
});

app.get('/api/bridges/:id', (req, res) => {
    const bridge = bridges.find(b => b.id === req.params.id);
    if (bridge) {
        res.json(bridge);
    } else {
        res.status(404).json({ error: 'Bridge not found' });
    }
});

app.post('/api/calculate-risk', (req, res) => {
    const bridge = req.body;
    
    // Simple FPI calculation
    let fpi = 0;
    fpi += Math.min(bridge.age_years, 100) * 0.15;
    fpi += bridge.traffic_load_index * 0.20;
    fpi += bridge.heavy_vehicle_percentage * 0.15;
    fpi += Math.min(bridge.incident_reports_count * 5, 100) * 0.10;
    fpi += bridge.flood_exposure_index * 0.10;
    fpi += bridge.heat_stress_index * 0.10;
    fpi += bridge.earthquake_zone_index * 0.10;
    
    fpi = Math.min(Math.round(fpi), 100);
    const riskCategory = fpi >= 70 ? 'high' : fpi >= 40 ? 'medium' : 'low';
    
    res.json({
        fpi,
        riskCategory,
        explanation: `Calculated based on multiple risk factors.`
    });
});

app.post('/api/optimize-repairs', (req, res) => {
    const { budget, assets } = req.body;
    const topN = budget || 3;
    
    const sortedAssets = [...assets].sort((a, b) => b.fpi - a.fpi);
    const toRepair = sortedAssets.slice(0, topN);
    
    const currentTotalRisk = assets.reduce((sum, asset) => sum + asset.fpi, 0);
    const repairedAssets = assets.map(asset => {
        if (toRepair.find(r => r.id === asset.id)) {
            return { ...asset, fpi: 20 };
        }
        return asset;
    });
    const newTotalRisk = repairedAssets.reduce((sum, asset) => sum + asset.fpi, 0);
    const riskReduction = ((currentTotalRisk - newTotalRisk) / currentTotalRisk * 100).toFixed(1);
    
    res.json({
        recommendedRepairs: toRepair,
        currentTotalRisk,
        newTotalRisk,
        riskReduction,
        message: `Fix ${topN} assets to reduce total risk by ${riskReduction}%`
    });
});

app.listen(PORT, () => {
    console.log(`✅ InfraWatch++ backend running on http://localhost:${PORT}`);
    console.log(`📊 API available at:`);
    console.log(`   http://localhost:${PORT}/api/bridges`);
    console.log(`   http://localhost:${PORT}/api/optimize-repairs`);
});

// Add after your existing routes in server.js

// Reports storage (in-memory for demo, use database in production)
let reports = [];

// Report APIs
app.post('/api/reports', (req, res) => {
    const report = {
        id: 'RPT-' + Date.now(),
        ...req.body,
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    reports.unshift(report); // Add to beginning
    res.json({
        success: true,
        message: 'Report submitted successfully',
        reportId: report.id
    });
});

app.get('/api/reports', (req, res) => {
    res.json(reports);
});

app.get('/api/reports/:id', (req, res) => {
    const report = reports.find(r => r.id === req.params.id);
    if (report) {
        res.json(report);
    } else {
        res.status(404).json({ error: 'Report not found' });
    }
});

app.put('/api/reports/:id/status', (req, res) => {
    const { status } = req.body;
    const reportIndex = reports.findIndex(r => r.id === req.params.id);
    
    if (reportIndex !== -1) {
        reports[reportIndex].status = status;
        reports[reportIndex].updatedAt = new Date().toISOString();
        res.json({
            success: true,
            message: `Report status updated to ${status}`
        });
    } else {
        res.status(404).json({ error: 'Report not found' });
    }
});

app.get('/api/report-stats', (req, res) => {
    const stats = {
        total: reports.length,
        new: reports.filter(r => r.status === 'new').length,
        inProgress: reports.filter(r => r.status === 'in-progress').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        byType: reports.reduce((acc, report) => {
            acc[report.problemType] = (acc[report.problemType] || 0) + 1;
            return acc;
        }, {})
    };
    res.json(stats);
});