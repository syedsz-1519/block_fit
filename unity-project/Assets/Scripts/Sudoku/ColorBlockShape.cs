using UnityEngine;
using BlockFitPuzzle.Runtime;

namespace BlockFitPuzzle.Sudoku
{
    [CreateAssetMenu(fileName = "ColorBlock", menuName = "BlockFit/Color Block")]
    public class ColorBlockShape : ScriptableObject
    {
        public int id;
        public string colorHex;
        public Vector2Int[] coordinates; // Local coordinates representing the block cells
        
        // Each cell in the block has a specific color
        public SudokuGridData.SudokuColor[] cellColors;
        
        // The block must be placed where colors match Sudoku constraints
        public bool CanPlaceOnSudokuGrid(SudokuGridData sudoku, int originX, int originY)
        {
            if (coordinates == null || cellColors == null || cellColors.Length != coordinates.Length) return false;

            for (int i = 0; i < coordinates.Length; i++)
            {
                int targetX = originX + coordinates[i].x;
                int targetY = originY + coordinates[i].y;

                // Standard bounds check
                if (!sudoku.IsInBounds(targetX, targetY))
                {
                    return false;
                }

                // Standard overlap check
                if (sudoku.cellStates[targetX, targetY] == SudokuGridData.CellState.Placed ||
                    sudoku.cellStates[targetX, targetY] == SudokuGridData.CellState.Fixed)
                {
                    return false;
                }

                // Sudoku constraint check
                if (!sudoku.IsValidPlacement(targetX, targetY, cellColors[i]))
                {
                    return false;
                }
            }

            return true;
        }
        
        // Get color at specific offset
        public SudokuGridData.SudokuColor GetColorAt(int offsetX, int offsetY)
        {
            int index = GetCellIndex(offsetX, offsetY);
            if (index >= 0 && index < cellColors.Length)
            {
                return cellColors[index];
            }
            return SudokuGridData.SudokuColor.Red; // Safe fallback
        }

        public int GetCellIndex(int offsetX, int offsetY)
        {
            if (coordinates == null) return -1;
            for (int i = 0; i < coordinates.Length; i++)
            {
                if (coordinates[i].x == offsetX && coordinates[i].y == offsetY)
                {
                    return i;
                }
            }
            return -1;
        }
    }
}
