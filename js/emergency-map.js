/**
 * Quick fix patch for the IFAW map issues
 * Save this as fix-map.js and include it in your HTML before the closing </body> tag
 */

// Execute immediately
(function() {
    console.log("Applying emergency map fixes...");
    
    // Fix file naming issues
    const fileNameFixes = {
        'districtboundaries': 'Districtboundaries.geojson',
        'communityCa': 'communityCA.geojson'
    };
    
    // Function to calculate length of a LineString feature
    function calculateLength(feature) {
        if (!feature || !feature.geometry || (feature.geometry.type !== 'LineString' && feature.geometry.type !== 'MultiLineString')) {
            return 0;
        }
        
        let length = 0;
        
        try {
            if (feature.geometry.type === 'LineString') {
                const line = feature.geometry.coordinates;
                for (let i = 1; i < line.length; i++) {
                    const p1 = L.latLng(line[i-1][1], line[i-1][0]);
                    const p2 = L.latLng(line[i][1], line[i][0]);
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
        } catch (error) {
            console.error('Error calculating length:', error);
            length = 0;
        }
        
        return length;
    }
    
    // Define fixMapIssues function if it doesn't exist
    if (typeof window.fixMapIssues === 'undefined') {
        window.fixMapIssues = function() {
            console.log("Fixing map issues...");
            
            // Fix missing layers
            for (const [layerId, fileName] of Object.entries(fileNameFixes)) {
                if (typeof allLayers === 'undefined' || !allLayers[layerId]) {
                    console.log(`Attempting to load ${layerId} with correct filename: ${fileName}`);
                    
                    fetch(`data/${fileName}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Failed to load ${fileName}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            // Create and add the layer
                            const layer = L.geoJSON(data, {
                                style: function() {
                                    return {
                                        color: layerId === 'districtboundaries' ? '#9C27B0' : '#FFEB3B',
                                        weight: 2,
                                        opacity: 0.7,
                                        fillOpacity: 0.2
                                    };
                                },
                                onEachFeature: function(feature, layer) {
                                    if (feature.properties) {
                                        let popupContent = "<div class='feature-popup'>";
                                        for (const key in feature.properties) {
                                            popupContent += `<p><strong>${key}:</strong> ${feature.properties[key]}</p>`;
                                        }
                                        popupContent += "</div>";
                                        layer.bindPopup(popupContent);
                                    }
                                }
                            });
                            
                            // Add to map and store in allLayers
                            if (typeof map !== 'undefined') {
                                layer.addTo(map);
                                if (typeof allLayers === 'undefined') {
                                    window.allLayers = {};
                                }
                                allLayers[layerId] = layer;
                                console.log(`Added ${layerId} layer to map`);
                            }
                        })
                        .catch(error => {
                            console.error(`Error loading ${layerId}:`, error);
                        });
                }
            }
            
            // Update analysis content
            updateAnalysisContent();
            
            window.fixesApplied = true;
            console.log("Map fixes applied!");
        };
    }
    
    // Helper function to update analysis content
    function updateAnalysisContent() {
        const totalAreaElement = document.getElementById('total-area');
        const corridorLengthElement = document.getElementById('corridor-length');
        const townsCountElement = document.getElementById('towns-count');
        
        if (totalAreaElement) totalAreaElement.textContent = "Calculating...";
        if (corridorLengthElement) corridorLengthElement.textContent = "Calculating...";
        if (townsCountElement) townsCountElement.textContent = "Calculating...";
        
        // Set a timeout to allow map to load fully
        setTimeout(function() {
            // Calculate values
            let totalArea = 0;
            let corridorLength = 0;
            let townsCount = 0;
            
            // Area calculation
            if (allLayers && allLayers.landscapeboundary) {
                try {
                    allLayers.landscapeboundary.eachLayer(function(layer) {
                        if (layer.feature) {
                            const area = turf.area(layer.feature) / 1000000; // Convert to km²
                            totalArea += area;
                        }
                    });
                } catch (e) {
                    console.error("Error calculating area:", e);
                    totalArea = 0;
                }
            }
            
            // Corridor length
            if (allLayers && allLayers.wildlife_corridors) {
                try {
                    allLayers.wildlife_corridors.eachLayer(function(layer) {
                        if (layer.feature) {
                            const length = calculateLength(layer.feature);
                            corridorLength += length;
                        }
                    });
                } catch (e) {
                    console.error("Error calculating corridor length:", e);
                    corridorLength = 0;
                }
            }
            
            // Towns count
            if (allLayers && allLayers.towns) {
                try {
                    allLayers.towns.eachLayer(function() {
                        townsCount++;
                    });
                } catch (e) {
                    console.error("Error counting towns:", e);
                    townsCount = 0;
                }
            }
            
            // Update display
            if (totalAreaElement) totalAreaElement.textContent = totalArea.toFixed(2) + " km²";
            if (corridorLengthElement) corridorLengthElement.textContent = corridorLength.toFixed(2) + " km";
            if (townsCountElement) townsCountElement.textContent = townsCount.toString();
        }, 3000); // Give the map 3 seconds to load completely
    }
    
    // Define a notifications function if they don't exist
    if (typeof window.showSuccessNotification === 'undefined') {
        window.showSuccessNotification = function(message) {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'success-notification';
            notification.textContent = message;
            
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
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 5000);
        };
    }
    
    if (typeof window.showErrorNotification === 'undefined') {
        window.showErrorNotification = function(message) {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'error-notification';
            notification.textContent = message;
            
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
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 8000);
        };
    }
    
    // Wait for the map to initialize and then apply fixes
    const checkMapInterval = setInterval(function() {
        if (typeof map !== 'undefined' && !window.fixesApplied) {
            clearInterval(checkMapInterval);
            console.log("Map detected, applying fixes...");
            fixMapIssues();
            showSuccessNotification("Map fixed successfully! Reload the page if any issues persist.");
        }
    }, 1000); // Check every second
    
    // Fail-safe: If map isn't detected after 15 seconds, show error
    setTimeout(function() {
        clearInterval(checkMapInterval);
        if (typeof map === 'undefined') {
            console.error("Map initialization failed!");
            showErrorNotification("Map failed to initialize. Please check console for errors.");
        }
    }, 15000);
})();