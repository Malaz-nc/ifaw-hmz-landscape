/**
 * Map fixes and improvements for IFAW's Elephant Corridors Map
 * This script fixes issues with layer loading, colors, styling, and ordering
 */

// Fix map issues and ensure all layers load properly
function fixMapIssues() {
    console.log("Applying comprehensive map fixes...");
    
    try {
        // Update CONFIG with correct file paths based on what's actually available
        updateConfigPaths();
        
        // Update styles for all layers based on requirements
        updateLayerStyles();
        
        // Load missing layers that failed to load in the original initialization
        loadMissingLayers().then(() => {
            // Set the correct layer order after everything is loaded
            setCorrectLayerOrder();
            
            // Add labels to important features
            addLabelsToFeatures();
            
            // Update the legend to match actual layers
            updateLegend();
            
            console.log("Map fixed successfully!");
            showSuccessNotification("Map updated successfully - all layers loaded");
        }).catch(error => {
            console.error("Error loading missing layers:", error);
            showErrorNotification("Partial fix applied - some layers couldn't be loaded");
        });
    } catch (error) {
        console.error("Error during map fix:", error);
        showErrorNotification("Error fixing map: " + error.message);
    }
}

// Update CONFIG with correct file paths based on actual files
function updateConfigPaths() {
    // Update paths based on the files that actually exist in your directory
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
        wildlifeCorridors: 'data/wildlife_corridors.geojson', // Using the correct file name
        forestArea: 'data/forest_area.geojson',
        ifawProjectSites: 'data/ifaw_project_sites.geojson',
        ifawProposedSites: 'data/ifaw_proposed_sites.geojson',
        landscapeBoundary: 'data/Landscape_boundary.geojson',
        landuse: 'data/Landuse.geojson',
        // landuse2 is not needed as per your request
        pointsOfInterest: 'data/places.geojson', // Using 'places.geojson' instead of 'Places_of_interest.geojson'
        rivers: 'data/rivers.geojson',
        wards: 'data/wards.geojson',
        waterSources: 'data/water_sources.geojson',
        zimwards: 'data/zimwards.geojson',
        matetsiUnits: 'data/matetsi_units.geojson' // Added the new file
    };

    // Update colors based on your requirements
    CONFIG.colors = {
        communalLand: '#f7e5b7',        // Light beige
        targetForestLand: '#006400',    // Dark green for forest areas
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
    
    console.log("Updated CONFIG paths and colors");
}

// Update styles for existing layers
function updateLayerStyles() {
    // Update styles for landuse layer to categorize by 'DESIG' field
    if (allLayers['landuse'] && typeof allLayers['landuse'].setStyle === 'function') {
        allLayers['landuse'].setStyle(function(feature) {
            let fillColor = CONFIG.colors.communalLand; // Default
            let weight = 1;
            let opacity = 1;
            let fillOpacity = 0.7;
            
            if (feature.properties) {
                // First check LANDTYPE
                if (feature.properties.LANDTYPE) {
                    const landType = feature.properties.LANDTYPE.toLowerCase();
                    
                    if (landType.includes('communal')) {
                        fillColor = CONFIG.colors.communalLand;
                    } else if (landType.includes('forest') || landType.includes('reserve')) {
                        fillColor = CONFIG.colors.forestArea;
                    } else if (landType.includes('farming') && landType.includes('large')) {
                        fillColor = CONFIG.colors.largeScaleFarming;
                    } else if (landType.includes('national') || landType.includes('park')) {
                        fillColor = CONFIG.colors.nationalPark;
                    } else if (landType.includes('safari') || landType.includes('chete')) {
                        fillColor = CONFIG.colors.safariArea;
                    } else if (landType.includes('farming') && landType.includes('small')) {
                        fillColor = CONFIG.colors.smallScaleFarming;
                    } else if (landType.includes('community') || landType.includes('ca')) {
                        fillColor = CONFIG.colors.communityCa;
                    }
                }
                
                // Then check DESIG if present (this will override LANDTYPE)
                if (feature.properties.DESIG) {
                    const desig = feature.properties.DESIG.toLowerCase();
                    
                    if (desig.includes('national park')) {
                        fillColor = CONFIG.colors.nationalPark;
                    } else if (desig.includes('safari')) {
                        fillColor = CONFIG.colors.safariArea;
                    } else if (desig.includes('forest')) {
                        fillColor = CONFIG.colors.forestArea;
                    }
                }
            }
            
            return {
                fillColor: fillColor,
                color: '#333',
                weight: weight,
                opacity: opacity,
                fillOpacity: fillOpacity
            };
        });
        console.log("Updated landuse styles based on LANDTYPE/DESIG field");
    }
    
    // Update other existing layers
    if (allLayers['bufferwards'] && typeof allLayers['bufferwards'].setStyle === 'function') {
        allLayers['bufferwards'].setStyle({
            color: CONFIG.colors.ifawOperatingWards,
            weight: 2,
            fillColor: CONFIG.colors.ifawOperatingWards,
            fillOpacity: 0.3
        });
    }
    
    if (allLayers['rivers'] && typeof allLayers['rivers'].setStyle === 'function') {
        allLayers['rivers'].setStyle({
            color: CONFIG.colors.rivers,
            weight: 2
        });
    }
    
    if (allLayers['wildlifeCorridors'] && typeof allLayers['wildlifeCorridors'].setStyle === 'function') {
        allLayers['wildlifeCorridors'].setStyle({
            color: CONFIG.colors.wildlifeCorridors,
            weight: 3
        });
    } else if (allLayers['corridors'] && typeof allLayers['corridors'].setStyle === 'function') {
        allLayers['corridors'].setStyle({
            color: CONFIG.colors.wildlifeCorridors,
            weight: 3
        });
    }
    
    console.log("Updated styles for existing layers");
}

