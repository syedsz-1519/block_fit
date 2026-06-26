using System;
using UnityEngine;

namespace BlockFitPuzzle.Runtime
{
    [Serializable]
    public struct BlockShape
    {
        public int id;
        public string colorHex;
        public Vector2Int[] coordinates; // Local grid offsets, e.g. (0,0), (0,1), (1,0)
    }

    public enum PlacementValidation
    {
        Valid,
        OutOfBounds,
        Overlapping,
        Locked
    }

    public struct PlacementResult
    {
        public bool success;
        public PlacementValidation validation;
        public Vector2Int[] affectedCells;
    }

    public class RuntimeGrid : MonoBehaviour
    {
        public static RuntimeGrid Instance { get; private set; }

        [Header("Grid Size Settings")]
        [SerializeField] private int gridWidth = 4;
        [SerializeField] private int gridHeight = 4;

        // Grid cells state tracker (0 means empty, positive integer corresponds to BlockShape ID)
        private int[,] cellMatrix;
        private int occupiedCellsCount = 0;
        private int targetCellsCount = 16; // Number of cells that need to be filled to win

        public int Width => gridWidth;
        public int Height => gridHeight;
        public int OccupiedCount => occupiedCellsCount;

        public event Action OnGridStateChanged;
        public event Action OnPlacementSuccess;
        public event Action OnPlacementFailed;

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

        public void InitializeGrid(int width, int height)
        {
            gridWidth = width;
            gridHeight = height;
            cellMatrix = new int[gridWidth, gridHeight];
            occupiedCellsCount = 0;
            targetCellsCount = width * height;

            OnGridStateChanged?.Invoke();
            Debug.Log($"[RuntimeGrid] Initialized grid of size {gridWidth}x{gridHeight}");
        }

        public PlacementValidation ValidatePlacement(BlockShape shape, Vector2Int origin)
        {
            foreach (Vector2Int coord in shape.coordinates)
            {
                int checkX = origin.x + coord.x;
                int checkY = origin.y + coord.y;

                // 1. Boundary Checks
                if (checkX < 0 || checkX >= gridWidth || checkY < 0 || checkY >= gridHeight)
                {
                    return PlacementValidation.OutOfBounds;
                }

                // 2. Overlap Checks
                if (cellMatrix[checkX, checkY] != 0)
                {
                    return PlacementValidation.Overlapping;
                }
            }

            return PlacementValidation.Valid;
        }

        public bool TryPlaceBlock(BlockShape shape, Vector2Int origin, out PlacementResult result)
        {
            PlacementValidation validation = ValidatePlacement(shape, origin);
            result = new PlacementResult();
            result.validation = validation;

            if (validation == PlacementValidation.Valid)
            {
                result.success = true;
                result.affectedCells = new Vector2Int[shape.coordinates.Length];

                for (int i = 0; i < shape.coordinates.Length; i++)
                {
                    Vector2Int localCoord = shape.coordinates[i];
                    Vector2Int globalCoord = new Vector2Int(origin.x + localCoord.x, origin.y + localCoord.y);
                    
                    cellMatrix[globalCoord.x, globalCoord.y] = shape.id;
                    result.affectedCells[i] = globalCoord;
                    occupiedCellsCount++;
                }

                OnGridStateChanged?.Invoke();
                OnPlacementSuccess?.Invoke();
                return true;
            }

            result.success = false;
            result.affectedCells = Array.Empty<Vector2Int>();
            OnPlacementFailed?.Invoke();
            return false;
        }

        public void PlaceBlockRealtime(BlockShape shape, Vector2Int origin)
        {
            PlacementResult res;
            TryPlaceBlock(shape, origin, out res);
        }

        public void RemoveBlockRealtime(BlockShape shape, Vector2Int origin)
        {
            foreach (Vector2Int coord in shape.coordinates)
            {
                int checkX = origin.x + coord.x;
                int checkY = origin.y + coord.y;

                if (checkX >= 0 && checkX < gridWidth && checkY >= 0 && checkY < gridHeight)
                {
                    if (cellMatrix[checkX, checkY] == shape.id)
                    {
                        cellMatrix[checkX, checkY] = 0;
                        occupiedCellsCount--;
                    }
                }
            }
            OnGridStateChanged?.Invoke();
        }

        public bool CheckWinCondition()
        {
            // O(1) Check based on occupied status relative to total size
            return occupiedCellsCount == targetCellsCount;
        }

        public int GetCellState(int x, int y)
        {
            if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return -1;
            return cellMatrix[x, y];
        }

        public void ClearGrid()
        {
            cellMatrix = new int[gridWidth, gridHeight];
            occupiedCellsCount = 0;
            OnGridStateChanged?.Invoke();
        }
    }
}
