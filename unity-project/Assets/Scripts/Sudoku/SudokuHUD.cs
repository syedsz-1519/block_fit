using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace BlockFitPuzzle.Sudoku
{
    public class SudokuHUD : MonoBehaviour
    {
        public static SudokuHUD Instance { get; private set; }

        [Header("Sudoku Info Texts")]
        [SerializeField] private Text rowCompletionText;
        [SerializeField] private Text colCompletionText;
        [SerializeField] private Text regionCompletionText;
        
        [Header("Color Palette Indicators")]
        [SerializeField] private Image[] colorIndicators; // 6 colors representation
        [SerializeField] private Text[] colorCountTexts;  // Placed count per color
        
        [Header("Validation Feedback UI")]
        [SerializeField] private GameObject validPlacementIcon;
        [SerializeField] private GameObject invalidPlacementIcon;
        [SerializeField] private Text invalidReasonText;
        
        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void UpdateCompletionStatus(SudokuGridData grid)
        {
            if (grid == null) return;

            int completedRows = 0;
            int completedCols = 0;
            int completedRegions = 0;

            for (int r = 0; r < SudokuGridData.GRID_SIZE; r++)
            {
                if (grid.IsRowComplete(r)) completedRows++;
            }

            for (int c = 0; c < SudokuGridData.GRID_SIZE; c++)
            {
                if (grid.IsColumnComplete(c)) completedCols++;
            }

            for (int reg = 0; reg < SudokuGridData.GRID_SIZE; reg++)
            {
                if (grid.IsRegionComplete(reg)) completedRegions++;
            }

            if (rowCompletionText != null)
            {
                rowCompletionText.text = $"Rows Complete: {completedRows}/{SudokuGridData.GRID_SIZE}";
            }

            if (colCompletionText != null)
            {
                colCompletionText.text = $"Columns Complete: {completedCols}/{SudokuGridData.GRID_SIZE}";
            }

            if (regionCompletionText != null)
            {
                regionCompletionText.text = $"Regions Complete: {completedRegions}/{SudokuGridData.GRID_SIZE}";
            }

            UpdateColorCounts(grid);
        }
        
        public void ShowValidationFeedback(ValidationResult result)
        {
            if (result == null) return;

            if (result.IsValid)
            {
                if (validPlacementIcon != null) validPlacementIcon.SetActive(true);
                if (invalidPlacementIcon != null) invalidPlacementIcon.SetActive(false);
                if (invalidReasonText != null) invalidReasonText.text = "Valid Placement!";
            }
            else
            {
                if (validPlacementIcon != null) validPlacementIcon.SetActive(false);
                if (invalidPlacementIcon != null) invalidPlacementIcon.SetActive(true);

                if (invalidReasonText != null)
                {
                    if (result.Errors.Count > 0)
                    {
                        ValidationError err = result.Errors[0];
                        switch (err)
                        {
                            case ValidationError.OutOfBounds:
                                invalidReasonText.text = "Invalid: Out of bounds!";
                                break;
                            case ValidationError.Overlap:
                                invalidReasonText.text = "Invalid: Cells already occupied!";
                                break;
                            case ValidationError.SudokuConflict:
                                invalidReasonText.text = "Invalid: Sudoku color conflict!";
                                break;
                            default:
                                invalidReasonText.text = "Invalid Placement!";
                                break;
                        }
                    }
                    else
                    {
                        invalidReasonText.text = "Invalid Placement!";
                    }
                }
            }
        }
        
        public void UpdateColorCounts(SudokuGridData grid)
        {
            if (grid == null) return;

            // Initialize counts for each of the 6 colors
            int[] counts = new int[6];

            for (int y = 0; y < SudokuGridData.GRID_SIZE; y++)
            {
                for (int x = 0; x < SudokuGridData.GRID_SIZE; x++)
                {
                    var col = grid.playerGrid[x, y];
                    if (col.HasValue)
                    {
                        int index = (int)col.Value;
                        if (index >= 0 && index < 6)
                        {
                            counts[index]++;
                        }
                    }
                }
            }

            for (int i = 0; i < 6; i++)
            {
                if (i < colorCountTexts.Length && colorCountTexts[i] != null)
                {
                    colorCountTexts[i].text = $"{counts[i]}/6";
                }

                // If fully placed (6 of this color), we can make the color indicator glow or change look
                if (i < colorIndicators.Length && colorIndicators[i] != null)
                {
                    Color indicatorColor = colorIndicators[i].color;
                    indicatorColor.a = counts[i] == 6 ? 1.0f : 0.6f;
                    colorIndicators[i].color = indicatorColor;
                }
            }
        }
    }
}