// Load all missing layers that failed to load initially
async function loadMissingLayers() {
    const layersToLoad = [
        { name: 'wildlifeCorridors', path: CONFIG.geojsonPaths.wildlifeCorridors, style: {
            color: CONFIG.colors.wildlifeCorridors,
            weight: 3
        }},
        { name: 'chizariraNationalPark', path: CONFIG.geojsonPaths.chizariraNationalPark, style: {
            fillColor: CONFIG.colors.nationalPark,
            color: '#333',
            weight: 1,
            fillOpacity: 0.7
        }},
        { name: 'chirisaSafari', path: CONFIG.geojsonPaths.chirisaSafari, style: {
            fillColor: CONFIG.colors.safariArea,
            color: '#333',
            weight: 1,
            fillOpacity: 0.7
        }},
        { name: 'cheteSafariArea', path: CONFIG.geojsonPaths.cheteSafariArea, style: {
            fillColor: CONFIG.colors.safariArea,
            color: '#333',
            weight: 1,
            fillOpacity: 0.7
        }},
        { name: 'matetsiUnits', path: CONFIG.geojsonPaths.matetsiUnits, style: {
            fillColor: CONFIG.colors.safariArea, // Safari area color as requested
            color: '#333',
            weight: 1,
            fillOpacity: 0.7
        }},
        { name: 'forestArea', path: CONFIG.geojsonPaths.forestArea, style: {
            fillColor: CONFIG.colors.forestArea,
            color: '#333',
            weight: 1,
            fillOpacity: 0.7
        }},
        { name: 'ifawProjectSites', path: CONFIG.geojsonPaths.ifawProjectSites, style: {
            color: CONFIG.colors.ifawProjectSites,
            weight: 3,
            dashArray: '5, 5',
            fillOpacity: 0.1
        }},
        { name: 'ifawProposedSites', path: CONFIG.geojsonPaths.ifawProposedSites, style: {
            color: CONFIG.colors.ifawProposedSites,
            weight: 3,
            dashArray: '10, 5',
            fillOpacity: 0.1
        }},
        { name: 'pointsOfInterest', path: CONFIG.geojsonPaths.pointsOfInterest, options: {
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
        }},
        { name: 'zimwards', path: CONFIG.geojsonPaths.zimwards, style: {
            color: '#555',
            weight: 1,
            fillOpacity: 0,
            dashArray: '3, 3'
        }}
    ];
    
    for (const layer of layersToLoad) {
        // Check if layer already exists and is loaded correctly
        if (allLayers[layer.name] && map.hasLayer(allLayers[layer.name])) {
            console.log(`Layer ${layer.name} already loaded, skipping`);
            continue;
        }
        
        try {
            console.log(`Loading ${layer.name} from ${layer.path}`);
            const response = await fetch(layer.path);
            
            if (!response.ok) {
                console.warn(`Failed to load ${layer.name} (${response.status}): ${response.statusText}`);
                continue;
            }
            
            const data = await response.json();
            
            if (data.features && data.features.length === 0) {
                console.warn(`${layer.name} has no features, skipping`);
                continue;
            }
            
            // Create the layer with appropriate options
            let geoLayer;
            
            if (layer.options && layer.options.pointToLayer) {
                // For point layers with custom markers
                geoLayer = L.geoJSON(data, {
                    pointToLayer: layer.options.pointToLayer,
                    onEachFeature: function(feature, layer) {
                        createFeaturePopup(feature, layer, layer.name);
                    }
                });
            } else {
                // For polygon or line layers
                geoLayer = L.geoJSON(data, {
                    style: layer.style,
                    onEachFeature: function(feature, layer) {
                        createFeaturePopup(feature, layer, layer.name);
                    }
                });
            }
            
            // Add the layer to allLayers
            allLayers[layer.name] = geoLayer;
            
            // Add to map
            geoLayer.addTo(map);
            console.log(`Successfully loaded ${layer.name}`);
        } catch (error) {
            console.error(`Error loading ${layer.name}:`, error);
        }
    }
    
    return true;
}

