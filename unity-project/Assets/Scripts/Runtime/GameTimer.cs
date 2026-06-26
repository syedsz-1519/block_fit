using System;
using UnityEngine;

namespace BlockFitPuzzle.Runtime
{
    public class GameTimer : MonoBehaviour
    {
        public static GameTimer Instance { get; private set; }

        [Header("Config")]
        [SerializeField] private float parTimeLimit = 60f; // in seconds
        [SerializeField] private float milestoneInterval = 30f; // trigger event every 30s

        private float elapsedTime;
        private bool isRunning;
        private float nextMilestoneTime;
        private bool hasTriggeredParWarning;

        // Events
        public event Action<float> OnTimerTick;
        public event Action OnParTimeReached; // par time exceeded warning trigger
        public event Action OnTimeMilestone;  // fired every 30 seconds

        public float ElapsedTime => elapsedTime;
        public bool IsRunning => isRunning;

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

        private void Update()
        {
            if (!isRunning) return;

            elapsedTime += Time.deltaTime;
            OnTimerTick?.Invoke(elapsedTime);

            // Check Milestones (every 30 seconds)
            if (elapsedTime >= nextMilestoneTime)
            {
                nextMilestoneTime += milestoneInterval;
                OnTimeMilestone?.Invoke();
            }

            // Check Par Time Warning
            if (!hasTriggeredParWarning && elapsedTime >= parTimeLimit)
            {
                hasTriggeredParWarning = true;
                OnParTimeReached?.Invoke();
            }
        }

        public void SetParTimeLimit(float limit)
        {
            parTimeLimit = limit;
        }

        public void StartTimer(float initialOffset = 0f)
        {
            elapsedTime = initialOffset;
            isRunning = true;
            nextMilestoneTime = milestoneInterval;
            hasTriggeredParWarning = false;
        }

        public void PauseTimer()
        {
            isRunning = false;
        }

        public void ResumeTimer()
        {
            isRunning = true;
        }

        public void StopTimer()
        {
            isRunning = false;
        }

        public void ResetTimer()
        {
            elapsedTime = 0f;
            isRunning = false;
            hasTriggeredParWarning = false;
            nextMilestoneTime = milestoneInterval;
        }

        // Helper to format string for UI, e.g., "02:34" or "02:34.55"
        public string GetFormattedTime(bool includeMilliseconds = false)
        {
            int minutes = Mathf.FloorToInt(elapsedTime / 60F);
            int seconds = Mathf.FloorToInt(elapsedTime - minutes * 60);

            if (includeMilliseconds)
            {
                int fraction = Mathf.FloorToInt((elapsedTime * 100) % 100);
                return string.Format("{0:00}:{1:00}.{2:00}", minutes, seconds, fraction);
            }
            
            return string.Format("{0:00}:{1:00}", minutes, seconds);
        }
    }
}
