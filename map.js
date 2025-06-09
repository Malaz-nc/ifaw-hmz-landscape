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
        .matetsi-label {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 11px !important;
            font-weight: bold !important;
            color: #FF8C00 !important;
            text-shadow: 2px 2px 3px white, -2px -2px 3px white, 2px -2px 3px white, -2px 2px 3px white !important;
            pointer-events: none !important;
        }
        .intersected-label {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 11px !important;
            font-weight: bold !important;
            color: #333 !important;
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

    // Create the map with the correct container ID
    window.map = L.map('landuse-map', {
        center: [-18.86, 26.31],
        zoom: 9,
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
        attribution: 'Tiles &copy; Esri'
    });

    const terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; OpenStreetMap contributors'
    });

    const baseLayers = {
        "OpenStreetMap": osm,
        "Satellite": satellite,
        "Terrain": terrain
    };

    // Load all GeoJSON layers
    debug("Loading GeoJSON layers...");
    Promise.all([
        loadLandUseLayer(window.map),
        loadCommunityCALayer(window.map),
        loadMatetsiUnitsLayer(window.map),
        loadIntersectedLayer(window.map),
        loadLandscapeBoundaryLayer(window.map),
        loadDistrictBoundariesLayer(window.map),
        loadRiversLayer(window.map),
        loadRoadsLayer(window.map),
        loadPlacesLayer(window.map),
        loadWaterSourcesLayer(window.map),
        loadProjectSitesLayer(window.map),
        loadBufferWardsLayer(window.map),
        loadElephantMovementLayer(window.map)
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
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.innerHTML = 'Error loading map data: ' + error.message;
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

// Helper functions
function findDesignationProperty(properties) {
    const possibleProps = ['desig', 'designation', 'type', 'class', 'landuse', 'land_use'];
    
    for (const prop of possibleProps) {
        if (properties[prop] !== undefined && properties[prop] !== null && properties[prop] !== '') {
            return properties[prop];
        }
    }
    return 'Unknown';
}

function findLandTypeProperty(properties) {
    const possibleProps = ['landtype', 'land_type', 'LANDTYPE', 'LAND_TYPE', 'type', 'Type', 'TYPE'];
    
    for (const prop of possibleProps) {
        if (properties[prop] !== undefined && properties[prop] !== null && properties[prop] !== '') {
            return properties[prop];
        }
    }
    return 'Unknown';
}

function getColor(designation) {
    let color = '#A52A2A'; // Brown for "Resettlement Area/Unknown"

    if (!designation) return color;

    const desig = String(designation).toLowerCase();

    if (desig.includes('national park') || desig.includes('np') || desig.includes('park')) {
        color = '#90EE90'; // Light green for National Parks
    } else if (desig.includes('forest') || desig.includes('forestry') || desig.includes('reserve')) {
        color = '#006400'; // Dark green for Forest areas
    } else if (desig.includes('safari') || desig.includes('game') || desig.includes('hunting')) {
        color = '#F5DEB3'; // Beige for Safari areas
    } else if (desig.includes('community') || desig.includes('conservancy')) {
        color = '#D2B48C'; // Tan/Brown for Community Conservation Areas
    }

    return color;
}

function getLandTypeColor(landtype) {
    let color = '#CCCCCC'; // Light gray for unknown

    if (!landtype) return color;

    const type = String(landtype).toLowerCase();

    if (type.includes('forest') || type.includes('woodland') || type.includes('tree')) {
        color = '#006400'; // Dark green for forest land
    } else if (type.includes('large scale') || type.includes('commercial') || type.includes('farming')) {
        color = '#808080'; // Grey color for large scale commercial farming
    } else if (type.includes('communal') || type.includes('community')) {
        color = '#D2B48C'; // Same color as community conservation areas
    }

    return color;
}

// Style functions
function styleLandUse(feature) {
    const designation = findDesignationProperty(feature.properties);
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

function styleIntersected(feature) {
    const landtype = findLandTypeProperty(feature.properties);
    const color = getLandTypeColor(landtype);

    return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    };
}

// Feature interaction functions
function onEachLandUseFeature(feature, layer) {
    if (feature.properties) {
        const designation = findDesignationProperty(feature.properties);
        let name = feature.properties.name || feature.properties.Name || feature.properties.NAME || '';

        let popupContent = '<div class="popup-content">';
        
        if (designation) {
            const displayDesignation = designation === 'Unknown' ? 'Resettlement Area' : designation;
            popupContent += '<strong>Designation:</strong> ' + displayDesignation + '<br>';
        }

        if (name) {
            popupContent += '<strong>Name:</strong> ' + name + '<br>';
        }

        for (const prop in feature.properties) {
            if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
            if (prop === 'name' || prop === 'Name' || prop === 'NAME' || prop === 'desig' || prop === 'designation' || prop === 'type') continue;

            const value = feature.properties[prop];
            if (value !== null && value !== undefined && value !== '') {
                popupContent += '<strong>' + prop + ':</strong> ' + value + '<br>';
            }
        }

        popupContent += '</div>';
        layer.bindPopup(popupContent);

        if (name) {
            setTimeout(() => {
                try {
                    let centroid;
                    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                        const bounds = layer.getBounds();
                        centroid = bounds.getCenter();
                    } else {
                        centroid = layer.getLatLng();
                    }

                    const labelMarker = L.marker(centroid, {
                        icon: L.divIcon({
                            html: name,
                            className: 'landuse-label',
                            iconSize: [100, 20],
                            iconAnchor: [50, 10]
                        })
                    }).addTo(window.map);

                    layer.labelMarker = labelMarker;
                } catch (e) {
                    console.error("Error adding label:", e);
                }
            }, 500);
        }
    }

    layer.on({
        click: zoomToFeature
    });
}

function onEachIntersectedFeature(feature, layer) {
    if (feature.properties) {
        const landtype = findLandTypeProperty(feature.properties);
        let name = feature.properties.name || feature.properties.Name || feature.properties.NAME || '';

        let popupContent = '<div class="popup-content">';

        if (landtype) {
            const displayLandtype = landtype === 'Unknown' ? 'Unclassified Land' : landtype;
            popupContent += '<strong>Land Type:</strong> ' + displayLandtype + '<br>';
        }

        if (name) {
            popupContent += '<strong>Name:</strong> ' + name + '<br>';
        }

        for (const prop in feature.properties) {
            if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
            if (prop === 'name' || prop === 'Name' || prop === 'NAME' || prop === 'landtype' || prop === 'land_type' || prop === 'type') continue;

            const value = feature.properties[prop];
            if (value !== null && value !== undefined && value !== '') {
                popupContent += '<strong>' + prop + ':</strong> ' + value + '<br>';
            }
        }

        popupContent += '</div>';
        layer.bindPopup(popupContent);

        if (name) {
            setTimeout(() => {
                try {
                    let centroid;
                    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                        const bounds = layer.getBounds();
                        centroid = bounds.getCenter();
                    } else {
                        centroid = layer.getLatLng();
                    }

                    const labelMarker = L.marker(centroid, {
                        icon: L.divIcon({
                            html: name,
                            className: 'intersected-label',
                            iconSize: [100, 20],
                            iconAnchor: [50, 10]
                        })
                    }).addTo(window.map);

                    layer.labelMarker = labelMarker;
                } catch (e) {
                    console.error("Error adding intersected label:", e);
                }
            }, 600);
        }
    }

    layer.on({
        click: zoomToFeature
    });
}

