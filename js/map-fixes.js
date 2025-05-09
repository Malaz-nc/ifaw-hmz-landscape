// Map fixes to address all the issues

// 1. Update CONFIG colors and add new layers
CONFIG.colors = {
    communalLand: '#f7e5b7',        // Light beige
    targetForestLand: '#006400',    // Dark green for all forest areas
    forestArea: '#006400',          // Dark green for forest areas
    largeScaleFarming: '#6c8a6c',   // Medium green
    nationalPark: '#7eff7e',        // Bright green for National Parks
    safariArea: '#b8b242',          // Olive green/yellow for Safari Areas
    smallScaleFarming: '#d1cb9e',   // Light tan
    communityCa: '#f5d08a',         // Light orange
    
    // Other features
    rivers: '#0078ff',              // Bright blue for rivers
    wildlifeCorridors: '#ff0000',   // Red for corridors
    chiefBuffers: '#ff0000',        // Red for chief buffers
    ifawOperatingWards: '#0077ff',  // Blue for IFAW operating wards
    wards: '#000000',               // Black for ward boundaries
    ifawProjectSites: '#ff9900',    // Orange for IFAW project sites
    ifawProposedSites: '#9900cc',   // Purple for IFAW proposed sites
    roads: {
        category1: '#000000',       // Black
        category2: '#555555',       // Dark gray
        category3: '#999999'        // Light gray
    }
};

// 2. Update geojsonPaths to match your actual file names
CONFIG.geojsonPaths = {
    bufferwards: 'data/bufferwards.geojson',
    category1Road: 'data/category1_road.geojson',
    category2Road: 'data/category2_road.geojson',
    category3Road: 'data/category3_road.geojson',
    cheteSafariArea: 'data/chete_safari_area.geojson',
    chiefs: 'data/chiefs.geojson',
    chirisaSafari: 'data/chirisa_safari.geojson',
    chizariraNationalPark: 'data/chizarira_nationalpark.geojson',
    communityCa: 'data/Community_CA.geojson',
    corridors: 'data/corridors.geojson',
    forestArea: 'data/forest_area.geojson',
    hmzBoundary: 'data/HMZ_Boundary.geojson',
    ifawProjectSites: 'data/ifaw_project_sites.geojson',
    ifawProposedSites: 'data/ifaw_proposed_sites.geojson',
    landscapeBoundary: 'data/Landscape_boundary.geojson',
    landuse: 'data/Landuse.geojson',
    landuse2: 'data/Landuse2.geojson',
    pointsOfInterest: 'data/Places_of_interest.geojson',
    rivers: 'data/rivers.geojson',
    wards: 'data/wards.geojson',
    waterSources: 'data/water_sources.geojson'
};

// Fix layer styles and order
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to make sure the original map is loaded
    setTimeout(fixMapIssues, 5000);
});

// Main function to fix all map issues
function fixMapIssues() {
    console.log("Applying map fixes...");
    
    try {
        // 1. Update style for existing layers
        updateExistingLayerStyles();
        
        // 2. Load additional layers that are specific to this implementation
        loadAdditionalLayers().then(() => {
            // 3. Set correct layer order after all layers are loaded
            setCorrectLayerOrder();
            
            // 4. Add labels to chiefs and points of interest
            addLabelsToFeatures();
            
            // 5. Update the legend
            createUpdatedLegend();
            
            console.log("Map fixed successfully!");
            showSuccessNotification("Map updated successfully");
        }).catch(error => {
            console.error("Error loading additional layers:", error);
            // Still try to fix what we can
            setCorrectLayerOrder();
            createUpdatedLegend();
            showSuccessNotification("Partial map update applied");
        });
    } catch (error) {
        console.error("Error fixing map:", error);
        showErrorNotification("Error fixing map. See console for details.");
    }
}

