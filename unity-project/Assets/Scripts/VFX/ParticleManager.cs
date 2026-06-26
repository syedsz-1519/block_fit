using System.Collections.Generic;
using UnityEngine;

namespace BlockFitPuzzle.VFX
{
    [System.Serializable]
    public struct ParticleConfig
    {
        public string id;
        public ParticleSystem prefab;
        public int poolSize;
    }

    public class ParticleManager : MonoBehaviour
    {
        public static ParticleManager Instance { get; private set; }

        [Header("Particle Pools Configuration")]
        [SerializeField] private List<ParticleConfig> configurations;
        [SerializeField] private int maxSimultaneousEffects = 3;

        private Dictionary<string, Queue<ParticleSystem>> particlePools = new Dictionary<string, Queue<ParticleSystem>>();
        private List<ParticleSystem> activeEffectsList = new List<ParticleSystem>();

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                InitializePools();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializePools()
        {
            foreach (ParticleConfig config in configurations)
            {
                if (config.prefab == null) continue;

                Queue<ParticleSystem> pool = new Queue<ParticleSystem>();
                for (int i = 0; i < config.poolSize; i++)
                {
                    ParticleSystem ps = Instantiate(config.prefab, Vector3.zero, Quaternion.identity, transform);
                    ps.gameObject.SetActive(false);
                    pool.Enqueue(ps);
                }
                particlePools[config.id] = pool;
            }
        }

        public void PlayEffect(string effectId, Vector3 position, Color? color = null)
        {
            if (!particlePools.ContainsKey(effectId))
            {
                Debug.LogWarning($"[ParticleManager] Particle pool for effect ID '{effectId}' not initialized.");
                return;
            }

            // Cap the concurrent active effects for mobile performance
            if (activeEffectsList.Count >= maxSimultaneousEffects)
            {
                // Recycle the oldest active system
                ParticleSystem oldest = activeEffectsList[0];
                oldest.Stop();
                oldest.gameObject.SetActive(false);
                activeEffectsList.RemoveAt(0);
                
                // Return to appropriate pool
                ReturnOldestSystemToAppropriatePool(oldest);
            }

            Queue<ParticleSystem> pool = particlePools[effectId];
            ParticleSystem ps = null;

            if (pool.Count > 0)
            {
                ps = pool.Dequeue();
            }
            else
            {
                // Instantiate a safety extra and log
                ParticleConfig config = configurations.Find(c => c.id == effectId);
                if (config.prefab != null)
                {
                    ps = Instantiate(config.prefab, Vector3.zero, Quaternion.identity, transform);
                }
            }

            if (ps != null)
            {
                ps.transform.position = position;
                ps.gameObject.SetActive(true);

                // Tint color if supplied
                if (color.HasValue)
                {
                    var mainModule = ps.main;
                    mainModule.startColor = color.Value;
                }

                ps.Play();
                activeEffectsList.Add(ps);

                // Auto return to pool after duration
                StartCoroutine(AutoReturnToPool(ps, effectId, ps.main.duration + ps.main.startLifetime.constantMax));
            }
        }

        private System.Collections.IEnumerator AutoReturnToPool(ParticleSystem ps, string effectId, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (ps != null && ps.gameObject.activeSelf)
            {
                ps.Stop();
                ps.gameObject.SetActive(false);
                activeEffectsList.Remove(ps);
                if (particlePools.ContainsKey(effectId))
                {
                    particlePools[effectId].Enqueue(ps);
                }
            }
        }

        private void ReturnOldestSystemToAppropriatePool(ParticleSystem ps)
        {
            foreach (var kvp in particlePools)
            {
                // In a production context, match via name tags or components
                if (ps.name.Contains(kvp.Key))
                {
                    kvp.Value.Enqueue(ps);
                    return;
                }
            }
            // Fallback: put in first pool
            if (configurations.Count > 0)
            {
                particlePools[configurations[0].id].Enqueue(ps);
            }
        }
    }
}
