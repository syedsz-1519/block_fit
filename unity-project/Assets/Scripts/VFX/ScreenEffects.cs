using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace BlockFitPuzzle.VFX
{
    public class ScreenEffects : MonoBehaviour
    {
        public static ScreenEffects Instance { get; private set; }

        [Header("Camera & Overlay References")]
        [SerializeField] private Camera mainCamera;
        [SerializeField] private Image flashOverlayImage;
        [SerializeField] private SpriteRenderer backgroundRenderer;

        [Header("Background Scrolling")]
        [SerializeField] private Transform backgroundTransform;
        [SerializeField] private float parallaxScrollSpeedMultiplier = 0.05f;

        private Vector3 originalCameraPosition;
        private Coroutine shakeCoroutine;
        private Coroutine flashCoroutine;
        private Coroutine pulseCoroutine;
        private Coroutine bgGradientCoroutine;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                if (mainCamera == null) mainCamera = Camera.main;
                if (mainCamera != null) originalCameraPosition = mainCamera.transform.position;
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Update()
        {
            // Parallax scroll ambient background over time
            if (backgroundTransform != null)
            {
                ParallaxScroll(parallaxScrollSpeedMultiplier);
            }
        }

        public void FlashScreen(Color color, float duration)
        {
            if (flashOverlayImage == null) return;
            if (flashCoroutine != null) StopCoroutine(flashCoroutine);
            flashCoroutine = StartCoroutine(FlashScreenRoutine(color, duration));
        }

        public void ShakeScreen(float intensity, float duration)
        {
            if (mainCamera == null) return;
            if (shakeCoroutine != null) StopCoroutine(shakeCoroutine);
            shakeCoroutine = StartCoroutine(ShakeCameraRoutine(intensity, duration));
        }

        public void PulseScreen(float intensity, float duration)
        {
            if (flashOverlayImage == null) return;
            if (pulseCoroutine != null) StopCoroutine(pulseCoroutine);
            pulseCoroutine = StartCoroutine(PulseScreenRoutine(intensity, duration));
        }

        public void SetBackgroundGradient(Color from, Color to, float duration)
        {
            if (backgroundRenderer == null) return;
            if (bgGradientCoroutine != null) StopCoroutine(bgGradientCoroutine);
            bgGradientCoroutine = StartCoroutine(ChangeBackgroundGradientRoutine(from, to, duration));
        }

        public void ParallaxScroll(float speed)
        {
            if (backgroundTransform == null) return;
            // Scroll background sprite texture or local position slightly
            backgroundTransform.Translate(Vector3.down * speed * Time.deltaTime, Space.World);
            if (backgroundTransform.position.y <= -10f)
            {
                backgroundTransform.position = new Vector3(backgroundTransform.position.x, 10f, backgroundTransform.position.z);
            }
        }

        // --- COROUTINES ---

        private IEnumerator FlashScreenRoutine(Color color, float duration)
        {
            flashOverlayImage.gameObject.SetActive(true);
            flashOverlayImage.color = color;

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / duration;
                Color newCol = color;
                newCol.a = Mathf.Lerp(color.a, 0f, progress);
                flashOverlayImage.color = newCol;
                yield return null;
            }

            flashOverlayImage.gameObject.SetActive(false);
        }

        private IEnumerator ShakeCameraRoutine(float intensity, float duration)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float currentIntensity = Mathf.Lerp(intensity, 0f, elapsed / duration);
                Vector2 randomOffset = Random.insideUnitCircle * currentIntensity;
                mainCamera.transform.position = originalCameraPosition + new Vector3(randomOffset.x, randomOffset.y, 0f);
                yield return null;
            }
            mainCamera.transform.position = originalCameraPosition;
        }

        private IEnumerator PulseScreenRoutine(float intensity, float duration)
        {
            flashOverlayImage.gameObject.SetActive(true);
            Color alertCol = new Color(1f, 0f, 0f, 0f);

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                // Periodic ping-pong pulse overlay representing heartbeat countdown
                float alpha = Mathf.PingPong(elapsed * 2f, intensity);
                alertCol.a = alpha;
                flashOverlayImage.color = alertCol;
                yield return null;
            }
            flashOverlayImage.gameObject.SetActive(false);
        }

        private IEnumerator ChangeBackgroundGradientRoutine(Color from, Color to, float duration)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                backgroundRenderer.color = Color.Lerp(from, to, elapsed / duration);
                yield return null;
            }
            backgroundRenderer.color = to;
        }
    }
}
