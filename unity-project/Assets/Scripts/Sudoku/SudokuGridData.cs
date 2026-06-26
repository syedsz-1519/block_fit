using System;
using System.Collections.Generic;
using UnityEngine;

namespace BlockFitPuzzle.Sudoku
{
    public class SudokuGridData
    {
        public const int GRID_SIZE = 6;
        public const int REGION_WIDTH = 2;
        public const int REGION_HEIGHT = 3;
        
        public enum CellState { Empty, Fixed, Placed, Invalid }
        public enum SudokuColor { Red, Blue, Green, Yellow, Purple, Orange }
        public enum Difficulty { Easy, Medium, Hard, Expert }
        
        public SudokuColor?[,] solutionGrid = new SudokuColor?[GRID_SIZE, GRID_SIZE];
        public CellState[,] cellStates = new CellState[GRID_SIZE, GRID_SIZE];
        public SudokuColor?[,] playerGrid = new SudokuColor?[GRID_SIZE, GRID_SIZE];
        
        public bool IsValidPlacement(int x, int y, SudokuColor color)
        {
            // Check row constraint (along x)
            for (int col = 0; col < GRID_SIZE; col++)
            {
                if (col != x && playerGrid[col, y] == color)
                    return false;
            }

            // Check column constraint (along y)
            for (int r = 0; r < GRID_SIZE; r++)
            {
                if (r != y && playerGrid[x, r] == color)
                    return false;
            }

            // Check 2x3 region constraint
            int regionIndex = GetRegionIndex(x, y);
            var (startX, startY) = GetRegionStart(regionIndex);
            for (int r = startY; r < startY + REGION_HEIGHT; r++)
            {
                for (int col = startX; col < startX + REGION_WIDTH; col++)
                {
                    if (col != x && r != y && playerGrid[col, r] == color)
                        return false;
                }
            }

            return true;
        }

        public bool IsRowComplete(int row)
        {
            HashSet<SudokuColor> colors = new HashSet<SudokuColor>();
            for (int col = 0; col < GRID_SIZE; col++)
            {
                SudokuColor? c = playerGrid[col, row];
                if (c == null) return false;
                colors.Add(c.Value);
            }
            return colors.Count == GRID_SIZE;
        }

        public bool IsColumnComplete(int col)
        {
            HashSet<SudokuColor> colors = new HashSet<SudokuColor>();
            for (int row = 0; row < GRID_SIZE; row++)
            {
                SudokuColor? c = playerGrid[col, row];
                if (c == null) return false;
                colors.Add(c.Value);
            }
            return colors.Count == GRID_SIZE;
        }

        public bool IsRegionComplete(int regionIndex)
        {
            var (startX, startY) = GetRegionStart(regionIndex);
            HashSet<SudokuColor> colors = new HashSet<SudokuColor>();
            for (int y = startY; y < startY + REGION_HEIGHT; y++)
            {
                for (int x = startX; x < startX + REGION_WIDTH; x++)
                {
                    SudokuColor? c = playerGrid[x, y];
                    if (c == null) return false;
                    colors.Add(c.Value);
                }
            }
            return colors.Count == GRID_SIZE;
        }

        public bool IsRegionComplete(int regionX, int regionY)
        {
            int regionIndex = regionY * (GRID_SIZE / REGION_WIDTH) + regionX;
            return IsRegionComplete(regionIndex);
        }

        public bool IsGridComplete()
        {
            for (int r = 0; r < GRID_SIZE; r++)
            {
                if (!IsRowComplete(r)) return false;
            }
            for (int c = 0; c < GRID_SIZE; c++)
            {
                if (!IsColumnComplete(c)) return false;
            }
            for (int ry = 0; ry < GRID_SIZE / REGION_HEIGHT; ry++)
            {
                for (int rx = 0; rx < GRID_SIZE / REGION_WIDTH; rx++)
                {
                    if (!IsRegionComplete(rx, ry)) return false;
                }
            }
            return true;
        }
        