function onEachFeature(feature, layer) {
    if (feature.properties) {
        let popupContent = '<div class="popup-content">';

        for (const prop in feature.properties) {
            const value = feature.properties[prop];
            if (value !== null && value !== undefined && value !== '') {
                if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
                popupContent += '<strong>' + prop + ':</strong> ' + value + '<br>';
            }
        }

        popupContent += '</div>';
        layer.bindPopup(popupContent);
    }

    layer.on({
        click: zoomToFeature
    });
}

function zoomToFeature(e) {
    window.map.fitBounds(e.target.getBounds());
}

// Layer loading functions
function loadLandUseLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/landuse.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Land use data loaded successfully");

                allLayers.landUse = L.geoJSON(data, {
                    style: styleLandUse,
                    onEachFeature: onEachLandUseFeature
                }).addTo(map);

                overlayLayers["Land Use"] = allLayers.landUse;
                map.fitBounds(allLayers.landUse.getBounds());
                resolve();
            })
            .catch(error => {
                console.error("Error loading land use data:", error);
                reject(error);
            });
    });
}

function loadCommunityCALayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/communityCA.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Community CA data loaded successfully");

                allLayers.communityCA = L.geoJSON(data, {
                    style: {
                        fillColor: '#D2B48C',
                        weight: 1,
                        opacity: 1,
                        color: '#666',
                        dashArray: '',
                        fillOpacity: 0.6
                    },
                    onEachFeature: onEachLandUseFeature
                }).addTo(map);

                overlayLayers["Community Conservation Areas"] = allLayers.communityCA;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Community CA data:", error);
                resolve();
            });
    });
}

function loadMatetsiUnitsLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/matetsiunits.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Matetsi Units data loaded successfully");

                allLayers.matetsiUnits = L.geoJSON(data, {
                    style: {
                        color: '#FF8C00',
                        weight: 3,
                        opacity: 0.8
                    },
                    onEachFeature: function(feature, layer) {
                        if (feature.properties) {
                            let popupContent = '<div class="popup-content">';

                            for (const prop in feature.properties) {
                                const value = feature.properties[prop];
                                if (value !== null && value !== undefined && value !== '') {
                                    if (['shape_leng', 'shape_area', 'SHAPE_Leng', 'SHAPE_Area'].includes(prop)) continue;
                                    popupContent += '<strong>' + prop + ':</strong> ' + value + '<br>';
                                }
                            }

                            popupContent += '</div>';
                            layer.bindPopup(popupContent);

                            let name = feature.properties.name || feature.properties.Name || feature.properties.NAME || '';

                            if (name) {
                                const bounds = layer.getBounds();
                                const center = bounds.getCenter();

                                setTimeout(() => {
                                    try {
                                        const labelMarker = L.marker(center, {
                                            icon: L.divIcon({
                                                html: name,
                                                className: 'matetsi-label',
                                                iconSize: [80, 16],
                                                iconAnchor: [40, 8]
                                            })
                                        }).addTo(window.map);

                                        layer.labelMarker = labelMarker;
                                    } catch (e) {
                                        console.error("Error adding Matetsi Units label:", e);
                                    }
                                }, 100);
                            }
                        }

                        layer.on({
                            click: zoomToFeature
                        });
                    }
                }).addTo(map);

                overlayLayers["Matetsi Units"] = allLayers.matetsiUnits;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Matetsi Units data:", error);
                resolve();
            });
    });
}

function loadIntersectedLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/intersected.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Intersected data loaded successfully");

                allLayers.intersected = L.geoJSON(data, {
                    style: styleIntersected,
                    onEachFeature: onEachIntersectedFeature
                }).addTo(map);

                overlayLayers["Land Types"] = allLayers.intersected;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Intersected data:", error);
                resolve();
            });
    });
}

function loadLandscapeBoundaryLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/landscapeboundary.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Landscape Boundary data loaded successfully");

                allLayers.landscapeBoundary = L.geoJSON(data, {
                    style: {
                        color: '#FF0000',
                        weight: 4,
                        opacity: 1,
                        fillOpacity: 0
                    },
                    onEachFeature: onEachFeature
                }).addTo(map);

                overlayLayers["Landscape Boundary"] = allLayers.landscapeBoundary;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Landscape Boundary data:", error);
                resolve();
            });
    });
}

function loadDistrictBoundariesLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/Districtboundaries.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("District Boundaries data loaded successfully");

                allLayers.districtBoundaries = L.geoJSON(data, {
                    style: {
                        color: '#666',
                        weight: 3,
                        opacity: 0.8,
                        fillOpacity: 0,
                        dashArray: '5, 5'
                    },
                    onEachFeature: onEachFeature
                });

                overlayLayers["District Boundaries"] = allLayers.districtBoundaries;
                resolve();
            })
            .catch(error => {
                console.error("Error loading District Boundaries data:", error);
                resolve();
            });
    });
}

function loadRiversLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/rivers.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Rivers data loaded successfully");

                allLayers.rivers = L.geoJSON(data, {
                    style: {
                        color: '#87CEFA',
                        weight: 1.5,
                        opacity: 0.6
                    },
                    onEachFeature: onEachFeature
                });

                overlayLayers["Rivers"] = allLayers.rivers;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Rivers data:", error);
                resolve();
            });
    });
}

function loadRoadsLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/roads.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Roads data loaded successfully");

                allLayers.roads = L.geoJSON(data, {
                    style: {
                        color: '#8B4513',
                        weight: 1.5,
                        opacity: 0.6
                    },
                    onEachFeature: onEachFeature
                });

                overlayLayers["Roads"] = allLayers.roads;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Roads data:", error);
                resolve();
            });
    });
}

function loadPlacesLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/places.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Places data loaded successfully");

                allLayers.places = L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 2,
                            fillColor: "#000",
                            color: "#000",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        if (feature.properties) {
                            let popupContent = '<div class="popup-content">';

                            for (const prop in feature.properties) {
                                const value = feature.properties[prop];
                                if (value !== null && value !== undefined && value !== '') {
                                    popupContent += '<strong>' + prop + ':</strong> ' + value + '<br>';
                                }
                            }

                            popupContent += '</div>';
                            layer.bindPopup(popupContent);

                            let name = feature.properties.FULL_NAME || feature.properties.full_name ||
                                        feature.properties.name || feature.properties.Name ||
                                        feature.properties.NAME || '';

                            if (name) {
                                layer.bindTooltip(name, {
                                    permanent: true,
                                    direction: 'right',
                                    offset: [10, 0],
                                    className: 'place-label'
                                });
                            }
                        }
                    }
                }).addTo(map);

                overlayLayers["Places"] = allLayers.places;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Places data:", error);
                resolve();
            });
    });
}

function loadWaterSourcesLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/watersources.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Water Sources data loaded successfully");

                allLayers.waterSources = L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 6,
                            fillColor: "#0000FF",
                            color: "#0066CC",
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.8
                        });
                    },
                    onEachFeature: onEachFeature
                });

                overlayLayers["Water Sources"] = allLayers.waterSources;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Water Sources data:", error);
                resolve();
            });
    });
}

function loadProjectSitesLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/projectsites.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Project Sites data loaded successfully");

                allLayers.projectSites = L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 8,
                            fillColor: "#FF6600",
                            color: "#CC5500",
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.8
                        });
                    },
                    onEachFeature: onEachFeature
                });

                overlayLayers["Project Sites"] = allLayers.projectSites;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Project Sites data:", error);
                resolve();
            });
    });
}

function loadBufferWardsLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/bufferwards.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Buffer Wards data loaded successfully");

                allLayers.bufferWards = L.geoJSON(data, {
                    style: {
                        fillColor: '#FFFF99',
                        weight: 2,
                        opacity: 1,
                        color: '#CCCC00',
                        dashArray: '10, 5',
                        fillOpacity: 0.4
                    },
                    onEachFeature: onEachFeature
                });

                overlayLayers["Buffer Wards"] = allLayers.bufferWards;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Buffer Wards data:", error);
                resolve();
            });
    });
}

function loadElephantMovementLayer(map) {
    return new Promise((resolve, reject) => {
        fetch('data/elephantmovement.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP error! Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                debug("Elephant Movement data loaded successfully");

                function getElephantMovementColor(contour) {
                    if (!contour) return '#999999';
                    
                    const contourStr = String(contour).toLowerCase();
                    
                    if (contourStr.includes('low') || contourStr === '1' || contourStr === 'l') {
                        return '#FFA500';
                    } else if (contourStr.includes('medium') || contourStr === '2' || contourStr === 'm') {
                        return '#FF0000';
                    } else if (contourStr.includes('high') || contourStr === '3' || contourStr === 'h') {
                        return '#800080';
                    }
                    
                    const num = parseFloat(contour);
                    if (!isNaN(num)) {
                        if (num <= 1) return '#FFA500';
                        else if (num <= 2) return '#FF0000';
                        else return '#800080';
                    }
                    
                    return '#999999';
                }

                allLayers.elephantMovement = L.geoJSON(data, {
                    style: function(feature) {
                        const contour = feature.properties.contour || feature.properties.Contour ||
                                       feature.properties.CONTOUR || feature.properties.level ||
                                       feature.properties.intensity || feature.properties.density;
                        
                        return {
                            fillColor: getElephantMovementColor(contour),
                            weight: 1,
                            opacity: 1,
                            color: '#333',
                            fillOpacity: 0.7
                        };
                    },
                    onEachFeature: onEachFeature
                });

                overlayLayers["Elephant Movement"] = allLayers.elephantMovement;
                resolve();
            })
            .catch(error => {
                console.error("Error loading Elephant Movement data:", error);
                resolve();
            });
    });
}

// Create legend function
function createLegend(map) {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const designations = [
            { name: 'National Park', color: '#90EE90' },
            { name: 'Forest Land', color: '#006400' },
            { name: 'Safari Area', color: '#F5DEB3' },
            { name: 'Community Conservation Area', color: '#D2B48C' },
            { name: 'Large Scale Commercial Farming', color: '#808080' },
            { name: 'Communal Land', color: '#D2B48C' },
            { name: 'Resettlement Area/Unknown', color: '#A52A2A' },
            { name: 'Water Sources', color: '#0000FF' },
            { name: 'Project Sites', color: '#FF6600' },
            { name: 'Buffer Wards', color: '#FFFF99' },
            { name: 'Matetsi Units', color: '#FF8C00' },
            { name: 'Elephant Movement - Low', color: '#FFA500' },
            { name: 'Elephant Movement - Medium', color: '#FF0000' },
            { name: 'Elephant Movement - High', color: '#800080' }
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