/**
 * Map-fixes.js - Functions to fix various map issues in the IFAW Elephant Corridors Map
 */

// Calculate length of a LineString or MultiLineString feature in kilometers
function calculateLength(feature) {
    if (!feature || !feature.geometry || (feature.geometry.type !== 'LineString' && feature.geometry.type !== 'MultiLineString')) {
        return 0;
    }
    
    let length = 0;
    
    try {
        if (feature.geometry.type === 'LineString') {
            const line = feature.geometry.coordinates;
            for (let i = 1; i < line.length; i++) {
                const p1 = L.latLng(line[i-1][1], line[i-1][0]);
                const p2 = L.latLng(line[i][1], line[i][0]);
                length += p1.distanceTo(p2) / 1000; // Convert meters to kilometers
            }
        } else if (feature.geometry.type === 'MultiLineString') {
            feature.geometry.coordinates.forEach(line => {
                for (let i = 1; i < line.length; i++) {
                    const p1 = L.latLng(line[i-1][1], line[i-1][0]);
                    const p2 = L.latLng(line[i][1], line[i][0]);
                    length += p1.distanceTo(p2) / 1000; // Convert meters to kilometers
                }
            });
        }
    } catch (error) {
        console.error('Error calculating length:', error);
        length = 0;
    }
    
    return length;
}

