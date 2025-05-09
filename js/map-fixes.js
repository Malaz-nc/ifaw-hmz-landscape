// Map fixes to address all the issues - final version with corrected file names

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

// 2. Updated geojsonPaths to match your actual file names
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
    wildlifeCorridors: 'data/wildlife_corridors.geojson', // Updated to the correct file
    forestArea: 'data/forest_area.geojson',
    // hmzBoundary removed as file doesn't exist
    ifawProjectSites: 'data/ifaw_project_sites.geojson',
    ifawProposedSites: 'data/ifaw_proposed_sites.geojson',
    landscapeBoundary: 'data/Landscape_boundary.geojson',
    landuse: 'data/Landuse.geojson',
    // landuse2 removed as requested
    pointsOfInterest: 'data/places.geojson', // Updated to the correct file
    rivers: 'data/rivers.geojson',
    wards: 'data/wards.geojson',
    waterSources: 'data/water_sources.geojson',
    zimwards: 'data/zimwards.geojson'
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
        // 1. Remove landuse2 if it exists
        if (allLayers['landuse2'] && map.hasLayer(allLayers['landuse2'])) {
            map.removeLayer(allLayers['landuse2']);
            console.log("Removed landuse2 as requested");
        }
        
        // 2. Update style for existing layers
        updateExistingLayerStyles();
        
        // 3. Load additional layers that are specific to this implementation
        loadAdditionalLayers().then(() => {
            // 4. Set correct layer order after all layers are loaded
            setCorrectLayerOrder();
            
            // 5. Add labels to all important features
            addLabelsToAllFeatures();
            
            // 6. Update the legend
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

// Update styles of existing layers with careful error checking
function updateExistingLayerStyles() {
    // 1. Update style for bufferwards to be blue
    if (allLayers['bufferwards'] && typeof allLayers['bufferwards'].setStyle === 'function') {
        allLayers['bufferwards'].setStyle({
            color: CONFIG.colors.ifawOperatingWards,
            weight: 2,
            fillColor: CONFIG.colors.ifawOperatingWards,
            fillOpacity: 0.3
        });
        console.log("Updated bufferwards style");
    }
    
    // 2. Update style for wards to be outlined only
    if (allLayers['wards'] && typeof allLayers['wards'].setStyle === 'function') {
        allLayers['wards'].setStyle({
            color: CONFIG.colors.wards,
            weight: 1.5,
            fillOpacity: 0,
            dashArray: '2, 2'
        });
        console.log("Updated wards style");
    }
    
    // 3. Update river styling
    if (allLayers['rivers'] && typeof allLayers['rivers'].setStyle === 'function') {
        allLayers['rivers'].setStyle({
            color: CONFIG.colors.rivers,
            weight: 2
        });
        console.log("Updated rivers style");
    }
    
    // 4. Update wildlife corridors to be red and thicker - with careful error checking
    // Note: We're now using wildlifeCorridors as the key
    if (allLayers['wildlifeCorridors']) {
        try {
            if (typeof allLayers['wildlifeCorridors'].setStyle === 'function') {
                allLayers['wildlifeCorridors'].setStyle({
                    color: CONFIG.colors.wildlifeCorridors,
                    weight: 4
                });
                console.log("Updated wildlife corridors style");
            } else if (typeof allLayers['wildlifeCorridors'].eachLayer === 'function') {
                // Try a different approach for layer groups
                allLayers['wildlifeCorridors'].eachLayer(function(layer) {
                    if (typeof layer.setStyle === 'function') {
                        layer.setStyle({
                            color: CONFIG.colors.wildlifeCorridors,
                            weight: 4
                        });
                    }
                });
                console.log("Updated wildlife corridors style through eachLayer");
            }
        } catch (error) {
            console.error("Error updating wildlife corridors style:", error);
        }
    }
    
    // 5. Make sure landuse has correct colors
    if (allLayers['landuse'] && typeof allLayers['landuse'].setStyle === 'function') {
        try {
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
        } catch (error) {
            console.error("Error updating landuse style:", error);
        }
    }
}

// Load additional layers specific to this implementation
async function loadAdditionalLayers() {
    const newLayers = [];
    
    // Function to safely load a layer with error handling
    async function safelyLoadLayer(layerName, urlPath, styleOptions, popupTitle) {
        if (!allLayers[layerName] && urlPath) {
            try {
                console.log(`Loading ${layerName} from ${urlPath}...`);
                const response = await fetch(urlPath);
                if (response.ok) {
                    const data = await response.json();
                    const layer = L.geoJSON(data, {
                        style: styleOptions,
                        onEachFeature: function(feature, layer) {
                            let popupContent = '<div class="custom-popup">';
                            popupContent += `<h3>${popupTitle || layerName}</h3>`;
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
                    allLayers[layerName] = layer;
                    newLayers.push(layerName);
                    console.log(`Added ${layerName} layer`);
                    return true;
                } else {
                    console.error(`Failed to load ${layerName}: ${response.status} ${response.statusText}`);
                    return false;
                }
            } catch (error) {
                console.error(`Error loading ${layerName}:`, error);
                return false;
            }
        }
        return false;
    }
    
    // Try to load wildlife_corridors if original corridors didn't load
    if (!allLayers['corridors'] && !allLayers['wildlifeCorridors']) {
        await safelyLoadLayer('wildlifeCorridors', CONFIG.geojsonPaths.wildlifeCorridors, {
            color: CONFIG.colors.wildlifeCorridors,
            weight: 4,
            opacity: 1
        }, 'Wildlife Corridors');
    }
    
    // 1. Load forest areas
    await safelyLoadLayer('forestArea', CONFIG.geojsonPaths.forestArea, {
        fillColor: CONFIG.colors.forestArea,
        color: '#333',
        weight: 1,
        fillOpacity: 0.7
    }, 'Forest Area');
    
    // 2. Load Chizarira National Park
    await safelyLoadLayer('chizariraNationalPark', CONFIG.geojsonPaths.chizariraNationalPark, {
        fillColor: CONFIG.colors.nationalPark,
        color: '#333',
        weight: 1,
        fillOpacity: 0.7
    }, 'Chizarira National Park');
    
    // 3. Load Chirisa Safari
    await safelyLoadLayer('chirisaSafari', CONFIG.geojsonPaths.chirisaSafari, {
        fillColor: CONFIG.colors.safariArea,
        color: '#333',
        weight: 1,
        fillOpacity: 0.7
    }, 'Chirisa Safari Area');
    
    // 4. Load Chete Safari Area
    await safelyLoadLayer('cheteSafariArea', CONFIG.geojsonPaths.cheteSafariArea, {
        fillColor: CONFIG.colors.safariArea,
        color: '#333',
        weight: 1,
        fillOpacity: 0.7
    }, 'Chete Safari Area');
    
    // 5. Load IFAW Project Sites
    await safelyLoadLayer('ifawProjectSites', CONFIG.geojsonPaths.ifawProjectSites, {
        color: CONFIG.colors.ifawProjectSites,
        weight: 3,
        dashArray: '5, 5',
        fillOpacity: 0.1
    }, 'IFAW Project Site');
    
    // 6. Load IFAW Proposed Sites
    await safelyLoadLayer('ifawProposedSites', CONFIG.geojsonPaths.ifawProposedSites, {
        color: CONFIG.colors.ifawProposedSites,
        weight: 3,
        dashArray: '10, 5',
        fillOpacity: 0.1
    }, 'IFAW Proposed Site');
    
    // 7. Try to load points of interest if they didn't load earlier
    if (!allLayers['pointsOfInterest']) {
        await safelyLoadLayer('pointsOfInterest', CONFIG.geojsonPaths.pointsOfInterest, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: '#FF7F00',
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            }
        }, 'Points of Interest');
    }
    
    // Add new layers to map
    newLayers.forEach(layerName => {
        // Check if the checkbox for this layer exists and is checked
        const checkbox = document.querySelector(`.layer-control[data-layer="${layerName}"]`);
        if (checkbox && checkbox.checked) {
            allLayers[layerName].addTo(map);
            console.log(`Added ${layerName} to map`);
        } else if (!checkbox) {
            // If no checkbox exists but it's a crucial layer, add it anyway
            if (['forestArea', 'chizariraNationalPark', 'chirisaSafari', 'cheteSafariArea'].includes(layerName)) {
                allLayers[layerName].addTo(map);
                console.log(`Added ${layerName} to map (no checkbox found)`);
            }
        }
    });
    
    return newLayers;
}

// Function to set the correct layer order with careful error checking
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
        
        // Land use base layer (only keeping landuse, not landuse2)
        'landuse',
        
        // Protected areas and specific land types
        'communityCa',
        'chizariraNationalPark',
        'chirisaSafari',
        'cheteSafariArea',
        'forestArea',
        
        // Administrative boundaries
        'wards',
        'zimwards',
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
        'wildlifeCorridors',
        
        // Points
        'waterSources',
        'chiefs',
        'pointsOfInterest'
    ];
    
    // First remove all layers to reset order (but remember which ones were visible)
    const visibleLayers = {};
    availableLayers.forEach(layerName => {
        if (map.hasLayer(allLayers[layerName])) {
            visibleLayers[layerName] = true;
            map.removeLayer(allLayers[layerName]);
        }
    });
    
    // Now add them back in correct order (only the ones that were visible)
    layerOrder.forEach(layerName => {
        if (availableLayers.includes(layerName) && visibleLayers[layerName]) {
            allLayers[layerName].addTo(map);
            console.log(`Added ${layerName} to map in correct order`);
        }
    });
    
    console.log("Layer order set successfully");
}

// Add labels to all important features
function addLabelsToAllFeatures() {
    try {
        // Add labels to chiefs if available
        if (allLayers['chiefs']) {
            addLabelsToLayer('chiefs');
        }
        
        // Add labels to points of interest if available
        if (allLayers['pointsOfInterest']) {
            addLabelsToLayer('pointsOfInterest');
        }
        
        // Add labels to parks and special areas
        const areaLayers = [
            'chizariraNationalPark', 
            'chirisaSafari', 
            'cheteSafariArea', 
            'forestArea'
        ];
        
        areaLayers.forEach(layerName => {
            if (allLayers[layerName]) {
                addLabelsToCenterOfPolygon(layerName);
            }
        });
        
    } catch (error) {
        console.error("Error adding labels to features:", error);
    }
}

// Helper function to add labels to a point layer
function addLabelsToLayer(layerName) {
    try {
        if (!allLayers[layerName]) return;
        
        // Make sure the layer has the toGeoJSON method
        if (typeof allLayers[layerName].toGeoJSON !== 'function') {
            console.log(`${layerName} doesn't support toGeoJSON method, can't add labels`);
            return;
        }
        
        // Create a label group if it doesn't exist
        if (!allLayers[`${layerName}Labels`]) {
            allLayers[`${layerName}Labels`] = L.layerGroup();
        } else {
            // Clear existing labels
            allLayers[`${layerName}Labels`].clearLayers();
        }
        
        // Get the features from the layer
        const geoJson = allLayers[layerName].toGeoJSON();
        if (!geoJson || !geoJson.features || !Array.isArray(geoJson.features)) {
            console.log(`${layerName} doesn't have valid features, can't add labels`);
            return;
        }
        
        geoJson.features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === 'Point') {
                const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                
                // Get the name from properties
                let name = layerName === 'chiefs' ? 'Chief' : 'POI';
                
                if (feature.properties) {
                    const nameProps = ['name', 'NAME', 'Name', 'CHIEF', 'Chief', 'title', 'TITLE', 'Title', 'Place', 'PLACE'];
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

// Helper function to add labels to the center of polygon areas
function addLabelsToCenterOfPolygon(layerName) {
    try {
        if (!allLayers[layerName]) return;
        
        // Make sure the layer has the toGeoJSON method
        if (typeof allLayers[layerName].toGeoJSON !== 'function') {
            console.log(`${layerName} doesn't support toGeoJSON method, can't add labels`);
            return;
        }
        
        // Create a label group if it doesn't exist
        if (!allLayers[`${layerName}Labels`]) {
            allLayers[`${layerName}Labels`] = L.layerGroup();
        } else {
            // Clear existing labels
            allLayers[`${layerName}Labels`].clearLayers();
        }
        
        // Get the features from the layer
        const geoJson = allLayers[layerName].toGeoJSON();
        if (!geoJson || !geoJson.features || !Array.isArray(geoJson.features)) {
            console.log(`${layerName} doesn't have valid features, can't add labels`);
            return;
        }
        
        geoJson.features.forEach(feature => {
            // Only process polygons
            if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                // Determine the center of the polygon
                let center;
                if (window.turf) {
                    // Use turf.js if available to get the center
                    const centroid = turf.centroid(feature);
                    center = [centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]];
                } else {
                    // Simple center calculation for polygon
                    if (feature.geometry.type === 'Polygon') {
                        // Get the first ring of the polygon (outer boundary)
                        const coords = feature.geometry.coordinates[0];
                        // Calculate the average of all points to get an approximate center
                        let sumX = 0, sumY = 0;
                        coords.forEach(coord => {
                            sumX += coord[0];
                            sumY += coord[1];
                        });
                        center = [sumY / coords.length, sumX / coords.length];
                    } else {
                        // For MultiPolygon, just use the center of the first polygon
                        const coords = feature.geometry.coordinates[0][0];
                        let sumX = 0, sumY = 0;
                        coords.forEach(coord => {
                            sumX += coord[0];
                            sumY += coord[1];
                        });
                        center = [sumY / coords.length, sumX / coords.length];
                    }
                }
                
                // Get a name for the area
                let name = layerName.replace(/([A-Z])/g, ' $1').trim();
                
                if (feature.properties) {
                    const nameProps = ['name', 'NAME', 'Name', 'LANDTYPE', 'landtype', 'Landtype', 'Land_Type', 'type', 'TYPE', 'Type'];
                    for (const prop of nameProps) {
                        if (feature.properties[prop]) {
                            name = feature.properties[prop];
                            break;
                        }
                    }
                }
                
                // Format the display name based on original layerName
                if (layerName === 'chizariraNationalPark') {
                    name = 'Chizarira National Park';
                } else if (layerName === 'chirisaSafari') {
                    name = 'Chirisa Safari Area';
                } else if (layerName === 'cheteSafariArea') {
                    name = 'Chete Safari Area';
                } else if (layerName === 'forestArea') {
                    name = 'Forest Area';
                }
                
                // Create label with appropriate styling
                const labelIcon = L.divIcon({
                    className: `${layerName}-label`,
                    html: `<div style="white-space: nowrap; background: rgba(255,255,255,0.7); padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 14px;">${name}</div>`,
                    iconSize: [150, 24],
                    iconAnchor: [75, 12]
                });
                
                // Add label to the layer group
                L.marker(center, { icon: labelIcon }).addTo(allLayers[`${layerName}Labels`]);
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
                        <div class="legend-label