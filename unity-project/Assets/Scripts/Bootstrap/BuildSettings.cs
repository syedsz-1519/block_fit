#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace BlockFitPuzzle.Bootstrap
{
    public static class BuildSettings
    {
        [MenuItem("Block Fit Puzzle/Configure Android Build")]
        public static void ConfigureAndroid()
        {
            Debug.Log("[BuildSettings] Running automated optimization profile for Google Android devices...");

            // 1. Company and Product Configuration
            PlayerSettings.companyName = "AI Studio Build";
            PlayerSettings.productName = "Block Fit Puzzle";
            PlayerSettings.bundleVersion = "1.0.0";
            
            // Set Target Platform
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);

            // 2. Refresh Refresh Rates
            QualitySettings.vSyncCount = 0; // Disable VSync to manually cap framerate at 60Hz
            Application.targetFrameRate = 60;

            // 3. Resolution and Orientations
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.allowedAutorotateToPortrait = true;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = false;
            PlayerSettings.allowedAutorotateToLandscapeRight = false;
            
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            // 4. Performance Optimizations (Enable high-performance IL2CPP scripting with ARM64/ARMv7 dual architecture support)
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARMv7 | AndroidArchitecture.ARM64;
            
            // Enable Managed Code Stripping to decrease file size (Low-Medium profile for maximum safety)
            PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.Android, ManagedStrippingLevel.Medium);

            // 5. Texture Compression Quality configuration (ASTC compress is high performance on all modern GLES3 chips)
            EditorUserBuildSettings.androidBuildSubtarget = MobileTextureSubtarget.ASTC;

            Debug.Log("[BuildSettings] Configuration Complete. Android PlayerSettings Optimized successfully!");
        }
    }
}
#endif