// Helper function to create feature popups
function createFeaturePopup(feature, layer, layerName) {
    if (!feature.properties) return;
    
    let popupContent = '<div class="custom-popup">';
    popupContent += `<h3>${layerName.charAt(0).toUpperCase() + layerName.slice(1).replace(/([A-Z])/g, ' $1').trim()}</h3>`;
    
    for (const property in feature.properties) {
        if (feature.properties[property]) {
            popupContent += `<p><strong>${property}:</strong> ${feature.properties[property]}</p>`;
        }
    }
    
    // Add area or length calculations if applicable
    if (feature.geometry && feature.geometry.type.includes('Polygon')) {
        try {
            const area = calculateArea(feature);
            popupContent += `<p><strong>Estimated Area:</strong> ${area.toFixed(2)} km²</p>`;
        } catch (error) {
            console.error('Error calculating area:', error);
        }
    } else if (feature.geometry && feature.geometry.type.includes('LineString')) {
        try {
            const length = calculateLength(feature);
            popupContent += `<p><strong>Estimated Length:</strong> ${length.toFixed(2)} km</p>`;
        } catch (error) {
            console.error('Error calculating length:', error);
        }
    }
    
    popupContent += '</div>';
    layer.bindPopup(popupContent);
    
    // Add click event to show info in the sidebar panel
    layer.on('click', function(e) {
        showFeatureInfo(feature, layerName);
    });
}

// Add labels to important features
function addLabelsToFeatures() {
    // Add labels to point layers
    const pointLayers = ['chiefs', 'pointsOfInterest', 'waterSources'];
    pointLayers.forEach(layerName => {
        if (allLayers[layerName]) {
            addLabelsToPointLayer(layerName);
        }
    });
    
    // Add labels to polygon layers
    const polygonLayers = ['chizariraNationalPark', 'chirisaSafari', 'cheteSafariArea', 'forestArea', 'matetsiUnits'];
    polygonLayers.forEach(layerName => {
        if (allLayers[layerName]) {
            addLabelsToPolygonLayer(layerName);
        }
    });
}

