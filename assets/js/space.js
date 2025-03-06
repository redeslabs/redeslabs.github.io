// 3D Star Field with Space Travel Effect
let stars = [];
const maxStars = 1000;
let speed = 2;
let acceleration = 0;
let targetSpeed = 2;
let canvas;
let speedControlsAdded = false;
let isMobile = false; // Flag for mobile detection

// Add planets array and related variables
let planets = [];
let lastPlanetTime = 0;
let nextPlanetDelay = 5000; // Initialize with default value, will be set properly in setup()

// Star colors based on spectral classification
const starColors = [
  [255, 255, 255],    // White
  [255, 240, 220],    // Yellow-white
  [255, 210, 160],    // Yellow
  [255, 180, 140],    // Orange
  [255, 150, 120],    // Red
  [200, 210, 255],    // Blue-white
  [150, 180, 255]     // Blue
];

// Planet types and colors - simplified with one dominant color per type
const planetTypes = [
  { type: 'vangogh-blue', hasRings: false, primaryColor: [40, 80, 180] }, // Deep blue
  { type: 'vangogh-gold', hasRings: true, primaryColor: [220, 180, 70] },  // Golden ochre
  { type: 'vangogh-red', hasRings: false, primaryColor: [220, 80, 40] },   // Cadmium red
  { type: 'vangogh-night', hasRings: true, primaryColor: [30, 40, 120] }, // Starry night blue
  { type: 'vangogh-green', hasRings: true, primaryColor: [40, 100, 60] }, // Cypress green
  { type: 'vangogh-purple', hasRings: true, primaryColor: [120, 60, 140] } // Purple violet
];

// Star color distribution probabilities
const colorProbabilities = [0.6, 0.15, 0.1, 0.05, 0.05, 0.03, 0.02];

function setup() {
  // Try to get the container elements
  const container = document.getElementById('canvas-container');
  const spaceContainer = document.getElementById('space-container');
  
  // Check if device is mobile
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  let w, h;
  
  // If either container exists, use its dimensions
  if (container) {
    w = container.offsetWidth;
    h = container.offsetHeight;
    canvas = createCanvas(w, h);
    canvas.parent('canvas-container');
    addSpeedControls(container);
  } else if (spaceContainer) {
    w = spaceContainer.offsetWidth;
    h = spaceContainer.offsetHeight;
    canvas = createCanvas(w, h);
    canvas.parent('space-container');
    addSpeedControls(spaceContainer);
  } else {
    // Fallback to window dimensions
    w = windowWidth;
    h = windowHeight;
    canvas = createCanvas(w, h);
  }
  
  // Make sure the canvas doesn't capture pointer events
  if (canvas && canvas.elt) {
    canvas.elt.style.pointerEvents = 'none';
  }
  
  // Create initial star field
  initStars();
  
  // Initialize the timer for the first planet
  lastPlanetTime = millis();
  nextPlanetDelay = random(5000, 10000); // Initialize properly here
  
  // Set framerate for smoother animation
  frameRate(60);
}

function initStars() {
  // Create stars with 3D positions
  for (let i = 0; i < maxStars; i++) {
    createStar();
  }
}

function createStar(initialZ = null) {
  // Random position in 3D space
  // X and Y extend beyond screen to allow stars to enter from sides
  const x = random(-width/2, width/2);
  const y = random(-height/2, height/2);
  
  // Z position (depth) - either random or specified
  const z = initialZ || random(100, 2000);
  
  // Select star color based on realistic distribution
  const colorIndex = getWeightedRandomIndex(colorProbabilities);
  const color = starColors[colorIndex];
  
  // Create star with realistic properties
  const star = {
    x: x,
    y: y,
    z: z,
    // Larger, brighter stars are rarer
    size: random(0.5, 2.5),
    color: color,
    // Streaking effect increases with star size
    streakFactor: random(1, 5) * (colorIndex <= 2 ? 1 : 1.5)  // Hotter stars have longer streaks
  };
  
  stars.push(star);
  return star;
}

function getWeightedRandomIndex(probabilities) {
  const r = random();
  let cumulativeProbability = 0;
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (r <= cumulativeProbability) {
      return i;
    }
  }
  
  return 0; // Fallback to first option
}

function draw() {
  // True space black
  background(0); // Ensure this is 0 for pure black, not a deep blue
  
  // Center the coordinate system for star movement
  translate(width/2, height/2);
  
  // Handle acceleration/deceleration
  if (speed < targetSpeed) {
    speed += acceleration;
  } else if (speed > targetSpeed) {
    speed -= acceleration;
  }
  
  // Move and render stars to create travel effect
  updateStars();
  
  // Check if it's time to spawn a new planet
  const currentTime = millis();
  if (currentTime - lastPlanetTime > nextPlanetDelay && planets.length < 3) { // Limit to 3 planets at once
    createPlanet();
    lastPlanetTime = currentTime;
    nextPlanetDelay = random(10000, 30000); // Set next delay to 10-30 seconds
  }
  
  // Update and render planets
  updatePlanets();
}

