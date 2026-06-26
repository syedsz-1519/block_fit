using UnityEngine;
using System.Collections.Generic;
using BlockFitPuzzle.Runtime;

namespace BlockFitPuzzle.Sudoku
{
    [CreateAssetMenu(fileName = "SudokuLevel", menuName = "BlockFit/Sudoku Level")]
    public class SudokuLevelData : ScriptableObject
    {
        // Core grid config parameters
        public int id;
        public int gridWidth = 6;
        public int gridHeight = 6;
        public List<BlockShape> blocksToSpawn;

        // Sudoku-specific parameters
        public SudokuGridData sudokuGrid;
        public List<ColorBlockShape> availableColorBlocks;
        
        // Hybrid constraints
        public bool enforceSudokuRules = true; // if false, pure Block Fit
        public bool enforceColorMatch = true;  // blocks must match cell colors
        
        // Visual
        public bool showRegionBorders = true; // highlight 2x3 regions
        public bool showColorHints = false;     // highlight valid color placements
        
        // Scoring
        public int baseScore = 100;
        public float timeBonusMultiplier = 1.5f;
        public float sudokuBonus = 50f; // extra for perfect Sudoku completion
    }
}
