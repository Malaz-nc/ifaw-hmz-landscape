// Simple debug function to log messages to console
function debug(message) {
    console.log(`HMZ-WebGIS: ${message}`);
}

// Set up configuration 
const CONFIG = {
    mapCenter: [-18.5, 26], // Hwange-Matetsi-Zambezi area
    defaultZoom: 8,
    maxZoom: 18,
    minZoom: 5
};

// Store all layers
const allLayers = {};

// Initialize the map when document is ready
document.addEventListener('DOMContentLoaded', function() {
    debug("Document ready, initializing map...");
    initializeMap();
});

// Initialize the map and load layers
function initializeMap() {
    debug("Creating map...");
    
    // Create the map with a global variable so we can access it elsewhere
    window.map = L.map('map', {
        center: CONFIG.mapCenter,
        zoom: CONFIG.defaultZoom,
        maxZoom: CONFIG.maxZoom,
        minZoom: CONFIG.minZoom
    });
    debug("Map created successfully");
    
    // Add base layers
    debug("Setting up basemap layers...");
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.map);
    
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    
    const baseLayers = {
        "OpenStreetMap": osm,
        "Satellite": satellite
    };
    
    // Load GeoJSON layers
    debug("Loading GeoJSON layers...");
    loadLandUseLayer(window.map)
        .then(() => {
            debug("All layers loaded successfully");
            createLegend(window.map);
            
            // Hide loading indicator if it exists
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        })
        .catch(error => {
            console.error("Error loading layers:", error);
            // Update loading indicator to show error if it exists
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.innerHTML = 
                    `Error loading map data: ${error.message}. Check console for details.`;
                loadingIndicator.style.color = 'red';
            }
        });
    
    // Add layer controls
    debug("Initializing map controls...");
    L.control.layers(baseLayers, null, {
        collapsed: false
    }).addTo(window.map);
    
    // Add scale
    L.control.scale({
        imperial: false,
        metric: true,
        position: 'bottomleft'
    }).addTo(window.map);
    
    debug("Map controls initialized");
}

// Function to load the land use layer
function loadLandUseLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/landuse.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Land use data loaded successfully");
                
                // DEBUG: Log the first few features to check their properties
                if (data.features && data.features.length > 0) {
                    console.log("Sample feature properties (first 3 features):");
                    for (let i = 0; i < Math.min(3, data.features.length); i++) {
                        console.log(`Feature ${i}:`, data.features[i].properties);
                    }
                    
                    // Identify property names in the data
                    const firstFeature = data.features[0];
                    if (firstFeature && firstFeature.properties) {
                        console.log("Available property names:", Object.keys(firstFeature.properties));
                    }
                }
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.landUse = L.geoJSON(data, {
                    style: styleLandUse,
                    onEachFeature: onEachFeature
                }).addTo(map);
                
                // Fit the map to the bounds of the GeoJSON layer
                map.fitBounds(allLayers.landUse.getBounds());
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading land use data:", error);
                document.getElementById('map').innerHTML = 
                    `<p class="error-message">Error loading land use data: ${error.message}. Please check the console for details.</p>`;
                reject(error);
            });
    });
}

// Helper function to find the designation property
function findDesignationProperty(properties) {
    // Check for common property names that might contain designation information
    // Listed in order of preference
    const possibleProps = [
        'desig', 'designation', 'type', 'class', 'landuse', 'land_use', 
        'landcover', 'land_cover', 'category', 'zone'
    ];
    
    for (const prop of possibleProps) {
        if (properties[prop] !== undefined && properties[prop] !== null && properties[prop] !== '') {
            return properties[prop];
        }
    }
    
    // If we can't find a specific designation property, try to find anything with "park", "forest", etc.
    for (const prop in properties) {
        const value = String(properties[prop]).toLowerCase();
        if (value.includes('park') || value.includes('forest') || 
            value.includes('safari') || value.includes('conservation') ||
            value.includes('reserve') || value.includes('protected')) {
            return properties[prop];
        }
    }
    
    return 'Unknown';
}

