// Map fixes to address all the issues

// 1. Update CONFIG colors
CONFIG.colors = {
    communalLand: '#f7e5b7',        // Light beige
    targetForestLand: '#006400',    // Dark green for all forest areas
    largeScaleFarming: '#6c8a6c',   // Medium green
    nationalPark: '#7eff7e',        // Bright green for National Parks
    safariArea: '#b8b242',          // Olive green/yellow for Safari Areas
    smallScaleFarming: '#d1cb9e',   // Light tan
    communityCa: '#f5d08a',         // Light orange
    
    // Other features
    rivers: '#0078ff',              // Bright blue for rivers
    wildlifeCorridors: '#ff0000',   // Red for corridors
    chiefBuffers: '#ff0000',        // Red for chief buffers
    ifawOperatingWards: '#555555',  // Dark grey for IFAW operating wards
    wards: '#000000',               // Black for ward boundaries
    roads: {
        category1: '#000000',       // Black
        category2: '#555555',       // Dark gray
        category3: '#999999'        // Light gray
    }
};

// 2. Fix layer styles and order
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to make sure the original map is loaded
    setTimeout(fixMapIssues, 2000);
});

// Main function to fix all map issues
function fixMapIssues() {
    console.log("Applying map fixes...");
    
    // 1. Update style for bufferwards to be dark grey
    if (allLayers['bufferwards']) {
        allLayers['bufferwards'].setStyle({
            color: CONFIG.colors.ifawOperatingWards,
            weight: 2,
            fillColor: CONFIG.colors.ifawOperatingWards,
            fillOpacity: 0.3
        });
    }
    
    // 2. Update style for wards to be outlined only
    if (allLayers['wards']) {
        allLayers['wards'].setStyle({
            color: CONFIG.colors.wards,
            weight: 1.5,
            fillOpacity: 0,
            dashArray: '2, 2'
        });
    }
    
    // 3. Update river styling
    if (allLayers['rivers']) {
        allLayers['rivers'].setStyle({
            color: CONFIG.colors.rivers,
            weight: 2
        });
    }
    
    // 4. Reload layers that need complete recreation
    reloadLayers();
}

// Function to reload complex layers
async function reloadLayers() {
    try {
        // 1. Reload land use layers to fix colors
        await loadLanduseLayers(true);
        
        // 2. Reload chiefs to get red buffers and labels
        await loadChiefsWithBuffer(true);
        
        // 3. Reload corridors to ensure they're visible with proper styling
        await loadCorridorsWithArrows(true);
        
        // 4. Reload points of interest with labels
        await loadPointsOfInterestWithLabels(true);
        
        // 5. Set correct layer order after all layers are loaded
        setCorrectLayerOrder();
        
        // 6. Update the legend
        createUpdatedLegend();
        
        console.log("Map fixed successfully!");
        showSuccessNotification("Map updated successfully");
    } catch (error) {
        console.error("Error fixing map:", error);
        showErrorNotification("Error fixing map. See console for details.");
    }
}

// Function to set the correct layer order
function setCorrectLayerOrder() {
    console.log("Setting correct layer order...");
    
    // Base layers first
    if (allLayers['landscapeBoundary']) map.removeLayer(allLayers['landscapeBoundary']);
    if (allLayers['hmzBoundary']) map.removeLayer(allLayers['hmzBoundary']);
    
    if (allLayers['landuse2']) map.removeLayer(allLayers['landuse2']);
    if (allLayers['landuse']) map.removeLayer(allLayers['landuse']);
    
    if (allLayers['wards']) map.removeLayer(allLayers['wards']);
    if (allLayers['bufferwards']) map.removeLayer(allLayers['bufferwards']);
    
    if (allLayers['rivers']) map.removeLayer(allLayers['rivers']);
    if (allLayers['waterSources']) map.removeLayer(allLayers['waterSources']);
    if (allLayers['roads']) map.removeLayer(allLayers['roads']);
    
    if (allLayers['corridors']) map.removeLayer(allLayers['corridors']);
    if (allLayers['chiefs']) map.removeLayer(allLayers['chiefs']);
    if (allLayers['pointsOfInterest']) map.removeLayer(allLayers['pointsOfInterest']);
    
    // Now add them back in the correct order
    if (allLayers['landscapeBoundary']) allLayers['landscapeBoundary'].addTo(map);
    if (allLayers['hmzBoundary']) allLayers['hmzBoundary'].addTo(map);
    
    if (allLayers['landuse2']) allLayers['landuse2'].addTo(map);
    if (allLayers['landuse']) allLayers['landuse'].addTo(map);
    
    if (allLayers['wards']) allLayers['wards'].addTo(map);
    if (allLayers['bufferwards']) allLayers['bufferwards'].addTo(map);
    
    if (allLayers['rivers']) allLayers['rivers'].addTo(map);
    if (allLayers['roads']) allLayers['roads'].addTo(map);
    
    if (allLayers['corridors']) allLayers['corridors'].addTo(map);
    if (allLayers['waterSources']) allLayers['waterSources'].addTo(map);
    if (allLayers['chiefs']) allLayers['chiefs'].addTo(map);
    if (allLayers['pointsOfInterest']) allLayers['pointsOfInterest'].addTo(map);
    
    console.log("Layer order set successfully");
}

