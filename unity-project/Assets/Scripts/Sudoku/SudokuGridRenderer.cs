using System;
using System.Collections.Generic;
using UnityEngine;

namespace BlockFitPuzzle.Sudoku
{
    public enum HighlightType { None, Valid, Invalid, Conflict }

    public class SudokuGridRenderer : MonoBehaviour
    {
        public static SudokuGridRenderer Instance { get; private set; }

        [Header("Grid Visuals")]
        [SerializeField] private GameObject cellPrefab;
        [SerializeField] private Transform cellContainer;
        [SerializeField] private float cellSpacing = 1.05f;
        
        [Header("Region Styling")]
        [SerializeField] private bool showRegionBorders = true;
        [SerializeField] private Color regionBorderColor = new Color(0.18f, 0.18f, 0.18f);
        [SerializeField] private float regionBorderWidth = 0.08f;
        
        [Header("Cell Colors")]
        [SerializeField] private Color emptyCellColor = new Color(0.96f, 0.95f, 0.94f);
        [SerializeField] private Color fixedCellColor = new Color(0.91f, 0.89f, 0.88f);
        [SerializeField] private Color invalidCellColor = new Color(1f, 0.3f, 0.3f, 0.45f);
        [SerializeField] private Color validHoverColor = new Color(0.18f, 0.8f, 0.44f, 0.45f);
        [SerializeField] private Color conflictWarningColor = new Color(0.95f, 0.77f, 0.06f, 0.35f);
        
        [Header("Color Mapping")]
        [SerializeField] private Color redColor = new Color(0.91f, 0.3f, 0.24f); // Red
        [SerializeField] private Color blueColor = new Color(0.2f, 0.6f, 0.86f); // Blue
        [SerializeField] private Color greenColor = new Color(0.18f, 0.8f, 0.44f); // Green
        [SerializeField] private Color yellowColor = new Color(0.95f, 0.77f, 0.06f); // Yellow
        [SerializeField] private Color purpleColor = new Color(0.61f, 0.35f, 0.71f); // Purple
        [SerializeField] private Color orangeColor = new Color(0.9f, 0.49f, 0.13f); // Orange
        
        private SpriteRenderer[,] cellRenderers;
        private List<LineRenderer> activeBorders = new List<LineRenderer>();
        private SudokuGridData gridData;
        
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

        public void Initialize(SudokuGridData data)
        {
            gridData = data;
            CreateGrid();
            if (showRegionBorders) DrawRegionBorders();
            ApplyInitialState();
        }
        
        private void CreateGrid()
        {
            // Clear prior grid rendering objects
            if (cellContainer != null)
            {
                foreach (Transform child in cellContainer)
                {
                    Destroy(child.gameObject);
                }
            }

            cellRenderers = new SpriteRenderer[SudokuGridData.GRID_SIZE, SudokuGridData.GRID_SIZE];

            // 6x6 grid, centered at (0,0)
            float halfGridWidth = (SudokuGridData.GRID_SIZE - 1) * cellSpacing / 2f;
            float halfGridHeight = (SudokuGridData.GRID_SIZE - 1) * cellSpacing / 2f;

            for (int y = 0; y < SudokuGridData.GRID_SIZE; y++)
            {
                for (int x = 0; x < SudokuGridData.GRID_SIZE; x++)
                {
                    Vector3 cellPos = new Vector3(
                        (x * cellSpacing) - halfGridWidth,
                        (y * cellSpacing) - halfGridHeight,
                        0f
                    );

                    GameObject cellGo = Instantiate(cellPrefab, cellPos, Quaternion.identity, cellContainer != null ? cellContainer : transform);
                    cellGo.name = $"Cell_{x}_{y}";
                    
                    SpriteRenderer sr = cellGo.GetComponent<SpriteRenderer>();
                    if (sr == null) sr = cellGo.AddComponent<SpriteRenderer>();
                    
                    cellRenderers[x, y] = sr;
                    sr.color = emptyCellColor;
                }
            }
        }
        
