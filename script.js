const WIDTH = 60;
const HEIGHT = 60;
const CELL_SIZE = 10;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = WIDTH * CELL_SIZE;
canvas.height = HEIGHT * CELL_SIZE;

let running = false;
let grid = createRandomGrid();
let lastGrid = null;
let frameCount = 0;
const UPDATE_FREQUENCY = 10; // Nur alle 10 Frames updaten


// --------------------------
// GRID
// --------------------------

function createRandomGrid() {
    return Array.from({ length: HEIGHT }, () =>
        Array.from({ length: WIDTH }, () => Math.random() > 0.7 ? 1 : 0)
    );
}

function createEmptyGrid() {
    return Array.from({ length: HEIGHT }, () =>
        Array(WIDTH).fill(0)
    );
}


// --------------------------
// DRAW
// --------------------------

function draw() {
    // Change Detection - nur zeichnen wenn sich was ändert
    if (JSON.stringify(lastGrid) === JSON.stringify(grid)) return;
    
    lastGrid = grid.map(row => [...row]);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Weißer Hintergrund
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid-Linien einmalig zeichnen (optimiert)
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    
    for (let i = 0; i <= HEIGHT; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // Nur lebende Zellen zeichnen (Performance!)
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


// --------------------------
// NEIGHBORS
// --------------------------

function neighbors(x, y) {
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


// --------------------------
// STEP
// --------------------------

function step() {
    const newGrid = grid.map(row => [...row]);

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {

            const n = neighbors(x, y);

            newGrid[y][x] = (grid[y][x] === 1)
                ? (n === 2 || n === 3 ? 1 : 0)
                : (n === 3 ? 1 : 0);
        }
    }

    grid = newGrid;
}


// --------------------------
// ANIMATION LOOP
// --------------------------

function loop() {
    if (running) {
        frameCount++;
        
        // Nur alle UPDATE_FREQUENCY Frames updaten
        if (frameCount >= UPDATE_FREQUENCY) {
            step();
            frameCount = 0;
        }
    }
    
    draw();
    requestAnimationFrame(loop);
}


// --------------------------
// BUTTONS
// --------------------------

const startBtn = document.getElementById("startBtn");

startBtn.onclick = () => {
    running = !running;

    if (running) {
        startBtn.textContent = "Stop";
        startBtn.style.background = "red";
    } else {
        startBtn.textContent = "Start";
        startBtn.style.background = "green";
    }
};

document.getElementById("stepBtn").onclick = () => {
    if (!running) {
        step();
        lastGrid = null;
        draw();
    }
};

document.getElementById("renewBtn").onclick = () => {
    grid = createRandomGrid();
    lastGrid = null;
    draw();
};

document.getElementById("clearBtn").onclick = () => {
    grid = createEmptyGrid();
    lastGrid = null;
    draw();
};


// --------------------------
// CLICK TOGGLE
// --------------------------

canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        grid[y][x] = grid[y][x] ? 0 : 1;
        lastGrid = null;
        draw();
    }
});


// --------------------------
// INIT
// --------------------------

draw();
loop();