function updateStars() {
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    
    // Move stars closer (reduce z-value)
    star.z -= speed;
    
    // If star passes viewer or goes too far to sides, reset it
    if (star.z < 1) {
      // Remove this star
      stars.splice(i, 1);
      // Create a new star far away
      createStar(random(1500, 2000));
      continue;
    }
    
    // Calculate projected 2D position and size based on z-depth
    const projectionFactor = 400 / star.z;
    const projectedX = star.x * projectionFactor;
    const projectedY = star.y * projectionFactor;
    
    // Stars grow as they get closer
    const projectedSize = star.size * projectionFactor;
    
    // Calculate opacity based on distance
    // Stars are brighter as they get closer
    const brightness = map(star.z, 0, 2000, 255, 100);
    
    // Draw star
    noStroke();
    
    // Draw streak/motion blur based on speed and proximity
    if (speed > 1 && star.z < 800) {
      // Calculate streak length
      const streakLength = (speed * star.streakFactor) / (star.z * 0.01);
      
      // Draw streak if it's visible
      if (streakLength > 1) {
        // Create a gradient for the streak
        for (let j = 0; j < 5; j++) {
          const streakDistance = (j / 5) * streakLength;
          const fadeX = projectedX + (streakDistance * (projectedX / sqrt(projectedX*projectedX + projectedY*projectedY)));
          const fadeY = projectedY + (streakDistance * (projectedY / sqrt(projectedX*projectedX + projectedY*projectedY)));
          
          const fadeOpacity = brightness * (1 - j/5);
          
          fill(star.color[0], star.color[1], star.color[2], fadeOpacity);
          ellipse(fadeX, fadeY, projectedSize * (1 - j/5));
        }
      }
    }
    
    // Draw the actual star
    fill(star.color[0], star.color[1], star.color[2], brightness);
    ellipse(projectedX, projectedY, projectedSize);
    
    // Add subtle glow for brighter stars
    if (projectedSize > 3) {
      fill(star.color[0], star.color[1], star.color[2], brightness * 0.4);
      ellipse(projectedX, projectedY, projectedSize * 2);
      
      fill(star.color[0], star.color[1], star.color[2], brightness * 0.2);
      ellipse(projectedX, projectedY, projectedSize * 3);
    }
  }
}

// Create a new planet in the distance
function createPlanet() {
  // Random position in 3D space, but not too far from center to ensure we encounter it
  const x = random(-width/8, width/8);
  const y = random(-height/8, height/8);
  
  // Place planet far away
  const z = random(3000, 4000);
  
  // Select random planet type
  const planetTypeIndex = floor(random(planetTypes.length));
  const planetType = planetTypes[planetTypeIndex];
  
  // Define a base size that won't change with perspective
  const baseSize = random(70, 100); // Fixed intrinsic size
  
  // Create planet with properties
  const planet = {
    x: x,
    y: y,
    z: z,
    baseSize: baseSize, // Intrinsic size that won't change
    size: baseSize, // Will be updated with projection for drawing
    aspectRatio: 1, // For rings, we'll maintain aspect ratio
    primaryColor: planetType.primaryColor,
    type: planetType.type,
    hasRings: planetType.hasRings,
    ringColor: [
      constrain(planetType.primaryColor[0] * 0.9, 0, 255),
      constrain(planetType.primaryColor[1] * 0.9, 0, 255),
      constrain(planetType.primaryColor[2] * 0.9, 0, 255)
    ],
    ringAngle: random(-0.3, 0.3), // Tilt angle for the rings
    rotationSpeed: random(0.0001, 0.0003), // Even slower rotation for less movement
    rotation: 0, // Current rotation
    // Reduce animation speed by half
    ringAnimSpeed: random(0.005, 0.01),
    ringAnimOffset: random(0, TWO_PI),
    ringRotationSpeed: random(0.0002, 0.0008), // Speed of ring rotation around planet
    // Pre-generate all random values to prevent flickering
    brushAngles: [], // Will store fixed angles for brushstrokes
    brushDistances: [], // Will store fixed distances for brushstrokes
    brushSizes: [], // Will store fixed sizes for brushstrokes
    swirlCenters: [], // Will store fixed centers for swirls
    highlightAngles: [], // Will store fixed angles for highlights
    // Store fully generated colors to eliminate color flickering
    brushColors: [], // Each brushstroke's color 
    swirlColors: [], // Each swirl's color
    highlightColors: [], // Each highlight's color
    // For ring waves
    ringWaves: []  // Will store wave parameters for continuous flowing rings
  };
  
  // Pre-generate all random values that would otherwise cause flickering
  // For brushstrokes - using absolute values based on baseSize
  const brushstrokeCount = floor(map(baseSize, 50, 120, 15, 25));
  for (let i = 0; i < brushstrokeCount; i++) {
    const angleStep = TWO_PI / brushstrokeCount;
    const angle = i * angleStep + random(-angleStep/6, angleStep/6);
    
    // Store distance as a proportion of baseSize
    const distanceProportion = random(0.125, 0.425); // 1/8 to just under 1/2
    planet.brushAngles.push(angle);
    planet.brushDistances.push(distanceProportion);
    
    // Store sizes as proportions of baseSize
    planet.brushSizes.push({
      lengthProportion: random(0.1, 0.15),
      widthProportion: random(0.03, 0.05)
    });
    
    // Pre-generate colors with subtle variations
    planet.brushColors.push([
      constrain(planet.primaryColor[0] + random(-10, 10), 0, 255),
      constrain(planet.primaryColor[1] + random(-10, 10), 0, 255),
      constrain(planet.primaryColor[2] + random(-10, 10), 0, 255)
    ]);
  }
  
  // For swirls
  const swirlCount = planet.type.includes('night') ? 2 : 1; // Even fewer swirls
  for (let i = 0; i < swirlCount; i++) {
    // Store positions as proportions of baseSize
    planet.swirlCenters.push({
      xProportion: i === 0 ? 0 : random(-0.125, 0.125),
      yProportion: i === 0 ? 0 : random(-0.125, 0.125)
    });
    
    // Pre-generate swirl colors
    if (planet.type.includes('night')) {
      planet.swirlColors.push([255, 220, 100]); // Yellow for night planets
    } else {
      planet.swirlColors.push([
        constrain(planet.primaryColor[0] * 1.3, 0, 255),
        constrain(planet.primaryColor[1] * 1.3, 0, 255),
        constrain(planet.primaryColor[2] * 1.3, 0, 255)
      ]);
    }
  }
  
  // For highlights
  const highlightCount = 3;
  for (let i = 0; i < highlightCount; i++) {
    planet.highlightAngles.push(TWO_PI / highlightCount * i);
    
    // Pre-generate highlight colors
    planet.highlightColors.push([
      min(planet.primaryColor[0] * 1.4, 255),
      min(planet.primaryColor[1] * 1.4, 255),
      min(planet.primaryColor[2] * 1.4, 255)
    ]);
  }
  
  // For ring waves - Van Gogh style continuous waves
  if (planet.hasRings) {
    // Create 2-3 concentric waves for the rings
    const waveCount = 2;
    // Store all ring dimensions as proportions of baseSize
    const ringOuterRadiusProportion = 1.1; 
    const ringThicknessProportion = 0.4;
    
    for (let i = 0; i < waveCount; i++) {
      const baseRadiusProportion = ringOuterRadiusProportion - (i * (ringThicknessProportion / waveCount));
      
      // Create wave parameters for a flowing, connected Van Gogh style
      planet.ringWaves.push({
        baseRadiusProportion: baseRadiusProportion,
        thicknessProportion: ringThicknessProportion / waveCount * 0.8,
        // Pre-generate amplitude variations for the wave (as proportions)
        amplitudeProportions: Array.from({length: 12}, () => random(0.08, 0.15)),
        // Pre-generate phase shifts for the wave
        phaseShifts: Array.from({length: 12}, () => random(0, TWO_PI)),
        // Pre-generate color variations along the wave path
        colorVariations: Array.from({length: 20}, () => ({
          r: constrain(planet.ringColor[0] + random(-15, 15), 0, 255),
          g: constrain(planet.ringColor[1] + random(-15, 15), 0, 255),
          b: constrain(planet.ringColor[2] + random(-15, 15), 0, 255)
        })),
        // Add variation in wave direction for each ring
        waveDirection: random() > 0.5 ? 1 : -1,
        // Add different wave speeds for each ring - slower by half
        waveSpeed: random(1, 1.5)  // Half the previous speed
      });
    }
  }
  
  planets.push(planet);
  return planet;
}

