using System.Collections;
using UnityEngine;
using BlockFitPuzzle.Runtime;
using BlockFitPuzzle.VFX;

namespace BlockFitPuzzle.Bootstrap
{
    public class GameBootstrap : MonoBehaviour
    {
        [Header("Runtime Dependencies")]
        [SerializeField] private GameController gameController;
        [SerializeField] private RuntimeGrid runtimeGrid;
        [SerializeField] private BlockSpawner blockSpawner;
        [SerializeField] private GameTimer gameTimer;

        [Header("VFX Dependencies")]
        [SerializeField] private AnimationManager animationManager;
        [SerializeField] private ScreenEffects screenEffects;

        [Header("Launch Configuration")]
        [SerializeField] private int startLevelNumber = 1;
        [SerializeField] private bool autoPrewarmSpawnerPool = true;

        private void Awake()
        {
            // Validate critical dependencies
            ValidateBootstrapReferences();

            // Setup custom callbacks or initial state configurations
            if (autoPrewarmSpawnerPool && blockSpawner != null)
            {
                blockSpawner.PrewarmPool(10); // Spawns 10 empty block pieces into reserve
            }
        }

        private void Start()
        {
            // Trigger Boot to Loading phase
            if (gameController != null)
            {
                gameController.SetPhase(GameController.GamePhase.Loading);
                LoadLevel(startLevelNumber);
                gameController.SetPhase(GameController.GamePhase.Playing);
            }
        }

        public void LoadLevel(int levelId)
        {
            Debug.Log($"[GameBootstrap] Loading Puzzle Level: {levelId}");

            // 1. Reset physical timers
            if (gameTimer != null)
            {
                gameTimer.ResetTimer();
            }

            // 2. Fetch or mock the static Level Data parameters (representing shapes, dimensions)
            LevelData mockLvl = GenerateMockLevel(levelId);

            // 3. Initialize the cells in the active puzzle grid
            if (runtimeGrid != null)
            {
                runtimeGrid.InitializeGrid(mockLvl.gridWidth, mockLvl.gridHeight);
            }

            // 4. Spawn active Block shapes on the user tray
            if (blockSpawner != null)
            {
                blockSpawner.SpawnBlocksForLevel(mockLvl);
            }

            // 5. Fire off timers
            if (gameTimer != null)
            {
                gameTimer.SetParTimeLimit((mockLvl.blocksToSpawn.Count * 12) + 10);
                gameTimer.StartTimer();
            }
        }

        private void ValidateBootstrapReferences()
        {
            if (gameController == null) gameController = FindObjectOfType<GameController>();
            if (runtimeGrid == null) runtimeGrid = FindObjectOfType<RuntimeGrid>();
            if (blockSpawner == null) blockSpawner = FindObjectOfType<BlockSpawner>();
            if (gameTimer == null) gameTimer = FindObjectOfType<GameTimer>();
            if (animationManager == null) animationManager = FindObjectOfType<AnimationManager>();
            if (screenEffects == null) screenEffects = FindObjectOfType<ScreenEffects>();

            // Safe fallback logging if anything is missing in scene setup
            if (gameController == null) Debug.LogError("[GameBootstrap] GameController reference is missing in Scene!");
            if (runtimeGrid == null) Debug.LogError("[GameBootstrap] RuntimeGrid reference is missing in Scene!");
            if (blockSpawner == null) Debug.LogError("[GameBootstrap] BlockSpawner reference is missing in Scene!");
            if (gameTimer == null) Debug.LogError("[GameBootstrap] GameTimer reference is missing in Scene!");
        }

        // Helper mock generator representing level puzzle properties (usually loaded via JSON/ScriptableObjects)
        private LevelData GenerateMockLevel(int levelId)
        {
            LevelData lvl = new LevelData
            {
                id = levelId,
                gridWidth = levelId <= 5 ? 3 : 4,
                gridHeight = levelId <= 5 ? 3 : 4,
                blocksToSpawn = new System.Collections.Generic.List<BlockShape>()
            };

            // Inject 3 mock Block shapes to solve
            BlockShape s1 = new BlockShape
            {
                id = 1,
                colorHex = "#EA580C",
                coordinates = new Vector2Int[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(0, 1) } // L-shaped block
            };

            BlockShape s2 = new BlockShape
            {
                id = 2,
                colorHex = "#10B981",
                coordinates = new Vector2Int[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(1, 1), new Vector2Int(2, 1) } // Z-shaped block
            };

            lvl.blocksToSpawn.Add(s1);
            lvl.blocksToSpawn.Add(s2);

            return lvl;
        }
    }
}
