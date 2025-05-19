// Global Configuration
const CONFIG = {
    mapCenter: [-18.5, 26.5], // Default center coordinates
    initialZoom: 10,
    minZoom: 8,
    maxZoom: 16,
    basemaps: {
        OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        Satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        })
    },
    geojsonPaths: {
        landscapeboundary: 'data/landscapeboundary.geojson',
        landuse: 'data/landuse.geojson',
        districtboundaries: 'data/Districtboundaries.geojson',
        bufferwards: 'data/bufferwards.geojson',
        communityCa: 'data/communityCA.geojson',
        wildlife_corridors: 'data/corridors.geojson',
        corridors: 'data/corridors.geojson',
        roads: 'data/roads.geojson',
        rivers: 'data/rivers.geojson',
        watersources: 'data/watersources.geojson',
        places: 'data/places.geojson',
        towns: 'data/towns.geojson',
        projectsites: 'data/projectsites.geojson',
        matetsiunits: 'data/matetsiunits.geojson'
    },
    colors: {
        communalLand: '#FFD700',
        targetForestLand: '#228B22',
        largeScaleFarming: '#CD853F',
        nationalPark: '#006400',
        safariArea: '#8B4513',
        smallScaleFarming: '#D2B48C',
        communityCa: '#FFA500',
        wildlifeCorridors: '#FF00FF',
        rivers: '#1E90FF',
        roads: {
            category1: '#8B0000'
        },
        ifawProjectSites: '#FF4500'
    }
};

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
            attributionControl: false
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
        console.log