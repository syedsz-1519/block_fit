using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace BlockFitPuzzle.VFX
{
    public class AnimationManager : MonoBehaviour
    {
        public static AnimationManager Instance { get; private set; }

        [Header("System References")]
        [SerializeField] private ParticleManager particleManager;

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

        // --- BLOCK ANIMATIONS ---

        public void AnimateBlockSpawn(Transform block, Vector3 targetPos)
        {
            StartCoroutine(SpawnRoutine(block, targetPos));
        }

        public void AnimateBlockDrag(Transform block, Vector3 targetPos)
        {
            // Lift and scale on drag start
            StartCoroutine(ScaleAndMoveRoutine(block, targetPos, 1.08f, 0.15f, EaseQuadOut));
        }

        public void AnimateBlockSnap(Transform block, Vector3 gridPos, Action onComplete)
        {
            // Snap scaling animation (Scale overshoot 1.12 -> 1)
            StartCoroutine(SnapRoutine(block, gridPos, onComplete));
        }

        public void AnimateBlockReturn(Transform block, Vector3 originPos)
        {
            StartCoroutine(MoveRoutine(block, originPos, 0.3f, EaseQuadOut));
        }

        public void AnimateBlockRotate(Transform block, int newRotation)
        {
            Quaternion targetRot = Quaternion.Euler(0, 0, newRotation);
            StartCoroutine(RotateRoutine(block, targetRot, 0.3f, EaseExpoOut));
        }

        public void AnimateBlockMirror(Transform block)
        {
            Vector3 targetScale = new Vector3(-block.localScale.x, block.localScale.y, block.localScale.z);
            StartCoroutine(ScaleRoutine(block, targetScale, 0.25f, EaseExpoInOut));
        }

        // --- GRID ANIMATIONS ---

        public void AnimateCellFill(Vector3 worldPos, Color blockColor)
        {
            // Subtle pulse and color snap on placing on grid
            if (particleManager != null)
            {
                particleManager.PlayEffect("SnapBurst", worldPos, blockColor);
            }
        }

        public void AnimateCellClear(Vector3 worldPos)
        {
            // Reset cell visualization
        }

        public void AnimateGridWin()
        {
            // A visual wave pulsing grid cells from the center outward
            Debug.Log("[AnimationManager] Triggering Grid Win Anim!");
            TriggerWinConfetti();
        }

        // --- UI ANIMATIONS ---

        public void AnimateScreenTransition(Transform panelFrom, Transform panelTo)
        {
            if (panelFrom != null) StartCoroutine(FadeAndScalePanel(panelFrom, false));
            if (panelTo != null) StartCoroutine(FadeAndScalePanel(panelTo, true));
        }

        public void AnimateButtonPress(Transform button)
        {
            StartCoroutine(ButtonPressRoutine(button));
        }

        public void AnimateCounterTick(Text textComponent, int fromValue, int toValue, float duration)
        {
            StartCoroutine(CounterTickRoutine(textComponent, fromValue, toValue, duration));
        }

        // --- VFX TRIGGERS ---

        public void TriggerSnapParticles(Vector3 position, Color color)
        {
            if (particleManager != null)
            {
                particleManager.PlayEffect("SnapBurst", position, color);
            }
        }

        public void TriggerWinConfetti()
        {
            if (particleManager != null)
            {
                particleManager.PlayEffect("Confetti", Vector3.up * 5f, Color.white);
            }
        }

        public void TriggerStarBurst(Vector3 position)
        {
            if (particleManager != null)
            {
                particleManager.PlayEffect("StarSparkle", position, Color.yellow);
            }
        }

        // --- PRIVATE COROUTINE IMPLEMENTATIONS & EASINGS ---

        private IEnumerator SpawnRoutine(Transform target, Vector3 targetPos)
        {
            target.position = targetPos;
            target.localScale = Vector3.zero;
            float elapsed = 0f;
            float duration = 0.4f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / duration;
                float scale = EaseElasticOut(progress);
                target.localScale = new Vector3(scale, scale, 1f);
                yield return null;
            }
            target.localScale = Vector3.one;
        }

        private IEnumerator SnapRoutine(Transform target, Vector3 targetPos, Action onComplete)
        {
            Vector3 startPos = target.position;
            Vector3 startScale = target.localScale;
            float elapsed = 0f;
            float duration = 0.25f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / duration;
                
                target.position = Vector3.Lerp(startPos, targetPos, EaseBackOut(progress));
                
                // Overshoot snap scale animation
                float scaleOvershoot = EaseBackOut(progress);
                target.localScale = Vector3.Lerp(startScale, Vector3.one * 1.12f, scaleOvershoot);
                yield return null;
            }

            target.position = targetPos;
            target.localScale = Vector3.one;
            onComplete?.Invoke();
        }

        private IEnumerator MoveRoutine(Transform target, Vector3 targetPos, float duration, Func<float, float> easeFunc)
        {
            Vector3 startPos = target.position;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = easeFunc(elapsed / duration);
                target.position = Vector3.Lerp(startPos, targetPos, progress);
                yield return null;
            }
            target.position = targetPos;
        }

        private IEnumerator RotateRoutine(Transform target, Quaternion targetRot, float duration, Func<float, float> easeFunc)
        {
            Quaternion startRot = target.rotation;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = easeFunc(elapsed / duration);
                target.rotation = Quaternion.Slerp(startRot, targetRot, progress);
                yield return null;
            }
            target.rotation = targetRot;
        }

        private IEnumerator ScaleRoutine(Transform target, Vector3 targetScale, float duration, Func<float, float> easeFunc)
        {
            Vector3 startScale = target.localScale;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = easeFunc(elapsed / duration);
                target.localScale = Vector3.Lerp(startScale, targetScale, progress);
                yield return null;
            }
            target.localScale = targetScale;
        }

        private IEnumerator ScaleAndMoveRoutine(Transform target, Vector3 targetPos, float targetScale, float duration, Func<float, float> easeFunc)
        {
            Vector3 startPos = target.position;
            Vector3 startScale = target.localScale;
            Vector3 destinationScale = new Vector3(targetScale, targetScale, 1f);
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = easeFunc(elapsed / duration);
                target.position = Vector3.Lerp(startPos, targetPos, progress);
                target.localScale = Vector3.Lerp(startScale, destinationScale, progress);
                yield return null;
            }
        }

        private IEnumerator ButtonPressRoutine(Transform target)
        {
            Vector3 origScale = target.localScale;
            Vector3 pressedScale = origScale * 0.9f;

            float elapsed = 0f;
            float halfDuration = 0.08f;

            while (elapsed < halfDuration)
            {
                elapsed += Time.deltaTime;
                target.localScale = Vector3.Lerp(origScale, pressedScale, elapsed / halfDuration);
                yield return null;
            }

            elapsed = 0f;
            while (elapsed < halfDuration)
            {
                elapsed += Time.deltaTime;
                target.localScale = Vector3.Lerp(pressedScale, origScale, elapsed / halfDuration);
                yield return null;
            }
            target.localScale = origScale;
        }

        private IEnumerator FadeAndScalePanel(Transform panel, bool appearing)
        {
            CanvasGroup cg = panel.GetComponent<CanvasGroup>();
            if (cg == null) cg = panel.gameObject.AddComponent<CanvasGroup>();

            float elapsed = 0f;
            float duration = 0.4f;

            float startAlpha = appearing ? 0f : 1f;
            float endAlpha = appearing ? 1f : 0f;
            Vector3 startScale = appearing ? Vector3.one * 0.95f : Vector3.one;
            Vector3 endScale = appearing ? Vector3.one : Vector3.one * 0.95f;

            panel.gameObject.SetActive(true);

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / duration;
                float t = EaseQuadInOut(progress);

                cg.alpha = Mathf.Lerp(startAlpha, endAlpha, t);
                panel.localScale = Vector3.Lerp(startScale, endScale, t);
                yield return null;
            }

            cg.alpha = endAlpha;
            panel.localScale = endScale;

            if (!appearing)
            {
                panel.gameObject.SetActive(false);
            }
        }

        private IEnumerator CounterTickRoutine(Text text, int from, int to, float duration)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / duration;
                int current = Mathf.RoundToInt(Mathf.Lerp(from, to, progress));
                text.text = current.ToString();
                yield return null;
            }
            text.text = to.ToString();
        }

        // --- EASING FUNCTIONS (ANIMATION TIMING TABLE MATCHES) ---

        private float EaseQuadOut(float t) => t * (2 - t);
        private float EaseQuadInOut(float t) => t < 0.5f ? 2 * t * t : -1 + (4 - 2 * t) * t;
        private float EaseExpoOut(float t) => t == 1 ? 1 : 1 - Mathf.Pow(2, -10 * t);
        private float EaseExpoInOut(float t) => t == 0 ? 0 : t == 1 ? 1 : t < 0.5f ? Mathf.Pow(2, 20 * t - 10) / 2 : (2 - Mathf.Pow(2, -20 * t + 10)) / 2;
        private float EaseBackOut(float t)
        {
            float c1 = 1.70158f;
            float c3 = c1 + 1;
            return 1 + c3 * Mathf.Pow(t - 1, 3) + c1 * Mathf.Pow(t - 1, 2);
        }
        private float EaseElasticOut(float t)
        {
            if (t == 0) return 0;
            if (t == 1) return 1;
            float p = 0.3f;
            return Mathf.Pow(2, -10 * t) * Mathf.Sin((t - p / 4) * (2 * Mathf.PI) / p) + 1;
        }
    }
}
