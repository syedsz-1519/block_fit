using System.Collections.Generic;
using UnityEngine;

namespace BlockFitPuzzle.Sudoku
{
    public static class SudokuValidator
    {
        // Real-time validation during drag
        public static ValidationResult ValidateDrag(ColorBlockShape block, int originX, int originY, SudokuGridData grid)
        {
            var result = new ValidationResult();
            
            if (block == null || grid == null)
            {
                result.IsValid = false;
                return result;
            }

            foreach (var offset in block.coordinates)
            {
                int targetX = originX + offset.x;
                int targetY = originY + offset.y;
                
                // Check bounds
                if (!grid.IsInBounds(targetX, targetY))
                {
                    result.AddError(ValidationError.OutOfBounds, targetX, targetY);
                    continue;
                }
                
                // Check overlap
                if (grid.cellStates[targetX, targetY] == SudokuGridData.CellState.Placed || 
                    grid.cellStates[targetX, targetY] == SudokuGridData.CellState.Fixed)
                {
                    result.AddError(ValidationError.Overlap, targetX, targetY);
                    continue;
                }
                
                // Check Sudoku color constraint
                SudokuGridData.SudokuColor blockColor = block.GetColorAt(offset.x, offset.y);
                if (!grid.IsValidPlacement(targetX, targetY, blockColor))
                {
                    result.AddError(ValidationError.SudokuConflict, targetX, targetY, blockColor);
                }
            }
            
            result.IsValid = result.Errors.Count == 0;
            return result;
        }
    }
}