        public int GetRegionIndex(int x, int y) => (y / REGION_HEIGHT) * (GRID_SIZE / REGION_WIDTH) + (x / REGION_WIDTH);
        
        public (int startX, int startY) GetRegionStart(int regionIndex)
        {
            int regionsAcross = GRID_SIZE / REGION_WIDTH;
            int regY = regionIndex / regionsAcross;
            int regX = regionIndex % regionsAcross;
            return (regX * REGION_WIDTH, regY * REGION_HEIGHT);
        }
        
        public void GenerateValidSolution()
        {
            for (int y = 0; y < GRID_SIZE; y++)
            {
                for (int x = 0; x < GRID_SIZE; x++)
                {
                    solutionGrid[x, y] = null;
                }
            }

            SolveBacktracking(0, 0);
        }

        private bool SolveBacktracking(int x, int y)
        {
            if (y == GRID_SIZE) return true;
            int nextX = x + 1;
            int nextY = y;
            if (nextX >= GRID_SIZE)
            {
                nextX = 0;
                nextY = y + 1;
            }

            List<SudokuColor> colors = new List<SudokuColor>((SudokuColor[])Enum.GetValues(typeof(SudokuColor)));
            // Shuffle colors for random solutions
            for (int i = colors.Count - 1; i > 0; i--)
            {
                int r = UnityEngine.Random.Range(0, i + 1);
                SudokuColor temp = colors[i];
                colors[i] = colors[r];
                colors[r] = temp;
            }

            foreach (SudokuColor color in colors)
            {
                if (IsValidInSolutionGrid(x, y, color))
                {
                    solutionGrid[x, y] = color;
                    if (SolveBacktracking(nextX, nextY))
                    {
                        return true;
                    }
                    solutionGrid[x, y] = null;
                }
            }

            return false;
        }

        private bool IsValidInSolutionGrid(int x, int y, SudokuColor color)
        {
            for (int col = 0; col < GRID_SIZE; col++)
            {
                if (col != x && solutionGrid[col, y] == color)
                    return false;
            }

            for (int r = 0; r < GRID_SIZE; r++)
            {
                if (r != y && solutionGrid[x, r] == color)
                    return false;
            }

            int regionIndex = GetRegionIndex(x, y);
            var (startX, startY) = GetRegionStart(regionIndex);
            for (int r = startY; r < startY + REGION_HEIGHT; r++)
            {
                for (int col = startX; col < startX + REGION_WIDTH; col++)
                {
                    if (col != x && r != y && solutionGrid[col, r] == color)
                        return false;
                }
            }

            return true;
        }
        
        public void SetDifficulty(Difficulty diff)
        {
            GenerateValidSolution();
            
            int keepCount = 20;
            switch (diff)
            {
                case Difficulty.Easy: keepCount = 20; break;
                case Difficulty.Medium: keepCount = 14; break;
                case Difficulty.Hard: keepCount = 8; break;
                case Difficulty.Expert: keepCount = 4; break;
            }

            for (int y = 0; y < GRID_SIZE; y++)
            {
                for (int x = 0; x < GRID_SIZE; x++)
                {
                    playerGrid[x, y] = null;
                    cellStates[x, y] = CellState.Empty;
                }
            }

            List<Vector2Int> allCells = new List<Vector2Int>();
            for (int y = 0; y < GRID_SIZE; y++)
            {
                for (int x = 0; x < GRID_SIZE; x++)
                {
                    allCells.Add(new Vector2Int(x, y));
                }
            }

            // Shuffle cells
            for (int i = allCells.Count - 1; i > 0; i--)
            {
                int r = UnityEngine.Random.Range(0, i + 1);
                Vector2Int temp = allCells[i];
                allCells[i] = allCells[r];
                allCells[r] = temp;
            }

            for (int i = 0; i < keepCount; i++)
            {
                Vector2Int cell = allCells[i];
                playerGrid[cell.x, cell.y] = solutionGrid[cell.x, cell.y];
                cellStates[cell.x, cell.y] = CellState.Fixed;
            }
        }

        public bool IsInBounds(int x, int y)
        {
            return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
        }
    }
}
