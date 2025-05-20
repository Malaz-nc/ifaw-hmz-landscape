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
const overlayLayers = {}; // For layer control

// Initialize the map when document is ready
document.addEventListener('DOMContentLoaded', function() {
    debug("Document ready, initializing map...");
    
    // Add CSS for labels
    const style = document.createElement('style');
    style.innerHTML = `
        .landuse-label {
            background: none;
            border: none;
            box-shadow: none;
            font-size: 10px;
            font-weight: bold;
            color: #333;
            text-shadow: 1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white;
        }
        .place-label {
            background: none;
            border: none;
            box-shadow: none;
            font-size: 10px;
            font-weight: bold;
            color: #000;
            text-shadow: 1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white;
        }
    `;
    document.head.appendChild(style);
    
    initializeMap();
});

// Initialize the map and load layers
function initializeMap() {
    debug("Creating map...");
    
    // Create the map with a global variable so we can access it elsewhere
    window.map = L.map('map', {
        center: [-18.86, 26.31], // Centered more on Hwange National Park
        zoom: 9, // Closer zoom to focus on the area
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
    
    const terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });
    
    const googleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
    });
    
    const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });
    
    const baseLayers = {
        "OpenStreetMap": osm,
        "Satellite": satellite,
        "Terrain": terrain,
        "Google Terrain": googleTerrain,
        "Carto Light": cartoLight
    };
    
    // Load all GeoJSON layers
    debug("Loading GeoJSON layers...");
    Promise.all([
        loadLandUseLayer(window.map),
        loadCommunityCALayer(window.map),
        loadMatetsiUnitsLayer(window.map),
        loadLandscapeBoundaryLayer(window.map),
        loadDistrictBoundariesLayer(window.map),
        loadRiversLayer(window.map),
        loadRoadsLayer(window.map),
        // loadTownsLayer(window.map), // Removed towns layer
        loadPlacesLayer(window.map)
    ])
    .then(() => {
        debug("All layers loaded successfully");
        createLegend(window.map);
        
        // Set up layer control with overlays
        L.control.layers(baseLayers, overlayLayers, {
            collapsed: false
        }).addTo(window.map);
        
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
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.landUse = L.geoJSON(data, {
                    style: styleLandUse,
                    onEachFeature: onEachFeature
                }).addTo(map);
                
                // Add to overlay control
                overlayLayers["Land Use"] = allLayers.landUse;
                
                // Fit the map to the bounds of the GeoJSON layer
                map.fitBounds(allLayers.landUse.getBounds());
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading land use data:", error);
                reject(error);
            });
    });
}

// Function to load the Community CA layer
function loadCommunityCALayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/communityCA.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Community CA data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.communityCA = L.geoJSON(data, {
                    style: styleCommunityCA,
                    onEachFeature: onEachFeature
                }).addTo(map);
                
                // Add to overlay control
                overlayLayers["Community Conservation Areas"] = allLayers.communityCA;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Community CA data:", error);
                // Don't reject, just resolve with a warning to allow other layers to load
                resolve();
            });
    });
}

// Function to load the Matetsi Units layer
function loadMatetsiUnitsLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/matetsiunits.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Matetsi Units data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.matetsiUnits = L.geoJSON(data, {
                    style: styleMatetsiUnits,
                    onEachFeature: onEachFeature
                }).addTo(map);
                
                // Add to overlay control
                overlayLayers["Matetsi Units"] = allLayers.matetsiUnits;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Matetsi Units data:", error);
                // Don't reject, just resolve with a warning to allow other layers to load
                resolve();
            });
    });
}

// Function to load the Landscape Boundary layer
function loadLandscapeBoundaryLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/landscapeboundary.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Landscape Boundary data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.landscapeBoundary = L.geoJSON(data, {
                    style: {
                        color: '#FF0000', // Changed to red color
                        weight: 4, // Thicker line (increased from 2)
                        opacity: 1,
                        fillOpacity: 0
                    },
                    onEachFeature: function(feature, layer) {
                        // Only add popup, no mouseover effects
                        if (feature.properties) {
                            let popupContent = '<div class="popup-content">';
                            
                            for (const prop in feature.properties) {
                                const value = feature.properties[prop];
                                if (value !== null && value !== undefined && value !== '') {
                                    if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
                                    popupContent += `<strong>${prop}:</strong> ${value}<br>`;
                                }
                            }
                            
                            popupContent += '</div>';
                            layer.bindPopup(popupContent);
                        }
                        
                        // Only add click handler for zooming
                        layer.on({
                            click: zoomToFeature
                        });
                    }
                }).addTo(map);
                
                // Add to overlay control
                overlayLayers["Landscape Boundary"] = allLayers.landscapeBoundary;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Landscape Boundary data:", error);
                resolve();
            });
    });
}

// Function to load the District Boundaries layer
function loadDistrictBoundariesLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/Districtboundaries.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("District Boundaries data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.districtBoundaries = L.geoJSON(data, {
                    style: {
                        color: '#666',
                        weight: 3, // Thicker line (increased from 1.5)
                        opacity: 0.8,
                        fillOpacity: 0,
                        dashArray: '5, 5'
                    },
                    onEachFeature: function(feature, layer) {
                        // Only add popup, no mouseover effects
                        if (feature.properties) {
                            let popupContent = '<div class="popup-content">';
                            
                            for (const prop in feature.properties) {
                                const value = feature.properties[prop];
                                if (value !== null && value !== undefined && value !== '') {
                                    if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
                                    popupContent += `<strong>${prop}:</strong> ${value}<br>`;
                                }
                            }
                            
                            popupContent += '</div>';
                            layer.bindPopup(popupContent);
                        }
                        
                        // Only add click handler for zooming
                        layer.on({
                            click: zoomToFeature
                        });
                    }
                });
                
                // Add to overlay control but don't add to map by default
                overlayLayers["District Boundaries"] = allLayers.districtBoundaries;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading District Boundaries data:", error);
                resolve();
            });
    });
}