// Success notification
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '80%';
    notification.style.textAlign = 'center';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = 'bold';
    
    // Add to body and auto-remove after 5 seconds
    document.body.appendChild(notification);
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);
}

// Create updated legend with the correct styles
function createUpdatedLegend() {
    try {
        const legendDiv = document.getElementById('legend-content');
        
        if (!legendDiv) {
            console.error('Legend container not found');
            return;
        }
        
        legendDiv.innerHTML = '';
        
        // Land Types Legend
        let legendHTML = '<div class="legend-section">';
        
        // Land types from static map
        const landTypes = [
            { color: CONFIG.colors.communalLand, label: 'Communal Land' },
            { color: CONFIG.colors.targetForestLand, label: 'Target Forest Land' },
            { color: CONFIG.colors.largeScaleFarming, label: 'Large Scale Farming' },
            { color: CONFIG.colors.nationalPark, label: 'National Park' },
            { color: CONFIG.colors.safariArea, label: 'Safari Area' },
            { color: CONFIG.colors.smallScaleFarming, label: 'Small Scale Farming' },
            { color: CONFIG.colors.communityCa, label: 'Community CA' }
        ];
        
        landTypes.forEach(item => {
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${item.color};"></div>
                    <div class="legend-label">${item.label}</div>
                </div>
            `;
        });
        
        legendHTML += '</div>';
        
        // Line Features
        legendHTML += '<div class="legend-section">';
        
        const lineFeatures = [
            { color: CONFIG.colors.wildlifeCorridors, label: 'Wildlife Corridors' },
            { color: CONFIG.colors.rivers, label: 'Rivers' },
            { color: CONFIG.colors.roads.category1, label: 'Category 1 Road' },
            { color: CONFIG.colors.roads.category2, label: 'Category 2 Road' },
            { color: CONFIG.colors.roads.category3, label: 'Category 3 Road' }
        ];
        
        lineFeatures.forEach((item, index) => {
            const thickness = index === 0 ? 3 : (index === 1 ? 2 : (index === 2 ? 3 : (index === 3 ? 2 : 1.5)));
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-line" style="border-top: ${thickness}px solid ${item.color}; width: 20px;"></div>
                    <div class="legend-label">${item.label}</div>
                </div>
            `;
        });
        
        legendHTML += '</div>';
        
        // Point Features
        legendHTML += '<div class="legend-section">';
        
        const pointItems = [
            { type: 'circle', color: '#FF0000', label: 'Chiefs' },
            { type: 'circle', color: '#22ff22', label: '15km Chief Buffer' },
            { type: 'circle', color: '#0078FF', label: 'Water Sources' },
            { type: 'circle', color: '#FF7F00', label: 'Points of Interest' }
        ];
        
        pointItems.forEach(item => {
            if (item.type === 'circle') {
                let style = `background-color: ${item.color}; border-radius: 50%; width: 10px; height: 10px;`;
                if (item.label.includes('Buffer')) {
                    style = `background-color: transparent; border: 2px solid ${item.color}; border-radius: 50%; width: 10px; height: 10px;`;
                }
                
                legendHTML += `
                    <div class="legend-item">
                        <div class="legend-point" style="${style}"></div>
                        <div class="legend-label">${item.label}</div>
                    </div>
                `;
            }
        });
        
        legendHTML += '</div>';
        
        // Set the legend HTML
        legendDiv.innerHTML = legendHTML;
    } catch (error) {
        console.error('Error creating updated legend:', error);
    }
}

// Add this to window to allow calling from console
window.fixMapIssues = fixMapIssues;