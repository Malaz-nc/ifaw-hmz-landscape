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
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 12px !important;
            font-weight: bold !important;
            color: #333 !important;
            text-shadow: 2px 2px 3px white, -2px -2px 3px white, 2px -2px 3px white, -2px 2px 3px white !important;
            pointer-events: none !important;
        }
        .place-label {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 11px !important;
            font-weight: bold !important;
            color: #000 !important;
            text-shadow: 2px 2px 3px white, -2px -2px 3px white, 2px -2px 3px white, -2px 2px 3px white !important;
            pointer-events: none !important;
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
        loadPlacesLayer(window.map),
        loadProjectSitesLayer(window.map),
        loadBufferwardsLayer(window.map),
        loadCorridorsLayer(window.map),
        loadWildlifeCorridorsLayer(window.map),
        loadWatersourcesLayer(window.map)
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
                    onEachFeature: onEachLandUseFeature  // Use specific function for land use features
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
                    onEachFeature: onEachLandUseFeature  // Use the same labeling function as land use
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
                    onEachFeature: onEachLandUseFeature  // Use the same labeling function as land use
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
                            
                            // Add district name as label
                            let name = feature.properties.name || feature.properties.Name || 
                                      feature.properties.NAME || feature.properties.DISTRICT || 
                                      feature.properties.District || '';
                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: true,
                                    direction: 'center',
                                    className: 'landuse-label'
                                });
                            }
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
                            
                            // REMOVED river name labels as requested
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
                            radius: 1.5, // Reduced from 4 to 1.5 as requested
                            fillColor: "#000", // Changed to black as requested
                            color: "#000",  // Changed to black as requested
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
                            
                            // Add label for places using the "Full Name" property if available
                            let name = feature.properties["Full Name"] || feature.properties.name || 
                                      feature.properties.Name || feature.properties.NAME || 
                                      feature.properties.title || feature.properties.TITLE || '';
                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: true,
                                    direction: 'right',
                                    offset: [10, 0], // Add offset to prevent overlap with marker
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

// Function to load the Project Sites layer
function loadProjectSitesLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/projectsites.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Project Sites data loaded successfully");
                
                // Define a diamond icon for project sites
                const projectIcon = L.divIcon({
                    className: 'project-site-icon',
                    html: '<div style="width: 10px; height: 10px; background-color: transparent; border: 2px solid #FF5722; transform: rotate(45deg);"></div>',
                    iconSize: [10, 10],
                    iconAnchor: [5, 5]
                });
                
                // Add GeoJSON to map with point markers
                allLayers.projectSites = L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        // Use diamond shape with no fill as requested
                        return L.marker(latlng, {
                            icon: projectIcon,
                            opacity: 0.9
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        // Add popup
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
                            
                            // Add label if name available
                            let name = feature.properties.name || feature.properties.Name || 
                                      feature.properties.NAME || feature.properties.title || 
                                      feature.properties.TITLE || feature.properties.Project || '';
                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: false, // Show only on hover
                                    direction: 'right',
                                    offset: [10, 0],
                                    className: 'place-label'
                                });
                            }
                        }
                    }
                });
                
                // Add to overlay control but don't add to map by default
                overlayLayers["Project Sites"] = allLayers.projectSites;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Project Sites data:", error);
                resolve();
            });
    });
}

// Function to load the Bufferwards layer
function loadBufferwardsLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/bufferwards.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Bufferwards data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.bufferwards = L.geoJSON(data, {
                    style: {
                        color: '#9C27B0', // Purple color
                        weight: 2,
                        opacity: 0.7,
                        fillOpacity: 0.2,
                        fillColor: '#CE93D8'
                    },
                    onEachFeature: function(feature, layer) {
                        // Add popup with properties
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
                            
                            // Add label if name available
                            let name = feature.properties.name || feature.properties.Name || 
                                      feature.properties.NAME || feature.properties.Corridor || '';
                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: true,
                                    direction: 'center',
                                    className: 'landuse-label'
                                });
                            }
                        }
                        
                        // Add click handler for zooming
                        layer.on({
                            click: zoomToFeature
                        });
                    }
                });
                
                // Add to overlay control but don't add to map by default
                overlayLayers["Wildlife Corridors"] = allLayers.wildlifeCorridors;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Wildlife Corridors data:", error);
                resolve();
            });
    });
}prop];
                                if (value !== null && value !== undefined && value !== '') {
                                    if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
                                    popupContent += `<strong>${prop}:</strong> ${value}<br>`;
                                }
                            }
                            
                            popupContent += '</div>';
                            layer.bindPopup(popupContent);
                            
                            // Add label if name available
                            let name = feature.properties.name || feature.properties.Name || 
                                      feature.properties.NAME || feature.properties.Ward || '';
                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: true,
                                    direction: 'center',
                                    className: 'landuse-label'
                                });
                            }
                        }
                        
                        // Add click handler for zooming
                        layer.on({
                            click: zoomToFeature
                        });
                    }
                });
                
                // Add to overlay control but don't add to map by default
                overlayLayers["Buffer Wards"] = allLayers.bufferwards;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Bufferwards data:", error);
                resolve();
            });
    });
}

// Function to load the Corridors layer
function loadCorridorsLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/corridors.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Corridors data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.corridors = L.geoJSON(data, {
                    style: {
                        color: '#4CAF50', // Green color
                        weight: 3,
                        opacity: 0.7,
                        fillOpacity: 0.3,
                        fillColor: '#A5D6A7',
                        dashArray: '5, 5'
                    },
                    onEachFeature: function(feature, layer) {
                        // Add popup with properties
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
                            
                            // Add label if name available
                            let name = feature.properties.name || feature.properties.Name || 
                                      feature.properties.NAME || feature.properties.Corridor || '';
                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: true,
                                    direction: 'center',
                                    className: 'landuse-label'
                                });
                            }
                        }
                        
                        // Add click handler for zooming
                        layer.on({
                            click: zoomToFeature
                        });
                    }
                });
                
                // Add to overlay control but don't add to map by default
                overlayLayers["Corridors"] = allLayers.corridors;
                
                resolve();
            })
            .catch(error => {
                console.error("Error loading Corridors data:", error);
                resolve();
            });
    });
}

// Function to load the Wildlife Corridors layer
function loadWildlifeCorridorsLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/wildlife_corridors.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                debug("Wildlife Corridors data loaded successfully");
                
                // Add GeoJSON to map with styling and interactivity
                allLayers.wildlifeCorridors = L.geoJSON(data, {
                    style: {
                        color: '#FF9800', // Orange color
                        weight: 3,
                        opacity: 0.8,
                        fillOpacity: 0.3,
                        fillColor: '#FFCC80',
                        dashArray: '10, 5'
                    },
                    onEachFeature: function(feature, layer) {
                        // Add popup with properties
                        if (feature.properties) {
                            let popupContent = '<div class="popup-content">';
                            
                            for (const prop in feature.properties) {
                                const value = feature.properties[