// Function to determine color based on the designation
function getColor(designation) {
    // Default color for Unknown/Resettlement Areas will now be brown
    let color = '#A52A2A'; // Brown for "Resettlement Area/Unknown"
    
    // If no designation provided, return brown (default)
    if (!designation) return color;
    
    // Convert designation to lowercase for case-insensitive comparison
    const desig = String(designation).toLowerCase();
    
    // Debug the designation
    console.log(`Checking designation: "${desig}"`);
    
    // Assign colors based on designation types
    if (desig.includes('national park') || desig.includes('np') || desig.includes('park')) {
        color = '#90EE90'; // Light green for National Parks
        console.log(`  Matched as National Park: ${color}`);
    } else if (desig.includes('forest') || desig.includes('forestry') || 
              desig.includes('state forest') || desig.includes('reserve') ||
              desig.includes('fr ')) {
        color = '#006400'; // Dark green for Forest areas
        console.log(`  Matched as Forest: ${color}`);
    } else if (desig.includes('safari') || desig.includes('game') || 
              desig.includes('hunting') || desig.includes('sa ')) {
        color = '#F5DEB3'; // Beige for Safari areas
        console.log(`  Matched as Safari: ${color}`);
    } else if (desig.includes('community') || desig.includes('conservancy') || 
              desig.includes('concession') || desig.includes('ca ') ||
              desig.includes('ct/') || desig.includes('ct')) {
        color = '#D2B48C'; // Tan/Brown for Community Conservation Areas
        console.log(`  Matched as Community: ${color}`);
    } else {
        console.log(`  No match - using Resettlement Area: ${color}`);
    }
    
    return color;
}

// Style function for GeoJSON features
function styleLandUse(feature) {
    // Find the designation property
    const designation = findDesignationProperty(feature.properties);
    
    // Get color based on designation
    const color = getColor(designation);
    
    // Debug log the color assignment
    console.log(`Styling feature: "${designation}" with color: ${color}`);
    
    return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    };
}

// Function to add interactivity to each feature
function onEachFeature(feature, layer) {
    // Create a popup with feature information
    if (feature.properties) {
        // Find the most likely name and designation properties
        const designation = findDesignationProperty(feature.properties);
        let name = feature.properties.name || feature.properties.Name || 
                  feature.properties.NAME || feature.properties.title || 
                  feature.properties.TITLE || '';
        
        let popupContent = '<div class="popup-content">';
        
        // Add designation if available
        if (designation) {
            // If the designation is "Unknown", display "Resettlement Area" instead
            const displayDesignation = designation === 'Unknown' ? 'Resettlement Area' : designation;
            popupContent += `<strong>Designation:</strong> ${displayDesignation}<br>`;
        }
        
        // Add name if available
        if (name) {
            popupContent += `<strong>Name:</strong> ${name}<br>`;
        }
        
        // Add all other properties that might be useful
        for (const prop in feature.properties) {
            // Skip properties we've already included or that are empty
            if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
            if (prop === 'name' || prop === 'Name' || prop === 'NAME' || 
                prop === 'desig' || prop === 'designation' || prop === 'type') continue;
            
            const value = feature.properties[prop];
            if (value !== null && value !== undefined && value !== '') {
                popupContent += `<strong>${prop}:</strong> ${value}<br>`;
            }
        }
        
        // Close the popup content div
        popupContent += '</div>';
        
        // Bind popup to layer
        layer.bindPopup(popupContent);
    }
    
    // Add hover effects
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// Highlight feature function
function highlightFeature(e) {
    const layer = e.target;
    
    layer.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.9
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

// Reset highlight function
function resetHighlight(e) {
    if (allLayers.landUse) {
        allLayers.landUse.resetStyle(e.target);
    }
}

// Zoom to feature function
function zoomToFeature(e) {
    window.map.fitBounds(e.target.getBounds());
}

// Create a legend for the map
function createLegend(map) {
    try {
        const legend = L.control({ position: 'bottomright' });
        
        legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'info legend');
            const categories = [
                { name: 'National Park', value: 'national park' },
                { name: 'Forest/State Forest', value: 'forest' },
                { name: 'Safari Area', value: 'safari' },
                { name: 'Community Conservation', value: 'community' },
                { name: 'Resettlement Area', value: '' } // Changed from "Other" to "Resettlement Area"
            ];
            
            div.innerHTML = '<h4>Land Designation</h4>';
            
            // Loop through our categories and generate a label with a colored square for each
            for (let i = 0; i < categories.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(categories[i].value) + '"></i> ' +
                    categories[i].name + '<br>';
            }
            
            return div;
        };
        
        legend.addTo(map);
        
        return legend;
    } catch (error) {
        console.error("Error creating legend:", error);
    }
}