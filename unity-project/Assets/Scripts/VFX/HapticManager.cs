using System.Collections;
using UnityEngine;

namespace BlockFitPuzzle.VFX
{
    public class HapticManager : MonoBehaviour
    {
        public static HapticManager Instance { get; private set; }

        public enum HapticType { Light, Medium, Heavy, Success, Failure, Custom }

        [Header("Throttling Settings")]
        [SerializeField] private float minimumHapticInterval = 0.1f; // 100ms threshold
        [SerializeField] private bool isHapticsEnabled = true;

        private float lastHapticTime = -999f;

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
            }
        }

        public void Trigger(HapticType type)
        {
            if (!isHapticsEnabled) return;

            // Enforce the 100ms throttling limit
            if (Time.time - lastHapticTime < minimumHapticInterval)
            {
                return;
            }

            lastHapticTime = Time.time;
            ExecuteVibration(type);
        }

        public void ToggleHaptics(bool enabled)
        {
            isHapticsEnabled = enabled;
        }

        private void ExecuteVibration(HapticType type)
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            switch (type)
            {
                case HapticType.Light:
                    AndroidVibrate(30); // 30ms light tap
                    break;
                case HapticType.Medium:
                    AndroidVibrate(60); // 60ms snap
                    break;
                case HapticType.Heavy:
                    AndroidVibrate(120); // 120ms error shake
                    break;
                case HapticType.Success:
                    StartCoroutine(VibratePattern(new long[] { 0, 50, 100, 100 })); // double-burst
                    break;
                case HapticType.Failure:
                    StartCoroutine(VibratePattern(new long[] { 0, 150, 100, 150 })); // descending low pulses
                    break;
                case HapticType.Custom:
                    AndroidVibrate(80);
                    break;
            }
#elif UNITY_IOS && !UNITY_EDITOR
            // Apple Taptic Engine feedback can be accessed via plugins, or standard fallback:
            if (type == HapticType.Heavy) Handheld.Vibrate();
            else Handheld.Vibrate(); // Standard fallback
#else
            // Editor / Web fallbacks
            Debug.Log($"[HapticManager] Mock vibration triggered: {type}");
#endif
        }

#if UNITY_ANDROID && !UNITY_EDITOR
        private void AndroidVibrate(long milliseconds)
        {
            using (AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            using (AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
            using (AndroidJavaObject vibrator = currentActivity.Call<AndroidJavaObject>("getSystemService", "vibrator"))
            {
                if (vibrator.Call<bool>("hasVibrator"))
                {
                    vibrator.Call("vibrate", milliseconds);
                }
            }
        }

        private IEnumerator VibratePattern(long[] pattern)
        {
            using (AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            using (AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
            using (AndroidJavaObject vibrator = currentActivity.Call<AndroidJavaObject>("getSystemService", "vibrator"))
            {
                if (vibrator.Call<bool>("hasVibrator"))
                {
                    // -1 means do not repeat pattern
                    vibrator.Call("vibrate", pattern, -1);
                }
            }
            yield return null;
        }
#endif
    }
}
