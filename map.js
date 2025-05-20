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
                    onEachFeature: onEachLandUseFeature   // Use specific function for land use features
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
                    onEachFeature: onEachLandUseFeature   // Use the same labeling function as land use
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
                    onEachFeature: onEachLandUseFeature   // Use the same labeling function as land use
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

                            // Ensure no permanent tooltip is set for rivers by default
                            // if (feature.properties && feature.properties.name) {
                            //     layer.bindTooltip(feature.properties.name, {
                            //         permanent: true,
                            //         direction: 'bottom',
                            //         className: 'river-label' // You might need to define CSS for this
                            //     });
                            // }
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
                            radius: 2, // Reduced from 4 to 2 as requested
                            fillColor: "#000", // Changed to black as requested
                            color: "#000", // Black border
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

                            // Look specifically for FULL_NAME property as requested
                            let name = feature.properties.FULL_NAME || feature.properties.full_name ||
                                        feature.properties.name || feature.properties.Name ||
                                        feature.properties.NAME || feature.properties.title ||
                                        feature.properties.TITLE || '';

                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: true, // Make labels permanent by default
                                    direction: 'right',
                                    offset: [10, 0], // Add offset to prevent overlap with marker
                                    className: 'place-label'
                                });
                            }
                        }
                    }
                }).addTo(map); // Add to map by default

                // Add to overlay control
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
    debug(`Checking designation: "${desig}"`);

    // Assign colors based on designation types
    if (desig.includes('national park') || desig.includes('np') || desig.includes('park')) {
        color = '#90EE90'; // Light green for National Parks
        debug(`  Matched as National Park: ${color}`);
    } else if (desig.includes('forest') || desig.includes('forestry') ||
               desig.includes('state forest') || desig.includes('reserve') ||
               desig.includes('fr ')) {
        color = '#006400'; // Dark green for Forest areas
        debug(`  Matched as Forest: ${color}`);
    } else if (desig.includes('safari') || desig.includes('game') ||
               desig.includes('hunting') || desig.includes('sa ')) {
        color = '#F5DEB3'; // Beige for Safari areas
        debug(`  Matched as Safari: ${color}`);
    } else if (desig.includes('community') || desig.includes('conservancy') ||
               desig.includes('concession') || desig.includes('ca ') ||
               desig.includes('ct/') || desig.includes('ct')) {
        color = '#D2B48C'; // Tan/Brown for Community Conservation Areas
        debug(`  Matched as Community: ${color}`);
    } else {
        debug(`  No match - using Resettlement Area: ${color}`);
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

// Specific function for land use features to ensure proper labeling
function onEachLandUseFeature(feature, layer) {
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

        // Add label for land use - ENSURE THIS WORKS BY MAKING LABEL PERMANENT
        if (name) {
            // Use a timeout to ensure labels are applied after the map is fully loaded
            setTimeout(() => {
                try {
                    // Get centroid for better label placement
                    let centroid;
                    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                        // For polygons, use the layer's getBounds method to find the center
                        const bounds = layer.getBounds();
                        centroid = bounds.getCenter();
                    } else {
                        // For other geometries, just use the layer's coordinates
                        centroid = layer.getLatLng();
                    }

                    // Create a marker at the centroid with the label
                    const labelMarker = L.marker(centroid, {
                        icon: L.divIcon({
                            html: name,
                            className: 'landuse-label',
                            iconSize: [100, 20],
                            iconAnchor: [50, 10]
                        })
                    }).addTo(window.map);

                    // Store the label marker reference to allow toggling it with the layer
                    layer.labelMarker = labelMarker;
                } catch (e) {
                    console.error("Error adding label:", e);
                }
            }, 500);
        }
    }

    // Only add click handler for zooming, no mouseover effects
    layer.on({
        click: zoomToFeature
    });
}

// Function to add interactivity to general features (without labels)
function onEachFeature(feature, layer) {
    // Create a popup with feature information
    if (feature.properties) {
        let popupContent = '<div class="popup-content">';

        // Loop through all properties and add them to the popup
        for (const prop in feature.properties) {
            const value = feature.properties[prop];
            if (value !== null && value !== undefined && value !== '') {
                // Skip some properties that aren't interesting for display
                if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;

                popupContent += `<strong>${prop}:</strong> ${value}<br>`;
            }
        }

        // Close the popup content div
        popupContent += '</div>';

        // Bind popup to layer
        layer.bindPopup(popupContent);
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

// Create legend function
function createLegend(map) {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const designations = [
            { name: 'National Park', color: '#90EE90' },
            { name: 'Forest Area', color: '#006400' },
            { name: 'Safari Area', color: '#F5DEB3' },
            { name: 'Community Conservation Area', color: '#D2B48C' },
            { name: 'Resettlement Area/Unknown', color: '#A52A2A' }
        ];

        div.innerHTML += '<h4>Legend</h4>';
        for (let i = 0; i < designations.length; i++) {
            div.innerHTML +=
                '<i style="background:' + designations[i].color + '"></i> ' +
                designations[i].name + '<br>';
        }

        return div;
    };

    legend.addTo(map);
}