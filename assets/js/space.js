// 3D Star Field with Space Travel Effect
let stars = [];
const maxStars = 1000;
let speed = 2;
let acceleration = 0;
let targetSpeed = 2;
let canvas;
let speedControlsAdded = false;

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

// Star color distribution probabilities
const colorProbabilities = [0.6, 0.15, 0.1, 0.05, 0.05, 0.03, 0.02];

function setup() {
  // Try to get the container elements
  const container = document.getElementById('canvas-container');
  const spaceContainer = document.getElementById('space-container');
  
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
  background(0);
  
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

// Add custom controls for speed adjustment
function addSpeedControls(container) {
  if (speedControlsAdded) return;
  
  // Check if mobile device - don't add controls on mobile
  const isMobile = window.innerWidth <= 768;
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