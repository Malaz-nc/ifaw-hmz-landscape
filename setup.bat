@echo off
echo Setting up IFAW HMZ Landscape Map Project...

REM Create directory structure if it doesn't exist
if not exist "css" mkdir css
if not exist "js" mkdir js
if not exist "data" mkdir data
if not exist "images" mkdir images

REM Clone repository if not already cloned
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git remote add origin https://github.com/Malaz-nc/ifaw-hmz-landscape.git
)

REM Create necessary files
echo Creating project files...

REM Copy data files if they exist in the current directory
echo Copying data files...
for %%f in (bufferwards.geojson category1_road.geojson category2_road.geojson category3_road.geojson chiefs.geojson Community_CA.geojson corridors.geojson HMZ_Boundary.geojson Landscape_boundary.geojson Landuse.geojson Landuse2.geojson Places_of_interest.geojson rivers.geojson wards.geojson water_sources.geojson) do (
    if exist "%%f" (
        echo   - Copying %%f to data folder
        copy "%%f" "data\%%f"
    ) else (
        echo   ! Missing %%f
    )
)

echo Project setup complete!
echo.
echo Next steps:
echo 1. Verify that all GeoJSON files are in the 'data' folder
echo 2. Open index.html in a web browser to test the map
echo 3. Run 'git add .' to add all files to git
echo 4. Run 'git commit -m "Initial commit"' to commit changes
echo 5. Run 'git push -u origin main' to push to GitHub