using System.Collections;
using UnityEngine;

namespace BlockFitPuzzle.VFX
{
    public class AudioSync : MonoBehaviour
    {
        public static AudioSync Instance { get; private set; }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private AudioSource musicSource;

        [Header("Audio Clips")]
        [SerializeField] private AudioClip snapSfx;
        [SerializeField] private AudioClip clickSfx;
        [SerializeField] private AudioClip errorSfx;
        [SerializeField] private AudioClip winMusicTrack;

        private Coroutine musicFadeCoroutine;

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

        public void PlaySnapSound()
        {
            if (sfxSource != null && snapSfx != null)
            {
                sfxSource.PlayOneShot(snapSfx);
            }
        }

        public void PlayClickSound()
        {
            if (sfxSource != null && clickSfx != null)
            {
                sfxSource.PlayOneShot(clickSfx);
            }
        }

        public void PlayErrorSound()
        {
            if (sfxSource != null && errorSfx != null)
            {
                sfxSource.PlayOneShot(errorSfx);
            }
        }

        public void PlayWinMusic()
        {
            if (musicSource != null && winMusicTrack != null)
            {
                CrossfadeMusic(winMusicTrack, 0.4f);
            }
        }

        public void SetMusicIntensity(float intensity)
        {
            if (musicSource != null)
            {
                // Dynamic audio adjustments: slightly pitch up or boost volume when low on time
                musicSource.volume = Mathf.Clamp(intensity, 0f, 1f);
            }
        }

        public void CrossfadeMusic(AudioClip newClip, float duration)
        {
            if (musicSource == null) return;
            if (musicFadeCoroutine != null) StopCoroutine(musicFadeCoroutine);
            musicFadeCoroutine = StartCoroutine(CrossfadeMusicRoutine(newClip, duration));
        }

        private IEnumerator CrossfadeMusicRoutine(AudioClip newClip, float duration)
        {
            float startVolume = musicSource.volume;

            // Fade Out
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / duration);
                yield return null;
            }

            musicSource.clip = newClip;
            musicSource.Play();

            // Fade In
            elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(0f, startVolume, elapsed / duration);
                yield return null;
            }
            musicSource.volume = startVolume;
        }
    }
}