// Update and render all planets
function updatePlanets() {
  for (let i = planets.length - 1; i >= 0; i--) {
    const planet = planets[i];
    
    // Move planets closer (reduce z-value)
    planet.z -= speed * 0.8; // Slightly slower than stars for parallax effect
    
    // Update planet rotation
    planet.rotation += planet.rotationSpeed;
    
    // If planet passes viewer, remove it
    if (planet.z < 10) {
      planets.splice(i, 1);
      continue;
    }
    
    // Calculate projected 2D position based on z-depth
    const projectionFactor = 800 / planet.z;
    const projectedX = planet.x * projectionFactor;
    const projectedY = planet.y * projectionFactor;
    
    // Projected size increases as planet gets closer
    // This only affects the overall scale, not the internal proportions
    const projectedSize = planet.baseSize * projectionFactor;
    
    // Calculate opacity based on distance
    const brightness = map(planet.z, 0, 4000, 255, 50);
    
    // Draw rings first (back half only) if the planet has them
    if (planet.hasRings) {
      // Draw only the back half of the rings
      drawVanGoghRings(planet, projectedX, projectedY, projectedSize, brightness, true);
    }
    
    // Draw planet in Van Gogh style with consistent internal proportions
    renderVanGoghPlanet(planet, projectedX, projectedY, projectedSize, brightness);
    
    // Draw rings front half if the planet has them
    if (planet.hasRings) {
      // Draw only the front half of the rings
      drawVanGoghRings(planet, projectedX, projectedY, projectedSize, brightness, false);
    }
  }
}

// Draw a planet in Van Gogh style with consistent proportions
function renderVanGoghPlanet(planet, x, y, size, brightness) {
  push();
  translate(x, y);
  
  // Base colors derived from primary color
  const darkColor = [
    constrain(planet.primaryColor[0] * 0.7, 0, 255),
    constrain(planet.primaryColor[1] * 0.7, 0, 255),
    constrain(planet.primaryColor[2] * 0.7, 0, 255)
  ];
  
  const lightColor = [
    constrain(planet.primaryColor[0] * 1.2, 0, 255),
    constrain(planet.primaryColor[1] * 1.2, 0, 255),
    constrain(planet.primaryColor[2] * 1.2, 0, 255)
  ];
  
  // Layer 1: Solid base with gradient
  // Create a radial gradient effect with the primary color
  const steps = 6;
  for (let i = steps; i > 0; i--) {
    const radius = (size/2) * (i/steps);
    const blendFactor = i/steps;
    
    // Blend from light center to dark edge (or vice versa for some types)
    let c1, c2;
    
    if (planet.type.includes('night')) {
      // Deep center for night-themed planets
      c1 = darkColor;
      c2 = planet.primaryColor;
    } else {
      // Lighter center for other planets
      c1 = lightColor;
      c2 = darkColor;
    }
    
    // Blend colors
    const blendedColor = [
      lerp(c1[0], c2[0], blendFactor),
      lerp(c1[1], c2[1], blendFactor),
      lerp(c1[2], c2[2], blendFactor)
    ];
    
    noStroke();
    fill(blendedColor[0], blendedColor[1], blendedColor[2], brightness * 0.95);
    ellipse(0, 0, radius * 2);
  }
  
  // Layer 2: Smooth, flowing brushstrokes in primary color
  const brushstrokeCount = planet.brushAngles.length;
  
  for (let i = 0; i < brushstrokeCount; i++) {
    // Use pre-generated values with consistent proportions
    const angle = planet.brushAngles[i] + (planet.rotation * 0.5);
    // Convert proportional distance to actual size
    const dist = planet.brushDistances[i] * size;
    
    // Use pre-generated colors
    const strokeColor = planet.brushColors[i];
    
    // Draw a smoother, more cohesive brushstroke
    push();
    translate(cos(angle) * dist, sin(angle) * dist);
    rotate(angle + PI/2); // Align with radial direction
    
    noStroke();
    fill(strokeColor[0], strokeColor[1], strokeColor[2], brightness * 0.8);
    
    // Convert proportional sizes to actual sizes
    const length = planet.brushSizes[i].lengthProportion * size;
    const width = planet.brushSizes[i].widthProportion * size;
    
    // Use a soft ellipse for the brushstroke
    ellipse(0, 0, width, length);
    pop();
  }
  
  // Layer 3: Van Gogh signature swirls - fewer, more deliberate
  const swirlCount = planet.swirlCenters.length;
  
  for (let i = 0; i < swirlCount; i++) {
    // Create more controlled swirls with consistent proportions
    const swirlRadius = size * 0.3;
    // Convert proportional positions to actual positions
    const centerX = planet.swirlCenters[i].xProportion * size;
    const centerY = planet.swirlCenters[i].yProportion * size;
    
    // Use pre-generated swirl colors
    const swirlColor = planet.swirlColors[i];
    
    push();
    translate(centerX, centerY);
    
    // Use fewer steps for a cleaner look
    const steps = 18;
    const swirls = 1.5; // Fewer rotations
    
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const angle = t * TWO_PI * swirls + (planet.rotation * 0.3);
      const radius = swirlRadius * (1 - t*0.6);
      
      // Position on spiral
      const x1 = cos(angle) * radius;
      const y1 = sin(angle) * radius;
      
      // Consistent color throughout swirl
      const strokeW = map(t, 0, 1, size*0.05, size*0.02);
      
      push();
      translate(x1, y1);
      rotate(angle + PI/2);
      
      noStroke();
      fill(swirlColor[0], swirlColor[1], swirlColor[2], brightness * (0.8 - t*0.3));
      
      // Simple ellipse
      ellipse(0, 0, strokeW, strokeW * 2);
      pop();
    }
    pop();
  }
  
  // Layer 4: Add subtle highlights - fewer and more deliberate
  const highlightCount = planet.highlightAngles.length;
  for (let i = 0; i < highlightCount; i++) {
    const angle = planet.highlightAngles[i] + (planet.rotation * 0.2);
    const dist = size/2 * 0.7;
    
    // Use pre-generated highlight colors
    const highlightColor = planet.highlightColors[i];
    
    push();
    translate(cos(angle) * dist, sin(angle) * dist);
    
    noStroke();
    fill(highlightColor[0], highlightColor[1], highlightColor[2], brightness * 0.5);
    
    const hlSize = size * 0.10;
    ellipse(0, 0, hlSize, hlSize);
    pop();
  }
  
  // Layer 5: Celestial glow - simplified
  noStroke();
  for (let i = 2; i > 0; i--) {
    fill(planet.primaryColor[0], planet.primaryColor[1], planet.primaryColor[2], brightness * 0.1 / i);
    ellipse(0, 0, size * (1 + i * 0.3));
  }
  
  pop();
}