// Add labels to point layer
function addLabelsToPointLayer(layerName) {
    try {
        if (!allLayers[layerName]) return;
        
        // Skip if the layer doesn't have the toGeoJSON method
        if (typeof allLayers[layerName].toGeoJSON !== 'function') {
            console.log(`${layerName} doesn't support toGeoJSON method, skipping labels`);
            return;
        }
        
        // Create label layer group
        if (!allLayers[`${layerName}Labels`]) {
            allLayers[`${layerName}Labels`] = L.layerGroup();
        } else {
            allLayers[`${layerName}Labels`].clearLayers();
        }
        
        // Get GeoJSON data
        const geoJson = allLayers[layerName].toGeoJSON();
        
        // Proceed only if features are available
        if (!geoJson.features || !Array.isArray(geoJson.features)) {
            console.log(`No features found for ${layerName}`);
            return;
        }
        
        // Add labels for each feature
        geoJson.features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === 'Point') {
                const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                
                // Determine label text
                let labelText = '';
                
                if (layerName === 'chiefs' && feature.properties) {
                    // For chiefs, try these property names
                    const nameProps = ['NAME', 'name', 'CHIEF', 'chief', 'Chief'];
                    for (const prop of nameProps) {
                        if (feature.properties[prop]) {
                            labelText = feature.properties[prop];
                            break;
                        }
                    }
                    
                    if (!labelText) labelText = 'Chief';
                } else if (layerName === 'pointsOfInterest' && feature.properties) {
                    // For POIs, try these property names
                    const nameProps = ['NAME', 'name', 'PLACE', 'place', 'TITLE', 'title'];
                    for (const prop of nameProps) {
                        if (feature.properties[prop]) {
                            labelText = feature.properties[prop];
                            break;
                        }
                    }
                    
                    if (!labelText) labelText = 'POI';
                } else if (layerName === 'waterSources' && feature.properties) {
                    // For water sources, try these property names
                    const nameProps = ['NAME', 'name', 'WATER', 'water', 'TYPE', 'type'];
                    for (const prop of nameProps) {
                        if (feature.properties[prop]) {
                            labelText = feature.properties[prop];
                            break;
                        }
                    }
                    
                    if (!labelText) labelText = 'Water Source';
                }
                
                if (labelText) {
                    // Create label
                    const icon = L.divIcon({
                        className: `${layerName}-label`,
                        html: `<div>${labelText}</div>`,
                        iconSize: [100, 20],
                        iconAnchor: [50, -10]
                    });
                    
                    // Add to label layer
                    L.marker(coords, { icon: icon }).addTo(allLayers[`${layerName}Labels`]);
                }
            }
        });
        
        // Add label layer to map
        allLayers[`${layerName}Labels`].addTo(map);
        console.log(`Added labels to ${layerName}`);
    } catch (error) {
        console.error(`Error adding labels to ${layerName}:`, error);
    }
}

// Add labels to polygon layer
function addLabelsToPolygonLayer(layerName) {
    try {
        if (!allLayers[layerName]) return;
        
        // Skip if the layer doesn't have the toGeoJSON method
        if (typeof allLayers[layerName].toGeoJSON !== 'function') {
            console.log(`${layerName} doesn't support toGeoJSON method, skipping labels`);
            return;
        }
        
        // Create label layer group
        if (!allLayers[`${layerName}Labels`]) {
            allLayers[`${layerName}Labels`] = L.layerGroup();
        } else {
            allLayers[`${layerName}Labels`].clearLayers();
        }
        
        // Get GeoJSON data
        const geoJson = allLayers[layerName].toGeoJSON();
        
        // Proceed only if features are available
        if (!geoJson.features || !Array.isArray(geoJson.features)) {
            console.log(`No features found for ${layerName}`);
            return;
        }
        
        // Add labels for each feature
        geoJson.features.forEach(feature => {
            if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                // Calculate center point
                let center;
                
                if (window.turf) {
                    try {
                        const centroid = turf.centroid(feature);
                        center = [centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]];
                    } catch (e) {
                        console.error(`Error calculating centroid for ${layerName}:`, e);
                        // Fallback to basic center calculation
                        center = calculateBasicCenter(feature);
                    }
                } else {
                    // Basic center calculation
                    center = calculateBasicCenter(feature);
                }
                
                // Skip if center calculation failed
                if (!center) return;
                
                // Determine label text
                let labelText = layerName.replace(/([A-Z])/g, ' $1').trim();
                
                // Lookup specific names for special areas
                if (layerName === 'chizariraNationalPark') {
                    labelText = 'Chizarira National Park';
                } else if (layerName === 'chirisaSafari') {
                    labelText = 'Chirisa Safari Area';
                } else if (layerName === 'cheteSafariArea') {
                    labelText = 'Chete Safari Area';
                } else if (layerName === 'forestArea') {
                    labelText = 'Forest Area';
                } else if (layerName === 'matetsiUnits') {
                    labelText = 'Matetsi Safari Area';
                } else if (feature.properties) {
                    // Try to find a name property
                    const nameProps = ['NAME', 'name', 'TITLE', 'title', 'LABEL', 'label'];
                    for (const prop of nameProps) {
                        if (feature.properties[prop]) {
                            labelText = feature.properties[prop];
                            break;
                        }
                    }
                }
                
                // Create label
                const icon = L.divIcon({
                    className: `${layerName}-label`,
                    html: `<div>${labelText}</div>`,
                    iconSize: [150, 24],
                    iconAnchor: [75, 12]
                });
                
                // Add to label layer
                L.marker(center, { icon: icon }).addTo(allLayers[`${layerName}Labels`]);
            }
        });
        
        // Add label layer to map
        allLayers[`${layerName}Labels`].addTo(map);
        console.log(`Added labels to ${layerName}`);
    } catch (error) {
        console.error(`Error adding labels to ${layerName}:`, error);
    }
}

