import numpy as np
from datetime import datetime
from typing import Dict, List

class InfraWatchRiskEngine:
    def __init__(self):
        # Risk factor weights (can be tuned)
        self.weights = {
            'structural': {
                'age': 0.15,
                'maintenance_gap': 0.20,
                'incidents': 0.10
            },
            'usage': {
                'traffic_load': 0.15,
                'heavy_vehicles': 0.10
            },
            'environmental': {
                'flood': 0.10,
                'heat': 0.10,
                'earthquake': 0.10
            }
        }
    
    def calculate_fpi(self, asset: Dict) -> Dict:
        """Calculate Failure Probability Index for an asset"""
        
        # Calculate maintenance gap
        last_maintenance = datetime.strptime(asset['last_maintenance_date'], '%Y-%m-%d')
        maintenance_gap_days = (datetime.now() - last_maintenance).days
        maintenance_gap_years = maintenance_gap_days / 365.25
        
        # Normalize factors to 0-100 scale
        factors = {
            'age': min(asset['age_years'] / 100 * 100, 100),
            'maintenance_gap': min(maintenance_gap_years / 20 * 100, 100),
            'traffic_load': asset['traffic_load_index'],
            'heavy_vehicles': asset['heavy_vehicle_percentage'],
            'incidents': min(asset['incident_reports_count'] * 5, 100),
            'flood': asset['flood_exposure_index'],
            'heat': asset['heat_stress_index'],
            'earthquake': asset['earthquake_zone_index']
        }
        
        # Calculate weighted scores
        structural_score = (
            factors['age'] * self.weights['structural']['age'] +
            factors['maintenance_gap'] * self.weights['structural']['maintenance_gap'] +
            factors['incidents'] * self.weights['structural']['incidents']
        ) * 100
        
        usage_score = (
            factors['traffic_load'] * self.weights['usage']['traffic_load'] +
            factors['heavy_vehicles'] * self.weights['usage']['heavy_vehicles']
        ) * 100
        
        environmental_score = (
            factors['flood'] * self.weights['environmental']['flood'] +
            factors['heat'] * self.weights['environmental']['heat'] +
            factors['earthquake'] * self.weights['environmental']['earthquake']
        ) * 100
        
        # Combine scores
        fpi = structural_score + usage_score + environmental_score
        fpi = min(max(fpi, 0), 100)  # Clamp to 0-100
        
        # Determine risk category
        if fpi >= 70:
            risk_category = 'high'
        elif fpi >= 40:
            risk_category = 'medium'
        else:
            risk_category = 'low'
        
        return {
            'fpi': round(fpi, 1),
            'risk_category': risk_category,
            'component_scores': {
                'structural': round(structural_score, 1),
                'usage': round(usage_score, 1),
                'environmental': round(environmental_score, 1)
            }
        }
    
    def optimize_repairs(self, assets: List[Dict], budget: int = 3) -> Dict:
        """Optimize repair strategy to maximize risk reduction"""
        
        # Calculate FPI for all assets
        scored_assets = []
        for asset in assets:
            risk = self.calculate_fpi(asset)
            scored_assets.append({**asset, **risk})
        
        # Sort by FPI descending
        scored_assets.sort(key=lambda x: x['fpi'], reverse=True)
        
        # Select top N to repair
        to_repair = scored_assets[:budget]
        
        # Calculate risk reduction
        current_total_risk = sum(asset['fpi'] for asset in scored_assets)
        
        # Assume repair reduces FPI to safe level (20)
        repaired_assets = []
        for asset in scored_assets:
            if asset in to_repair:
                repaired_assets.append({**asset, 'fpi': 20})
            else:
                repaired_assets.append(asset)
        
        new_total_risk = sum(asset['fpi'] for asset in repaired_assets)
        risk_reduction = ((current_total_risk - new_total_risk) / current_total_risk * 100)
        
        return {
            'recommended_repairs': to_repair,
            'current_total_risk': round(current_total_risk, 1),
            'new_total_risk': round(new_total_risk, 1),
            'risk_reduction': round(risk_reduction, 1),
            'message': f"Fix {budget} assets to reduce total risk by {round(risk_reduction, 1)}%"
        }
    
    def generate_explanation(self, asset: Dict, risk_result: Dict) -> str:
        """Generate human-readable explanation for risk score"""
        reasons = []
        
        if asset['age_years'] > 40:
            reasons.append(f"Age ({asset['age_years']} years)")
        
        maintenance_gap = (datetime.now() - datetime.strptime(asset['last_maintenance_date'], '%Y-%m-%d')).days / 365.25
        if maintenance_gap > 5:
            reasons.append(f"{maintenance_gap:.1f}-year maintenance gap")
        
        if asset['traffic_load_index'] > 70:
            reasons.append("High traffic load")
        
        if asset['heavy_vehicle_percentage'] > 20:
            reasons.append("Heavy vehicle usage")
        
        if asset['incident_reports_count'] > 10:
            reasons.append("Multiple incident reports")
        
        if asset['flood_exposure_index'] > 60:
            reasons.append("Flood-prone area")
        
        if asset['heat_stress_index'] > 70:
            reasons.append("Heat stress exposure")
        
        if asset['earthquake_zone_index'] > 50:
            reasons.append("Seismic risk zone")
        
        if reasons:
            explanation = "High risk due to: " + ", ".join(reasons)
        else:
            explanation = "Risk factors are within acceptable ranges"
        
        return explanation

# Example usage
if __name__ == "__main__":
    engine = InfraWatchRiskEngine()
    
    # Sample asset
    sample_asset = {
        "id": "B-101",
        "name": "Downtown Bridge",
        "last_maintenance_date": "2015-03-15",
        "age_years": 45,
        "traffic_load_index": 88,
        "heavy_vehicle_percentage": 32,
        "incident_reports_count": 17,
        "flood_exposure_index": 75,
        "heat_stress_index": 65,
        "earthquake_zone_index": 40
    }
    
    # Calculate risk
    result = engine.calculate_fpi(sample_asset)
    print(f"FPI Score: {result['fpi']}")
    print(f"Risk Category: {result['risk_category']}")
    print(f"Explanation: {engine.generate_explanation(sample_asset, result)}")