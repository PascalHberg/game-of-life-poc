// ============================================
// GAME OF LIFE - OPTIMIZED & MOBILE ENABLED
// ============================================

// CONFIGURATION - Responsive sizing
const CONFIG = {
    MIN_CELL_SIZE: 16,
    MAX_CELL_SIZE: 40,
    DEFAULT_CELL_SIZE: 24,
    UPDATE_FREQUENCY: 10, // Updates every N frames
    TOUCH_PAINT_MODE: true // Enable painting mode
};

// DOM Elements
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const container = document.querySelector(".canvas-container") || canvas.parentElement;

// Game State
let WIDTH = 50;
let HEIGHT = 30;
let CELL_SIZE = CONFIG.DEFAULT_CELL_SIZE;

let running = false;
let grid = null;
let gridBuffer = null; // Pre-allocated buffer for step calculations
let dirtyRegions = []; // Track changed regions for efficient redraw
let frameCount = 0;
let needsFullRedraw = true;

// Painting/Erasing State
let isMouseDown = false;
let paintMode = true; // true = paint (alive), false = erase (dead)
let lastPaintedCells = new Set(); // Track painted cells this frame

// ============================================
// RESPONSIVE SIZING
// ============================================

function initializeCanvasSize() {
    const rect = container.getBoundingClientRect();
    const availableWidth = Math.min(window.innerWidth * 0.95, 1000);
    const availableHeight = Math.min(window.innerHeight * 0.6, 600);

    // Calculate optimal cell size
    CELL_SIZE = Math.floor(
        Math.min(
            availableWidth / WIDTH,
            availableHeight / HEIGHT,
            CONFIG.MAX_CELL_SIZE
        )
    );
    CELL_SIZE = Math.max(CELL_SIZE, CONFIG.MIN_CELL_SIZE);

    canvas.width = WIDTH * CELL_SIZE;
    canvas.height = HEIGHT * CELL_SIZE;
    
    // Set canvas style for crisp rendering
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    canvas.style.imageRendering = "pixelated";
    canvas.style.imageRendering = "crisp-edges";
    
    needsFullRedraw = true;
}

// Recalculate on window resize
window.addEventListener("resize", debounce(() => {
    initializeCanvasSize();
    draw();
}, 250));

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ============================================
// GRID MANAGEMENT
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
// OPTIMIZED DRAWING - Static Grid Lines
// ============================================

let gridLinesCanvas = null;
let gridLinesCtx = null;

function createGridLinesImage() {
    if (!gridLinesCanvas) {
        gridLinesCanvas = document.createElement("canvas");
        gridLinesCtx = gridLinesCanvas.getContext("2d");
    }

    gridLinesCanvas.width = WIDTH * CELL_SIZE;
    gridLinesCanvas.height = HEIGHT * CELL_SIZE;

    gridLinesCtx.fillStyle = "white";
    gridLinesCtx.fillRect(0, 0, gridLinesCanvas.width, gridLinesCanvas.height);

    gridLinesCtx.strokeStyle = "#ddd";
    gridLinesCtx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= WIDTH; i++) {
        gridLinesCtx.beginPath();
        gridLinesCtx.moveTo(i * CELL_SIZE, 0);
        gridLinesCtx.lineTo(i * CELL_SIZE, gridLinesCanvas.height);
        gridLinesCtx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= HEIGHT; i++) {
        gridLinesCtx.beginPath();
        gridLinesCtx.moveTo(0, i * CELL_SIZE);
        gridLinesCtx.lineTo(gridLinesCanvas.width, i * CELL_SIZE);
        gridLinesCtx.stroke();
    }

    return gridLinesCanvas;
}

function draw() {
    if (needsFullRedraw) {
        // Full redraw: background + grid lines
        const gridImage = createGridLinesImage();
        ctx.drawImage(gridImage, 0, 0);
        needsFullRedraw = false;
    } else {
        // Partial redraw: only update changed regions
        ctx.fillStyle = "white";
        dirtyRegions.forEach(region => {
            ctx.fillRect(region.x, region.y, region.w, region.h);
            
            // Redraw grid lines for this region
            ctx.strokeStyle = "#ddd";
            ctx.lineWidth = 1;
            
            // Vertical lines in region
            for (let i = Math.floor(region.x / CELL_SIZE); i <= Math.ceil((region.x + region.w) / CELL_SIZE); i++) {
                ctx.beginPath();
                ctx.moveTo(i * CELL_SIZE, region.y);
                ctx.lineTo(i * CELL_SIZE, region.y + region.h);
                ctx.stroke();
            }
            
            // Horizontal lines in region
            for (let i = Math.floor(region.y / CELL_SIZE); i <= Math.ceil((region.y + region.h) / CELL_SIZE); i++) {
                ctx.beginPath();
                ctx.moveTo(region.x, i * CELL_SIZE);
                ctx.lineTo(region.x + region.w, i * CELL_SIZE);
                ctx.stroke();
            }
        });
        dirtyRegions = [];
    }

    // Draw alive cells (black)
    ctx.fillStyle = "black";
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (grid[y][x] === 1) {
                ctx.fillRect(
                    x * CELL_SIZE + 1,
                    y * CELL_SIZE + 1,
                    CELL_SIZE - 2,
                    CELL_SIZE - 2
                );
            }
        }
    }
}