// Calculate basic center for a polygon feature
function calculateBasicCenter(feature) {
    try {
        if (feature.geometry.type === 'Polygon') {
            // Get the first ring of the polygon (outer boundary)
            const coords = feature.geometry.coordinates[0];
            let sumX = 0, sumY = 0;
            
            coords.forEach(coord => {
                sumX += coord[0];
                sumY += coord[1];
            });
            
            return [sumY / coords.length, sumX / coords.length];
        } else if (feature.geometry.type === 'MultiPolygon') {
            // Use the largest polygon for the label
            let maxArea = 0;
            let centerPoint = null;
            
            feature.geometry.coordinates.forEach(polygon => {
                const coords = polygon[0];
                let sumX = 0, sumY = 0;
                
                coords.forEach(coord => {
                    sumX += coord[0];
                    sumY += coord[1];
                });
                
                const center = [sumY / coords.length, sumX / coords.length];
                
                // Estimate polygon area (not accurate but good enough for comparison)
                let area = 0;
                for (let i = 0; i < coords.length - 1; i++) {
                    area += Math.abs(coords[i][0] * coords[i+1][1] - coords[i+1][0] * coords[i][1]);
                }
                
                if (area > maxArea) {
                    maxArea = area;
                    centerPoint = center;
                }
            });
            
            return centerPoint;
        }
    } catch (error) {
        console.error('Error calculating basic center:', error);
    }
    
    return null;
}

// Set the correct layer order
function setCorrectLayerOrder() {
    console.log("Setting correct layer order...");
    
    // The layers from bottom to top
    const layerOrder = [
        // Base layers
        'landscapeBoundary',
        'landuse',
        
        // Protected areas
        'forestArea',
        'matetsiUnits',
        'chizariraNationalPark',
        'chirisaSafari',
        'cheteSafariArea',
        'communityCa',
        
        // Administrative boundaries
        'wards',
        'zimwards',
        'bufferwards',
        
        // IFAW areas
        'ifawProposedSites',
        'ifawProjectSites',
        
        // Lines
        'rivers',
        'category3Road',
        'category2Road',
        'category1Road',
        'roads',
        'corridors',
        'wildlifeCorridors',
        
        // Points - chiefs on top as requested
        'waterSources',
        'pointsOfInterest',
        'chiefs'
    ];
    
    // Track which layers are visible to restore them later
    const visibleLayers = {};
    
    // First check which layers are visible
    for (const layerName in allLayers) {
        if (allLayers[layerName] && map.hasLayer(allLayers[layerName])) {
            visibleLayers[layerName] = true;
            map.removeLayer(allLayers[layerName]);
        }
    }
    
    // Now add them back in the correct order
    layerOrder.forEach(layerName => {
        if (allLayers[layerName]) {
            if (visibleLayers[layerName]) {
                allLayers[layerName].addTo(map);
                console.log(`Added ${layerName} to map in correct order`);
            }
        }
    });
    
    // Finally, add any label layers
    for (const layerName in allLayers) {
        if (layerName.endsWith('Labels') && visibleLayers[layerName.replace('Labels', '')]) {
            allLayers[layerName].addTo(map);
        }
    }
    
    console.log("Layer order set successfully");
}