// Function to load the Rivers layer
function loadRiversLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/rivers.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Rivers data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.rivers = L.geoJSON(data, {
                    style: {
                        color: '#87CEFA', // Light blue color
                        weight: 1.5,
                        opacity: 0.6 // Changed from 0.4 to 0.6 (60%)
                    },
                    onEachFeature: function(feature, layer) {
                        // Only add popup, no mouseover effects
                        if (feature.properties) {
                            let popupContent = '<div class="popup-content">';
                            
                            for (const prop in feature.properties) {
                                const value = feature.properties[prop];
                                if (value !== null && value !== undefined && value !== '') {
                                    if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
                                    popupContent += `<strong>${prop}:</strong> ${value}<br>`;
                                }
                            }
                            
                            popupContent += '</div>';
                            layer.bindPopup(popupContent);
                        }
                        
                        // Only add click handler for zooming
                        layer.on({
                            click: zoomToFeature
                        });
                    }
                });
                
                // Add to overlay control but don't add to map by default
                overlayLayers["Rivers"] = allLayers.rivers;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Rivers data:", error);
                resolve();
            });
    });
}

// Function to load the Roads layer
function loadRoadsLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/roads.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Roads data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.roads = L.geoJSON(data, {
                    style: {
                        color: '#8B4513', // Brown color
                        weight: 1.5,
                        opacity: 0.6 // Changed from 0.4 to 0.6 (60%)
                    },
                    onEachFeature: function(feature, layer) {
                        // Only add popup, no mouseover effects
                        if (feature.properties) {
                            let popupContent = '<div class="popup-content">';
                            
                            for (const prop in feature.properties) {
                                const value = feature.properties[prop];
                                if (value !== null && value !== undefined && value !== '') {
                                    if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
                                    popupContent += `<strong>${prop}:</strong> ${value}<br>`;
                                }
                            }
                            
                            popupContent += '</div>';
                            layer.bindPopup(popupContent);
                        }
                        
                        // Only add click handler for zooming
                        layer.on({
                            click: zoomToFeature
                        });
                    }
                });
                
                // Add to overlay control but don't add to map by default
                overlayLayers["Roads"] = allLayers.roads;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Roads data:", error);
                resolve();
            });
    });
}

// Function to load the Places layer
function loadPlacesLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/places.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Places data loaded successfully");
                
                // Add GeoJSON to map with point markers
                allLayers.places = L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 2, // Changed from 1 to 2
                            fillColor: "#FFA500",
                            color: "#000",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        // Only add popup, no mouseover effects
                        if (feature.properties) {
                            let popupContent = '<div class="popup-content">';
                            
                            for (const prop in feature.properties) {
                                const value = feature.properties[prop];
                                if (value !== null && value !== undefined && value !== '') {
                                    popupContent += `<strong>${prop}:</strong> ${value}<br>`;
                                }
                            }
                            
                            popupContent += '</div>';
                            layer.bindPopup(popupContent);
                            
                            // Add label for places
                            let name = feature.properties.name || feature.properties.Name || 
                                      feature.properties.NAME || feature.properties.title || 
                                      feature.properties.TITLE || '';
                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: true,
                                    direction: 'right',
                                    className: 'place-label'
                                });
                            }
                        }
                    }
                });
                
                // Add to overlay control but don't add to map by default
                overlayLayers["Places"] = allLayers.places;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Places data:", error);
                resolve();
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
    // Default color for Unknown/Resettlement Areas is brown
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

// Style function for Land Use GeoJSON features
function styleLandUse(feature) {
    // Find the designation property
    const designation = findDesignationProperty(feature.properties);
    
    // Get color based on designation
    const color = getColor(designation);
    
    return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    };
}

// Style function for Community CA features - specific brown color
function styleCommunityCA(feature) {
    return {
        fillColor: '#8B4513', // Dark brown for Community CA
        weight: 1,
        opacity: 1,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.6
    };
}

// Style function for Matetsi Units features - beige color for Safari
function styleMatetsiUnits(feature) {
    return {
        fillColor: '#F5DEB3', // Beige for Safari Areas
        weight: 1,
        opacity: 1,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.6
    };
}

// Function to add interactivity to each feature - removed hover effects
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
        
        // Add label for land use
        if (name) {
            layer.bindTooltip(name, {
                permanent: true,
                direction: 'center',
                className: 'landuse-label'
            });
        }
    }
    
    // Only add click handler for zooming, no mouseover effects
    layer.on({
        click: zoomToFeature
    });
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
                { name: 'Community Conservation', value: '8B4513', isHex: true },
                { name: 'Resettlement Area', value: '' }
            ];
            
            div.innerHTML = '<h4>Land Designation</h4>';
            
            // Loop through our categories and generate a label with a colored square for each
            for (let i = 0; i < categories.length; i++) {
                const color = categories[i].isHex ? 
                              categories[i].value : 
                              getColor(categories[i].value);
                div.innerHTML +=
                    '<i style="background:' + (categories[i].isHex ? '#' + categories[i].value : color) + '"></i> ' +
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