// Simple debug function to log messages to console
function debug(message) {
    console.log(`DEBUG: ${message}`);
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
    
    // Create the map
    const map = L.map('map', {
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
    }).addTo(map);
    
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    
    const baseLayers = {
        "OpenStreetMap": osm,
        "Satellite": satellite
    };
    
    // Load GeoJSON layers
    debug("Loading GeoJSON layers...");
    loadLandUseLayer(map)
        .then(() => {
            debug("All layers loaded successfully");
            createLegend(map);
            
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
    }).addTo(map);
    
    // Add scale
    L.control.scale({
        imperial: false,
        metric: true,
        position: 'bottomleft'
    }).addTo(map);
    
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
                
                // DEBUG: Log the first feature to check its properties
                if (data.features && data.features.length > 0) {
                    console.log("Sample feature properties:", data.features[0].properties);
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

// Function to determine color based on the designation
function getColor(designation) {
    // Default color if designation doesn't match any case
    let color = '#AAAAAA'; // Gray for "Other"
    
    // If no designation provided, return default
    if (!designation) return color;
    
    // Convert designation to lowercase for case-insensitive comparison
    const desig = designation.toLowerCase();
    
    // Assign colors based on designation types
    if (desig.includes('national park')) {
        color = '#90EE90'; // Light green for National Parks
    } else if (desig.includes('forest') || desig.includes('forestry') || desig.includes('state forest') || desig.includes('reserve')) {
        color = '#006400'; // Dark green for Forest areas
    } else if (desig.includes('safari') || desig.includes('game') || desig.includes('hunting')) {
        color = '#F5DEB3'; // Beige for Safari areas
    } else if (desig.includes('community') || desig.includes('conservancy') || desig.includes('concession')) {
        color = '#D2B48C'; // Tan/Brown for Community Conservation Areas
    }
    
    return color;
}

// Style function for GeoJSON features
function styleLandUse(feature) {
    // Log what property we're using for designation
    const desig = feature.properties.desig || feature.properties.designation || feature.properties.type || 'Unknown';
    const color = getColor(desig);
    
    // Debug log the color assignment
    console.log(`Styling feature: "${desig}" with color: ${color}`);
    
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
        // Log the feature properties to debug
        console.log('Feature properties:', feature.properties);
        
        let popupContent = '<div class="popup-content">';
        
        // Add designation if available (check multiple possible property names)
        const designation = feature.properties.desig || feature.properties.designation || feature.properties.type;
        if (designation) {
            popupContent += `<strong>Designation:</strong> ${designation}<br>`;
        }
        
        // Add name if available
        if (feature.properties.name) {
            popupContent += `<strong>Name:</strong> ${feature.properties.name}<br>`;
        }
        
        // Add any other important properties that might be in the dataset
        // This will show any property that isn't 'desig', 'designation', 'type', or 'name'
        for (const prop in feature.properties) {
            if (!['desig', 'designation', 'type', 'name'].includes(prop) && 
                feature.properties[prop] !== null && 
                feature.properties[prop] !== undefined &&
                feature.properties[prop] !== '') {
                popupContent += `<strong>${prop}:</strong> ${feature.properties[prop]}<br>`;
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
    map.fitBounds(e.target.getBounds());
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
                { name: 'Other', value: '' }
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