// Draw Van Gogh style rings as continuous flowing waves with sinusoidal animation and rotation
function drawVanGoghRings(planet, x, y, size, brightness, drawBackHalf) {
  push();
  translate(x, y);
  // Keep the tilt but don't tie the overall rotation to the planet rotation
  rotate(planet.ringAngle);
  
  // Draw each ring wave with consistent proportions
  if (planet.ringWaves && planet.ringWaves.length) {
    for (let waveIndex = 0; waveIndex < planet.ringWaves.length; waveIndex++) {
      const wave = planet.ringWaves[waveIndex];
      
      // Create a Van Gogh style flowing wave that forms a complete ring
      // Using consistent proportions and animated flow
      // Draw either back half or front half based on parameter
      drawVanGoghWave(planet, wave, size, brightness, waveIndex, drawBackHalf);
      
      // Add some scattered brushstrokes around the wave for texture
      const strokeCount = 12;
      for (let i = 0; i < strokeCount; i++) {
        // Calculate the angle with rotation over time
        const baseAngle = (TWO_PI / strokeCount) * i;
        const rotationAngle = millis() * planet.ringRotationSpeed;
        const angle = baseAngle + rotationAngle;
        
        // Determine if this brushstroke is in the back half or front half
        // Using a clearer front/back division for better 3D effect
        // Back half: angles between PI/2 and 3*PI/2 (left side in screen space)
        // Front half: angles between -PI/2 and PI/2 (right side in screen space)
        const adjustedAngle = (angle % TWO_PI + TWO_PI) % TWO_PI; // Normalize to 0-2PI
        const isBackHalf = (adjustedAngle > PI/2 && adjustedAngle < 3*PI/2);
        
        // Skip brushstrokes that aren't in the current half we're drawing
        if (isBackHalf !== drawBackHalf) continue;
        
        // Vertical wave motion 
        const animOffset = sin(baseAngle * 3 + millis() * 0.0025 * wave.waveSpeed) * 0.2;
        
        // Scale all dimensions by the current size to maintain proportions
        const baseRadius = wave.baseRadiusProportion * size;
        
        // Fixed radius (no radial variation) but variable height
        const radius = baseRadius;
        const heightOffset = size * 0.15 * animOffset; // Vertical offset
        
        // Draw a brushstroke
        push();
        translate(
          cos(angle) * radius,
          sin(angle) * (radius * 0.3) + heightOffset // Add vertical offset for up/down motion
        );
        rotate(angle + PI/2 + sin(millis() * 0.0015 + baseAngle) * 0.3); // Rotation animation
        
        // Use pre-generated colors from the wave
        const colorIndex = i % wave.colorVariations.length;
        const color = wave.colorVariations[colorIndex];
        
        noStroke();
        fill(color.r, color.g, color.b, brightness * 0.7);
        
        // Scale brushstroke size by the current size for consistent proportions
        const bLength = size * 0.10;
        const bWidth = size * 0.04;
        ellipse(0, 0, bWidth, bLength);
        pop();
      }
    }
  }
  
  pop();
}

