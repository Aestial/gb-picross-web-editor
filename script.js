// Language translations
const translations = {
  en: {
    subtitle: "Edit .gbsres files",
    howToUse: "How to use:",
    instructions: [
      'Upload a .gbsres file using the "Load File" button',
      "Select grid size (3x3, 5x5, or 10x10)",
      "Click on grid cells to toggle their state (active/inactive)",
      'Download the modified file with the "Save File" button',
    ],
    buttons: {
      load: "Load File",
      save: "Save File",
      clear: "Clear Grid",
    },
    status: {
      loading: "Loading file...",
      success: "File loaded successfully!",
      error: "Error: Invalid file structure",
      fileError: "Error reading file",
      noFile: "Error: No file loaded",
      saved: "File saved successfully!",
      cleared: "Grid cleared",
      sizeChange: "Grid size changed",
    },
  },
  es: {
    subtitle: "Editar archivos .gbsres",
    howToUse: "Cómo usar:",
    instructions: [
      'Sube un archivo .gbsres usando el botón "Cargar archivo"',
      "Selecciona el tamaño de la cuadrícula (3x3, 5x5 o 10x10)",
      "Haz clic en las celdas para cambiar su estado (activo/inactivo)",
      'Descarga el archivo modificado con el botón "Guardar archivo"',
    ],
    buttons: {
      load: "Cargar archivo",
      save: "Guardar archivo",
      clear: "Limpiar cuadrícula",
    },
    status: {
      loading: "Cargando archivo...",
      success: "¡Archivo cargado correctamente!",
      error: "Error: Estructura de archivo inválida",
      fileError: "Error al leer el archivo",
      noFile: "Error: No hay archivo cargado",
      saved: "¡Archivo guardado correctamente!",
      cleared: "Cuadrícula limpiada",
      sizeChange: "Tamaño de cuadrícula cambiado",
    },
  },
  zh: {
    subtitle: "编辑 .gbsres 文件",
    howToUse: "使用方法:",
    instructions: [
      "使用“加载文件”按钮上传.gbsres文件",
      "选择网格大小（3x3、5x5 或 10x10）",
      "点击网格单元切换状态（激活/非激活）",
      "使用“保存文件”按钮下载修改后的文件",
    ],
    buttons: {
      load: "加载文件",
      save: "保存文件",
      clear: "清除网格",
    },
    status: {
      loading: "正在加载文件...",
      success: "文件加载成功!",
      error: "错误: 无效的文件结构",
      fileError: "读取文件错误",
      noFile: "错误: 没有加载文件",
      saved: "文件保存成功!",
      cleared: "网格已清除",
      sizeChange: "网格大小已更改",
    },
  },
};

let currentLanguage = "en";
let gridData = Array(10)
  .fill()
  .map(() => Array(10).fill(false));
let jsonData = null;
let cellRefs = [];
let currentGridSize = 10;

// Update UI language
function updateLanguage() {
  const lang = translations[currentLanguage];
  document.getElementById("subtitle").textContent = lang.subtitle;
  document.getElementById("howToUse").textContent = lang.howToUse;

  const instructionsList = document.getElementById("instructionsList");
  instructionsList.innerHTML = "";
  lang.instructions.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    instructionsList.appendChild(li);
  });

  document.getElementById("loadBtn").textContent = lang.buttons.load;
  document.getElementById("saveBtn").textContent = lang.buttons.save;
  document.getElementById("clearBtn").textContent = lang.buttons.clear;
}

// Calculate nonogram hints for a given array
function calculateHints(arr) {
  const hints = [];
  let count = 0;

  for (const cell of arr) {
    if (cell) {
      count++;
    } else if (count > 0) {
      hints.push(count);
      count = 0;
    }
  }

  if (count > 0) hints.push(count);
  return hints.length > 0 ? hints : [0];
}

// Update nonogram hints display with fixed positioning
function updateHints() {
  const columnHintsContainer = document.getElementById("columnHints");
  const rowHintsContainer = document.getElementById("rowHints");

  // Clear existing hints
  columnHintsContainer.innerHTML = "";
  rowHintsContainer.innerHTML = "";

  // Create all 10 column hint cells (with placeholders for unused ones)
  for (let col = 0; col < 10; col++) {
    const hintCell = document.createElement("div");
    hintCell.className = "hint-cell";

    if (col < currentGridSize) {
      // Calculate hints for active columns
      const column = [];
      for (let row = 0; row < currentGridSize; row++) {
        column.push(gridData[col][row]);
      }
      const hints = calculateHints(column, true);

      // Add hint numbers
      hints.forEach((hint) => {
        const hintNumber = document.createElement("div");
        hintNumber.className = "hint-number";
        hintNumber.textContent = hint;
        hintCell.appendChild(hintNumber);
      });
    } else {
      // Add placeholder for inactive columns
      hintCell.classList.add("placeholder");
      const hintNumber = document.createElement("div");
      hintNumber.className = "hint-number";
      hintNumber.textContent = "0";
      hintCell.appendChild(hintNumber);
    }

    columnHintsContainer.appendChild(hintCell);
  }

  // Create all 10 row hint cells (with placeholders for unused ones)
  for (let row = 0; row < 10; row++) {
    const hintCell = document.createElement("div");
    hintCell.className = "hint-cell";

    if (row < currentGridSize) {
      // Calculate hints for active rows
      const rowData = [];
      for (let col = 0; col < currentGridSize; col++) {
        rowData.push(gridData[col][row]);
      }
      const hints = calculateHints(rowData);

      // Add hint numbers
      hints.forEach((hint) => {
        const hintNumber = document.createElement("div");
        hintNumber.className = "hint-number";
        hintNumber.textContent = hint;
        hintCell.appendChild(hintNumber);
      });
    } else {
      // Add placeholder for inactive rows
      hintCell.classList.add("placeholder");
      const hintNumber = document.createElement("div");
      hintNumber.className = "hint-number";
      hintNumber.textContent = "0";
      hintCell.appendChild(hintNumber);
    }

    rowHintsContainer.appendChild(hintCell);
  }
}

