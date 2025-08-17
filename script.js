let gridData = Array(10).fill().map(() => Array(10).fill(false));
let jsonData = null;
let cellRefs = [];
let currentGridSize = 10;

// Initialize grid UI
function initGrid() {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    cellRefs = [];
    
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${gridData[col][row] ? 'active' : ''}`;
            cell.dataset.col = col;
            cell.dataset.row = row;
            
            // Disable cells outside current grid size
            if (col >= currentGridSize || row >= currentGridSize) {
                cell.classList.add('disabled');
            }
            
            cell.addEventListener('click', () => {
                const col = parseInt(cell.dataset.col);
                const row = parseInt(cell.dataset.row);
                
                // Only allow toggling within current grid size
                if (col < currentGridSize && row < currentGridSize) {
                    gridData[col][row] = !gridData[col][row];
                    cell.classList.toggle('active', gridData[col][row]);
                }
            });
            
            container.appendChild(cell);
            cellRefs.push(cell);
        }
    }
}

// Parse JSON and extract grid data
function parseJsonData(json) {
    try {
        const flagsGroup = json.script[0].children.true[1];
        const columns = flagsGroup.children.true.slice(0, 10);
        
        columns.forEach((colGroup, colIndex) => {
            const flags = colGroup.children.true;
            flags.forEach((flagEvent, rowIndex) => {
                const hasTrueIncrement = flagEvent.children.true.some(
                    e => e.command === "EVENT_INC_VALUE"
                );
                gridData[colIndex][rowIndex] = hasTrueIncrement;
            });
        });
        showStatus("File loaded successfully!", "success");
        return true;
    } catch (error) {
        console.error("Parsing error:", error);
        showStatus("Error: Invalid file structure", "error");
        return false;
    }
}

// Update JSON with modified grid while preserving all IDs
function updateJsonData() {
    const flagsGroup = jsonData.script[0].children.true[1];
    const columns = flagsGroup.children.true.slice(0, 10);
    
    columns.forEach((colGroup, colIndex) => {
        const flags = colGroup.children.true;
        flags.forEach((flagEvent, rowIndex) => {
            const cellValue = gridData[colIndex][rowIndex];
            
            // Preserve existing EVENT_INC_VALUE objects
            let trueIncrement = flagEvent.children.true.find(
                e => e.command === "EVENT_INC_VALUE"
            );
            
            let falseIncrement = flagEvent.children.false.find(
                e => e.command === "EVENT_INC_VALUE"
            );
            
            // Clear arrays but keep other events if they exist
            flagEvent.children.true = flagEvent.children.true.filter(
                e => e.command !== "EVENT_INC_VALUE"
            );
            
            flagEvent.children.false = flagEvent.children.false.filter(
                e => e.command !== "EVENT_INC_VALUE"
            );
            
            // Add increment event to correct branch
            if (cellValue) {
                if (trueIncrement) {
                    flagEvent.children.true.push(trueIncrement);
                } else if (falseIncrement) {
                    flagEvent.children.true.push(falseIncrement);
                } else {
                    // Create new event if none exists (preserve ID structure)
                    flagEvent.children.true.push({
                        command: "EVENT_INC_VALUE",
                        args: { variable: "V1", __collapse: true },
                        id: `gen_${colIndex}_${rowIndex}_${Date.now()}`
                    });
                }
            } else {
                if (falseIncrement) {
                    flagEvent.children.false.push(falseIncrement);
                } else if (trueIncrement) {
                    flagEvent.children.false.push(trueIncrement);
                } else {
                    flagEvent.children.false.push({
                        command: "EVENT_INC_VALUE",
                        args: { variable: "V1", __collapse: true },
                        id: `gen_${colIndex}_${rowIndex}_${Date.now()}`
                    });
                }
            }
        });
    });
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status';
        }, 3000);
    }
}

// Handle grid size change
function handleGridSizeChange() {
    currentGridSize = parseInt(document.getElementById('gridSize').value);
    updateGridInteractivity();
}

// Update grid interactivity based on current size
function updateGridInteractivity() {
    cellRefs.forEach(cell => {
        const col = parseInt(cell.dataset.col);
        const row = parseInt(cell.dataset.row);
        
        if (col >= currentGridSize || row >= currentGridSize) {
            cell.classList.add('disabled');
        } else {
            cell.classList.remove('disabled');
        }
    });
}

// Initialize event listeners
function initEventListeners() {
    const loadBtn = document.getElementById('loadBtn');
    const fileInput = document.getElementById('fileInput');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const gridSizeSelect = document.getElementById('gridSize');
    
    loadBtn.addEventListener('click', () => {
        fileInput.value = ''; // Reset to allow re-uploading same file
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        showStatus("Loading file...", "loading");
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                jsonData = JSON.parse(event.target.result);
                if (parseJsonData(jsonData)) {
                    initGrid();
                }
            } catch (error) {
                console.error("File error:", error);
                showStatus("Error: Invalid .gbres file", "error");
            }
        };
        reader.onerror = () => {
            showStatus("Error reading file", "error");
        };
        reader.readAsText(file);
    });
    
    saveBtn.addEventListener('click', () => {
        if (!jsonData) {
            showStatus("Error: No file loaded", "error");
            return;
        }
        
        try {
            updateJsonData();
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'picross.gbres';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showStatus("File saved successfully!", "success");
        } catch (error) {
            console.error("Saving error:", error);
            showStatus("Error saving file", "error");
        }
    });
    
    clearBtn.addEventListener('click', () => {
        gridData = Array(10).fill().map(() => Array(10).fill(false));
        initGrid();
        showStatus("Grid cleared", "success");
    });
    
    gridSizeSelect.addEventListener('change', handleGridSizeChange);
}

// Initialize the app
function initApp() {
    initGrid();
    initEventListeners();
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);