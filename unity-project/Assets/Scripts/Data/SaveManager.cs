using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace WoodBlockSaga.Data
{
    [Serializable]
    public class PlayerProfile
    {
        public string DisplayName = "Woodcrafter";
        public string EquippedSkin = "ClassicOak";
        public string EquippedTheme = "WorkshopTable";
        public string EquippedCharacter = "Oakley";
    }

    [Serializable]
    public class CampaignProgress
    {
        public List<int> WorldUnlocks = new List<int> { 1 };
        public List<string> CompletedLevels = new List<string>();
        public Dictionary<string, int> LevelStars = new Dictionary<string, int>();
    }

    [Serializable]
    public class DailyData
    {
        public int StreakCount = 0;
        public string LastPlayedDate = "";
        public int StreakFreezeCount = 1;
    }

    [Serializable]
    public class GameSettings
    {
        public float MasterVolume = 1.0f;
        public float MusicVolume = 0.8f;
        public float SFXVolume = 1.0f;
        public bool HapticsEnabled = true;
        public string ColorblindMode = "none";
        public bool OneHandMode = false;
        public bool TapToPlace = false;
        public float UIScale = 1.0f;
    }

    [Serializable]
    public class SaveData
    {
        public PlayerProfile Profile = new PlayerProfile();
        public CampaignProgress Campaign = new CampaignProgress();
        public DailyData Daily = new DailyData();
        public GameSettings Settings = new GameSettings();
    }

    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        public SaveData CurrentData { get; private set; }

        private string saveFilePath;
        private readonly byte[] encryptionKey = Encoding.UTF8.GetBytes("WoodBlockSagaKey1234567890123456"); // 32 bytes

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                saveFilePath = Path.Combine(Application.persistentDataPath, "woodblock_save.dat");
                LoadGame();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void SaveGame()
        {
            try
            {
                string json = JsonUtility.ToJson(CurrentData, true);
                byte[] encryptedData = EncryptString(json, encryptionKey);
                File.WriteAllBytes(saveFilePath, encryptedData);
                Debug.Log($"[SaveManager] Game saved to {saveFilePath}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveManager] Save failed: {ex.Message}");
            }
        }

        public void LoadGame()
        {
            if (!File.Exists(saveFilePath))
            {
                Debug.Log("[SaveManager] No save file found. Creating new save data.");
                CurrentData = new SaveData();
                SaveGame();
                return;
            }

            try
            {
                byte[] encryptedData = File.ReadAllBytes(saveFilePath);
                string json = DecryptBytes(encryptedData, encryptionKey);
                CurrentData = JsonUtility.FromJson<SaveData>(json);
                Debug.Log("[SaveManager] Game loaded successfully.");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[SaveManager] Load failed, resetting save: {ex.Message}");
                CurrentData = new SaveData();
                SaveGame();
            }
        }

        private byte[] EncryptString(string plainText, byte[] key)
        {
            using (Aes aes = Aes.Create())
            {
                aes.Key = key;
                aes.IV = new byte[16];
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
                    {
                        byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
                        cs.Write(plainBytes, 0, plainBytes.Length);
                        cs.FlushFinalBlock();
                    }
                    return ms.ToArray();
                }
            }
        }

        private string DecryptBytes(byte[] cipherData, byte[] key)
        {
            using (Aes aes = Aes.Create())
            {
                aes.Key = key;
                aes.IV = new byte[16];
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Write))
                    {
                        cs.Write(cipherData, 0, cipherData.Length);
                        cs.FlushFinalBlock();
                    }
                    return Encoding.UTF8.GetString(ms.ToArray());
                }
            }
        }
    }
}
