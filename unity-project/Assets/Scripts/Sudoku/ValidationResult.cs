using System.Collections.Generic;

namespace BlockFitPuzzle.Sudoku
{
    public enum ValidationError { OutOfBounds, Overlap, SudokuConflict }

    public class ValidationResult
    {
        public bool IsValid;
        public List<ValidationError> Errors = new List<ValidationError>();

        public void AddError(ValidationError error, int x, int y, SudokuGridData.SudokuColor? color = null)
        {
            Errors.Add(error);
        }
    }
}
