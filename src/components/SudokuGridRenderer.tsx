import React from 'react';
import { motion } from 'motion/react';
import { 
  SudokuGridData, 
  SudokuColor, 
  SUDOKU_COLOR_MAP, 
  SUDOKU_COLOR_HINTS_MAP 
} from '../sudokuLogic';

interface SudokuGridRendererProps {
  gridData: SudokuGridData;
  draggedBlock: any;
  ghostPlacement: { x: number; y: number } | null;
  isGhostValid: boolean;
  onCellClick: (x: number, y: number) => void;
  colorblindMode?: boolean;
  showColorHints?: boolean;
  conflictCells?: { x: number; y: number }[];
}

export const SudokuGridRenderer: React.FC<SudokuGridRendererProps> = ({
  gridData,
  draggedBlock,
  ghostPlacement,
  isGhostValid,
  onCellClick,
  colorblindMode = false,
  showColorHints = true,
  conflictCells = []
}) => {
  const getCellStyles = (x: number, y: number) => {
    const isFixed = gridData.cellStates[y][x] === 'fixed';
    const isPlaced = gridData.cellStates[y][x] === 'placed';
    const color = gridData.playerGrid[y][x];

    let classes = "relative aspect-square flex items-center justify-center transition-all duration-250 cursor-pointer select-none ";
    let style: React.CSSProperties = {
      backgroundColor: '#F5F2EF', // Empty cell background
      borderWidth: '1px',
      borderColor: '#CCCCCC',
    };

    // Region styling borders: 6x6 grid with 2x3 subregions
    // Vertical borders after column 1 (c === 1) and column 3 (c === 3)
    if (x === 1 || x === 3) {
      style.borderRightWidth = '3px';
      style.borderRightColor = '#2D2D2D';
    }
    // Horizontal border after row 2 (y === 2)
    if (y === 2) {
      style.borderBottomWidth = '3px';
      style.borderBottomColor = '#2D2D2D';
    }

    // Border highlights if selected or has conflict
    const isConflict = conflictCells.some(cell => cell.x === x && cell.y === y);
    
    if (isConflict) {
      style.backgroundColor = 'rgba(241, 196, 15, 0.35)'; // Yellow conflict background
      style.outline = '3px solid #F1C40F';
      style.zIndex = 10;
    }

    if (isFixed || isPlaced) {
      if (color) {
        style.backgroundColor = SUDOKU_COLOR_MAP[color];
        style.borderColor = 'rgba(0,0,0,0.15)';
      }
    } else {
      // Default empty background
      style.backgroundColor = '#F5F2EF';
    }

    // Ghost Drag Preview logic
    const isGhostActive = ghostPlacement !== null && draggedBlock !== null;
    let isGhostCoordinate = false;
    let ghostColor: SudokuColor | null = null;

    if (isGhostActive && draggedBlock) {
      const draggedCells = draggedBlock.cells; // Array of [ox, oy]
      const draggedCellColors = draggedBlock.cellColors || []; // Corresponding colors

      for (let i = 0; i < draggedCells.length; i++) {
        const [ox, oy] = draggedCells[i];
        if (ghostPlacement!.x + ox === x && ghostPlacement!.y + oy === y) {
          isGhostCoordinate = true;
          ghostColor = draggedCellColors[i] || null;
          break;
        }
      }
    }

    if (isGhostCoordinate) {
      if (isGhostValid) {
        // Valid placement = Green transparent glow showing block's intended color
        style.backgroundColor = ghostColor ? `${SUDOKU_COLOR_MAP[ghostColor]}90` : 'rgba(46, 204, 113, 0.5)';
        style.outline = '4px solid #2ECC71';
        style.outlineOffset = '-2px';
        style.zIndex = 20;
      } else {
        // Invalid placement = Red transparent flash
        style.backgroundColor = 'rgba(232, 76, 61, 0.5)';
        style.outline = '4px solid #E84C3D';
        style.outlineOffset = '-2px';
        style.zIndex = 20;
      }
    }

    // Fallback: If showing color hints and cell is empty, show subtle hint of the solution color
    if (!isPlaced && !isFixed && !isGhostCoordinate && showColorHints) {
      const solutionColor = gridData.solutionGrid[y][x];
      if (solutionColor) {
        style.backgroundColor = SUDOKU_COLOR_HINTS_MAP[solutionColor];
      }
    }

    return { classes, style, isFixed, isPlaced, color };
  };

  return (
    <div className="w-full max-w-[380px] bg-[#FAF8F5] p-3 rounded-3xl border border-gray-300 shadow-xl relative select-none">
      {/* 6x6 Grid Container */}
      <div 
        className="grid gap-0 overflow-hidden rounded-2xl border-2 border-[#2D2D2D]"
        style={{
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(6, minmax(0, 1fr))'
        }}
      >
        {Array.from({ length: 6 }).map((_, y) => (
          Array.from({ length: 6 }).map((_, x) => {
            const { classes, style, isFixed, isPlaced, color } = getCellStyles(x, y);

            return (
              <motion.div
                key={`${y}-${x}`}
                className={classes}
                style={style}
                whileHover={!isFixed ? { scale: 1.05, zIndex: 15 } : {}}
                whileTap={!isFixed ? { scale: 0.95 } : {}}
                onClick={() => onCellClick(x, y)}
              >
                {/* Visual content for fixed prefilled cells */}
                {isFixed && (
                  <div className="absolute top-1 left-1.5 text-[8px] font-mono font-black uppercase text-white/50 tracking-wider">
                    ★
                  </div>
                )}

                {/* Main symbol representation of color or colorblind pattern overlay */}
                {(isFixed || isPlaced) && color && (
                  <span className="text-white text-xs font-black drop-shadow font-mono tracking-tight text-center">
                    {color.substring(0, 3).toUpperCase()}
                  </span>
                )}

                {/* Simple center dot for empty hintless cells */}
                {!isFixed && !isPlaced && !showColorHints && (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400/25" />
                )}

                {/* Colorblind visual pattern */}
                {colorblindMode && color && (
                  <div 
                    className="absolute inset-0 rounded-md pointer-events-none opacity-25 mix-blend-overlay"
                    style={{
                      backgroundImage: color === SudokuColor.Red ? 'radial-gradient(circle, #fff 10%, transparent 11%)' :
                                      color === SudokuColor.Blue ? 'linear-gradient(45deg, #fff 25%, transparent 25%)' :
                                      color === SudokuColor.Green ? 'linear-gradient(90deg, #fff 50%, transparent 50%)' :
                                      color === SudokuColor.Yellow ? 'radial-gradient(circle, transparent 20%, #fff 20%, #fff 30%, transparent 30%)' :
                                      color === SudokuColor.Purple ? 'linear-gradient(135deg, #fff 25%, transparent 25%)' :
                                      'repeating-linear-gradient(0deg, #fff, #fff 2px, transparent 2px, transparent 10px)'
                    }}
                  />
                )}
              </motion.div>
            );
          })
        ))}
      </div>
    </div>
  );
};