// Draw a continuous Van Gogh style wave as a ring with consistent proportions, rotation and vertical animation
function drawVanGoghWave(planet, wave, size, brightness, ringIndex, drawBackHalf) {
  const points = 80; // More points for smoother curves
  
  // Convert proportional sizes to actual sizes
  const baseRadius = wave.baseRadiusProportion * size;
  const thickness = wave.thicknessProportion * size;
  
  // Calculate the animation time factors
  const animTime = millis() * 0.0025 * wave.waveSpeed;
  const rotationTime = millis() * planet.ringRotationSpeed; // Rotation over time
  
  // Calculate all points of the full ellipse first
  let ellipsePoints = [];
  for (let i = 0; i <= points; i++) {
    // Base angle around the ellipse
    const baseAngle = (TWO_PI / points) * i;
    const angle = baseAngle + rotationTime;
    
    // Create a traveling wave effect that moves vertically (up and down)
    // Use baseAngle for the wave pattern so it rotates with the ring
    const verticalWave = sin(baseAngle * 4 - animTime * wave.waveDirection + ringIndex * PI/2) * 0.3;
    
    // Create a complex wave pattern by combining sine waves
    let radiusOffset = 0;
    for (let w = 0; w < wave.amplitudeProportions.length; w++) {
      // Each harmonic adds to the wave pattern, scaled properly
      radiusOffset += wave.amplitudeProportions[w] * size * 
        sin(baseAngle * (w+1) + wave.phaseShifts[w] + planet.rotation * 0.2) * 0.05;
    }
    
    // Keep radius mostly consistent, add vertical wave motion
    const r = baseRadius + radiusOffset;
    const x = cos(angle) * r; // Use rotated angle for position
    // Add vertical offset to create up/down motion instead of in/out
    const verticalOffset = size * verticalWave * 0.3;
    const y = sin(angle) * (r * 0.3) + verticalOffset; // Use rotated angle for position
    
    // Store the point
    ellipsePoints.push({x, y, angle});
  }
  
  // Draw the main flowing path of the ring with vertical motion and rotation
  beginShape();
  noFill();
  const waveColor = planet.ringColor;
  stroke(waveColor[0], waveColor[1], waveColor[2], brightness * 0.8);
  strokeWeight(thickness * 0.7);
  
  // Find where the transition happens (x changes sign)
  let transitionPoints = [];
  for (let i = 0; i < ellipsePoints.length - 1; i++) {
    const p1 = ellipsePoints[i];
    const p2 = ellipsePoints[i + 1];
    
    // Check if we cross from negative to positive x or vice versa
    if ((p1.x < 0 && p2.x >= 0) || (p1.x >= 0 && p2.x < 0)) {
      // Calculate intersection point with y-axis (x = 0)
      const t = Math.abs(p1.x) / (Math.abs(p1.x) + Math.abs(p2.x));
      const y = p1.y * (1 - t) + p2.y * t;
      transitionPoints.push({x: 0, y, index: i});
    }
  }
  
  // Sort transition points by y-coordinate (top to bottom)
  transitionPoints.sort((a, b) => a.y - b.y);
  
  // We should have 2 transition points for a complete ellipse
  if (transitionPoints.length >= 2) {
    const top = transitionPoints[0];
    const bottom = transitionPoints[transitionPoints.length - 1];
    
    // Add a slight overlap to prevent visual gaps
    const overlapAngle = 0.05; // Small angle to create overlap
    
    // If drawing back half (left side, x < 0)
    if (drawBackHalf) {
      // We don't need to start with a vertex at the top transition point
      // Instead, we'll draw slightly past the transition points to ensure seamless connection
      
      // Add all points on the left side (back half), plus a bit extra for overlap
      for (let i = 0; i < ellipsePoints.length; i++) {
        const point = ellipsePoints[i];
        // Back half (left side) plus a little overlap on both ends
        if (point.x < 0 || 
            (i > 0 && ellipsePoints[i-1].x < 0) || 
            (i < ellipsePoints.length-1 && ellipsePoints[i+1].x < 0)) {
          vertex(point.x, point.y);
        }
      }
    } else {
      // Drawing front half (right side, x >= 0)
      
      // Add all points on the right side (front half), plus a bit extra for overlap
      for (let i = 0; i < ellipsePoints.length; i++) {
        const point = ellipsePoints[i];
        // Front half (right side) plus a little overlap on both ends
        if (point.x >= 0 || 
            (i > 0 && ellipsePoints[i-1].x >= 0) || 
            (i < ellipsePoints.length-1 && ellipsePoints[i+1].x >= 0)) {
          vertex(point.x, point.y);
        }
      }
    }
  }
  
  endShape();
  
  // Draw overlapping brushstrokes along the wave with vertical animation and rotation
  const brushCount = 24;
  for (let i = 0; i < brushCount; i++) {
    const t = i / brushCount;
    // Base angle plus rotation over time
    const baseAngle = t * TWO_PI;
    const angle = baseAngle + rotationTime;
    
    // Determine position
    const x = cos(angle) * baseRadius;
    
    // Add a small buffer zone around the transition to avoid hard edge
    const buffer = 0.1; // Small buffer zone
    const isInBufferZone = (x > -buffer && x < buffer);
    
    // Determine if this brushstroke is in the back half or front half
    // Using x-coordinate for a clear, unambiguous front/back division
    const isBackHalf = (x < 0);
    
    // Skip brushstrokes that aren't in the current half we're drawing
    // But allow brushstrokes in the buffer zone to be drawn for both halves
    if (!isInBufferZone && isBackHalf !== drawBackHalf) continue;
    
    // Adjust opacity for brushstrokes in the buffer zone to create a fade effect
    let adjustedBrightness = brightness;
    if (isInBufferZone) {
      // Fade based on how close to the center line
      const fadeAmount = map(abs(x), 0, buffer, 0.3, 1.0);
      adjustedBrightness *= fadeAmount;
    }
    
    // Create traveling wave effect that moves vertically
    // Use baseAngle for the wave pattern so it rotates with the ring
    const verticalWave = sin(baseAngle * 4 - animTime * wave.waveDirection + ringIndex * PI/2) * 0.3;
    
    // Calculate base position with less radial variation
    let radiusOffset = 0;
    for (let w = 0; w < wave.amplitudeProportions.length; w++) {
      radiusOffset += wave.amplitudeProportions[w] * size * 
        sin(baseAngle * (w+1) + wave.phaseShifts[w] + planet.rotation * 0.2) * 0.05;
    }
    
    // Base position with consistent radius but variable height
    const radius = baseRadius + radiusOffset;
    const verticalOffset = size * verticalWave * 0.3;
    
    // Get color from pre-generated variations
    const colorIndex = i % wave.colorVariations.length;
    const color = wave.colorVariations[colorIndex];
    
    // Calculate position
    const posX = cos(angle) * radius;
    const posY = sin(angle) * (radius * 0.3) + verticalOffset;
    
    // Draw Van Gogh style brushstroke along the wave
    push();
    translate(posX, posY);
    
    // Add flowing rotation to the brushstrokes
    rotate(angle + PI/2 + sin(baseAngle * 2 - animTime) * 0.2);
    
    noStroke();
    fill(color.r, color.g, color.b, adjustedBrightness * 0.8);
    
    // Draw brushstroke aligned with the curve, scaled properly
    const length = thickness * 1.2;
    const width = thickness * 0.5;
    ellipse(0, 0, width, length);
    pop();
  }
  
  // Add flowing texture brushstrokes along the wave path with vertical animation and rotation
  for (let i = 0; i < brushCount; i++) {
    const t = i / brushCount;
    // Base angle plus rotation over time
    const baseAngle = t * TWO_PI;
    const angle = baseAngle + rotationTime;
    
    // Determine position
    const x = cos(angle) * baseRadius;
    
    // Add a small buffer zone around the transition to avoid hard edge
    const buffer = 0.1; // Small buffer zone
    const isInBufferZone = (x > -buffer && x < buffer);
    
    // Determine if this brushstroke is in the back half or front half
    // Using x-coordinate for a clear, unambiguous front/back division
    const isBackHalf = (x < 0);
    
    // Skip brushstrokes that aren't in the current half we're drawing
    // But allow brushstrokes in the buffer zone to be drawn for both halves
    if (!isInBufferZone && isBackHalf !== drawBackHalf) continue;
    
    // Adjust opacity for brushstrokes in the buffer zone to create a fade effect
    let adjustedBrightness = brightness;
    if (isInBufferZone) {
      // Fade based on how close to the center line
      const fadeAmount = map(abs(x), 0, buffer, 0.3, 1.0);
      adjustedBrightness *= fadeAmount;
    }
    
    // Create vertical wave effect for texture brushstrokes
    // Use baseAngle for the wave pattern so it rotates with the ring
    const verticalWave = sin(baseAngle * 4 - animTime * wave.waveDirection + PI/4 + ringIndex * PI/2) * 0.3;
    
    // Calculate position with slightly different pattern for texture variation
    let radiusOffset = 0;
    for (let w = 0; w < wave.amplitudeProportions.length; w++) {
      radiusOffset += wave.amplitudeProportions[w] * size * 
        sin(baseAngle * (w+1.5) + wave.phaseShifts[w] + planet.rotation * 0.15) * 0.05;
    }
    
    // Position with consistent radius but variable height
    const radius = baseRadius + radiusOffset + (thickness * 0.3);
    const verticalOffset = size * verticalWave * 0.3;
    
    // Calculate position
    const posX = cos(angle) * radius;
    const posY = sin(angle) * (radius * 0.3) + verticalOffset;
    
    // Get different color from pre-generated variations
    const colorIndex = (i + 3) % wave.colorVariations.length;
    const color = wave.colorVariations[colorIndex];
    
    // Draw short brushstroke
    push();
    translate(posX, posY);
    
    // Add flowing rotation to create dynamic brushwork
    rotate(angle + PI/2 + sin(baseAngle * 3 + animTime * 1.5) * 0.15);
    
    noStroke();
    fill(color.r, color.g, color.b, adjustedBrightness * 0.6);
    
    // Small brushstroke for texture, scaled properly
    const length = thickness * 0.8;
    const width = thickness * 0.3;
    ellipse(0, 0, width, length);
    pop();
  }
}

