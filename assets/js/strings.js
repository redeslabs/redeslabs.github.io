// String effect animation for Detego header
// Based on interactive harp string simulation

// Configuration
const numThreads = 50; // More strings for denser effect
const particlesPerThread = 30;
const stiffness = 0.3; // Stronger strings for more visible movement
const forceStrength = 15; // Stronger force for more dramatic interaction
const forceRadius = 150; // Larger interaction radius
const damping = 0.98; // Less damping for more movement
const windForce = 0.03; // Stronger wind effect
const threadColor = 'rgba(255, 255, 255, 0.7)'; // More opaque white
const maxVelocity = 2;
const returnForce = 0.005;

// Variables
let threads = [];
let originalPositions = []; // Store initial positions
let time = 0;
let canvas, container, heroSection;
let mouseHasMoved = false; // Add this flag to track if mouse has moved
let isMobile = false; // Flag for mobile detection

// p5.js functions
function setup() {
  heroSection = document.getElementById('hero');
  container = document.getElementById('strings-canvas-container');
  if (!container || !heroSection) return;
  
  // Calculate dimensions based on the hero section
  let w = container.clientWidth;
  let h = heroSection.clientHeight;
  
  canvas = createCanvas(w, h);
  canvas.parent('strings-canvas-container');
  
  // Check if device is mobile
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  setupThreads();
}

function windowResized() {
  // Skip resize handling on mobile devices to prevent scroll triggering reset
  if (isMobile) return;
  
  heroSection = document.getElementById('hero');
  container = document.getElementById('strings-canvas-container');
  if (!container || !heroSection) return;
  
  // Resize to match hero dimensions
  let w = container.clientWidth;
  let h = heroSection.clientHeight;
  
  resizeCanvas(w, h);
  setupThreads(); // Reset threads to adjust to new dimensions
}

function setupThreads() {
  threads = [];
  originalPositions = [];
  
  let spacing = width / (numThreads + 1);
  for (let i = 1; i <= numThreads; i++) {
    let x = spacing * i;
    let thread = [];
    let originalThread = [];
    
    for (let j = 0; j < particlesPerThread; j++) {
      let y = j * height / (particlesPerThread - 1);
      let pos = createVector(x, y);
      
      let p = {
        pos: pos.copy(),
        vel: createVector(0, 0),
        acc: createVector(0, 0),
        isFixed: j === 0 || j === particlesPerThread - 1
      };
      
      thread.push(p);
      originalThread.push(pos.copy());
    }
    
    threads.push(thread);
    originalPositions.push(originalThread);
  }
}

function draw() {
  clear(); // Use clear instead of background for transparency
  updateSimulation();
  
  // Artistic rendering
  strokeWeight(1.5); // Thicker lines
  noFill();
  
  for (let i = 0; i < threads.length; i++) {
    let thread = threads[i];
    // Vary opacity based on position and time
    let alpha = map(sin(time + i * 0.1), -1, 1, 50, 180); // Higher alpha range
    let gradientColor = `rgba(255, 255, 255, ${alpha/255})`;
    
    // Add some color variation
    if (i % 3 === 0) {
      gradientColor = `rgba(150, 150, 255, ${alpha/255})`; // Blue tint
    } else if (i % 3 === 1) {
      gradientColor = `rgba(255, 150, 150, ${alpha/255})`; // Red tint
    }
    
    stroke(gradientColor);
    
    beginShape();
    for (let p of thread) {
      vertex(p.pos.x, p.pos.y);
    }
    endShape();
  }
  
  time += 0.02; // Faster animation
}

// Add this function to detect mouse movement
function mouseMoved() {
  mouseHasMoved = true;
}

function updateSimulation() {
  // Reset accelerations
  for (let thread of threads) {
    for (let p of thread) {
      p.acc.set(0, 0);
    }
  }

  // Gentle wave motion
  for (let i = 0; i < threads.length; i++) {
    for (let j = 0; j < threads[i].length; j++) {
      let p = threads[i][j];
      if (!p.isFixed) {
        // Add flowing motion
        let wave = sin(time + i * 0.2) * cos(j * 0.1);
        p.acc.add(createVector(wave * windForce, 0));
      }
    }
  }

  // Spring forces
  for (let thread of threads) {
    for (let i = 0; i < thread.length - 1; i++) {
      let p1 = thread[i];
      let p2 = thread[i + 1];
      let dir = p5.Vector.sub(p2.pos, p1.pos);
      let d = dir.mag();
      let restLength = height / (particlesPerThread - 1);
      let stretch = d - restLength;
      let force = dir.copy().normalize().mult(stretch * stiffness);
      
      if (!p1.isFixed) p1.acc.add(force);
      if (!p2.isFixed) p2.acc.sub(force);
    }
  }

  // Modified mouse interaction code to only apply when mouse has moved and not on mobile
  if (!isMobile && mouseHasMoved && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY < height) {
    let mousePos = createVector(mouseX, mouseY);
    for (let thread of threads) {
      for (let p of thread) {
        if (!p.isFixed) {
          let dir = p5.Vector.sub(p.pos, mousePos);
          let d = dir.mag();
          if (d < forceRadius) {
            // Adjust force for hover (slightly gentler than click)
            let forceMag = map(d, 0, forceRadius, forceStrength * 0.7, 0, true);
            let force = dir.copy().normalize().mult(forceMag);
            p.acc.add(force);
          }
        }
      }
    }
  }

  // Gentle return to original position
  for (let i = 0; i < threads.length; i++) {
    for (let j = 0; j < threads[i].length; j++) {
      let p = threads[i][j];
      if (!p.isFixed) {
        let originalPos = originalPositions[i][j];
        let returnDir = p5.Vector.sub(originalPos, p.pos);
        p.acc.add(returnDir.mult(returnForce));
      }
    }
  }

  // Update positions with controlled motion
  for (let thread of threads) {
    for (let p of thread) {
      if (!p.isFixed) {
        p.vel.add(p.acc);
        p.vel.mult(damping);
        
        // Limit velocity
        let speed = p.vel.mag();
        if (speed > maxVelocity) {
          p.vel.setMag(maxVelocity);
        }
        
        p.pos.add(p.vel);
      }
    }
  }
  
  // Randomly pluck some strings occasionally for more movement
  if (frameCount % 60 === 0) { // Every second (assuming 60fps)
    let randomThread = Math.floor(random(threads.length));
    let randomParticle = Math.floor(random(1, particlesPerThread - 1));
    
    if (threads[randomThread] && threads[randomThread][randomParticle]) {
      // Apply a random force to a particle
      let force = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
      force.mult(3); // Stronger force for visible effect
      threads[randomThread][randomParticle].vel.add(force);
    }
  }
}