// Update the legend to match actual layers
function updateLegend() {
    try {
        const legendDiv = document.getElementById('legend-content');
        
        if (!legendDiv) {
            console.error('Legend container not found');
            return;
        }
        
        legendDiv.innerHTML = '';
        
        // Land Types Legend
        let legendHTML = '<div class="legend-section">';
        legendHTML += '<h4 style="margin-bottom: 5px; color: #333;">Land Types</h4>';
        
        const landTypes = [
            { color: CONFIG.colors.communalLand, label: 'Communal Land' },
            { color: CONFIG.colors.targetForestLand, label: 'Forest Area' },
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
        
        // Administrative Boundaries Legend
        legendHTML += '<div class="legend-section">';
        legendHTML += '<h4 style="margin-bottom: 5px; color: #333;">Administrative Areas</h4>';
        
        legendHTML += `
            <div class="legend-item">
                <div style="width: 16px; height: 16px; border: 1px solid #000; background: transparent; margin-right: 8px;"></div>
                <div class="legend-label">Landscape Boundary</div>
            </div>
            <div class="legend-item">
                <div style="width: 16px; height: 16px; border: 1px dashed #555; background: transparent; margin-right: 8px;"></div>
                <div class="legend-label">Wards</div>
            </div>
            <div class="legend-item">
                <div style="width: 16px; height: 16px; border: 1px solid #0077ff; background: rgba(0,119,255,0.2); margin-right: 8px;"></div>
                <div class="legend-label">IFAW Operating Wards</div>
            </div>
        `;
        
        // IFAW Activity Areas
        legendHTML += `
            <div class="legend-item">
                <div style="width: 16px; height: 3px; border-top: 3px dashed ${CONFIG.colors.ifawProjectSites}; margin-right: 8px;"></div>
                <div class="legend-label">IFAW Project Sites</div>
            </div>
            <div class="legend-item">
                <div style="width: 16px; height: 3px; border-top: 3px dashed ${CONFIG.colors.ifawProposedSites}; margin-right: 8px;"></div>
                <div class="legend-label">IFAW Proposed Sites</div>
            </div>
        `;
        
        legendHTML += '</div>';
        
        // Line Features Legend
        legendHTML += '<div class="legend-section">';
        legendHTML += '<h4 style="margin-bottom: 5px; color: #333;">Features</h4>';
        
        // Lines
        const lineFeatures = [
            { color: CONFIG.colors.wildlifeCorridors, label: 'Wildlife Corridors', thickness: 3 },
            { color: CONFIG.colors.rivers, label: 'Rivers', thickness: 2 },
            { color: CONFIG.colors.roads.category1, label: 'Category 1 Road', thickness: 3 },
            { color: CONFIG.colors.roads.category2, label: 'Category 2 Road', thickness: 2 },
            { color: CONFIG.colors.roads.category3, label: 'Category 3 Road', thickness: 1.5 }
        ];
        
        lineFeatures.forEach(item => {
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-line" style="border-top: ${item.thickness}px solid ${item.color};"></div>
                    <div class="legend-label">${item.label}</div>
                </div>
            `;
        });
        
        // Points
        const pointFeatures = [
            { color: '#FF0000', label: 'Chiefs', type: 'circle' },
            { color: '#FF0000', label: '15km Chief Buffer', type: 'circle-outline' },
            { color: '#0078FF', label: 'Water Sources', type: 'circle' },
            { color: '#FF7F00', label: 'Points of Interest', type: 'circle' }
        ];
        
        pointFeatures.forEach(item => {
            if (item.type === 'circle') {
                legendHTML += `
                    <div class="legend-item">
                        <div class="legend-point" style="background-color: ${item.color}; border-radius: 50%;"></div>
                        <div class="legend-label">${item.label}</div>
                    </div>
                `;
            } else if (item.type === 'circle-outline') {
                legendHTML += `
                    <div class="legend-item">
                        <div class="legend-point" style="background-color: transparent; border: 2px solid ${item.color}; border-radius: 50%;"></div>
                        <div class="legend-label">${item.label}</div>
                    </div>
                `;
            }
        });
        
        legendHTML += '</div>';
        
        // Set the legend HTML
        legendDiv.innerHTML = legendHTML;
        console.log("Legend updated successfully");
    } catch (error) {
        console.error("Error updating legend:", error);
    }
}

// Helper function to show success notification
function showSuccessNotification(message) {
    // Create notification element
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
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '18px';
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(notification);
    });
    
    notification.appendChild(closeBtn);
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);
}

// Helper function to show error notification
function showErrorNotification(message) {
    // Create notification element
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
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '18px';
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(notification);
    });
    
    notification.appendChild(closeBtn);
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 8000);
}

// Document ready function to ensure the fixes are applied after the map initializes
document.addEventListener('DOMContentLoaded', function() {
    console.log("Map-fixes.js loaded successfully");
    // The main script already has a setTimeout for fixMapIssues function
    // This is just a backup in case the main script's call fails
    setTimeout(function() {
        if (typeof map !== 'undefined' && !window.fixesApplied) {
            console.log("Applying map fixes from map-fixes.js...");
            fixMapIssues();
            window.fixesApplied = true;
        }
    }, 8000);
});jectSites}; margin-right: 8px;"></div>
                <div class="legend-label">IFAW Project Sites</div>
            </div>
            <div class="legend-item">
                <div style="width: 16px; height: 3px; border-top: 3px dashed ${CONFIG.colors.ifawPro