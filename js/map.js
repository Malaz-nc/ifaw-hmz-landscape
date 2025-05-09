// Initialize the map
let map;
let layerControl;
let allLayers = {};

// Initialize map when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
});

function initializeMap() {
    // Create the map
    map = L.map('map', {
        center: CONFIG.mapCenter,
        zoom: CONFIG.initialZoom,
        minZoom: CONFIG.minZoom,
        maxZoom: CONFIG.maxZoom,
        fullscreenControl: true
    });

    // Add basemap layers
    const baseMaps = CONFIG.basemaps;
    baseMaps.OpenStreetMap.addTo(map);

    // Create overlay groups for organization
    const landTypeOverlays = {};
    const featureOverlays = {};

    // Initialize layer control
    layerControl = L.control.layers(baseMaps, null, {
        collapsed: false,
        position: 'topleft'
    });

    // Load all geojson data
    loadAllLayers().then(() => {
        // Add layer control to map
        layerControl.addTo(map);
        
        // Initialize UI controls
        initializeCustomControls();
        
        // Create and add the legend
        createLegend();
    });
}

// Load all GeoJSON layers
async function loadAllLayers() {
    try {
        // Load boundary first
        await loadLayer('hmzBoundary', CONFIG.geojsonPaths.hmzBoundary, {
            style: {
                color: '#000',
                weight: 2,
                fillOpacity: 0,
                dashArray: '5, 5'
            }
        });
        
        // Load landscapeBoundary
        await loadLayer('landscapeBoundary', CONFIG.geojsonPaths.landscapeBoundary, {
            style: {
                color: '#333',
                weight: 1.5,
                fillOpacity: 0
            }
        });

        // Load landuse and landuse2 (with landuse on top as it takes precedence)
        await loadLanduseLayers();
        
        // Load wards
        await loadLayer('wards', CONFIG.geojsonPaths.wards, {
            style: {
                color: '#666',
                weight: 1,
                fillOpacity: 0,
                dashArray: '2, 2'
            }
        });
        
        // Load bufferwards
        await loadLayer('bufferwards', CONFIG.geojsonPaths.bufferwards, {
            style: {
                color: '#228B22',
                weight: 1.5,
                fillColor: '#90EE90',
                fillOpacity: 0.3
            }
        });
        
        // Load chiefs with buffer
        await loadChiefsWithBuffer();
        
        // Load wildlife corridors with arrows
        await loadCorridorsWithArrows();
        
        // Load roads by category
        await loadRoadsByCategory();
        
        // Load rivers
        await loadLayer('rivers', CONFIG.geojsonPaths.rivers, {
            style: {
                color: CONFIG.colors.rivers,
                weight: 1.5
            }
        });
        
        // Load water sources
        await loadLayer('waterSources', CONFIG.geojsonPaths.waterSources, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 4,
                    fillColor: '#0078FF',
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            }
        });
        
        // Load points of interest
        await loadLayer('pointsOfInterest', CONFIG.geojsonPaths.pointsOfInterest, {
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
        });

        // Ensure proper z-index ordering
        if (allLayers['landuse']) allLayers['landuse'].bringToFront();
        if (allLayers['rivers']) allLayers['rivers'].bringToFront();
        if (allLayers['corridors']) allLayers['corridors'].bringToFront();
        if (allLayers['chiefs']) allLayers['chiefs'].bringToFront();
        
    } catch (error) {
        console.error('Error loading layers:', error);
    }
}