// Initialize grid UI
function initGrid() {
  const container = document.getElementById("gridContainer");
  container.innerHTML = "";
  cellRefs = [];

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = document.createElement("div");
      cell.className = `cell ${gridData[col][row] ? "active" : ""}`;
      cell.dataset.col = col;
      cell.dataset.row = row;

      if (col >= currentGridSize || row >= currentGridSize) {
        cell.classList.add("disabled");
      }

      cell.addEventListener("click", () => {
        const col = parseInt(cell.dataset.col);
        const row = parseInt(cell.dataset.row);

        if (col < currentGridSize && row < currentGridSize) {
          gridData[col][row] = !gridData[col][row];
          cell.classList.toggle("active", gridData[col][row]);
          updateHints(); // Update hints when grid changes
        }
      });

      container.appendChild(cell);
      cellRefs.push(cell);
    }
  }

  updateHints(); // Initial hints calculation
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
          (e) => e.command === "EVENT_INC_VALUE"
        );
        gridData[colIndex][rowIndex] = hasTrueIncrement;
      });
    });
    updateHints(); // Add this line
    showStatus(translations[currentLanguage].status.success, "success");
    return true;
  } catch (error) {
    console.error("Parsing error:", error);
    showStatus(translations[currentLanguage].status.error, "error");
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

      let trueIncrement = flagEvent.children.true.find(
        (e) => e.command === "EVENT_INC_VALUE"
      );

      let falseIncrement = flagEvent.children.false.find(
        (e) => e.command === "EVENT_INC_VALUE"
      );

      flagEvent.children.true = flagEvent.children.true.filter(
        (e) => e.command !== "EVENT_INC_VALUE"
      );

      flagEvent.children.false = flagEvent.children.false.filter(
        (e) => e.command !== "EVENT_INC_VALUE"
      );

      if (cellValue) {
        if (trueIncrement) {
          flagEvent.children.true.push(trueIncrement);
        } else if (falseIncrement) {
          flagEvent.children.true.push(falseIncrement);
        } else {
          flagEvent.children.true.push({
            command: "EVENT_INC_VALUE",
            args: { variable: "V1", __collapse: true },
            id: `gen_${colIndex}_${rowIndex}_${Date.now()}`,
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
            id: `gen_${colIndex}_${rowIndex}_${Date.now()}`,
          });
        }
      }
    });
  });
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;

  if (type === "success") {
    setTimeout(() => {
      statusEl.textContent = "";
      statusEl.className = "status";
    }, 3000);
  }
}

// Handle grid size change
function handleGridSizeChange() {
  currentGridSize = parseInt(document.getElementById("gridSize").value);
  gridData = Array(10)
    .fill()
    .map(() => Array(10).fill(false));
  initGrid();
  updateHints(); // Add this line
  updateGridInteractivity();
  showStatus(translations[currentLanguage].status.sizeChange, "success");
}

// Update grid interactivity based on current size
function updateGridInteractivity() {
  cellRefs.forEach((cell) => {
    const col = parseInt(cell.dataset.col);
    const row = parseInt(cell.dataset.row);

    if (col >= currentGridSize || row >= currentGridSize) {
      cell.classList.add("disabled");
    } else {
      cell.classList.remove("disabled");
    }
  });
}

// Handle language change
function handleLanguageChange() {
  currentLanguage = document.getElementById("languageSelect").value;
  updateLanguage();
}

// Initialize event listeners
function initEventListeners() {
  document.getElementById("loadBtn").addEventListener("click", () => {
    document.getElementById("fileInput").value = "";
    document.getElementById("fileInput").click();
  });

  let currentFileName = "";

  document.getElementById("fileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentFileName = file.name; // Store the original filename
    showStatus(translations[currentLanguage].status.loading, "loading");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        jsonData = JSON.parse(event.target.result);
        if (parseJsonData(jsonData)) {
          initGrid();
        }
      } catch (error) {
        console.error("File error:", error);
        showStatus(translations[currentLanguage].status.fileError, "error");
      }
    };
    reader.onerror = () => {
      showStatus(translations[currentLanguage].status.fileError, "error");
    };
    reader.readAsText(file);
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    if (!jsonData) {
      showStatus(translations[currentLanguage].status.noFile, "error");
      return;
    }

    try {
      updateJsonData();
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = currentFileName || "win_picross.gbsres";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus(translations[currentLanguage].status.saved, "success");
    } catch (error) {
      console.error("Saving error:", error);
      showStatus(translations[currentLanguage].status.error, "error");
    }
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    gridData = Array(10)
      .fill()
      .map(() => Array(10).fill(false));
    initGrid();
    updateHints(); // Add this line
    showStatus(translations[currentLanguage].status.cleared, "success");
  });

  document
    .getElementById("gridSize")
    .addEventListener("change", handleGridSizeChange);
  document
    .getElementById("languageSelect")
    .addEventListener("change", handleLanguageChange);
}

// Initialize the app
function initApp() {
  updateLanguage();
  initGrid();
  initEventListeners();
}

// Start the app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
