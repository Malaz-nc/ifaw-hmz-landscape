# Map Colors and Layer Order Fix Guide

This guide will help you implement the fixes for the colors, layer order, and visibility issues identified in your map.

## Issues Fixed

1. Made rivers, water sources, and roads appear on top of other layers
2. Changed IFAW operating wards color to dark grey
3. Made ward boundaries visible as outlines only (no fill)
4. Added labels to chiefs
5. Fixed wildlife corridors to be visible and on top of other layers
6. Fixed Matetsi Safaris to display above land use layers
7. Fixed categorized roads display
8. Made points of interest appear on top of all layers and added labels
9. Set Chirisa National Park to have the same color as National Parks (green)
10. Made all forest areas (state forest and reserve forest) dark green
11. Changed chief buffers to be red instead of green
12. Updated colors to match the static map exactly

## Implementation Instructions

Follow these steps to implement the fixes:

### Option 1: Add Fix Script to Existing Files

1. **Create a new file** named `map-fixes.js` in your `js` folder using the content provided
2. **Add a reference** to this new script in your existing `index.html` file just after the map.js script:

```html
<script src="js/config.js"></script>
<script src="js/map.js"></script>
<script src="js/map-fixes.js"></script>
```

3. **Add the script initialization** at the end of your HTML file:

```html
<script>
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (typeof fixMapIssues === 'function') {
                fixMapIssues();
            }
        }, 3000);
    });
</script>
```

### Option 2: Replace Existing Files (Recommended)

1. **Replace your existing `index.html`** with the provided `index-with-fixes.html` file (rename it to `index.html`)
2. **Create a new file** named `map-fixes.js` in your `js` folder with the provided content

## Verifying the Fixes

After implementing the changes:

1. Open the map in your browser
2. Check that all layers are visible in the correct order:
   - Rivers, roads, and points of interest should be on top
   - Wildlife corridors should be visible as red arrows
   - Chiefs should have red buffers around them
   - Ward boundaries should be visible as outlines
   - All forest areas should appear dark green
   - Chirisa National Park should appear bright green like other national parks

3. Test the layer controls to ensure they work properly:
   - Toggling layers on/off should maintain proper layer order
   - The legend should match the actual colors on the map

## Troubleshooting

If you encounter issues:

1. **Layers not showing in correct order:**
   - Open the browser console (F12)
   - Enter `fixMapIssues()` to manually trigger the fix
   - Check for any error messages

2. **Colors not matching:**
   - Ensure the `map-fixes.js` file is being loaded (check network tab in developer tools)
   - Verify there are no JavaScript errors in the console

3. **Labels not showing:**
   - This could be due to missing name properties in your GeoJSON data
   - Check your GeoJSON files to ensure they have appropriate name properties

## Additional Customization

You can further customize the appearance by modifying these sections in the `map-fixes.js` file:

1. **Change colors:** Modify the `CONFIG.colors` values at the top of the file
2. **Adjust label styles:** Update the label creation in the `loadChiefsWithBuffer` and `loadPointsOfInterestWithLabels` functions
3. **Change layer order:** Modify the `setCorrectLayerOrder` function to reorder layers as needed

## Deployment

After testing locally, deploy the changes to your web server:

1. **Commit changes to Git:**
   ```bash
   git add js/map-fixes.js
   git add index.html
   git commit -m "Fix map colors and layer order issues"
   git push origin main
   ```

2. **Update GitHub Pages** (if using):
   - If GitHub Pages is enabled, it will automatically update after pushing
   - If not, enable it in your repository settings

## Support

If you encounter any issues implementing these fixes, check the browser console for error messages and refer to the provided code comments for guidance. The code is designed to be robust with error handling that should help identify any problems.