// Global variables
let map;
let allLayers = {};
let basemapLayers = {};
let activeBasemap = 'OpenStreetMap';
let analysisData = {
    totalArea: 0,
    corridorLength: 0,
    chiefsCount: 0
};

// Initialize map when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document ready, initializing map...");
    try {
        initializeMap();
        initializeControls();
    } catch (error) {
        console.error("Error during initialization:", error);
        showErrorNotification("Error initializing map: " + error.message);
    }
});

function initializeMap() {
    try {
        console.log("Creating map...");
        // Create the map
        map = L.map('map', {
            center: CONFIG.mapCenter,
            zoom: CONFIG.initialZoom,
            minZoom: CONFIG.minZoom,
            maxZoom: CONFIG.maxZoom,
            fullscreenControl: true,
            attributionControl: false // We'll add attribution in the footer
        });

        console.log("Map created successfully");

        // Add attribution to footer
        const attributionText = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | IFAW 2025';
        document.getElementById('footer').innerHTML = `<p>${attributionText}</p>`;

        // Setup basemap layers
        console.log("Setting up basemap layers...");
        basemapLayers = CONFIG.basemaps;
        basemapLayers.OpenStreetMap.addTo(map);

        // Add zoom control to top-right
        L.control.zoom({
            position: 'topright'
        }).addTo(map);

        // Add fullscreen control
        L.control.fullscreen({
            position: 'topright',
            title: 'View Fullscreen',
            titleCancel: 'Exit Fullscreen',
            forceSeparateButton: true
        }).addTo(map);

        // Add scale control
        L.control.scale({
            imperial: false,
            position: 'bottomright'
        }).addTo(map);

        console.log("Loading GeoJSON layers...");
        // Load all GeoJSON data
        loadAllLayers().then(() => {
            console.log("All layers loaded successfully");
            // Create and add the legend
            createLegend();
            
            // Update analysis data
            updateAnalysisData();
        }).catch(error => {
            console.error("Error loading layers:", error);
            showErrorNotification("Error loading map layers. Please check console for details.");
        });
    } catch (error) {
        console.error("Error initializing map:", error);
        showErrorNotification("Failed to initialize map. Please check console for details.");
    }
}

// Initialize custom controls and event listeners
function initializeControls() {
    try {
        console.log("Initializing map controls...");
        // Initialize basemap radio buttons
        const basemapRadios = document.querySelectorAll('input[name="basemap"]');
        basemapRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                changeBasemap(this.value);
            });
        });

        // Initialize layer checkboxes
        const layerCheckboxes = document.querySelectorAll('.layer-control');
        layerCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                toggleLayer(this.dataset.layer, this.checked);
            });
        });

        // Close button for info panel
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.getElementById('info-panel').style.display = 'none';
            });
        }

        // Add responsive sidebar toggle for mobile
        addMobileSidebarToggle();
        console.log("Map controls initialized");
    } catch (error) {
        console.error("Error initializing controls:", error);
        showErrorNotification("Error setting up map controls: " + error.message);
    }
}

// Function to toggle layers
function toggleLayer(layerName, isVisible) {
    try {
        if (!allLayers[layerName]) {
            console.warn(`Layer ${layerName} not found`);
            return;
        }
        
        if (isVisible) {
            if (!map.hasLayer(allLayers[layerName])) {
                map.addLayer(allLayers[layerName]);
                console.log(`Added layer ${layerName} to map`);
            }
        } else {
            if (map.hasLayer(allLayers[layerName])) {
                map.removeLayer(allLayers[layerName]);
                console.log(`Removed layer ${layerName} from map`);
            }
        }

        // Special case for the "roads" group
        if (layerName === 'roads') {
            const roadCheckboxes = document.querySelectorAll('.layer-control[data-layer^="category"]');
            roadCheckboxes.forEach(checkbox => {
                checkbox.disabled = isVisible;
                if (isVisible) {
                    // Hide individual road layers when "All Roads" is checked
                    if (allLayers[checkbox.dataset.layer] && map.hasLayer(allLayers[checkbox.dataset.layer])) {
                        map.removeLayer(allLayers[checkbox.dataset.layer]);
                    }
                    checkbox.checked = false;
                } else {
                    checkbox.disabled = false;
                }
            });
        }

        // Update analysis data whenever a relevant layer is toggled
        updateAnalysisData();
    } catch (error) {
        console.error(`Error toggling layer ${layerName}:`, error);
        showErrorNotification(`Error toggling ${layerName} layer: ${error.message}`);
    }
}