// Update styles of existing layers
function updateExistingLayerStyles() {
    // 1. Update style for bufferwards to be blue
    if (allLayers['bufferwards']) {
        allLayers['bufferwards'].setStyle({
            color: CONFIG.colors.ifawOperatingWards,
            weight: 2,
            fillColor: CONFIG.colors.ifawOperatingWards,
            fillOpacity: 0.3
        });
        console.log("Updated bufferwards style");
    }
    
    // 2. Update style for wards to be outlined only
    if (allLayers['wards']) {
        allLayers['wards'].setStyle({
            color: CONFIG.colors.wards,
            weight: 1.5,
            fillOpacity: 0,
            dashArray: '2, 2'
        });
        console.log("Updated wards style");
    }
    
    // 3. Update river styling
    if (allLayers['rivers']) {
        allLayers['rivers'].setStyle({
            color: CONFIG.colors.rivers,
            weight: 2
        });
        console.log("Updated rivers style");
    }
    
    // 4. Update wildlife corridors to be red and thicker
    if (allLayers['corridors']) {
        allLayers['corridors'].setStyle({
            color: CONFIG.colors.wildlifeCorridors,
            weight: 4
        });
        console.log("Updated corridors style");
    }
    
    // 5. Make sure landuse layers have correct colors
    if (allLayers['landuse']) {
        allLayers['landuse'].setStyle(function(feature) {
            let fillColor = CONFIG.colors.communalLand; // Default
            
            if (feature.properties && feature.properties.LANDTYPE) {
                const landType = feature.properties.LANDTYPE.toLowerCase();
                
                if (landType.includes('communal')) {
                    fillColor = CONFIG.colors.communalLand;
                } else if (landType.includes('forest') || landType.includes('reserve')) {
                    fillColor = CONFIG.colors.forestArea;
                } else if (landType.includes('farming') && landType.includes('large')) {
                    fillColor = CONFIG.colors.largeScaleFarming;
                } else if (landType.includes('national') || landType.includes('park') || landType.includes('chirisa')) {
                    fillColor = CONFIG.colors.nationalPark;
                } else if (landType.includes('safari') || landType.includes('chete')) {
                    fillColor = CONFIG.colors.safariArea;
                } else if (landType.includes('farming') && landType.includes('small')) {
                    fillColor = CONFIG.colors.smallScaleFarming;
                } else if (landType.includes('community') || landType.includes('ca')) {
                    fillColor = CONFIG.colors.communityCa;
                }
            }
            
            return {
                fillColor: fillColor,
                fillOpacity: 0.7
            };
        });
        console.log("Updated landuse style");
    }
    
    if (allLayers['landuse2']) {
        allLayers['landuse2'].setStyle(function(feature) {
            let fillColor = CONFIG.colors.communalLand; // Default
            
            if (feature.properties && feature.properties.LANDTYPE) {
                const landType = feature.properties.LANDTYPE.toLowerCase();
                
                if (landType.includes('communal')) {
                    fillColor = CONFIG.colors.communalLand;
                } else if (landType.includes('forest') || landType.includes('reserve')) {
                    fillColor = CONFIG.colors.forestArea;
                } else if (landType.includes('farming') && landType.includes('large')) {
                    fillColor = CONFIG.colors.largeScaleFarming;
                } else if (landType.includes('national') || landType.includes('park') || landType.includes('chirisa')) {
                    fillColor = CONFIG.colors.nationalPark;
                } else if (landType.includes('safari') || landType.includes('chete')) {
                    fillColor = CONFIG.colors.safariArea;
                } else if (landType.includes('farming') && landType.includes('small')) {
                    fillColor = CONFIG.colors.smallScaleFarming;
                } else if (landType.includes('community') || landType.includes('ca')) {
                    fillColor = CONFIG.colors.communityCa;
                }
            }
            
            return {
                fillColor: fillColor,
                fillOpacity: 0.7
            };
        });
        console.log("Updated landuse2 style");
    }
}