// Calculate area of a polygon feature in square kilometers
function calculateArea(feature) {
    if (!feature || !feature.geometry || (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon')) {
        return 0;
    }
    
    let area = 0;
    
    try {
        if (window.turf) {
            area = turf.area(feature) / 1000000; // Convert square meters to square kilometers
        } else {
            // Very basic fallback if turf.js is not available
            // This will be less accurate
            if (feature.geometry.type === 'Polygon') {
                // Approximate with a simple algorithm
                area = 0; // Simplified - would need a proper algorithm here
            } else if (feature.geometry.type === 'MultiPolygon') {
                // Sum the areas of each polygon
                area = 0; // Simplified - would need a proper algorithm here
            }
        }
    } catch (error) {
        console.error('Error calculating area:', error);
        area = 0;
    }
    
    return area;
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

/**
 * Main fix function to address map issues
 */
function fixMapIssues() {
    console.log("Fixing map issues...");
    
    // Fix 1: Correct file paths for GeoJSON data
    // Update file paths to match actual filenames in the data folder
    const filePathFixes = {
        'landuse': 'landuse.geojson',
        'districtboundaries': 'DistrictBoundaries.geojson',
        'communityCa': 'communityCA.geojson',
        'matetsiunits': 'matetsiunits.geojson',
        'places': 'places.geojson',
        'towns': 'towns.geojson',
        'watersources': 'watersources.geojson',
        'wildlife_corridors': 'wildlife_corridors.geojson'
    };
    
    // Fix 2: Handle missing layers gracefully
    for (const layerId of Object.keys(filePathFixes)) {
        if (typeof allLayers === 'undefined' || !allLayers[layerId]) {
            console.log(`Layer ${layerId} not found in allLayers, will try to load it`);
            const dataPath = `data/${filePathFixes[layerId]}`;
            tryLoadMissingLayer(layerId, dataPath);
        }
    }
    
    // Fix 3: Update analysis content with actual data
    updateAnalysis();
    
    // Fix 4: Add feature labels where needed
    addFeatureLabels();
    
    // Fix 5: Ensure correct layer visibility based on checkboxes
    syncLayerVisibility();
    
    console.log("Map fixes applied successfully!");
    showSuccessNotification("Map updated successfully!");
}

/**
 * Try to load a missing layer
 */
function tryLoadMissingLayer(layerId, dataPath) {
    if (!map || !dataPath) return;
    
    console.log(`Attempting to load missing layer: ${layerId} from ${dataPath}`);
    
    fetch(dataPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${layerId} (${response.status}): ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Successfully loaded ${layerId} data`);
            
            if (!window.allLayers) {
                window.allLayers = {};
            }
            
            // Create layer based on type
            let layer;
            if (layerId === 'places' || layerId === 'towns' || layerId === 'watersources') {
                // Point layers
                layer = L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 5,
                            fillColor: "#ff7800",
                            color: "#000",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        if (feature.properties) {
                            let popupContent = "<div class='feature-popup'>";
                            for (const key in feature.properties) {
                                popupContent += `<p><strong>${key}:</strong> ${feature.properties[key]}</p>`;
                            }
                            popupContent += "</div>";
                            layer.bindPopup(popupContent);
                        }
                    }
                });
            } else {
                // Polygon or line layers
                layer = L.geoJSON(data, {
                    style: function(feature) {
                        // Set default style
                        return {
                            weight: 2,
                            opacity: 1,
                            color: getLayerColor(layerId),
                            fillOpacity: 0.5
                        };
                    },
                    onEachFeature: function(feature, layer) {
                        if (feature.properties) {
                            let popupContent = "<div class='feature-popup'>";
                            for (const key in feature.properties) {
                                popupContent += `<p><strong>${key}:</strong> ${feature.properties[key]}</p>`;
                            }
                            popupContent += "</div>";
                            layer.bindPopup(popupContent);
                        }
                    }
                });
            }
            
            // Add layer to map and store in allLayers
            layer.addTo(map);
            allLayers[layerId] = layer;
            
            // Update layer control status
            const checkbox = document.querySelector(`.layer-control[data-layer="${layerId}"]`);
            if (checkbox) {
                layer.setStyle({ opacity: checkbox.checked ? 1 : 0, fillOpacity: checkbox.checked ? 0.5 : 0 });
            }
            
            console.log(`Added ${layerId} layer to map`);
        })
        .catch(error => {
            console.error(`Error loading layer ${layerId}:`, error);
            showErrorNotification(`Failed to load ${layerId} layer. Check console for details.`);
        });
}

/**
 * Get appropriate color for layer
 */
function getLayerColor(layerId) {
    const colorMap = {
        'landuse': '#8BC34A',
        'districtboundaries': '#9C27B0',
        'communityCa': '#FFEB3B',
        'matetsiunits': '#FF9800',
        'landscapeboundary': '#F44336',
        'bufferwards': '#2196F3',
        'wildlife_corridors': '#3F51B5',
        'rivers': '#00BCD4',
        'roads': '#795548'
    };
    
    return colorMap[layerId] || '#888888';
}

/**
 * Update analysis content with real data
 */
function updateAnalysis() {
    let totalArea = 0;
    let corridorLength = 0;
    let townsCount = 0;
    
    // Calculate total landscape area
    if (allLayers && allLayers.landscapeboundary) {
        allLayers.landscapeboundary.eachLayer(function(layer) {
            if (layer.feature) {
                totalArea += calculateArea(layer.feature);
            }
        });
    }
    
    // Calculate corridor length
    if (allLayers && allLayers.wildlife_corridors) {
        allLayers.wildlife_corridors.eachLayer(function(layer) {
            if (layer.feature) {
                corridorLength += calculateLength(layer.feature);
            }
        });
    }
    
    // Count towns
    if (allLayers && allLayers.towns) {
        allLayers.towns.eachLayer(function(layer) {
            townsCount++;
        });
    }
    
    // Update the display
    document.getElementById('total-area').textContent = totalArea.toFixed(2) + ' km²';
    document.getElementById('corridor-length').textContent = corridorLength.toFixed(2) + ' km';
    document.getElementById('towns-count').textContent = townsCount;
}

/**
 * Add feature labels where needed
 */
function addFeatureLabels() {
    const layersToLabel = ['towns', 'places', 'matetsiunits'];
    
    layersToLabel.forEach(layerId => {
        if (allLayers && allLayers[layerId]) {
            allLayers[layerId].eachLayer(function(layer) {
                if (layer.feature && layer.feature.properties) {
                    const props = layer.feature.properties;
                    const labelField = getAppropriateFieldForLabel(props, layerId);
                    
                    if (labelField && props[labelField]) {
                        const labelText = props[labelField];
                        if (layer.getLatLng) { // Point layer
                            const latLng = layer.getLatLng();
                            const icon = L.divIcon({
                                className: `${layerId}-label`,
                                html: `<div>${labelText}</div>`,
                                iconSize: [100, 20],
                                iconAnchor: [50, -10]
                            });
                            L.marker(latLng, { icon: icon }).addTo(map);
                        }
                    }
                }
            });
        }
    });
}

/**
 * Get the appropriate field to use for labeling based on feature properties
 */
function getAppropriateFieldForLabel(properties, layerId) {
    // Priority fields for different layer types
    const fieldPriorities = {
        'towns': ['name', 'NAME', 'TOWN', 'town', 'Town'],
        'places': ['name', 'NAME', 'PLACE', 'place', 'Place'],
        'matetsiunits': ['name', 'NAME', 'UNIT', 'unit', 'Unit']
    };
    
    const priorities = fieldPriorities[layerId] || ['name', 'NAME', 'LABEL'];
    
    for (const field of priorities) {
        if (properties[field]) {
            return field;
        }
    }
    
    // If no priority field found, return the first property that seems like a name
    for (const prop in properties) {
        const propLower = prop.toLowerCase();
        if (propLower.includes('name') || propLower.includes('title') || propLower.includes('label')) {
            return prop;
        }
    }
    
    // If all else fails, return the first string property
    for (const prop in properties) {
        if (typeof properties[prop] === 'string' && properties[prop].length > 0) {
            return prop;
        }
    }
    
    return null;
}

/**
 * Ensure layer visibility matches checkbox states
 */
function syncLayerVisibility() {
    const checkboxes = document.querySelectorAll('.layer-control');
    
    checkboxes.forEach(checkbox => {
        const layerId = checkbox.getAttribute('data-layer');
        if (allLayers && allLayers[layerId]) {
            const visible = checkbox.checked;
            
            if (visible) {
                allLayers[layerId].setStyle({ opacity: 1, fillOpacity: 0.5 });
                map.addLayer(allLayers[layerId]);
            } else {
                allLayers[layerId].setStyle({ opacity: 0, fillOpacity: 0 });
                map.removeLayer(allLayers[layerId]);
            }
        }
    });
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
});