// Function to change basemap
function changeBasemap(basemapName) {
    try {
        if (map.hasLayer(basemapLayers[activeBasemap])) {
            map.removeLayer(basemapLayers[activeBasemap]);
        }
        
        map.addLayer(basemapLayers[basemapName]);
        activeBasemap = basemapName;
        console.log(`Changed basemap to ${basemapName}`);
    } catch (error) {
        console.error(`Error changing basemap to ${basemapName}:`, error);
        showErrorNotification(`Error changing basemap: ${error.message}`);
    }
}

// Add mobile sidebar toggle
function addMobileSidebarToggle() {
    // Check if we're on mobile
    if (window.innerWidth <= 768) {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '≡';
        toggleBtn.style.padding = '10px';
        toggleBtn.style.fontSize = '20px';
        toggleBtn.style.background = 'white';
        toggleBtn.style.border = '1px solid #ccc';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.style.cursor = 'pointer';
        
        // Add to map container
        document.getElementById('main-container').appendChild(toggleBtn);
        
        // Add event listener
        toggleBtn.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('active');
        });
    }
}

// Load all GeoJSON layers
async function loadAllLayers() {
    try {
        console.log("Loading HMZ Boundary...");
        // Load boundary first
        await loadLayer('hmzBoundary', CONFIG.geojsonPaths.hmzBoundary, {
            style: {
                color: '#000',
                weight: 2,
                fillOpacity: 0,
                dashArray: '5, 5'
            }
        });
        
        console.log("Loading Landscape Boundary...");
        // Load landscapeBoundary
        await loadLayer('landscapeBoundary', CONFIG.geojsonPaths.landscapeBoundary, {
            style: {
                color: '#333',
                weight: 1.5,
                fillOpacity: 0
            }
        });

        console.log("Loading Land Use Layers...");
        // Load landuse and landuse2 (with landuse on top as it takes precedence)
        await loadLanduseLayers();
        
        console.log("Loading Wards...");
        // Load wards
        await loadLayer('wards', CONFIG.geojsonPaths.wards, {
            style: {
                color: '#666',
                weight: 1,
                fillOpacity: 0,
                dashArray: '2, 2'
            }
        });
        
        console.log("Loading IFAW Operating Wards...");
        // Load bufferwards
        await loadLayer('bufferwards', CONFIG.geojsonPaths.bufferwards, {
            style: {
                color: '#228B22',
                weight: 1.5,
                fillColor: '#90EE90',
                fillOpacity: 0.3
            }
        });
        
        console.log("Loading Chiefs with Buffers...");
        // Load chiefs with buffer
        await loadChiefsWithBuffer();
        
        console.log("Loading Wildlife Corridors...");
        // Load wildlife corridors with arrows
        await loadCorridorsWithArrows();
        
        console.log("Loading Roads...");
        // Load roads by category
        await loadRoadsByCategory();
        
        console.log("Loading Rivers...");
        // Load rivers
        await loadLayer('rivers', CONFIG.geojsonPaths.rivers, {
            style: {
                color: CONFIG.colors.rivers,
                weight: 1.5
            }
        });
        
        console.log("Loading Water Sources...");
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
        
        console.log("Loading Points of Interest...");
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

        console.log("Setting layer order...");
        // Ensure proper z-index ordering
        if (allLayers['landuse']) allLayers['landuse'].bringToFront();
        if (allLayers['rivers']) allLayers['rivers'].bringToFront();
        if (allLayers['corridors']) allLayers['corridors'].bringToFront();
        if (allLayers['chiefs']) allLayers['chiefs'].bringToFront();
        
        console.log("All layers loaded successfully");
        return true;
        
    } catch (error) {
        console.error('Error loading layers:', error);
        showErrorNotification('Some layers could not be loaded. Check that all GeoJSON files are present in the data folder.');
        return false;
    }
}