// Add custom controls for speed adjustment
function addSpeedControls(container) {
  if (speedControlsAdded) return;
  
  // Check if mobile device - don't add controls on mobile
  if (isMobile) {
    // Don't add controls on mobile devices
    speedControlsAdded = true;
    return;
  }
  
  // Remove any existing control panel first
  const existingPanel = container.querySelector('.space-control-panel');
  if (existingPanel) {
    container.removeChild(existingPanel);
  }
  
  // Create a control panel
  const controlPanel = document.createElement('div');
  controlPanel.className = 'space-control-panel';
  controlPanel.style.position = 'absolute';
  controlPanel.style.bottom = '20px';
  controlPanel.style.right = '20px';
  controlPanel.style.zIndex = '100';
  controlPanel.style.display = 'flex';
  controlPanel.style.flexDirection = 'column';
  controlPanel.style.gap = '10px';
  controlPanel.style.pointerEvents = 'auto';
  controlPanel.style.backdropFilter = 'blur(5px)';
  controlPanel.style.padding = '10px';
  controlPanel.style.borderRadius = '10px';
  controlPanel.style.background = 'rgba(20, 20, 40, 0.4)';
  controlPanel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
  
  // Add a label for the controls
  const label = document.createElement('div');
  label.textContent = 'WARP SPEED';
  label.style.color = 'white';
  label.style.fontSize = '10px';
  label.style.textAlign = 'center';
  label.style.fontWeight = 'bold';
  label.style.letterSpacing = '1px';
  label.style.marginBottom = '5px';
  controlPanel.appendChild(label);
  
  // Create button container for horizontal layout
  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.justifyContent = 'center';
  btnContainer.style.gap = '10px';
  
  // Speed down button
  const speedDownBtn = document.createElement('button');
  speedDownBtn.innerHTML = '<i class="fas fa-chevron-down" style="font-size: 1.2rem;"></i>';
  speedDownBtn.style.background = 'rgba(100, 100, 180, 0.3)';
  speedDownBtn.style.color = 'white';
  speedDownBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  speedDownBtn.style.borderRadius = '8px';
  speedDownBtn.style.width = '40px';
  speedDownBtn.style.height = '40px';
  speedDownBtn.style.cursor = 'pointer';
  speedDownBtn.style.transition = 'all 0.3s';
  speedDownBtn.style.pointerEvents = 'auto';
  speedDownBtn.style.display = 'flex';
  speedDownBtn.style.alignItems = 'center';
  speedDownBtn.style.justifyContent = 'center';
  speedDownBtn.title = "Reduce warp speed";
  
  speedDownBtn.addEventListener('mouseover', function() {
    this.style.background = 'rgba(80, 80, 200, 0.5)';
    this.style.transform = 'scale(1.1)';
  });
  
  speedDownBtn.addEventListener('mouseout', function() {
    this.style.background = 'rgba(100, 100, 180, 0.3)';
    this.style.transform = 'scale(1)';
  });
  
  speedDownBtn.addEventListener('click', function() {
    targetSpeed = max(targetSpeed - 2, 1);
    acceleration = 0.1;
    updateSpeedIndicator();
  });
  
  // Speed up button
  const speedUpBtn = document.createElement('button');
  speedUpBtn.innerHTML = '<i class="fas fa-chevron-up" style="font-size: 1.2rem;"></i>';
  speedUpBtn.style.background = 'rgba(100, 100, 180, 0.3)';
  speedUpBtn.style.color = 'white';
  speedUpBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  speedUpBtn.style.borderRadius = '8px';
  speedUpBtn.style.width = '40px';
  speedUpBtn.style.height = '40px';
  speedUpBtn.style.cursor = 'pointer';
  speedUpBtn.style.transition = 'all 0.3s';
  speedUpBtn.style.pointerEvents = 'auto';
  speedUpBtn.style.display = 'flex';
  speedUpBtn.style.alignItems = 'center';
  speedUpBtn.style.justifyContent = 'center';
  speedUpBtn.title = "Increase warp speed";
  
  speedUpBtn.addEventListener('mouseover', function() {
    this.style.background = 'rgba(80, 80, 200, 0.5)';
    this.style.transform = 'scale(1.1)';
  });
  
  speedUpBtn.addEventListener('mouseout', function() {
    this.style.background = 'rgba(100, 100, 180, 0.3)';
    this.style.transform = 'scale(1)';
  });
  
  speedUpBtn.addEventListener('click', function() {
    targetSpeed = min(targetSpeed + 2, 30);
    acceleration = 0.1;
    updateSpeedIndicator();
  });
  
  // Add speed indicator
  const speedIndicator = document.createElement('div');
  speedIndicator.id = 'space-speed-indicator';
  speedIndicator.style.marginTop = '5px';
  speedIndicator.style.height = '4px';
  speedIndicator.style.background = 'rgba(255, 255, 255, 0.2)';
  speedIndicator.style.borderRadius = '2px';
  speedIndicator.style.overflow = 'hidden';
  
  const speedFill = document.createElement('div');
  speedFill.id = 'space-speed-fill';
  speedFill.style.height = '100%';
  speedFill.style.width = `${(targetSpeed / 30) * 100}%`;
  speedFill.style.background = 'linear-gradient(to right, #4287f5, #42f5f5)';
  speedFill.style.transition = 'width 0.3s';
  
  speedIndicator.appendChild(speedFill);
  
  // Function to update speed indicator
  function updateSpeedIndicator() {
    const fill = document.getElementById('space-speed-fill');
    if (fill) {
      fill.style.width = `${(targetSpeed / 30) * 100}%`;
    }
  }
  
  // Add buttons to the button container
  btnContainer.appendChild(speedDownBtn);
  btnContainer.appendChild(speedUpBtn);
  
  // Add button container to the control panel
  controlPanel.appendChild(btnContainer);
  
  // Add speed indicator to the control panel
  controlPanel.appendChild(speedIndicator);
  
  // Add the control panel to the container
  container.appendChild(controlPanel);
  
  // Update speed indicator on window load
  updateSpeedIndicator();
  
  speedControlsAdded = true;
}

