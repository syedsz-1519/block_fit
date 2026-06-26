using System;
using System.Collections.Generic;
using UnityEngine;

namespace BlockFitPuzzle.Sudoku
{
    public class ColorBlockVisual : MonoBehaviour
    {
        [Header("Block Visuals")]
        [SerializeField] private GameObject segmentPrefab;
        [SerializeField] private float segmentSpacing = 1.05f;
        
        private ColorBlockShape blockShape;
        private List<SpriteRenderer> segmentRenderers = new List<SpriteRenderer>();
        private List<GameObject> activeSegments = new List<GameObject>();
        
        public ColorBlockShape BlockShape => blockShape;

        public void Initialize(ColorBlockShape shape)
        {
            blockShape = shape;
            CreateSegments();
        }
        
        private void CreateSegments()
        {
            // Clear prior active segments
            foreach (GameObject seg in activeSegments)
            {
                Destroy(seg);
            }
            activeSegments.Clear();
            segmentRenderers.Clear();

            if (blockShape == null || segmentPrefab == null) return;

            for (int i = 0; i < blockShape.coordinates.Length; i++)
            {
                Vector2Int coord = blockShape.coordinates[i];
                Vector3 localPos = new Vector3(coord.x * segmentSpacing, coord.y * segmentSpacing, 0f);

                GameObject segmentGo = Instantiate(segmentPrefab, transform);
                segmentGo.transform.localPosition = localPos;
                segmentGo.name = $"Segment_{coord.x}_{coord.y}";

                SpriteRenderer sr = segmentGo.GetComponent<SpriteRenderer>();
                if (sr == null) sr = segmentGo.AddComponent<SpriteRenderer>();

                // Set segment color mapping from BlockFit/SudokuColor config
                if (SudokuGridRenderer.Instance != null)
                {
                    sr.color = SudokuGridRenderer.Instance.GetColorForSudokuColor(blockShape.cellColors[i]);
                }

                segmentRenderers.Add(sr);
                activeSegments.Add(segmentGo);
            }
        }
        
        public void UpdateColors(SudokuGridData grid, int originX, int originY)
        {
            if (blockShape == null || grid == null) return;

            // Highlight cells real-time during interaction
            for (int i = 0; i < blockShape.coordinates.Length; i++)
            {
                Vector2Int offset = blockShape.coordinates[i];
                int targetX = originX + offset.x;
                int targetY = originY + offset.y;

                if (grid.IsInBounds(targetX, targetY))
                {
                    bool isValidCell = grid.IsValidPlacement(targetX, targetY, blockShape.cellColors[i]);
                    bool isOccupied = grid.cellStates[targetX, targetY] == SudokuGridData.CellState.Placed ||
                                      grid.cellStates[targetX, targetY] == SudokuGridData.CellState.Fixed;

                    if (isOccupied)
                    {
                        segmentRenderers[i].color = new Color(1f, 0.3f, 0.3f, 0.8f); // Conflicting overlap
                    }
                    else if (!isValidCell)
                    {
                        segmentRenderers[i].color = new Color(0.95f, 0.77f, 0.06f, 0.8f); // Sudoku constraint failure
                    }
                    else
                    {
                        // Clean fit glow
                        if (SudokuGridRenderer.Instance != null)
                        {
                            segmentRenderers[i].color = SudokuGridRenderer.Instance.GetColorForSudokuColor(blockShape.cellColors[i]);
                        }
                    }
                }
                else
                {
                    // Out of bounds - semi-transparent alert
                    segmentRenderers[i].color = new Color(0.5f, 0.5f, 0.5f, 0.4f);
                }
            }
        }
        
        public void SetTransparency(float alpha)
        {
            foreach (SpriteRenderer sr in segmentRenderers)
            {
                Color col = sr.color;
                col.a = alpha;
                sr.color = col;
            }
        }
        
        public void AnimatePlace()
        {
            // Bounce or squish on placement
            StartCoroutine(PlaceBounceAnimation());
        }

        private System.Collections.IEnumerator PlaceBounceAnimation()
        {
            Vector3 targetScale = Vector3.one;
            Vector3 bounceUp = Vector3.one * 1.15f;
            float elapsed = 0f;
            float duration = 0.15f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                transform.localScale = Vector3.Lerp(targetScale, bounceUp, elapsed / duration);
                yield return null;
            }

            elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                transform.localScale = Vector3.Lerp(bounceUp, targetScale, elapsed / duration);
                yield return null;
            }
            transform.localScale = targetScale;
        }
    }
}
