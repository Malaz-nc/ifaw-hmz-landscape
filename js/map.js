// Global variables
let map;
let allLayers = {};
let basemapLayers = {};
let activeBasemap = 'OpenStreetMap';
let analysisData = {
    totalArea: 0,
    corridorLength: 0,
    townsCount: 0
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
        console.log("Loading Landscape Boundary...");
        // Load boundary first
        await loadLayer('landscapeboundary', CONFIG.geojsonPaths.landscapeboundary, {
            style: {
                color: '#000',
                weight: 2,
                fillOpacity: 0,
                dashArray: '5, 5'
            }
        });
        
        console.log("Loading Land Use Layers...");
        // Load landuse
        await loadLayer('landuse', CONFIG.geojsonPaths.landuse, {
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
            }
        });
        
        console.log("Loading District Boundaries...");
        // Load district boundaries
        await loadLayer('districtboundaries', CONFIG.geojsonPaths.districtboundaries, {
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
        
        console.log("Loading Community CA...");
        // Load Community CA
        await loadLayer('communityCa', CONFIG.geojsonPaths.communityCa, {
            style: {
                color: '#FFA500',
                weight: 1.5,
                fillColor: CONFIG.colors.communityCa,
                fillOpacity: 0.5
            }
        });
        
        console.log("Loading Wildlife Corridors...");
        // Load wildlife corridors with arrows
        await loadCorridorsWithArrows();
        
        console.log("Loading Roads...");
        // Load roads
        await loadLayer('roads', CONFIG.geojsonPaths.roads, {
            style: {
                color: CONFIG.colors.roads.category1,
                weight: 1.5
            }
        });
        
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
        await loadLayer('watersources', CONFIG.geojsonPaths.watersources, {
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
        
        console.log("Loading Places...");
        // Load places
        await loadLayer('places', CONFIG.geojsonPaths.places, {
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
        
        console.log("Loading Towns...");
        // Load towns
        await loadLayer('towns', CONFIG.geojsonPaths.towns, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: '#FF0000',
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            }
        });
        
        console.log("Loading Project Sites...");
        // Load project sites
        await loadLayer('projectsites', CONFIG.geojsonPaths.projectsites, {
            style: {
                color: CONFIG.colors.ifawProjectSites,
                weight: 2,
                fillOpacity: 0.2,
                dashArray: '5, 5'
            }
        });
        
        console.log("Loading Matetsi Units...");
        // Load matetsi units
        await loadLayer('matetsiunits', CONFIG.geojsonPaths.matetsiunits, {
            style: {
                color: '#333',
                weight: 1.5,
                fillColor: CONFIG.colors.safariArea,
                fillOpacity: 0.7
            }
        });

        console.log("Setting layer order...");
        // Ensure proper z-index ordering
        if (allLayers['landuse']) allLayers['landuse'].bringToFront();
        if (allLayers['rivers']) allLayers['rivers'].bringToFront();
        if (allLayers['roads']) allLayers['roads'].bringToFront();
        if (allLayers['wildlife_corridors']) allLayers['wildlife_corridors'].bringToFront();
        if (allLayers['towns']) allLayers['towns'].bringToFront();
        
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
            if (layerName === 'corridors' || layerName === 'wildlife_corridors') {
                // Calculate length if it's a corridor
                try {
                    const length = calculateLength(feature);
                    content += `<p><strong>Estimated Length:</strong> ${length.toFixed(2)} km</p>`;
                } catch (error) {
                    console.error('Error calculating length:', error);
                }
            } else if (layerName === 'landuse' || layerName === 'communityCa' || layerName === 'matetsiunits') {
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

// Load wildlife corridors with animated arrows
async function loadCorridorsWithArrows() {
    try {
        // First try wildlife_corridors
        let response = await fetch(CONFIG.geojsonPaths.wildlife_corridors);
        if (!response.ok) {
            // If wildlife_corridors fails, try corridors
            response = await fetch(CONFIG.geojsonPaths.corridors);
            if (!response.ok) {
                throw new Error(`Failed to load corridors`);
            }
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
                showFeatureInfo(feature, 'wildlife_corridors');
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
        allLayers['wildlife_corridors'] = corridorsGroup;
        
        // Add to map if checkbox is checked
        const checkbox = document.querySelector('.layer-control[data-layer="wildlife_corridors"]');
        if (checkbox && checkbox.checked) {
            corridorsGroup.addTo(map);
        }
        
    } catch (error) {
        console.error('Error loading corridors with arrows:', error);
        showErrorNotification('Error loading wildlife corridors');
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
        legendHTML += '<h4 style="margin-bottom: 5px; color: #333;">Land Types</h4>';
        
        // Land type legend items
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
        
        // Line Features Legend
        legendHTML += '<div class="legend-section">';
        legendHTML += '<h4 style="margin-bottom: 5px; color: #333;">Features</h4>';
        
        // Line features legend items
        const lineFeatures = [
            { color: CONFIG.colors.wildlifeCorridors, label: 'Wildlife Corridors', thickness: 3 },
            { color: CONFIG.colors.rivers, label: 'Rivers', thickness: 2 },
            { color: CONFIG.colors.roads.category1, label: 'Roads', thickness: 2 }
        ];
        
        lineFeatures.forEach(item => {
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-line" style="border-top: ${item.thickness}px solid ${item.color};"></div>
                    <div class="legend-label">${item.label}</div>
                </div>
            `;
        });
        
        // Point Features Legend
        const pointFeatures = [
            { color: '#FF0000', label: 'Towns', type: 'circle' },
            { color: '#0078FF', label: 'Water Sources', type: 'circle' },
            { color: '#FF7F00', label: 'Places', type: 'circle' }
        ];
        
        pointFeatures.forEach(item => {
            if (item.type === 'circle') {
                legendHTML += `
                    <div class="legend-item">
                        <div class="legend-point" style="background-color: ${item.color}; border-radius: 50%;"></div>
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
        if (allLayers['landscapeboundary'] && map.hasLayer(allLayers['landscapeboundary'])) {
            const data = allLayers['landscapeboundary'].toGeoJSON();
            data.features.forEach(feature => {
                totalArea += calculateArea(feature);
            });
        }
        
        // Calculate total corridor length
        let corridorLength = 0;
        if (allLayers['wildlife_corridors'] && map.hasLayer(allLayers['wildlife_corridors'])) {
            const data = allLayers['wildlife_corridors'].toGeoJSON();
            if (data && data.features) {
                data.features.forEach(feature => {
                    corridorLength += calculateLength(feature);
                });
            }
        }
        
        // Count towns
        let townsCount = 0;
        if (allLayers['towns'] && map.hasLayer(allLayers['towns'])) {
            // Try to get a more accurate count if possible
            const townsData = allLayers['towns'].toGeoJSON();
            if (townsData && townsData.features) {
                townsCount = townsData.features.length;
            }
        }
        
        // Update analysis data object
        analysisData = {
            totalArea,
            corridorLength,
            townsCount
        };
        
        // Update the DOM
        const totalAreaElement = document.getElementById('total-area');
        const corridorLengthElement = document.getElementById('corridor-length');
        const townsCountElement = document.getElementById('towns-count');
        
        if (totalAreaElement) totalAreaElement.textContent = `${totalArea.toFixed(2)} km²`;
        if (corridorLengthElement) corridorLengthElement.textContent = `${corridorLength.toFixed(2)} km`;
        if (townsCountElement) townsCountElement.textContent = townsCount.toString();
        
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
    notification.style