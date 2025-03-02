// DNA Helix Animation
// A p5.js background animation showing a DNA double helix

let dnaStrands = [];
let particles = [];
const PARTICLE_COUNT = 500;
const DNA_PAIRS = 30;
const DNA_RADIUS = 100;
const DNA_HEIGHT = 900;
const ROTATION_SPEED = 0.01;
let angleOffset = 0;
let canvas;

// DNA base pair colors
const BASE_COLORS = {
    A: [120, 230, 150], // Adenine - green
    T: [230, 120, 150], // Thymine - red
    G: [230, 180, 120], // Guanine - orange
    C: [120, 180, 230]  // Cytosine - blue
};

// Base pair complementary matches
const BASE_PAIRS = {
    A: 'T',
    T: 'A',
    G: 'C',
    C: 'G'
};

// Environment colors
const BG_COLOR = [10, 15, 30];
const BACKBONE_COLOR = [220, 220, 240];
const PARTICLE_COLORS = [
    [100, 200, 255, 150], // Light blue
    [150, 255, 200, 150], // Light green
    [255, 200, 100, 150]  // Light orange
];

function setup() {
    // Create canvas inside the specified container
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    canvas = createCanvas(w, h);
    canvas.parent('canvas-container');
    
    // Generate DNA sequence
    generateDNA();
    
    // Create environment particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
    }
}

function generateDNA() {
    // Create DNA strand with random bases
    dnaStrands = [];
    
    const bases = ['A', 'T', 'G', 'C'];
    
    for (let i = 0; i < DNA_PAIRS; i++) {
        // Random base for first strand
        let base1 = random(bases);
        // Complementary base for second strand
        let base2 = BASE_PAIRS[base1];
        
        dnaStrands.push({
            base1: base1,
            base2: base2,
            highlight: 0,
            offset: 0
        });
    }
}

function createParticle() {
    // Calculate position near DNA helix
    let angle = random(TWO_PI);
    let radius = random(DNA_RADIUS * 1.5, DNA_RADIUS * 4);
    let height = random(-DNA_HEIGHT/2, DNA_HEIGHT/2);
    
    return {
        x: width/2 + cos(angle) * radius,
        y: height + height/2,
        z: sin(angle) * radius,
        color: random(PARTICLE_COLORS),
        size: random(1, 3),
        speed: random(0.02, 0.08),
        angle: random(TWO_PI),
        ySpeed: random(-0.2, 0.2)
    };
}

function draw() {
    clear();
    background(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2], 200); // Semi-transparent background
    
    // Update rotation
    angleOffset += ROTATION_SPEED;
    
    // Center everything
    translate(width/2, height/2);
    
    // Draw environment particles
    updateParticles();
    
    // Draw DNA helix
    drawDNA();
    
    // Highlight random base pairs occasionally
    if (frameCount % 60 === 0) {
        highlightRandomBase();
    }
}

