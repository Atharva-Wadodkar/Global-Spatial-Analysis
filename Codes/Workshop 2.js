// Data structure 
Map.setOptions('SATELLITE')
// Sets the map into satellite view 

//
Map.setCenter(174.0638, -39.298, 11);
// Takes you to the coordinates on the map 

// Import SRTM data
var dataset = ee.Image("CGIAR/SRTM90_V4")
print (dataset) 
// Look at the data properties

// elevationVis
var elevationVis = {
  min: 0,
  max: 2500,
  palette: ["0000ff", "00ffff", "ffff00", "ff0000", "ffffff"]
};

// Now we know where the data is (via the Asset ID), add it to our map.
 ////Map.addLayer(dataset, {min: 0, max: 5500, palette: ['blue', 'green', 'red', 'white']}, 'srtm');
// Creates gradient layers using colour palette 

// Add the protected planet data
var wdpa = ee.FeatureCollection("WCMC/WDPA/current/polygons")
////Map.addLayer(wdpa, {color: 'green'}, 'wdpa')
// Adds color to all wdpa areas

// Calculating No. of protected areas (wdpa)
print ('No of wdpa:', wdpa.size())
// Prints the total number of wdpa's

//
print (wdpa)
print (wdpa.first())
// looking just at the first feature is much faster.

//
var iucn_pa = wdpa.filter(ee.Filter.eq('IUCN_CAT', 'IV'));
//Map.addLayer(iucn_pa, {color: 'yellow'}, 'National Parks')
// Filter only for level IV protected areas

// filter date
var iucn_pre1980 = wdpa.filter(ee.Filter.lte('STATUS_YR', 1980));
//Map.addLayer(iucn_pa, {color: 'white'}, 'PAs in 1980')
// 

// Import countries
var countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017")
// 

//
print (countries); // look at it. // how to find a country name?
//Map.addLayer(countries) // look at it.

// New Zealand only
var nz = countries.filter(ee.Filter.equals('country_na', 'New Zealand'))
print (nz)
//Map.addLayer(nz) // look at it.

// Spatial filter PAs only in NZ
var nz_pas = wdpa.filter(ee.Filter.bounds(nz))
print ('Number of wdpas in NZ:', nz_pas.size())
//

// And let’s add them to the map in a different colour just to make sure we know what’s going on.
//Map.addLayer(nz_pas, {color:'red'}, 'NZ PAs only')
//

// Let’s now find only the “national park” category level (IUCN category IV) parks only in New Zealand.
// Link them all into one statement
var nz_wdpas = wdpa
    .filter(ee.Filter.eq('IUCN_CAT', 'IV')) // filter only NPs
    .filter(ee.Filter.bounds(nz)) // filter to NZ

print ('Number of wdpas in NZ:', nz_wdpas.size())
// 5585 wdpas in NZ in IUCN CAT IV

// Change opacity
Map.addLayer(dataset, elevationVis, 'Elevation', true, 0.6);
print (dataset)
//

//Computation
print (dataset) 
var srtm_fixed = dataset.add(100)
Map.addLayer(srtm_fixed, {min: 0, max: 2500, palette: ['black', 'lime', 'yellow']}, 'fixed srtm')
// 

// Threshold image
var elevGt1500 = dataset; ee.Filter.greaterThan(1500) 
Map.addLayer(elevGt1500) 
// Binary white == true

//
var elevGt1500 = dataset.gt(1500).selfMask() 
Map.addLayer(elevGt1500) 
// Highlights everything above 1500m

//
Map.addLayer(elevGt1500.selfMask(), {palette:'fuchsia'}, 'gt 1500m', true, 0.7) 
// Adds colour to everything above 1500m 

// apply complex algorithm
// Use terrain, an algorithm that returns several topographic variables from an elevation image
var terrain = ee.Terrain.products(dataset);
print ('terrain', terrain ) // print it to see what's inside

// make images from the bands we are interested in
var slope = terrain.select(['slope']) 
var hillshade = terrain.select(['hillshade'])
Map.addLayer (hillshade)
Map.addLayer (slope, {palette: ['white', 'darkred', 'black'], min:0, max:45}, 'slope')
//

// Find Taranaki NP
var taranaki = wdpa.filter(ee.Filter.eq('NAME', 'Egmont National Park'));
Map.addLayer(taranaki, {color: 'orange'}, 'Mt Taranaki')
//

// Apply a spatial reducer to estimate mean slope
var slopeOutput = slope.reduceRegion({
  reducer: ee.Reducer.mean(), // we compute the mean of all slope pixel values in the national park
  geometry: taranaki,
  scale:90 // pixel size in metres - get this from the metadata (ie. search for it)
})
print ('slopeOutput', slopeOutput)
// First, let’s calculate the average slope of the national park.
// Average slope is 10.036m