// Load additional layers specific to this implementation
async function loadAdditionalLayers() {
    const newLayers = [];
    
    // 1. Load forest areas
    if (!allLayers['forestArea'] && CONFIG.geojsonPaths.forestArea) {
        try {
            const response = await fetch(CONFIG.geojsonPaths.forestArea);
            if (response.ok) {
                const data = await response.json();
                const forestLayer = L.geoJSON(data, {
                    style: {
                        fillColor: CONFIG.colors.forestArea,
                        color: '#333',
                        weight: 1,
                        fillOpacity: 0.7
                    },
                    onEachFeature: function(feature, layer) {
                        let popupContent = '<div class="custom-popup">';
                        popupContent += '<h3>Forest Area</h3>';
                        if (feature.properties) {
                            for (const prop in feature.properties) {
                                if (feature.properties[prop]) {
                                    popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                                }
                            }
                        }
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                });
                allLayers['forestArea'] = forestLayer;
                newLayers.push('forestArea');
                console.log("Added forest area layer");
            }
        } catch (error) {
            console.error("Error loading forest area:", error);
        }
    }
    
    // 2. Load Chizarira National Park
    if (!allLayers['chizariraNationalPark'] && CONFIG.geojsonPaths.chizariraNationalPark) {
        try {
            const response = await fetch(CONFIG.geojsonPaths.chizariraNationalPark);
            if (response.ok) {
                const data = await response.json();
                const parkLayer = L.geoJSON(data, {
                    style: {
                        fillColor: CONFIG.colors.nationalPark,
                        color: '#333',
                        weight: 1,
                        fillOpacity: 0.7
                    },
                    onEachFeature: function(feature, layer) {
                        let popupContent = '<div class="custom-popup">';
                        popupContent += '<h3>Chizarira National Park</h3>';
                        if (feature.properties) {
                            for (const prop in feature.properties) {
                                if (feature.properties[prop]) {
                                    popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                                }
                            }
                        }
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                });
                allLayers['chizariraNationalPark'] = parkLayer;
                newLayers.push('chizariraNationalPark');
                console.log("Added Chizarira National Park layer");
            }
        } catch (error) {
            console.error("Error loading Chizarira National Park:", error);
        }
    }
    
    // 3. Load Safari Areas
    if (!allLayers['chirisaSafari'] && CONFIG.geojsonPaths.chirisaSafari) {
        try {
            const response = await fetch(CONFIG.geojsonPaths.chirisaSafari);
            if (response.ok) {
                const data = await response.json();
                const safariLayer = L.geoJSON(data, {
                    style: {
                        fillColor: CONFIG.colors.safariArea,
                        color: '#333',
                        weight: 1,
                        fillOpacity: 0.7
                    },
                    onEachFeature: function(feature, layer) {
                        let popupContent = '<div class="custom-popup">';
                        popupContent += '<h3>Chirisa Safari Area</h3>';
                        if (feature.properties) {
                            for (const prop in feature.properties) {
                                if (feature.properties[prop]) {
                                    popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                                }
                            }
                        }
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                });
                allLayers['chirisaSafari'] = safariLayer;
                newLayers.push('chirisaSafari');
                console.log("Added Chirisa Safari layer");
            }
        } catch (error) {
            console.error("Error loading Chirisa Safari:", error);
        }
    }
    
    // 4. Load Chete Safari Area
    if (!allLayers['cheteSafariArea'] && CONFIG.geojsonPaths.cheteSafariArea) {
        try {
            const response = await fetch(CONFIG.geojsonPaths.cheteSafariArea);
            if (response.ok) {
                const data = await response.json();
                const safariLayer = L.geoJSON(data, {
                    style: {
                        fillColor: CONFIG.colors.safariArea,
                        color: '#333',
                        weight: 1,
                        fillOpacity: 0.7
                    },
                    onEachFeature: function(feature, layer) {
                        let popupContent = '<div class="custom-popup">';
                        popupContent += '<h3>Chete Safari Area</h3>';
                        if (feature.properties) {
                            for (const prop in feature.properties) {
                                if (feature.properties[prop]) {
                                    popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                                }
                            }
                        }
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                });
                allLayers['cheteSafariArea'] = safariLayer;
                newLayers.push('cheteSafariArea');
                console.log("Added Chete Safari Area layer");
            }
        } catch (error) {
            console.error("Error loading Chete Safari Area:", error);
        }
    }
    
    // 5. Load IFAW Project Sites with dashed lines
    if (!allLayers['ifawProjectSites'] && CONFIG.geojsonPaths.ifawProjectSites) {
        try {
            const response = await fetch(CONFIG.geojsonPaths.ifawProjectSites);
            if (response.ok) {
                const data = await response.json();
                const projectSitesLayer = L.geoJSON(data, {
                    style: {
                        color: CONFIG.colors.ifawProjectSites,
                        weight: 3,
                        dashArray: '5, 5',
                        fillOpacity: 0.1
                    },
                    onEachFeature: function(feature, layer) {
                        let popupContent = '<div class="custom-popup">';
                        popupContent += '<h3>IFAW Project Site</h3>';
                        if (feature.properties) {
                            for (const prop in feature.properties) {
                                if (feature.properties[prop]) {
                                    popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                                }
                            }
                        }
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                });
                allLayers['ifawProjectSites'] = projectSitesLayer;
                newLayers.push('ifawProjectSites');
                console.log("Added IFAW Project Sites layer");
            }
        } catch (error) {
            console.error("Error loading IFAW Project Sites:", error);
        }
    }
    
    // 6. Load IFAW Proposed Sites with different dashed lines
    if (!allLayers['ifawProposedSites'] && CONFIG.geojsonPaths.ifawProposedSites) {
        try {
            const response = await fetch(CONFIG.geojsonPaths.ifawProposedSites);
            if (response.ok) {
                const data = await response.json();
                const proposedSitesLayer = L.geoJSON(data, {
                    style: {
                        color: CONFIG.colors.ifawProposedSites,
                        weight: 3,
                        dashArray: '10, 5',
                        fillOpacity: 0.1
                    },
                    onEachFeature: function(feature, layer) {
                        let popupContent = '<div class="custom-popup">';
                        popupContent += '<h3>IFAW Proposed Site</h3>';
                        if (feature.properties) {
                            for (const prop in feature.properties) {
                                if (feature.properties[prop]) {
                                    popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                                }
                            }
                        }
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                });
                allLayers['ifawProposedSites'] = proposedSitesLayer;
                newLayers.push('ifawProposedSites');
                console.log("Added IFAW Proposed Sites layer");
            }
        } catch (error) {
            console.error("Error loading IFAW Proposed Sites:", error);
        }
    }
    
    // Add new layers to map
    newLayers.forEach(layerName => {
        allLayers[layerName].addTo(map);
    });
    
    return newLayers;
}

// Function to set the correct layer order
function setCorrectLayerOrder() {
    console.log("Setting correct layer order...");
    
    // Get all available layers
    const availableLayers = Object.keys(allLayers).filter(key => 
        allLayers[key] && typeof allLayers[key].bringToFront === 'function');
    
    console.log("Available layers:", availableLayers);
    
    // The order from bottom to top should be:
    const layerOrder = [
        // Base layers
        'landscapeBoundary',
        'hmzBoundary',
        
        // Land use base layers
        'landuse2',
        'landuse',
        
        // Protected areas and specific land types
        'communityCa',
        'chizariraNationalPark',
        'chirisaSafari',
        'cheteSafariArea',
        'forestArea',
        
        // Administrative boundaries
        'wards',
        'bufferwards',
        
        // IFAW areas (on top of other polygons)
        'ifawProposedSites',
        'ifawProjectSites',
        
        // Lines
        'rivers',
        'roads',
        'category1Road',
        'category2Road',
        'category3Road',
        'corridors',
        
        // Points
        'waterSources',
        'chiefs',
        'pointsOfInterest'
    ];
    
    // First, remove all layers to reset order
    availableLayers.forEach(layerName => {
        if (map.hasLayer(allLayers[layerName])) {
            map.removeLayer(allLayers[layerName]);
        }
    });
    
    // Now add them back in correct order
    layerOrder.forEach(layerName => {
        if (availableLayers.includes(layerName)) {
            allLayers[layerName].addTo(map);
            console.log(`Added ${layerName} to map in correct order`);
        }
    });
    
    console.log("Layer order set successfully");
}

// Add labels to chiefs and points of interest
function addLabelsToFeatures() {
    // Add labels to chiefs
    if (allLayers['chiefs']) {
        addLabelsToLayer('chiefs');
    }
    
    // Add labels to points of interest
    if (allLayers['pointsOfInterest']) {
        addLabelsToLayer('pointsOfInterest');
    }
}

// Helper function to add labels to a layer
function addLabelsToLayer(layerName) {
    try {
        if (!allLayers[layerName]) return;
        
        // Create a label group if it doesn't exist
        if (!allLayers[`${layerName}Labels`]) {
            allLayers[`${layerName}Labels`] = L.layerGroup();
        } else {
            // Clear existing labels
            allLayers[`${layerName}Labels`].clearLayers();
        }
        
        // Get the features from the layer
        const features = allLayers[layerName].toGeoJSON().features;
        
        features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === 'Point') {
                const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                
                // Get the name from properties
                let name = layerName === 'chiefs' ? 'Chief' : 'POI';
                
                if (feature.properties) {
                    const nameProps = ['name', 'NAME', 'Name', 'CHIEF', 'Chief', 'title', 'TITLE', 'Title'];
                    for (const prop of nameProps) {
                        if (feature.properties[prop]) {
                            name = feature.properties[prop];
                            break;
                        }
                    }
                }
                
                // Create label with appropriate styling
                const labelIcon = L.divIcon({
                    className: `${layerName}-label`,
                    html: `<div style="white-space: nowrap; background: rgba(255,255,255,0.7); padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 12px;">${name}</div>`,
                    iconSize: [100, 20],
                    iconAnchor: [50, -10]
                });
                
                // Add label to the layer group
                L.marker(coords, { icon: labelIcon }).addTo(allLayers[`${layerName}Labels`]);
            }
        });
        
        // Add the label group to the map
        allLayers[`${layerName}Labels`].addTo(map);
        console.log(`Added labels to ${layerName}`);
    } catch (error) {
        console.error(`Error adding labels to ${layerName}:`, error);
    }
}

// Create updated legend
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
            { color: CONFIG.colors.communityCa, label: 'Community CA' },
            { color: CONFIG.colors.ifawOperatingWards, label: 'IFAW Operating Wards' }
        ];
        
        landTypes.forEach(item => {
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${item.color};"></div>
                    <div class="legend-label">${item.label}</div>
                </div>
            `;
        });
        
        // Add IFAW project and proposed sites
        legendHTML += `
            <div class="legend-item">
                <div style="width: 20px; height: 3px; border-top: 3px dashed ${CONFIG.colors.ifawProjectSites}; margin-right: 8px;"></div>
                <div class="legend-label">IFAW Project Sites</div>
            </div>
            <div class="legend-item">
                <div style="width: 20px; height: 3px; border-top: 3px dashed ${CONFIG.colors.ifawProposedSites}; margin-right: 8px;"></div>
                <div class="legend-label">IFAW Proposed Sites</div>
            </div>
        `;
        
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
            const thickness = index === 0 ? 4 : (index === 1 ? 2 : (index === 2 ? 3 : (index === 3 ? 2 : 1.5)));
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
            { type: 'circle', color: '#FF0000', label: '15km Chief Buffer' },
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
        console.log("Legend updated");
    } catch (error) {
        console.error('Error creating updated legend:', error);
    }
}

// Success notification
function showSuccessNotification(message) {
    // Check if there's an existing notification
    const existingNotification = document.querySelector('.success-notification');
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }

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

// Error notification
function showErrorNotification(message) {
    // Check if there's an existing notification
    const existingNotification = document.querySelector('.error-notification');
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }

    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#ff5555';
    notification.style.color = 'white';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '80%';
    notification.style.textAlign = 'center';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = 'bold';
    
    // Add to body and auto-remove after 10 seconds
    document.body.appendChild(notification);
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000);
    
    // Log to console as well
    console.error(message);
}

// Add to window to allow calling from console
window.fixMapIssues = fixMapIssues;