        private void DrawRegionBorders()
        {
            foreach (LineRenderer lr in activeBorders)
            {
                Destroy(lr.gameObject);
            }
            activeBorders.Clear();

            // Highlight 2x3 subregions
            float halfGridWidth = (SudokuGridData.GRID_SIZE - 1) * cellSpacing / 2f;
            float halfGridHeight = (SudokuGridData.GRID_SIZE - 1) * cellSpacing / 2f;

            // Draw regional vertical dividing borders
            for (int rx = 1; rx < SudokuGridData.GRID_SIZE / SudokuGridData.REGION_WIDTH; rx++)
            {
                float xCoord = (rx * SudokuGridData.REGION_WIDTH * cellSpacing) - halfGridWidth - (cellSpacing / 2f);
                CreateBorderLine(
                    new Vector3(xCoord, -halfGridHeight - (cellSpacing / 2f), -1f),
                    new Vector3(xCoord, halfGridHeight + (cellSpacing / 2f), -1f)
                );
            }

            // Draw regional horizontal dividing borders
            for (int ry = 1; ry < SudokuGridData.GRID_SIZE / SudokuGridData.REGION_HEIGHT; ry++)
            {
                float yCoord = (ry * SudokuGridData.REGION_HEIGHT * cellSpacing) - halfGridHeight - (cellSpacing / 2f);
                CreateBorderLine(
                    new Vector3(-halfGridWidth - (cellSpacing / 2f), yCoord, -1f),
                    new Vector3(halfGridWidth + (cellSpacing / 2f), yCoord, -1f)
                );
            }
        }

        private void CreateBorderLine(Vector3 start, Vector3 end)
        {
            GameObject lineGo = new GameObject("RegionBorder");
            lineGo.transform.SetParent(cellContainer != null ? cellContainer : transform);
            LineRenderer lr = lineGo.AddComponent<LineRenderer>();
            
            lr.positionCount = 2;
            lr.SetPosition(0, start);
            lr.SetPosition(1, end);
            lr.startWidth = regionBorderWidth;
            lr.endWidth = regionBorderWidth;
            lr.useWorldSpace = true;
            lr.material = new Material(Shader.Find("Sprites/Default"));
            lr.startColor = regionBorderColor;
            lr.endColor = regionBorderColor;

            activeBorders.Add(lr);
        }
        
        private void ApplyInitialState()
        {
            if (gridData == null) return;

            for (int y = 0; y < SudokuGridData.GRID_SIZE; y++)
            {
                for (int x = 0; x < SudokuGridData.GRID_SIZE; x++)
                {
                    if (gridData.cellStates[x, y] == SudokuGridData.CellState.Fixed)
                    {
                        cellRenderers[x, y].color = fixedCellColor;
                        // Draw prefilled color indicator in center if needed
                        var col = gridData.playerGrid[x, y];
                        if (col.HasValue)
                        {
                            cellRenderers[x, y].color = GetColorForSudokuColor(col.Value);
                        }
                    }
                    else
                    {
                        cellRenderers[x, y].color = emptyCellColor;
                    }
                }
            }
        }
        
        public void HighlightCell(int x, int y, HighlightType type)
        {
            if (x < 0 || x >= SudokuGridData.GRID_SIZE || y < 0 || y >= SudokuGridData.GRID_SIZE) return;

            Color targetColor = emptyCellColor;
            if (gridData != null && gridData.cellStates[x, y] == SudokuGridData.CellState.Fixed)
            {
                var fixedCol = gridData.playerGrid[x, y];
                targetColor = fixedCol.HasValue ? GetColorForSudokuColor(fixedCol.Value) : fixedCellColor;
            }

            switch (type)
            {
                case HighlightType.Valid:
                    cellRenderers[x, y].color = Color.Lerp(targetColor, validHoverColor, 0.5f);
                    break;
                case HighlightType.Invalid:
                    cellRenderers[x, y].color = Color.Lerp(targetColor, invalidCellColor, 0.5f);
                    break;
                case HighlightType.Conflict:
                    cellRenderers[x, y].color = Color.Lerp(targetColor, conflictWarningColor, 0.6f);
                    break;
                case HighlightType.None:
                    cellRenderers[x, y].color = targetColor;
                    break;
            }
        }
        
        public void PlaceColorBlock(ColorBlockShape block, int originX, int originY)
        {
            if (block == null || gridData == null) return;

            for (int i = 0; i < block.coordinates.Length; i++)
            {
                Vector2Int offset = block.coordinates[i];
                int targetX = originX + offset.x;
                int targetY = originY + offset.y;

                if (gridData.IsInBounds(targetX, targetY))
                {
                    gridData.playerGrid[targetX, targetY] = block.cellColors[i];
                    gridData.cellStates[targetX, targetY] = SudokuGridData.CellState.Placed;
                    
                    // Trigger color update visual
                    cellRenderers[targetX, targetY].color = GetColorForSudokuColor(block.cellColors[i]);
                }
            }
        }
        
        public Color GetColorForSudokuColor(SudokuGridData.SudokuColor color)
        {
            return color switch
            {
                SudokuGridData.SudokuColor.Red => redColor,
                SudokuGridData.SudokuColor.Blue => blueColor,
                SudokuGridData.SudokuColor.Green => greenColor,
                SudokuGridData.SudokuColor.Yellow => yellowColor,
                SudokuGridData.SudokuColor.Purple => purpleColor,
                SudokuGridData.SudokuColor.Orange => orangeColor,
                _ => Color.white
            };
        }
    }
}
