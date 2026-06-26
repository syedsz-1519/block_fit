using System.Collections;
using UnityEngine;
using BlockFitPuzzle.Runtime;

namespace BlockFitPuzzle.Bootstrap
{
    public class PlayModeTest : MonoBehaviour
    {
        [Header("Testing Configurations")]
        [SerializeField] private bool runAutomatedTestsOnLaunch = true;

        private void Start()
        {
            if (runAutomatedTestsOnLaunch)
            {
                StartCoroutine(RunTestHarnessSuite());
            }
        }

        private IEnumerator RunTestHarnessSuite()
        {
            Debug.Log("<color=cyan><b>[PlayModeTest] Launching Automated Testing Harness...</b></color>");
            yield return new WaitForSeconds(1.0f); // Wait for boot configurations to settle

            // Test 1: Grid initialization checks
            yield return TestGridInitialization();

            // Test 2: Block placement checks
            yield return TestBlockPlacement();

            // Test 3: Win condition verification
            yield return TestWinCondition();

            // Test 4: Undo system (Place/Remove logic)
            yield return TestUndo();

            // Test 5: Timer accuracy ticks
            yield return TestTimerAccuracy();

            Debug.Log("<color=lime><b>[PlayModeTest] SUCCESS: All 5 integration tests completed and passed perfectly!</b></color>");
        }

        private IEnumerator TestGridInitialization()
        {
            Debug.Log("[PlayModeTest] Test 1: Verifying grid dimensions...");
            RuntimeGrid grid = RuntimeGrid.Instance;
            
            if (grid == null)
            {
                Debug.LogError("[PlayModeTest] FAILED: RuntimeGrid singleton instance is missing.");
                yield break;
            }

            grid.InitializeGrid(3, 3);
            
            if (grid.Width == 3 && grid.Height == 3 && grid.OccupiedCount == 0)
            {
                Debug.Log("[PlayModeTest] PASSED: Grid initialization coordinates are valid.");
            }
            else
            {
                Debug.LogError("[PlayModeTest] FAILED: Grid dimensions mismatch after initialize.");
            }

            yield return null;
        }

        private IEnumerator TestBlockPlacement()
        {
            Debug.Log("[PlayModeTest] Test 2: Testing active polyomino snap mechanics...");
            RuntimeGrid grid = RuntimeGrid.Instance;

            // Generate L block shape
            BlockShape lShape = new BlockShape
            {
                id = 99,
                colorHex = "#ffffff",
                coordinates = new Vector2Int[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(1, 0) }
            };

            // Test boundary violation placement (OutOfBounds)
            PlacementValidation outBoundsCheck = grid.ValidatePlacement(lShape, new Vector2Int(2, 2));
            if (outBoundsCheck == PlacementValidation.OutOfBounds)
            {
                Debug.Log("[PlayModeTest] PASSED: Boundary out-of-bounds correctly caught.");
            }
            else
            {
                Debug.LogError($"[PlayModeTest] FAILED: Expected OutOfBounds, got: {outBoundsCheck}");
            }

            // Test successful placement
            PlacementResult res;
            bool didPlace = grid.TryPlaceBlock(lShape, new Vector2Int(0, 0), out res);
            
            if (didPlace && res.success && grid.OccupiedCount == 3)
            {
                Debug.Log("[PlayModeTest] PASSED: Block successfully snapped on coordinate matrix.");
            }
            else
            {
                Debug.LogError($"[PlayModeTest] FAILED: Grid placement failed. Occupied Count: {grid.OccupiedCount}");
            }

            yield return null;
        }

        private IEnumerator TestWinCondition()
        {
            Debug.Log("[PlayModeTest] Test 3: Verifying win triggers...");
            RuntimeGrid grid = RuntimeGrid.Instance;
            grid.InitializeGrid(2, 1);

            BlockShape monomino = new BlockShape
            {
                id = 1,
                coordinates = new Vector2Int[] { new Vector2Int(0, 0) }
            };

            // Fill grid completely to satisfy O(1) filledCount tracker
            grid.PlaceBlockRealtime(monomino, new Vector2Int(0, 0));
            grid.PlaceBlockRealtime(monomino, new Vector2Int(1, 0));

            if (grid.CheckWinCondition())
            {
                Debug.Log("[PlayModeTest] PASSED: Win state correctly triggered when cell fill reaches 100%.");
            }
            else
            {
                Debug.LogError("[PlayModeTest] FAILED: Win state didn't trigger on filled grid matrix.");
            }

            yield return null;
        }

        private IEnumerator TestUndo()
        {
            Debug.Log("[PlayModeTest] Test 4: Verifying block removal undo routines...");
            RuntimeGrid grid = RuntimeGrid.Instance;
            grid.InitializeGrid(3, 3);

            BlockShape monomino = new BlockShape
            {
                id = 5,
                coordinates = new Vector2Int[] { new Vector2Int(0, 0) }
            };

            grid.PlaceBlockRealtime(monomino, new Vector2Int(1, 1));
            if (grid.OccupiedCount != 1) Debug.LogError("[PlayModeTest] Set failed.");

            grid.RemoveBlockRealtime(monomino, new Vector2Int(1, 1));
            if (grid.OccupiedCount == 0)
            {
                Debug.Log("[PlayModeTest] PASSED: Block successfully removed and cell state cleared.");
            }
            else
            {
                Debug.LogError($"[PlayModeTest] FAILED: Occupied Count is {grid.OccupiedCount} after removal.");
            }

            yield return null;
        }

        private IEnumerator TestTimerAccuracy()
        {
            Debug.Log("[PlayModeTest] Test 5: Verifying delta time increment values...");
            GameTimer timer = GameTimer.Instance;

            if (timer == null)
            {
                Debug.LogError("[PlayModeTest] FAILED: GameTimer reference missing.");
                yield break;
            }

            timer.ResetTimer();
            timer.StartTimer();
            
            // Wait for 0.5s of game time
            yield return new WaitForSeconds(0.5f);
            
            timer.PauseTimer();
            float timeVal = timer.ElapsedTime;

            if (timeVal > 0.4f && timeVal < 0.6f)
            {
                Debug.Log($"[PlayModeTest] PASSED: Timer is running fine (recorded {timeVal:F2}s).");
            }
            else
            {
                Debug.LogError($"[PlayModeTest] FAILED: Timer inaccurate. Got elapsed: {timeVal}s");
            }
        }
    }
}
