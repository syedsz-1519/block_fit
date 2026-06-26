using System;
using UnityEngine;

namespace BlockFitPuzzle.Runtime
{
    public class GameController : MonoBehaviour
    {
        public static GameController Instance { get; private set; }

        public enum GamePhase { Boot, Loading, Playing, Paused, Animating, Won, Lost }
        
        [Header("State Machine")]
        [SerializeField] private GamePhase initialPhase = GamePhase.Boot;
        [SerializeField] private bool verboseLogging = true;

        private GamePhase currentPhase;
        private float gameTime;
        private float timeScale = 1.0f;
        private bool isPaused;

        // Phase Transition Events
        public event Action<GamePhase> OnPhaseEntered;
        public event Action<GamePhase> OnPhaseExited;
        public event Action<float> OnGameTimeUpdated;

        public GamePhase CurrentPhase => currentPhase;
        public float GameTime => gameTime;
        public float DeltaTime => Time.deltaTime * timeScale;
        public bool IsPaused => isPaused;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
                return;
            }

            currentPhase = initialPhase;
        }

        private void Start()
        {
            SetPhase(GamePhase.Boot);
        }

        private void Update()
        {
            if (currentPhase == GamePhase.Playing && !isPaused)
            {
                gameTime += DeltaTime;
                OnGameTimeUpdated?.Invoke(gameTime);
            }

            // Frame-precise input or visual updates go here
            if (currentPhase == GamePhase.Playing)
            {
                UpdateGameplayVisuals();
            }
        }

        private void FixedUpdate()
        {
            // Deterministic physics/placement queries or timers
            if (currentPhase == GamePhase.Playing && !isPaused)
            {
                TickFixedPhysicsSystems();
            }
        }

        private void LateUpdate()
        {
            // Camera position syncs and final canvas overlays
            if (currentPhase == GamePhase.Playing)
            {
                SyncLateSystems();
            }
        }

        public void SetPhase(GamePhase newPhase)
        {
            if (currentPhase == newPhase) return;

            if (verboseLogging)
            {
                Debug.Log($"[GameController] Transitioning from {currentPhase} to {newPhase}");
            }

            // Exit current phase
            OnPhaseExited?.Invoke(currentPhase);
            ExitPhaseCallback(currentPhase);

            GamePhase previousPhase = currentPhase;
            currentPhase = newPhase;

            // Enter new phase
            OnPhaseEntered?.Invoke(currentPhase);
            EnterPhaseCallback(currentPhase);
        }

        public void SetTimeScale(float scale)
        {
            timeScale = Mathf.Max(0, scale);
        }

        public void TogglePause()
        {
            if (currentPhase != GamePhase.Playing && currentPhase != GamePhase.Paused) return;

            isPaused = !isPaused;
            if (isPaused)
            {
                SetPhase(GamePhase.Paused);
                Time.timeScale = 0f;
            }
            else
            {
                SetPhase(GamePhase.Playing);
                Time.timeScale = 1f;
            }
        }

        public void ResetGameTime()
        {
            gameTime = 0f;
        }

        private void EnterPhaseCallback(GamePhase phase)
        {
            switch (phase)
            {
                case GamePhase.Boot:
                    // Initialize critical low-level singletons or diagnostics
                    SetPhase(GamePhase.Loading);
                    break;
                case GamePhase.Loading:
                    ResetGameTime();
                    break;
                case GamePhase.Playing:
                    isPaused = false;
                    Time.timeScale = 1f;
                    break;
                case GamePhase.Paused:
                    isPaused = true;
                    break;
                case GamePhase.Animating:
                    // Disable core input buffering, allow non-blocking sequences
                    break;
                case GamePhase.Won:
                    Debug.Log("[GameController] Level Successfully Completed!");
                    break;
                case GamePhase.Lost:
                    Debug.Log("[GameController] Level Failed!");
                    break;
            }
        }

        private void ExitPhaseCallback(GamePhase phase)
        {
            switch (phase)
            {
                case GamePhase.Paused:
                    isPaused = false;
                    break;
            }
        }

        private void UpdateGameplayVisuals()
        {
            // Updates that must occur every frame in real-time
        }

        private void TickFixedPhysicsSystems()
        {
            // Fixed timestep physics checks (50Hz)
        }

        private void SyncLateSystems()
        {
            // Late calculations (camera, canvas constraints)
        }
    }
}
