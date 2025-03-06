// Starry Night Effect for Background
// A digital tribute to Vincent van Gogh's masterpiece, designed for all screens!

// Constants and variables for the animation
let flowField = [];
let particles = [];
let stars = [];
let canvas, container;
let isMobile = false; // Flag for mobile detection

// Color palettes inspired by *The Starry Night*
const SKY_COLORS = [
    [19, 24, 98],   // Deep blue
    [16, 39, 126],  // Medium blue
    [25, 55, 155],  // Lighter blue
    [40, 70, 180],  // Bright blue
    [70, 100, 205]  // Light blue
];

const STAR_COLORS = [
    [255, 231, 122], // Pale yellow
    [255, 216, 97],  // Yellow
    [255, 202, 53],  // Golden yellow
    [255, 162, 0],   // Orange-yellow
    [240, 225, 160]  // Light yellow
];

// Animation parameters
const PARTICLE_COUNT = 1000;
const STAR_COUNT = 7;

// Fixed star positions (relative to canvas)
const STAR_POSITIONS = [
    { x: 0.15, y: 0.2, size: 12, halo: 35 },
    { x: 0.35, y: 0.15, size: 8, halo: 25 },
    { x: 0.6, y: 0.25, size: 10, halo: 30 },
    { x: 0.75, y: 0.1, size: 9, halo: 28 },
    { x: 0.25, y: 0.35, size: 14, halo: 40 },
    { x: 0.85, y: 0.3, size: 7, halo: 20 },
    { x: 0.5, y: 0.18, size: 11, halo: 32 }
];

// Reference width for scaling
const referenceWidth = 1000;

function setup() {
    // Initialize the canvas
    container = document.getElementById('starry-canvas-container');
    if (!container) return;

    let w = container.clientWidth;
    let h = container.clientHeight;

    canvas = createCanvas(w, h);
    canvas.parent('starry-canvas-container');
    background(19, 24, 98);

    // Check if device is mobile
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    noiseSeed(42);
    createFlowField();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        createParticle();
    }
    createStars();
}

function createFlowField() {
    // Calculate scale factor
    let scaleFactor = width / referenceWidth;

    // Scale flow field cell size
    let flowCellSize = 20 * scaleFactor;
    let cols = ceil(width / flowCellSize);
    let rows = ceil(height / flowCellSize);

    // Scale swirl radii
    let radiusMoon = 150 * scaleFactor;
    let radiusSwirl1 = 180 * scaleFactor;
    let radiusSwirl2 = 150 * scaleFactor;

    for (let y = 0; y < rows; y++) {
        flowField[y] = [];
        for (let x = 0; x < cols; x++) {
            let angle = noise(x * 0.1, y * 0.1) * TWO_PI * 2;

            // Moon swirl
            let moonX = width * 0.7;
            let moonY = height * 0.25;
            let distToMoon = dist(x * flowCellSize, y * flowCellSize, moonX, moonY);
            if (distToMoon < radiusMoon) {
                let moonAngle = atan2(y * flowCellSize - moonY, x * flowCellSize - moonX);
                angle = moonAngle + PI/2 + noise(x * 0.05, y * 0.05) * 0.5;
            }

            // First additional swirl
            let swirl1X = width * 0.3;
            let swirl1Y = height * 0.4;
            let distToSwirl1 = dist(x * flowCellSize, y * flowCellSize, swirl1X, swirl1Y);
            if (distToSwirl1 < radiusSwirl1) {
                let swirl1Angle = atan2(y * flowCellSize - swirl1Y, x * flowCellSize - swirl1X);
                angle = swirl1Angle + PI/2 + noise(x * 0.03, y * 0.03) * 0.7;
            }

            // Second additional swirl
            let swirl2X = width * 0.5;
            let swirl2Y = height * 0.6;
            let distToSwirl2 = dist(x * flowCellSize, y * flowCellSize, swirl2X, swirl2Y);
            if (distToSwirl2 < radiusSwirl2) {
                let swirl2Angle = atan2(y * flowCellSize - swirl2Y, x * flowCellSize - swirl2X);
                angle = swirl2Angle + PI/2 + noise(x * 0.04, y * 0.04) * 0.6;
            }

            flowField[y][x] = angle;
        }
    }
}

function createParticle(x, y) {
    let scaleFactor = width / referenceWidth;
    return particles.push({
        x: x || random(width),
        y: y || random(height),
        size: random(1, 3.5) * scaleFactor,
        color: random(SKY_COLORS),
        speed: random(0.3, 1.2),
        life: random(50, 200),
        maxLife: random(50, 200),
        alpha: random(40, 180),
        stepSize: random(1, 3)
    });
}

