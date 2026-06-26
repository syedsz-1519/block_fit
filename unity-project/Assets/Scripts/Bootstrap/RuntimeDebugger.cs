using UnityEngine;
using BlockFitPuzzle.Runtime;

namespace BlockFitPuzzle.Bootstrap
{
    public class RuntimeDebugger : MonoBehaviour
    {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
        [Header("Debug Display Controls")]
        [SerializeField] private bool showFPS = true;
        [SerializeField] private bool showGridState = true;
        [SerializeField] private bool slowMotion = false;

        private float fpsAccumulator = 0f;
        private int fpsFramesCount = 0;
        private float fpsTimeLeft = 0.5f;
        private float currentFPS = 60.0f;

        private void Start()
        {
            fpsTimeLeft = 0.5f;
        }

        private void Update()
        {
            UpdateFPSCounter();
            HandleHotkeyInputs();
        }

        private void UpdateFPSCounter()
        {
            fpsTimeLeft -= Time.unscaledDeltaTime;
            fpsAccumulator += Time.unscaledDeltaTime;
            fpsFramesCount++;

            if (fpsTimeLeft <= 0.0)
            {
                currentFPS = fpsFramesCount / fpsAccumulator;
                fpsTimeLeft = 0.5f;
                fpsAccumulator = 0.0f;
                fpsFramesCount = 0;
            }
        }

        private void HandleHotkeyInputs()
        {
            // F1: Toggle FPS display
            if (Input.GetKeyDown(KeyCode.F1))
            {
                showFPS = !showFPS;
                Debug.Log($"[RuntimeDebugger] Toggle FPS: {showFPS}");
            }

            // F2: Skip / Instant Win
            if (Input.GetKeyDown(KeyCode.F2))
            {
                TriggerInstantWin();
            }

            // F3: Gain Mock Hints
            if (Input.GetKeyDown(KeyCode.F3))
            {
                Debug.Log("[RuntimeDebugger] Dev Cheats: Earned +10 Hints!");
            }

            // F4: Slow Motion
            if (Input.GetKeyDown(KeyCode.F4))
            {
                slowMotion = !slowMotion;
                Time.timeScale = slowMotion ? 0.1f : 1.0f;
                Debug.Log($"[RuntimeDebugger] Slow Motion toggled: {slowMotion}");
            }

            // F5: Restart current level
            if (Input.GetKeyDown(KeyCode.F5))
            {
                GameBootstrap bootstrap = FindObjectOfType<GameBootstrap>();
                if (bootstrap != null)
                {
                    bootstrap.LoadLevel(1);
                    Debug.Log("[RuntimeDebugger] Level reset triggered.");
                }
            }
        }

        private void TriggerInstantWin()
        {
            Debug.Log("[RuntimeDebugger] Skipping level... Instant Win Cheat triggered!");
            GameController controller = GameController.Instance;
            if (controller != null)
            {
                controller.SetPhase(GameController.GamePhase.Won);
            }
        }

        private void OnGUI()
        {
            // Position parameters
            float panelWidth = 260f;
            float panelHeight = showGridState ? 240f : 110f;
            Rect rect = new Rect(15, 15, panelWidth, panelHeight);

            // Styling
            Texture2D background = new Texture2D(1, 1);
            background.SetPixel(0, 0, new Color(0, 0, 0, 0.75f));
            background.Apply();

            GUIStyle panelStyle = new GUIStyle(GUI.skin.box);
            panelStyle.normal.background = background;

            GUI.Box(rect, "", panelStyle);

            GUILayout.BeginArea(new Rect(25, 25, panelWidth - 20, panelHeight - 20));

            // Title
            GUILayout.Label("<color=orange><b>BLOCK FIT DEBUGGER</b></color>", GetLabelStyle(14, true));

            // FPS Display
            if (showFPS)
            {
                string fpsColor = currentFPS >= 55f ? "lime" : currentFPS >= 30f ? "yellow" : "red";
                GUILayout.Label($"FPS: <color={fpsColor}>{currentFPS:F1}</color>", GetLabelStyle(12, false));
            }

            // System States
            GameController controller = GameController.Instance;
            string phase = controller != null ? controller.CurrentPhase.ToString() : "N/A";
            GUILayout.Label($"Game Phase: <b>{phase}</b>", GetLabelStyle(12, false));

            // Memory Allocation (Garbage Collector tracking)
            long mem = System.GC.GetTotalMemory(false) / (1024 * 1024);
            GUILayout.Label($"GC Heap Memory: {mem} MB", GetLabelStyle(12, false));

            // Grid Fill tracking stats
            if (showGridState && RuntimeGrid.Instance != null)
            {
                GUILayout.Space(5);
                GUILayout.Label("<color=cyan><b>Grid Occupancy Stats:</b></color>", GetLabelStyle(11, true));
                int cellsOccupied = RuntimeGrid.Instance.OccupiedCount;
                int totalCells = RuntimeGrid.Instance.Width * RuntimeGrid.Instance.Height;
                float fillRatio = totalCells > 0 ? ((float)cellsOccupied / totalCells) * 100f : 0f;

                GUILayout.Label($"Occupied: {cellsOccupied}/{totalCells} cells ({fillRatio:F1}%)", GetLabelStyle(11, false));
                GUILayout.Label("Controls: [F1]FPS  [F2]Win  [F4]Slow-Mo  [F5]Reset", GetLabelStyle(10, false));
            }

            GUILayout.EndArea();
        }

        private GUIStyle GetLabelStyle(int fontSize, bool bold)
        {
            GUIStyle style = new GUIStyle(GUI.skin.label);
            style.fontSize = fontSize;
            style.richText = true;
            style.normal.textColor = Color.white;
            if (bold) style.fontStyle = FontStyle.Bold;
            return style;
        }
#endif
    }
}