// Try clipping to see if it's any different.
var taranakiSlope = slope.clip(taranaki)
Map.addLayer (taranakiSlope, {palette: ['white', 'darkred', 'black'], min:0, max:45}, 'taranaki slope')

var slopeOutput2 = taranakiSlope.reduceRegion({
  reducer: ee.Reducer.mean(), // we compute the mean of all slope pixel values in the national park
  geometry: taranaki,
  scale:90 // pixel size in metres - get this from the metadata (ie. search for it)
})
print ('slopeOutput2', slopeOutput2) // same answer
//

// Use reduce regions with a different reducer (Max)
var elevOutput_Max = dataset.reduceRegion({
  reducer: ee.Reducer.max(), // we compute the max of all pixel values in the national park
  geometry: taranaki,
  scale:90 // pixel size in metres - get this from the metadata (ie. search for it)
})
print ('elevOutput_Max', elevOutput_Max)
// The max elevation of the national park is 2484m

// Use reduce regions with a different reducer (min)
var elevOutput_Min = dataset.reduceRegion({
  reducer: ee.Reducer.min(), // we compute the min of all slope pixel values in the national park
  geometry: taranaki,
  scale:90 // pixel size in metres - get this from the metadata (ie. search for it)
})
print ('elevOutput_Min', elevOutput_Min)
// The min elevation of the national park is 108m

// Use reduce regions with a different reducer
var elevOutput_MinMax = dataset.reduceRegion({
  reducer: ee.Reducer.minMax(), // we compute the mean of all slope pixel values in the national park
  geometry: taranaki,
  scale:90 // pixel size in metres - get this from the metadata (ie. search for it)
})
print ('elevOutput_MinMax', elevOutput_MinMax)
// 

// Get area of >1500m
var areaGt1500m = elevGt1500 // binary 1 == yes
  .multiply (ee.Image.pixelArea()) // get the area of each pixel
  .reduceRegion({
  reducer: ee.Reducer.sum(), // sum all pixel areas together
  geometry: taranaki,
  scale:90 
})
print ('The area of Taranaki above 1500m (m2)', areaGt1500m) // in square metres
print ('The area of Taranaki above 1500m (km2)', ee.Number(areaGt1500m.get('elevation')).divide(1000 * 1000)) 
// in square metres
// Last, we’ll work out how much area above 1500m occurs inside the national park.
// 11.474km area.

//
var dataset = ee.ImageCollection('WORLDCLIM/V1/MONTHLY');
print (dataset) 
// 12 images where each one is a month


// Get two months
var jan_climate = ee.Image ("WORLDCLIM/V1/MONTHLY/01")
var july_climate = ee.Image ("WORLDCLIM/V1/MONTHLY/07")
//

// Select their average temperature bands
var jan_climate_avg = jan_climate.select('tavg') // get average band
var july_climate_avg = july_climate.select('tavg')
//

// Set vis parameters
var meanTemperatureVis = {
  min: -40,
  max: 20,
  palette: ['blue', 'purple', 'cyan', 'green', 'yellow', 'red'],
};

Map.addLayer(jan_climate_avg, meanTemperatureVis, 'janClimate')
Map.addLayer(july_climate_avg, meanTemperatureVis, 'julyClimate')
// Inspect them!

// Note the pixel scaling error and fix it
// Need to divide all pixel values by 10, or multiply by .1 (.multiply(0.1)

// We want to reduce to get the yearly average
var annualMeanTemperature = dataset
  .select('tavg')
  .mean() // this is the reducer
  .multiply(0.1); // scale pixels to real values

Map.setCenter(71.7, 52.4, 3);
Map.addLayer(annualMeanTemperature, meanTemperatureVis, 'Mean Annual Temperature');
//

// We will import some Landsat images, all of the Landsat images for the year 2017.
var dataset = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
  .filterDate('2017-01-01', '2017-12-31'); // only images from 2017
var trueColour = dataset.select(['B4', 'B3', 'B2']);
var trueColourVis = {
  min: 0.0,
  max: 0.4,
};
Map.setCenter(146.746, -19.529, 9);
Map.addLayer(trueColour, trueColourVis, 'True Colour Landsat');
//

// In the code below, we use the .median() reducer to find the median pixel in all of those 42 images. Notice the remarkable result!
// Let's use reduce these
var LandsatMedian = trueColour.median()
Map.addLayer(LandsatMedian, trueColourVis, 'True Color Median');
//

