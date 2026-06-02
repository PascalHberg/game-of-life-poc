// ============================================
// GAME OF LIFE - PIXEL BLOCK MODE + GRID
// ============================================

const CONFIG = {
    CELL_SIZE: 12,              // größere Pixel-Blöcke
    UPDATE_FREQUENCY: 10
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

let WIDTH = 80;
let HEIGHT = 50;

let running = false;
let grid = null;
let gridBuffer = null;

let frameCount = 0;

// ============================================
// GRID
// ============================================

function createRandomGrid() {
    return Array.from({ length: HEIGHT }, () =>
        new Uint8Array(WIDTH).map(() => (Math.random() > 0.7 ? 1 : 0))
    );
}

function createEmptyGrid() {
    return Array.from({ length: HEIGHT }, () => new Uint8Array(WIDTH));
}

function createGridBuffer() {
    return Array.from({ length: HEIGHT }, () => new Uint8Array(WIDTH));
}

// ============================================
// CANVAS
// ============================================

function initCanvas() {
    canvas.width = WIDTH * CONFIG.CELL_SIZE;
    canvas.height = HEIGHT * CONFIG.CELL_SIZE;

    canvas.style.imageRendering = "pixelated";
}

// ============================================
// NEIGHBORS
// ============================================

function countNeighbors(x, y) {
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = (x + dx + WIDTH) % WIDTH;
            const ny = (y + dy + HEIGHT) % HEIGHT;

            count += grid[ny][nx];
        }
    }
    return count;
}

// ============================================
// STEP
// ============================================

function step() {
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const n = countNeighbors(x, y);

            gridBuffer[y][x] =
                grid[y][x] === 1
                    ? (n === 2 || n === 3 ? 1 : 0)
                    : (n === 3 ? 1 : 0);
        }
    }

    [grid, gridBuffer] = [gridBuffer, grid];
}

// ============================================
// DRAW (GRID + BLOCK PIXELS)
// ============================================

function drawGrid() {
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;

    for (let x = 0; x <= WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CONFIG.CELL_SIZE, 0);
        ctx.lineTo(x * CONFIG.CELL_SIZE, HEIGHT * CONFIG.CELL_SIZE);
        ctx.stroke();
    }

    for (let y = 0; y <= HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CONFIG.CELL_SIZE);
        ctx.lineTo(WIDTH * CONFIG.CELL_SIZE, y * CONFIG.CELL_SIZE);
        ctx.stroke();
    }
}

function draw() {
    // Hintergrund
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // lebende Zellen
    ctx.fillStyle = "black";

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (grid[y][x] === 1) {
                ctx.fillRect(
                    x * CONFIG.CELL_SIZE + 1,
                    y * CONFIG.CELL_SIZE + 1,
                    CONFIG.CELL_SIZE - 2,
                    CONFIG.CELL_SIZE - 2
                );
            }
        }
    }

    // Raster drüber
    drawGrid();
}

// ============================================
// LOOP
// ============================================

function loop() {
    if (running) {
        frameCount++;
        if (frameCount >= CONFIG.UPDATE_FREQUENCY) {
            step();
            frameCount = 0;
        }
    }

    draw();
    requestAnimationFrame(loop);
}

// ============================================
// INPUT
// ============================================

function getCell(e) {
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor((e.clientX - rect.left) / CONFIG.CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CONFIG.CELL_SIZE);

    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        return { x, y };
    }
    return null;
}

function paint(x, y, value) {
    grid[y][x] = value;
}

// Mouse
let isDown = false;

canvas.addEventListener("mousedown", (e) => {
    if (running) return;
    isDown = true;

    const c = getCell(e);
    if (c) paint(c.x, c.y, grid[c.y][c.x] ? 0 : 1);
});

canvas.addEventListener("mousemove", (e) => {
    if (!isDown || running) return;

    const c = getCell(e);
    if (c) paint(c.x, c.y, 1);
});

canvas.addEventListener("mouseup", () => (isDown = false));

// Touch
canvas.addEventListener("touchmove", (e) => {
    if (running) return;
    e.preventDefault();

    for (let t of e.touches) {
        const c = getCell(t);
        if (c) paint(c.x, c.y, 1);
    }
}, { passive: false });

// ============================================
// BUTTONS 
// ============================================

const startBtn = document.getElementById("startBtn");

startBtn.onclick = () => {
    running = !running;

    if (running) {
        startBtn.textContent = "Stop";
        startBtn.style.background = "red";
        startBtn.style.color = "white";
    } else {
        startBtn.textContent = "Start";
        startBtn.style.background = "green";
        startBtn.style.color = "white";
    }
};

document.getElementById("stepBtn").onclick = () => {
    if (!running) {
        step();
        draw();
    }
};

document.getElementById("renewBtn").onclick = () => {
    grid = createRandomGrid();
    gridBuffer = createGridBuffer();
    draw();
};

document.getElementById("clearBtn").onclick = () => {
    grid = createEmptyGrid();
    gridBuffer = createGridBuffer();
    draw();
};
// ============================================
// INFO MODAL
// ============================================

const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const closeBtn = document.querySelector(".close-btn");

infoBtn.onclick = () => {
    infoModal.classList.remove("hidden");
};

closeBtn.onclick = () => {
    infoModal.classList.add("hidden");
};

infoModal.onclick = (e) => {
    if (e.target === infoModal) {
        infoModal.classList.add("hidden");
    }
};
// ============================================
// INIT
// ============================================

function init() {
    initCanvas();
    grid = createRandomGrid();
    gridBuffer = createGridBuffer();
    loop();
}

init();