function createStars() {
    let scaleFactor = width / referenceWidth;
    for (let i = 0; i < STAR_COUNT; i++) {
        let position = STAR_POSITIONS[i];
        stars.push({
            x: width * position.x,
            y: height * position.y,
            size: position.size * scaleFactor,
            haloSize: position.halo * scaleFactor,
            color: random(STAR_COLORS),
            pulse: random(0.01, 0.03),
            angle: 0,
            raysLength: random(10, 25) * scaleFactor
        });
    }
}

function draw() {
    fill(19, 24, 98, 10);
    noStroke();
    rect(0, 0, width, height);

    updateParticles();
    drawStars();
    drawMoon();
}

function updateParticles() {
    let scaleFactor = width / referenceWidth;
    let flowCellSize = 20 * scaleFactor;
    let cols = ceil(width / flowCellSize);

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];

        let col = constrain(floor(p.x / flowCellSize), 0, cols - 1);
        let row = constrain(floor(p.y / flowCellSize), 0, flowField.length - 1);

        let flowAngle = flowField[row][col];

        let xStep = cos(flowAngle) * p.speed * p.stepSize;
        let yStep = sin(flowAngle) * p.speed * p.stepSize;

        stroke(p.color[0], p.color[1], p.color[2], p.alpha * (p.life / p.maxLife));
        strokeWeight(p.size);
        line(p.x, p.y, p.x + xStep, p.y + yStep);

        p.x += xStep;
        p.y += yStep;
        p.life--;

        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || p.life <= 0) {
            particles.splice(i, 1);
            createParticle();
        }
    }
}

function drawStars() {
    for (let star of stars) {
        star.angle += star.pulse;
        let pulseFactor = 1 + sin(star.angle) * 0.2;

        // Draw halo
        for (let i = 8; i > 0; i--) {
            fill(star.color[0], star.color[1], star.color[2], 3 + i * 2);
            noStroke();
            ellipse(star.x, star.y, star.haloSize * i / 4 * pulseFactor);
        }

        // Draw star core
        fill(star.color[0], star.color[1], star.color[2], 220);
        ellipse(star.x, star.y, star.size * pulseFactor);

        // Draw rays
        stroke(star.color[0], star.color[1], star.color[2], 150);
        strokeWeight(1.5);
        for (let a = 0; a < TWO_PI; a += PI/4) {
            let rayLength = star.raysLength * pulseFactor;
            line(
                star.x,
                star.y,
                star.x + cos(a + star.angle * 0.5) * rayLength,
                star.y + sin(a + star.angle * 0.5) * rayLength
            );
        }
    }
}

function drawMoon() {
    let scaleFactor = width / referenceWidth;
    let moonX = width * 0.7;
    let moonY = height * 0.25;

    let moonSize = 60 * scaleFactor;
    let haloBase = 70 * scaleFactor;
    let haloStep = 8 * scaleFactor;

    // Draw halo
    for (let i = 12; i > 0; i--) {
        fill(255, 255, 190, 2);
        noStroke();
        ellipse(moonX, moonY, haloBase + i * haloStep);
    }

    // Draw moon base
    fill(230, 230, 210);
    ellipse(moonX, moonY, moonSize);

    // Draw craters
    fill(200, 200, 180);
    ellipse(moonX - 10 * scaleFactor, moonY + 5 * scaleFactor, 20 * scaleFactor);

    fill(210, 210, 190);
    ellipse(moonX + 15 * scaleFactor, moonY - 8 * scaleFactor, 15 * scaleFactor);

    fill(190, 190, 170);
    ellipse(moonX + 5 * scaleFactor, moonY + 15 * scaleFactor, 10 * scaleFactor);
    ellipse(moonX - 18 * scaleFactor, moonY - 10 * scaleFactor, 8 * scaleFactor);
    ellipse(moonX + 20 * scaleFactor, moonY + 10 * scaleFactor, 6 * scaleFactor);

    fill(250, 250, 230, 180);
    ellipse(moonX - 15 * scaleFactor, moonY - 15 * scaleFactor, 12 * scaleFactor);
    ellipse(moonX + 10 * scaleFactor, moonY - 20 * scaleFactor, 8 * scaleFactor);

    fill(255, 255, 220, 100);
    ellipse(moonX, moonY, 70 * scaleFactor);
}

function mouseMoved() {
    // Skip user interaction on mobile devices
    if (isMobile) return false;
    
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY < height) {
        for (let i = 0; i < 3; i++) {
            createParticle(
                mouseX + random(-20, 20),
                mouseY + random(-20, 20)
            );
        }
        while (particles.length > PARTICLE_COUNT) {
            particles.shift();
        }
    }
    return false;
}

function windowResized() {
    // Skip resize handling on mobile devices to prevent scroll triggering reset
    if (isMobile) return;
    
    container = document.getElementById('starry-canvas-container');
    if (!container) return;

    let w = container.clientWidth;
    let h = container.clientHeight;

    resizeCanvas(w, h);
    background(19, 24, 98);
    createFlowField();
    stars = [];
    createStars();
}