function markDirtyRegion(x, y) {
    // Mark a cell region as dirty for redraw
    dirtyRegions.push({
        x: x * CELL_SIZE,
        y: y * CELL_SIZE,
        w: CELL_SIZE,
        h: CELL_SIZE
    });
}

// ============================================
// GAME LOGIC
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

function step() {
    // Use pre-allocated buffer instead of creating new array
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const n = countNeighbors(x, y);
            gridBuffer[y][x] = (grid[y][x] === 1)
                ? (n === 2 || n === 3 ? 1 : 0)
                : (n === 3 ? 1 : 0);
        }
    }

    // Swap grids
    [grid, gridBuffer] = [gridBuffer, grid];
    needsFullRedraw = true;
}

// ============================================
// ANIMATION LOOP
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
// PAINTING/ERASING - MOUSE EVENTS
// ============================================

function getCellFromEvent(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        return { x, y };
    }
    return null;
}

function paintCell(x, y, value) {
    if (grid[y][x] !== value) {
        grid[y][x] = value;
        markDirtyRegion(x, y);
        lastPaintedCells.add(`${x},${y}`);
    }
}

// Paint brush with variable size (larger on mobile for easier drawing)
function paintBrush(x, y, value, brushSize = 1) {
    for (let dy = -Math.floor(brushSize / 2); dy <= Math.floor(brushSize / 2); dy++) {
        for (let dx = -Math.floor(brushSize / 2); dx <= Math.floor(brushSize / 2); dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
                paintCell(nx, ny, value);
            }
        }
    }
}

// Mouse events
canvas.addEventListener("mousedown", (e) => {
    if (running) return; // Disable drawing while simulation running
    isMouseDown = true;
    lastPaintedCells.clear();
    const cell = getCellFromEvent(e.clientX, e.clientY);
    if (cell) {
        // Detect if clicking on alive cell = erase, dead cell = paint
        paintMode = grid[cell.y][cell.x] === 0;
        const brushSize = CELL_SIZE <= 10 ? 2 : 1;
        paintBrush(cell.x, cell.y, paintMode ? 1 : 0, brushSize);
        needsFullRedraw = true;
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!isMouseDown || running) return;
    const cell = getCellFromEvent(e.clientX, e.clientY);
    if (cell) {
        const cellKey = `${cell.x},${cell.y}`;
        if (!lastPaintedCells.has(cellKey)) {
            const brushSize = CELL_SIZE <= 10 ? 2 : 1;
            paintBrush(cell.x, cell.y, paintMode ? 1 : 0, brushSize);
            needsFullRedraw = true;
        }
    }
});

canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
    lastPaintedCells.clear();
});

canvas.addEventListener("mouseleave", () => {
    isMouseDown = false;
    lastPaintedCells.clear();
});

// ============================================
// TOUCH EVENTS - MOBILE PAINTING
// ============================================

canvas.addEventListener("touchstart", (e) => {
    if (running) return;
    e.preventDefault();
    isMouseDown = true;
    lastPaintedCells.clear();
    
    for (let touch of e.touches) {
        const cell = getCellFromEvent(touch.clientX, touch.clientY);
        if (cell) {
            paintMode = grid[cell.y][cell.x] === 0;
            const brushSize = Math.max(2, Math.floor(CELL_SIZE / 10)); // Adaptive brush
            paintBrush(cell.x, cell.y, paintMode ? 1 : 0, brushSize);
            needsFullRedraw = true;
        }
    }
});

canvas.addEventListener("touchmove", (e) => {
    if (!isMouseDown || running) return;
    e.preventDefault();
    
    for (let touch of e.touches) {
        const cell = getCellFromEvent(touch.clientX, touch.clientY);
        if (cell) {
            const cellKey = `${cell.x},${cell.y}`;
            if (!lastPaintedCells.has(cellKey)) {
                const brushSize = Math.max(2, Math.floor(CELL_SIZE / 10));
                paintBrush(cell.x, cell.y, paintMode ? 1 : 0, brushSize);
                needsFullRedraw = true;
            }
        }
    }
});

canvas.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
        isMouseDown = false;
        lastPaintedCells.clear();
    }
});

// ============================================
// BUTTON CONTROLS
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
        needsFullRedraw = true;
        draw();
    }
};

document.getElementById("renewBtn").onclick = () => {
    grid = createRandomGrid();
    gridBuffer = createGridBuffer();
    needsFullRedraw = true;
    draw();
};

document.getElementById("clearBtn").onclick = () => {
    grid = createEmptyGrid();
    gridBuffer = createGridBuffer();
    needsFullRedraw = true;
    draw();
};

// ============================================
// MODAL CONTROLS
// ============================================

const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const closeBtn = document.querySelector(".close-btn");

infoBtn.addEventListener("click", () => {
    infoModal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
    infoModal.classList.add("hidden");
});

infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) {
        infoModal.classList.add("hidden");
    }
});

// ============================================
// INITIALIZATION
// ============================================

function init() {
    initializeCanvasSize();
    grid = createRandomGrid();
    gridBuffer = createGridBuffer();
    draw();
    loop();
}

init();