// Load a single GeoJSON layer
async function loadLayer(layerName, url, options = {}) {
    try {
        console.log(`Fetching ${layerName} from ${url}...`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${layerName} (${response.status}): ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully parsed ${layerName} GeoJSON data`);
        
        // Add popup if not specified in options
        if (!options.onEachFeature) {
            options.onEachFeature = function(feature, layer) {
                if (feature.properties) {
                    let popupContent = '<div class="custom-popup">';
                    popupContent += `<h3>${layerName.charAt(0).toUpperCase() + layerName.slice(1).replace(/([A-Z])/g, ' $1').trim()}</h3>`;
                    for (const property in feature.properties) {
                        if (feature.properties[property]) {
                            popupContent += `<p><strong>${property}:</strong> ${feature.properties[property]}</p>`;
                        }
                    }
                    popupContent += '</div>';
                    layer.bindPopup(popupContent);
                    
                    // Add click event to show info in sidebar
                    layer.on('click', function(e) {
                        showFeatureInfo(feature, layerName);
                    });
                }
            };
        }
        
        // Create and add the layer
        console.log(`Creating ${layerName} layer...`);
        const layer = L.geoJSON(data, options);
        allLayers[layerName] = layer;
        
        // Add to map by default if corresponding checkbox is checked
        const checkbox = document.querySelector(`.layer-control[data-layer="${layerName}"]`);
        if (checkbox && checkbox.checked) {
            layer.addTo(map);
            console.log(`Added ${layerName} to map`);
        }
        
        return layer;
    } catch (error) {
        console.error(`Error loading ${layerName}:`, error);
        showErrorNotification(`Failed to load ${layerName}. Check that the file exists in the data folder.`);
        return null;
    }
}

// Show feature information in the info panel
function showFeatureInfo(feature, layerName) {
    try {
        const infoPanel = document.getElementById('info-panel');
        const infoContent = document.getElementById('info-content');
        
        if (!infoPanel || !infoContent) {
            console.error('Info panel elements not found');
            return;
        }
        
        // Set title
        const infoHeader = document.querySelector('.info-header h3');
        if (infoHeader) {
            infoHeader.textContent = layerName.charAt(0).toUpperCase() + layerName.slice(1).replace(/([A-Z])/g, ' $1').trim() + ' Information';
        }
        
        // Clear previous content
        infoContent.innerHTML = '';
        
        // Add feature properties
        if (feature.properties) {
            let content = '';
            for (const property in feature.properties) {
                if (feature.properties[property]) {
                    content += `<p><strong>${property}:</strong> ${feature.properties[property]}</p>`;
                }
            }
            
            // Add additional information based on layer type
            if (layerName === 'corridors') {
                // Calculate length if it's a corridor
                try {
                    const length = calculateLength(feature);
                    content += `<p><strong>Estimated Length:</strong> ${length.toFixed(2)} km</p>`;
                } catch (error) {
                    console.error('Error calculating length:', error);
                }
            } else if (layerName === 'landuse' || layerName === 'landuse2') {
                // Calculate area if it's a polygon
                try {
                    const area = calculateArea(feature);
                    content += `<p><strong>Estimated Area:</strong> ${area.toFixed(2)} km²</p>`;
                } catch (error) {
                    console.error('Error calculating area:', error);
                }
            }
            
            infoContent.innerHTML = content;
        } else {
            infoContent.innerHTML = '<p>No information available for this feature.</p>';
        }
        
        // Show the panel
        infoPanel.style.display = 'block';
    } catch (error) {
        console.error('Error showing feature info:', error);
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
                if (feature.properties && feature.properties.LANDTYPE) {
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
                }
                
                return {
                    fillColor: fillColor,
                    weight: 1,
                    opacity: 1,
                    color: '#666',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                // Custom popup content for land use
                let popupContent = '<div class="custom-popup">';
                popupContent += `<h3>${feature.properties && feature.properties.LANDTYPE ? feature.properties.LANDTYPE : 'Land Use'}</h3>`;
                
                if (feature.properties) {
                    for (const property in feature.properties) {
                        if (feature.properties[property]) {
                            popupContent += `<p><strong>${property}:</strong> ${feature.properties[property]}</p>`;
                        }
                    }
                }
                
                // Add area calculation
                try {
                    const area = calculateArea(feature);
                    popupContent += `<p><strong>Estimated Area:</strong> ${area.toFixed(2)} km²</p>`;
                } catch (error) {
                    console.error('Error calculating area:', error);
                }
                
                popupContent += '</div>';
                layer.bindPopup(popupContent);
                
                // Add click event to show info in sidebar
                layer.on('click', function(e) {
                    showFeatureInfo(feature, 'landuse2');
                });
            }
        });
        
        // Then load landuse on top (it takes precedence)
        const landuse = await loadLayer('landuse', CONFIG.geojsonPaths.landuse, {
            style: function(feature) {
                let fillColor = CONFIG.colors.communalLand; // Default
                
                // Set color based on land type property
                if (feature.properties && feature.properties.LANDTYPE) {
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
                }
                
                return {
                    fillColor: fillColor,
                    weight: 1,
                    opacity: 1,
                    color: '#666',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                // Custom popup content for land use
                let popupContent = '<div class="custom-popup">';
                popupContent += `<h3>${feature.properties && feature.properties.LANDTYPE ? feature.properties.LANDTYPE : 'Land Use'}</h3>`;
                
                if (feature.properties) {
                    for (const property in feature.properties) {
                        if (feature.properties[property]) {
                            popupContent += `<p><strong>${property}:</strong> ${feature.properties[property]}</p>`;
                        }
                    }
                }
                
                // Add area calculation
                try {
                    const area = calculateArea(feature);
                    popupContent += `<p><strong>Estimated Area:</strong> ${area.toFixed(2)} km²</p>`;
                } catch (error) {
                    console.error('Error calculating area:', error);
                }
                
                popupContent += '</div>';
                layer.bindPopup(popupContent);
                
                // Add click event to show info in sidebar
                layer.on('click', function(e) {
                    showFeatureInfo(feature, 'landuse');
                });
            }
        });
        
        // Make sure landuse is always on top
        if (landuse && landuse2) {
            landuse.bringToFront();
        }
        
    } catch (error) {
        console.error('Error loading landuse layers:', error);
        showErrorNotification('Error loading land use layers');
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
            // Skip if geometry is missing
            if (!feature.geometry || !feature.geometry.coordinates) {
                console.warn('Chief feature missing geometry or coordinates');
                return;
            }
            
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
            if (feature.properties) {
                for (const property in feature.properties) {
                    if (feature.properties[property]) {
                        popupContent += `<p><strong>${property}:</strong> ${feature.properties[property]}</p>`;
                    }
                }
            }
            popupContent += '</div>';
            chiefMarker.bindPopup(popupContent);
            
            // Add click event to show info in sidebar
            chiefMarker.on('click', function(e) {
                showFeatureInfo(feature, 'chiefs');
            });
            
            // Add chief marker to the group
            chiefsGroup.addLayer(chiefMarker);
            
            // Create a 15km buffer around the chief
            // Convert 15km to degrees (approximate conversion, varies by latitude)
            // At the equator, 1 degree is approximately 111 km
            const bufferRadius = CONFIG.chiefBufferRadius / 111;
            
            const bufferCircle = L.circle([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                radius: CONFIG.chiefBufferRadius * 1000, // Convert km to meters for Leaflet
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
        
        // Add the chiefs group to allLayers
        allLayers['chiefs'] = chiefsGroup;
        
        // Add to map if checkbox is checked
        const checkbox = document.querySelector('.layer-control[data-layer="chiefs"]');
        if (checkbox && checkbox.checked) {
            chiefsGroup.addTo(map);
        }
        
    } catch (error) {
        console.error('Error loading chiefs with buffers:', error);
        showErrorNotification('Error loading chiefs layer');
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
            // Skip if geometry is missing or not a LineString
            if (!feature.geometry || feature.geometry.type !== 'LineString' || !feature.geometry.coordinates || feature.geometry.coordinates.length < 2) {
                console.warn('Corridor feature has invalid geometry');
                return;
            }
            
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
            if (feature.properties) {
                for (const property in feature.properties) {
                    if (feature.properties[property]) {
                        popupContent += `<p><strong>${property}:</strong> ${feature.properties[property]}</p>`;
                    }
                }
            }
            
            // Add corridor length
            try {
                const length = calculateLength(feature);
                popupContent += `<p><strong>Estimated Length:</strong> ${length.toFixed(2)} km</p>`;
            } catch (error) {
                console.error('Error calculating length:', error);
            }
            
            popupContent += '</div>';
            corridorLine.bindPopup(popupContent);
            
            // Add click event to show info in sidebar
            corridorLine.on('click', function(e) {
                showFeatureInfo(feature, 'corridors');
            });
            
            // Add corridor to the group
            corridorsGroup.addLayer(corridorLine);
            
            // Extract coordinates for arrow decorations
            const coordinates = feature.geometry.coordinates;
            
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
        
        // Add the corridors group to allLayers
        allLayers['corridors'] = corridorsGroup;
        
        // Add to map if checkbox is checked
        const checkbox = document.querySelector('.layer-control[data-layer="corridors"]');
        if (checkbox && checkbox.checked) {
            corridorsGroup.addTo(map);
        }
        
    } catch (error) {
        console.error('Error loading corridors with arrows:', error);
        showErrorNotification('Error loading wildlife corridors');
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
        const roadsGroup = L.layerGroup();
        
        // Add individual road layers to the group if they exist
        if (category1Roads) roadsGroup.addLayer(category1Roads);
        if (category2Roads) roadsGroup.addLayer(category2Roads);
        if (category3Roads) roadsGroup.addLayer(category3Roads);
        
        // Add the roads group to allLayers
        allLayers['roads'] = roadsGroup;
        
        // Add to map if checkbox is checked
        const checkbox = document.querySelector('.layer-control[data-layer="roads"]');
        if (checkbox && checkbox.checked) {
            roadsGroup.addTo(map);
            
            // Disable individual road category checkboxes
            const roadCheckboxes = document.querySelectorAll('.layer-control[data-layer^="category"]');
            roadCheckboxes.forEach(cb => {
                cb.disabled = true;
                cb.checked = false;
            });
        }
        
    } catch (error) {
        console.error('Error loading roads by category:', error);
        showErrorNotification('Error loading road layers');
    }
}

// Create and add the legend to the map
function createLegend() {
    try {
        const legendDiv = document.getElementById('legend-content');
        
        if (!legendDiv) {
            console.error('Legend container not found');
            return;
        }
        
        legendDiv.innerHTML = '';
        
        // Land Types Legend
        let legendHTML = '<div class="legend-section">';
        
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
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${item.color};"></div>
                    <div class="legend-label">${item.label}</div>
                </div>
            `;
        });
        
        legendHTML += '</div>';
        
        // Line Features Legend
        legendHTML += '<div class="legend-section">';
        
        // Line features legend items
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
        
        legendHTML += '</div>';
        
        // Point Features Legend
        legendHTML += '<div class="legend-section">';
        
        // Point features legend items
        const pointFeatures = [
            { color: '#FF0000', label: 'Chiefs', type: 'circle' },
            { color: CONFIG.colors.chiefBuffers, label: '15km Chief Buffer', type: 'circle-outline' },
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
    } catch (error) {
        console.error('Error creating legend:', error);
    }
}