function keyPressed() {
  // Skip keyboard interactions on mobile devices
  if (isMobile) return true;
  
  // Check if canvas or its container is focused
  const isFocused = document.activeElement === canvas.elt ||
                    document.activeElement === document.getElementById('canvas-container') ||
                    document.activeElement === document.getElementById('space-container');
  
  // Only process key events if canvas or container is focused
  if (isFocused) {
    // Speed controls
    if (keyCode === UP_ARROW) {
      targetSpeed = min(targetSpeed + 2, 30);
      acceleration = 0.1;
      updateSpeedIndicator();
    } else if (keyCode === DOWN_ARROW) {
      targetSpeed = max(targetSpeed - 2, 1);
      acceleration = 0.1;
      updateSpeedIndicator();
    } else if (keyCode === 32) { // SPACE
      // Emergency stop
      targetSpeed = 0;
      acceleration = 0.2;
      updateSpeedIndicator();
    }
    
    return false; // Prevent default only when canvas is focused
  }
  
  // Allow default key behavior otherwise
  return true;
}

function windowResized() {
  // Try to get the container elements
  const container = document.getElementById('canvas-container');
  const spaceContainer = document.getElementById('space-container');
  
  let w, h;
  
  // If either container exists, use its dimensions
  if (container) {
    w = container.offsetWidth;
    h = container.offsetHeight;
  } else if (spaceContainer) {
    w = spaceContainer.offsetWidth;
    h = spaceContainer.offsetHeight;
  } else {
    // Fallback to window dimensions
    w = windowWidth;
    h = windowHeight;
  }
  
  resizeCanvas(w, h);
  
  // Reset stars for new dimensions
  stars = [];
  initStars();
  
  // Clear planets
  planets = [];
  
  // Reset speed controls
  speedControlsAdded = false;
  if (container) {
    addSpeedControls(container);
  } else if (spaceContainer) {
    addSpeedControls(spaceContainer);
  }
}

// Automate speed variations for more interesting effect
setInterval(() => {
  if (random() < 0.2 && !mouseIsPressed) {
    // More gentle speed changes
    targetSpeed = constrain(targetSpeed + random(-1, 1.5), 1, 15);
    acceleration = random(0.03, 0.1);
  }
}, 8000);

// Function to update speed indicator
function updateSpeedIndicator() {
  const fill = document.getElementById('space-speed-fill');
  if (fill) {
    fill.style.width = `${(targetSpeed / 30) * 100}%`;
  }
}

// Add window resize listener to update controls for responsive design
window.addEventListener('resize', function() {
  // Check if now on mobile
  const isMobile = window.innerWidth <= 768;
  
  // Remove any existing controls regardless of device
  const existingPanel = document.querySelector('.space-control-panel');
  if (existingPanel && existingPanel.parentNode) {
    existingPanel.parentNode.removeChild(existingPanel);
  }
  
  // Reset flag to allow adding controls again if appropriate
  speedControlsAdded = false;
  
  // Don't add controls on mobile devices
  if (isMobile) {
    speedControlsAdded = true;
    return;
  }
  
  // Add controls only on desktop/tablet
  const container = document.getElementById('canvas-container');
  const spaceContainer = document.getElementById('space-container');
  
  if (container) {
    addSpeedControls(container);
  } else if (spaceContainer) {
    addSpeedControls(spaceContainer);
  }
});