function drawDNA() {
    // DNA parameters
    let helixRadius = DNA_RADIUS;
    let helixHeight = DNA_HEIGHT;
    let pairsCount = dnaStrands.length;
    let pairSpacing = helixHeight / pairsCount;
    
    // Draw the two backbone strands
    strokeWeight(6);
    stroke(BACKBONE_COLOR[0], BACKBONE_COLOR[1], BACKBONE_COLOR[2], 200);
    noFill();
    
    // First backbone strand
    beginShape();
    for (let i = 0; i <= pairsCount; i++) {
        let angle = i * 0.5 + angleOffset;
        let x = cos(angle) * helixRadius;
        let y = -helixHeight/2 + i * pairSpacing;
        let z = sin(angle) * helixRadius;
        
        // Apply perspective
        let perspective = map(z, -helixRadius, helixRadius, 0.8, 1.2);
        vertex(x * perspective, y);
    }
    endShape();
    
    // Second backbone strand (180 degrees offset)
    beginShape();
    for (let i = 0; i <= pairsCount; i++) {
        let angle = i * 0.5 + angleOffset + PI;
        let x = cos(angle) * helixRadius;
        let y = -helixHeight/2 + i * pairSpacing;
        let z = sin(angle) * helixRadius;
        
        // Apply perspective
        let perspective = map(z, -helixRadius, helixRadius, 0.8, 1.2);
        vertex(x * perspective, y);
    }
    endShape();
    
    // Draw base pairs
    for (let i = 0; i < pairsCount; i++) {
        let pair = dnaStrands[i];
        let angle = i * 0.5 + angleOffset;
        let y = -helixHeight/2 + i * pairSpacing;
        
        // Calculate positions for the two backbone points
        let x1 = cos(angle) * helixRadius;
        let z1 = sin(angle) * helixRadius;
        let x2 = cos(angle + PI) * helixRadius;
        let z2 = sin(angle + PI) * helixRadius;
        
        // Apply perspective
        let perspective1 = map(z1, -helixRadius, helixRadius, 0.8, 1.2);
        let perspective2 = map(z2, -helixRadius, helixRadius, 0.8, 1.2);
        
        // Draw the connecting base pair
        strokeWeight(3);
        
        // Base 1 color
        let base1Color = BASE_COLORS[pair.base1];
        // Base 2 color
        let base2Color = BASE_COLORS[pair.base2];
        
        // Highlight effect
        let highlight = pair.highlight;
        if (highlight > 0) {
            // Brighten colors during highlight
            base1Color = [
                min(base1Color[0] + 50, 255),
                min(base1Color[1] + 50, 255),
                min(base1Color[2] + 50, 255)
            ];
            base2Color = [
                min(base2Color[0] + 50, 255),
                min(base2Color[1] + 50, 255),
                min(base2Color[2] + 50, 255)
            ];
            
            // Decrease highlight for next frame
            pair.highlight *= 0.95;
            if (pair.highlight < 0.1) pair.highlight = 0;
        }
        
        // First half of base pair
        stroke(base1Color[0], base1Color[1], base1Color[2], 230);
        line(x1 * perspective1, y, (x1 + x2) * 0.5, y);
        
        // Second half of base pair
        stroke(base2Color[0], base2Color[1], base2Color[2], 230);
        line((x1 + x2) * 0.5, y, x2 * perspective2, y);
        
        // Base labels
        if (z1 > 0) { // Only show when facing forward
            fill(base1Color[0], base1Color[1], base1Color[2]);
            noStroke();
            textSize(14);
            textAlign(CENTER, CENTER);
            text(pair.base1, x1 * perspective1 * 0.8, y);
        }
        
        if (z2 > 0) { // Only show when facing forward
            fill(base2Color[0], base2Color[1], base2Color[2]);
            noStroke();
            textSize(14);
            textAlign(CENTER, CENTER);
            text(pair.base2, x2 * perspective2 * 0.8, y);
        }
    }
}

function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        
        // Update particle position (circular motion around DNA)
        p.angle += p.speed * 0.02;
        p.y += p.ySpeed;
        
        // Recalculate x and z based on angle and radius
        let radius = sqrt(p.x * p.x + p.z * p.z);
        p.x = cos(p.angle) * radius;
        p.z = sin(p.angle) * radius;
        
        // Apply perspective
        let perspective = map(p.z, -DNA_RADIUS * 4, DNA_RADIUS * 4, 0.7, 1.3);
        let screenX = p.x * perspective;
        let screenY = p.y;
        
        // Draw particle with depth effect
        let alpha = map(perspective, 0.7, 1.3, 100, 255);
        fill(p.color[0], p.color[1], p.color[2], alpha);
        noStroke();
        ellipse(screenX, screenY, p.size * perspective);
        
        // Wrap around
        if (p.y < -height/2) p.y = height/2;
        if (p.y > height/2) p.y = -height/2;
    }
}

function highlightRandomBase() {
    // Randomly highlight a base pair
    let index = floor(random(dnaStrands.length));
    dnaStrands[index].highlight = 1;
}

function mousePressed() {
    // Find closest base pair to mouse
    let mouseYPos = mouseY - height/2;
    let pairSpacing = DNA_HEIGHT / dnaStrands.length;
    let index = floor(map(mouseYPos, -DNA_HEIGHT/2, DNA_HEIGHT/2, 0, dnaStrands.length));
    
    if (index >= 0 && index < dnaStrands.length) {
        // Highlight clicked base pair
        dnaStrands[index].highlight = 1;
        
        // Add particles at this location
        let y = -DNA_HEIGHT/2 + index * pairSpacing;
        for (let i = 0; i < 20; i++) {
            let p = createParticle();
            p.y = y;
            particles.push(p);
            
            // Remove oldest particle
            if (particles.length > PARTICLE_COUNT) {
                particles.shift();
            }
        }
    }
}

function mouseDragged() {
    // Add rotation based on mouse movement
    angleOffset += (mouseX - pmouseX) * 0.01;
    
    return false; // Prevent default
}

function windowResized() {
    // Resize canvas to fit container
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    resizeCanvas(container.offsetWidth, container.offsetHeight);
}