// Load a single GeoJSON layer
async function loadLayer(layerName, url, options = {}) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${layerName} (${response.status})`);
        }
        
        const data = await response.json();
        
        // Add popup if not specified in options
        if (!options.onEachFeature) {
            options.onEachFeature = function(feature, layer) {
                if (feature.properties) {
                    let popupContent = '<div class="custom-popup">';
                    for (const property in feature.properties) {
                        if (feature.properties[property]) {
                            popupContent += `<strong>${property}:</strong> ${feature.properties[property]}<br>`;
                        }
                    }
                    popupContent += '</div>';
                    layer.bindPopup(popupContent);
                }
            };
        }
        
        // Create and add the layer
        const layer = L.geoJSON(data, options);
        allLayers[layerName] = layer;
        
        return layer;
    } catch (error) {
        console.error(`Error loading ${layerName}:`, error);
    }
}

// Load landuse and landuse2 with proper ordering
async function loadLanduseLayers() {
    try {
        // Load landuse2 first (it goes underneath)
        const landuse2 = await loadLayer('landuse2', CONFIG.geojsonPaths.landuse2, {
            style: function(feature) {
                let fillColor = CONFIG.colors.communalLand; // Default
                
                // Set color based on land type property
                if (feature.properties.LANDTYPE === 'Communal Land') {
                    fillColor = CONFIG.colors.communalLand;
                } else if (feature.properties.LANDTYPE === 'Target Forest Land') {
                    fillColor = CONFIG.colors.targetForestLand;
                } else if (feature.properties.LANDTYPE === 'Large Scale Farming') {
                    fillColor = CONFIG.colors.largeScaleFarming;
                } else if (feature.properties.LANDTYPE === 'National Park') {
                    fillColor = CONFIG.colors.nationalPark;
                } else if (feature.properties.LANDTYPE === 'Safari Area') {
                    fillColor = CONFIG.colors.safariArea;
                } else if (feature.properties.LANDTYPE === 'Small Scale Farming') {
                    fillColor = CONFIG.colors.smallScaleFarming;
                } else if (feature.properties.LANDTYPE === 'Community CA') {
                    fillColor = CONFIG.colors.communityCa;
                }
                
                return {
                    fillColor: fillColor,
                    weight: 1,
                    opacity: 1,
                    color: '#666',
                    fillOpacity: 0.7
                };
            }
        });
        
        // Then load landuse on top (it takes precedence)
        const landuse = await loadLayer('landuse', CONFIG.geojsonPaths.landuse, {
            style: function(feature) {
                let fillColor = CONFIG.colors.communalLand; // Default
                
                // Set color based on land type property
                if (feature.properties.LANDTYPE === 'Communal Land') {
                    fillColor = CONFIG.colors.communalLand;
                } else if (feature.properties.LANDTYPE === 'Target Forest Land') {
                    fillColor = CONFIG.colors.targetForestLand;
                } else if (feature.properties.LANDTYPE === 'Large Scale Farming') {
                    fillColor = CONFIG.colors.largeScaleFarming;
                } else if (feature.properties.LANDTYPE === 'National Park') {
                    fillColor = CONFIG.colors.nationalPark;
                } else if (feature.properties.LANDTYPE === 'Safari Area') {
                    fillColor = CONFIG.colors.safariArea;
                } else if (feature.properties.LANDTYPE === 'Small Scale Farming') {
                    fillColor = CONFIG.colors.smallScaleFarming;
                } else if (feature.properties.LANDTYPE === 'Community CA') {
                    fillColor = CONFIG.colors.communityCa;
                }
                
                return {
                    fillColor: fillColor,
                    weight: 1,
                    opacity: 1,
                    color: '#666',
                    fillOpacity: 0.7
                };
            }
        });
        
        // Make sure landuse is always on top
        landuse.bringToFront();
        
        // Add both to the layer control
        layerControl.addOverlay(landuse2, 'Land Use (base)');
        layerControl.addOverlay(landuse, 'Land Use (priority)');
        
        // Show landuse by default
        landuse.addTo(map);
        landuse2.addTo(map);
        
    } catch (error) {
        console.error('Error loading landuse layers:', error);
    }
}

// Load chiefs with 15km buffer
async function loadChiefsWithBuffer() {
    try {
        const response = await fetch(CONFIG.geojsonPaths.chiefs);
        if (!response.ok) {
            throw new Error(`Failed to load chiefs (${response.status})`);
        }
        
        const data = await response.json();
        
        // Create a group for both chiefs and their buffers
        const chiefsGroup = L.layerGroup();
        
        // Process each chief point
        data.features.forEach(feature => {
            // Create the chief marker
            const chiefMarker = L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                radius: 8,
                fillColor: '#FF0000',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.9
            });
            
            // Add popup
            let popupContent = '<div class="custom-popup">';
            popupContent += `<h3>Chief</h3>`;
            for (const property in feature.properties) {
                if (feature.properties[property]) {
                    popupContent += `<strong>${property}:</strong> ${feature.properties[property]}<br>`;
                }
            }
            popupContent += '</div>';
            chiefMarker.bindPopup(popupContent);
            
            // Add chief marker to the group
            chiefsGroup.addLayer(chiefMarker);
            
            // Create a 15km buffer around the chief
            // Convert 15km to degrees (approximate conversion, varies by latitude)
            // At the equator, 1 degree is approximately 111 km
            const bufferRadius = CONFIG.chiefBufferRadius / 111;
            
            const bufferCircle = L.circle([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                radius: bufferRadius * 111000, // Convert back to meters for Leaflet
                color: CONFIG.colors.chiefBuffers,
                fillColor: CONFIG.colors.chiefBuffers,
                weight: 2,
                opacity: 0.6,
                fillOpacity: 0.1,
                className: 'chief-buffer'
            });
            
            // Add buffer to the group
            chiefsGroup.addLayer(bufferCircle);
        });
        
        // Add the chiefs group to allLayers and the layer control
        allLayers['chiefs'] = chiefsGroup;
        layerControl.addOverlay(chiefsGroup, 'Chiefs with 15km Buffers');
        
        // Add to map by default
        chiefsGroup.addTo(map);
        
    } catch (error) {
        console.error('Error loading chiefs with buffers:', error);
    }
}

// Load wildlife corridors with animated arrows
async function loadCorridorsWithArrows() {
    try {
        const response = await fetch(CONFIG.geojsonPaths.corridors);
        if (!response.ok) {
            throw new Error(`Failed to load corridors (${response.status})`);
        }
        
        const data = await response.json();
        
        // Create a group for corridors and arrows
        const corridorsGroup = L.layerGroup();
        
        // Process each corridor line
        data.features.forEach(feature => {
            // Create the corridor line
            const corridorLine = L.geoJSON(feature, {
                style: {
                    color: CONFIG.colors.wildlifeCorridors,
                    weight: 3,
                    opacity: 1
                }
            });
            
            // Add popup
            let popupContent = '<div class="custom-popup">';
            popupContent += `<h3>Wildlife Corridor</h3>`;
            for (const property in feature.properties) {
                if (feature.properties[property]) {
                    popupContent += `<strong>${property}:</strong> ${feature.properties[property]}<br>`;
                }
            }
            popupContent += '</div>';
            corridorLine.bindPopup(popupContent);
            
            // Add corridor to the group
            corridorsGroup.addLayer(corridorLine);
            
            // Extract coordinates for arrow decorations
            const coordinates = feature.geometry.coordinates;
            
            // Skip if not a LineString or has fewer than 2 points
            if (feature.geometry.type !== 'LineString' || coordinates.length < 2) {
                return;
            }
            
            // Create polyline for the decorator
            const latLngs = coordinates.map(coord => [coord[1], coord[0]]);
            const polyline = L.polyline(latLngs, {
                color: 'transparent',
                weight: 1
            });
            
            // Add arrow decorations
            const arrowDecorator = L.polylineDecorator(polyline, {
                patterns: [
                    {
                        offset: '5%',
                        repeat: '15%',
                        symbol: L.Symbol.arrowHead({
                            pixelSize: 15,
                            pathOptions: {
                                color: CONFIG.colors.wildlifeCorridors,
                                fillOpacity: 1,
                                weight: 0
                            }
                        })
                    }
                ]
            });
            
            // Add arrow decorator to the group
            corridorsGroup.addLayer(arrowDecorator);
        });
        
        // Add the corridors group to allLayers and the layer control
        allLayers['corridors'] = corridorsGroup;
        layerControl.addOverlay(corridorsGroup, 'Wildlife Corridors');
        
        // Add to map by default
        corridorsGroup.addTo(map);
        
    } catch (error) {
        console.error('Error loading corridors with arrows:', error);
    }
}

// Load roads by category
async function loadRoadsByCategory() {
    try {
        // Load category 1 roads
        const category1Roads = await loadLayer('category1Road', CONFIG.geojsonPaths.category1Road, {
            style: {
                color: CONFIG.colors.roads.category1,
                weight: 3,
                opacity: 1
            }
        });
        
        // Load category 2 roads
        const category2Roads = await loadLayer('category2Road', CONFIG.geojsonPaths.category2Road, {
            style: {
                color: CONFIG.colors.roads.category2,
                weight: 2,
                opacity: 1
            }
        });
        
        // Load category 3 roads
        const category3Roads = await loadLayer('category3Road', CONFIG.geojsonPaths.category3Road, {
            style: {
                color: CONFIG.colors.roads.category3,
                weight: 1.5,
                opacity: 1
            }
        });
        
        // Create a group for all roads
        const roadsGroup = L.layerGroup([category1Roads, category2Roads, category3Roads]);
        
        // Add the roads group to allLayers and the layer control
        allLayers['roads'] = roadsGroup;
        layerControl.addOverlay(roadsGroup, 'Roads');
        
        // Add individual road categories to the layer control
        layerControl.addOverlay(category1Roads, 'Category 1 Roads');
        layerControl.addOverlay(category2Roads, 'Category 2 Roads');
        layerControl.addOverlay(category3Roads, 'Category 3 Roads');
        
        // Add to map by default
        roadsGroup.addTo(map);
        
    } catch (error) {
        console.error('Error loading roads by category:', error);
    }
}

// Initialize custom layer control UI
function initializeCustomControls() {
    // This function could be expanded to create a more custom UI
    // For now, we're using the built-in layer control
}

// Create and add the legend to the map
function createLegend() {
    const legendDiv = document.getElementById('legend-content');
    
    if (!legendDiv) {
        console.error('Legend container not found');
        return;
    }
    
    legendDiv.innerHTML = '';
    
    // Add land type section
    const landTypeLegend = document.createElement('div');
    landTypeLegend.innerHTML = '<h4>Land Type</h4>';
    
    // Land type legend items
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
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = item.color;
        
        const label = document.createElement('div');
        label.className = 'legend-label';
        label.textContent = item.label;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        landTypeLegend.appendChild(legendItem);
    });
    
    legendDiv.appendChild(landTypeLegend);
    
    // Add features section
    const featuresLegend = document.createElement('div');
    featuresLegend.innerHTML = '<h4>Features</h4>';
    
    // Features legend items
    const features = [
        { color: CONFIG.colors.wildlifeCorridors, label: 'Wildlife Corridors', type: 'line' },
        { color: CONFIG.colors.rivers, label: 'Rivers', type: 'line' },
        { color: CONFIG.colors.roads.category1, label: 'Category 1 Road', type: 'line' },
        { color: CONFIG.colors.roads.category2, label: 'Category 2 Road', type: 'line' },
        { color: CONFIG.colors.roads.category3, label: 'Category 3 Road', type: 'line' },
        { color: '#FF0000', label: 'Chiefs', type: 'circle' },
        { color: CONFIG.colors.chiefBuffers, label: '15km Chief Buffer', type: 'circle-outline' },
        { color: '#0078FF', label: 'Water Sources', type: 'circle' },
        { color: '#FF7F00', label: 'Points of Interest', type: 'circle' }
    ];
    
    features.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        
        if (item.type === 'line') {
            colorBox.style.backgroundColor = 'transparent';
            colorBox.style.height = '4px';
            colorBox.style.borderTop = `3px solid ${item.color}`;
            colorBox.style.borderBottom = 'none';
        } else if (item.type === 'circle') {
            colorBox.style.backgroundColor = item.color;
            colorBox.style.borderRadius = '50%';
        } else if (item.type === 'circle-outline') {
            colorBox.style.backgroundColor = 'transparent';
            colorBox.style.border = `2px solid ${item.color}`;
            colorBox.style.borderRadius = '50%';
        } else {
            colorBox.style.backgroundColor = item.color;
        }
        
        const label = document.createElement('div');
        label.className = 'legend-label';
        label.textContent = item.label;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        featuresLegend.appendChild(legendItem);
    });
    
    legendDiv.appendChild(featuresLegend);
}

// Add event listeners
function addEventListeners() {
    // Add any additional event listeners here
}

// Scale factor for arrow animation speed based on zoom level
function getScaleFactor() {
    const zoom = map.getZoom();
    return 1 + (CONFIG.initialZoom - zoom) * 0.2;
}

// Utility function to handle errors when loading GeoJSON
function handleGeoJsonError(error, layerName) {
    console.error(`Error loading ${layerName}:`, error);
    // You could add a notification to the UI here
}

// Update chief buffers when the map is zoomed
function updateChiefBuffers() {
    if (allLayers['chiefs']) {
        // This would need to iterate through all buffer layers and update them
        // based on the current zoom level if needed
    }
}

// Utility function to convert kilometers to degrees at a given latitude
function kmToDegrees(km, latitude) {
    // Earth's radius in km
    const earthRadius = 6371;
    
    // Convert latitude to radians
    const latRad = latitude * Math.PI / 180;
    
    // Calculate the length of a degree of latitude and longitude at the given latitude
    const degLatKm = 111.132; // km per degree of latitude (approximately constant)
    const degLonKm = 111.132 * Math.cos(latRad); // km per degree of longitude
    
    // Convert km to degrees
    const latDeg = km / degLatKm;
    const lonDeg = km / degLonKm;
    
    return { latDeg, lonDeg };
}