// Create a new asteroid
function createAsteroid() {
  console.log("Creating new asteroid"); // Debug log
  
  // Create asteroid with a random entry and exit point at the screen edges
  const entryPoint = random(TWO_PI); // Random angle around a circle
  const exitPoint = (entryPoint + PI + random(-PI/4, PI/4)) % TWO_PI; // Roughly opposite direction with some variation
  
  // Calculate entry position on the edge of the screen
  // Make asteroid start outside the visible area
  const screenDiagonal = sqrt(width*width + height*height);
  const entryDistance = screenDiagonal * 0.6; // Start just off-screen
  const entryX = cos(entryPoint) * entryDistance;
  const entryY = sin(entryPoint) * entryDistance;
  
  // Calculate exit position on the opposite edge
  const exitDistance = screenDiagonal * 0.6; // End just off-screen
  const exitX = cos(exitPoint) * exitDistance;
  const exitY = sin(exitPoint) * exitDistance;
  
  // Set z position with some randomness
  const z = random(1000, 3000);
  
  // Calculate movement vector
  const moveVector = {
    x: exitX - entryX,
    y: exitY - entryY
  };
  
  // Normalize movement vector
  const magnitude = sqrt(moveVector.x * moveVector.x + moveVector.y * moveVector.y);
  const normalizedVector = {
    x: moveVector.x / magnitude,
    y: moveVector.y / magnitude
  };
  
  // Set asteroid properties
  const asteroid = {
    x: entryX,
    y: entryY,
    z: z,
    baseSize: random(10, 30), // Smaller than planets
    moveX: normalizedVector.x,
    moveY: normalizedVector.y,
    moveSpeed: random(5, 10), // Moderate speed, scaled by global speed
    rotation: random(TWO_PI),
    rotationSpeed: random(0.005, 0.01) // Rotation speed
  };
  
  // Generate random points around the asteroid for a jagged appearance
  asteroid.detailPoints = [];
  const pointCount = floor(random(7, 12));
  for (let i = 0; i < pointCount; i++) {
    const angle = (TWO_PI / pointCount) * i;
    const distance = 1 + random(-0.3, 0.3); // Jaggedness
    asteroid.detailPoints.push({
      angle: angle,
      distance: distance
    });
  }
  
  // Random gray color with a slight tint
  const baseGray = random(60, 100);
  const tint = random(15);
  asteroid.color = {
    r: baseGray + random(-tint, tint),
    g: baseGray + random(-tint, tint),
    b: baseGray + random(-tint, tint)
  };
  
  // Add asteroid to the array
  asteroids.push(asteroid);
  console.log("Asteroid created. Total asteroids:", asteroids.length); // Debug log
}

// Update and render all asteroids
function updateAsteroids() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    
    // Move asteroid along its path
    asteroid.x += asteroid.moveX * asteroid.moveSpeed;
    asteroid.y += asteroid.moveY * asteroid.moveSpeed;
    
    // Move asteroid closer (reduce z-value)
    asteroid.z -= speed * 0.8;
    
    // Update asteroid rotation
    asteroid.rotation += asteroid.rotationSpeed;
    
    // If asteroid is too close or off screen, remove it
    if (asteroid.z < 50) {
      asteroids.splice(i, 1);
      continue;
    }
    
    // Calculate projected 2D position based on z-depth
    const projectionFactor = 800 / asteroid.z;
    const projectedX = asteroid.x * projectionFactor;
    const projectedY = asteroid.y * projectionFactor;
    
    // Projected size increases as asteroid gets closer
    const projectedSize = asteroid.baseSize * projectionFactor;
    
    // Calculate opacity based on distance
    const brightness = map(asteroid.z, 0, 4000, 255, 50);
    
    // Render the asteroid
    renderAsteroid(asteroid, projectedX, projectedY, projectedSize, brightness);
  }
}

// Render an asteroid with a Van Gogh-inspired style but more rough and jagged
function renderAsteroid(asteroid, x, y, size, brightness) {
  push();
  translate(x, y);
  rotate(asteroid.rotation);
  
  // Draw the main asteroid body
  beginShape();
  noStroke();
  fill(asteroid.color.r, asteroid.color.g, asteroid.color.b, brightness * 0.8);
  
  // Create the jagged outline
  for (let i = 0; i < asteroid.detailPoints.length; i++) {
    const point = asteroid.detailPoints[i];
    const angle = point.angle;
    const distance = point.distance * size;
    const px = cos(angle) * distance;
    const py = sin(angle) * distance;
    vertex(px, py);
  }
  endShape(CLOSE);
  
  // Add Van Gogh style brushstrokes for texture (fewer for performance)
  const brushCount = constrain(floor(size / 5), 3, 8);
  for (let i = 0; i < brushCount; i++) {
    const angle = random(TWO_PI);
    const distance = random(0, 0.8) * size;
    push();
    translate(cos(angle) * distance, sin(angle) * distance);
    rotate(angle);
    
    // Color variation
    const variation = random(-25, 25);
    fill(
      constrain(asteroid.color.r + variation, 20, 220),
      constrain(asteroid.color.g + variation, 20, 220),
      constrain(asteroid.color.b + variation, 20, 220),
      brightness * 0.9
    );
    
    // Draw a brushstroke
    const strokeLength = random(0.1, 0.3) * size;
    const strokeWidth = random(0.05, 0.1) * size;
    ellipse(0, 0, strokeWidth, strokeLength);
    pop();
  }
  
  // Simple highlight for performance
  push();
  const highlightAngle = random(TWO_PI);
  const highlightDistance = random(0, 0.6) * size;
  translate(cos(highlightAngle) * highlightDistance, sin(highlightAngle) * highlightDistance);
  fill(255, 255, 255, brightness * 0.6);
  const highlightSize = size * 0.15;
  ellipse(0, 0, highlightSize * 0.5, highlightSize);
  pop();
  
  pop();
}