// Calculate length of a linestring feature in kilometers
function calculateLength(feature) {
    if (!feature || !feature.geometry || (feature.geometry.type !== 'LineString' && feature.geometry.type !== 'MultiLineString')) {
        return 0;
    }
    
    let length = 0;
    
    try {
        if (window.turf) {
            length = turf.length(feature, {units: 'kilometers'});
        } else {
            // Fallback manual calculation if turf.js is not available
            if (feature.geometry.type === 'LineString') {
                const coords = feature.geometry.coordinates;
                for (let i = 1; i < coords.length; i++) {
                    const p1 = L.latLng(coords[i-1][1], coords[i-1][0]);
                    const p2 = L.latLng(coords[i][1], coords[i][0]);
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

// Update analysis data
function updateAnalysisData() {
    try {
        // Calculate total landscape area
        let totalArea = 0;
        if (allLayers['landscapeBoundary'] && map.hasLayer(allLayers['landscapeBoundary'])) {
            const data = allLayers['landscapeBoundary'].toGeoJSON();
            data.features.forEach(feature => {
                totalArea += calculateArea(feature);
            });
        }
        
        // Calculate total corridor length
        let corridorLength = 0;
        if (allLayers['corridors'] && map.hasLayer(allLayers['corridors'])) {
            const data = allLayers['corridors'].toGeoJSON();
            if (data && data.features) {
                data.features.forEach(feature => {
                    corridorLength += calculateLength(feature);
                });
            }
        }
        
        // Count chiefs
        let chiefsCount = 0;
        if (allLayers['chiefs'] && map.hasLayer(allLayers['chiefs'])) {
            // Try to get a more accurate count if possible
            const chiefsData = document.querySelectorAll('.leaflet-marker-icon').length;
            chiefsCount = Math.max(1, Math.floor(chiefsData / 2)); // Rough estimate
        }
        
        // Update analysis data object
        analysisData = {
            totalArea,
            corridorLength,
            chiefsCount
        };
        
        // Update the DOM
        const totalAreaElement = document.getElementById('total-area');
        const corridorLengthElement = document.getElementById('corridor-length');
        const chiefsCountElement = document.getElementById('chiefs-count');
        
        if (totalAreaElement) totalAreaElement.textContent = `${totalArea.toFixed(2)} km²`;
        if (corridorLengthElement) corridorLengthElement.textContent = `${corridorLength.toFixed(2)} km`;
        if (chiefsCountElement) chiefsCountElement.textContent = chiefsCount.toString();
        
    } catch (error) {
        console.error('Error updating analysis data:', error);
    }
}

// Show error notification
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
    notification.style.fontWeight = 'bold';
    
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
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000);
    
    // Log to console as well
    console.error(message);
}

// Add event listener for map zoom change to adjust arrow size
if (map) {
    map.on('zoomend', function() {
        // Could implement dynamic scaling of arrows based on zoom level
        updateAnalysisData();
    });
}

// Add event listener for window resize to handle responsive layout
window.addEventListener('resize', function() {
    // Check if we need to add/remove the mobile sidebar toggle
    if (window.innerWidth <= 768) {
        if (!document.querySelector('.sidebar-toggle')) {
            addMobileSidebarToggle();
        }
    } else {
        const toggle = document.querySelector('.sidebar-toggle');
        if (toggle) {
            toggle.parentNode.removeChild(toggle);
        }
        
        // Ensure sidebar is visible on desktop
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }
});