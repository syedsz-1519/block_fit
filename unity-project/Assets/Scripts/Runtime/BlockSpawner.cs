using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace BlockFitPuzzle.Runtime
{
    [System.Serializable]
    public class LevelData
    {
        public int id;
        public int gridWidth;
        public int gridHeight;
        public List<BlockShape> blocksToSpawn;
    }

    public class BlockSpawner : MonoBehaviour
    {
        public static BlockSpawner Instance { get; private set; }

        [Header("Prefab References")]
        [SerializeField] private GameObject blockPiecePrefab;
        [SerializeField] private Transform blockTrayContainer;

        [Header("Animation Settings")]
        [SerializeField] private float spawnDelayBetweenBlocks = 0.12s;
        [SerializeField] private float spawnScaleDuration = 0.35f;

        // Object Pool for Block GameObjects
        private Queue<GameObject> blockPool = new Queue<GameObject>();
        private List<GameObject> activeSpawnedBlocks = new List<GameObject>();

        public List<GameObject> ActiveBlocks => activeSpawnedBlocks;

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

        public void PrewarmPool(int initialCapacity)
        {
            for (int i = 0; i < initialCapacity; i++)
            {
                GameObject block = Instantiate(blockPiecePrefab, Vector3.zero, Quaternion.identity);
                block.SetActive(false);
                blockPool.Enqueue(block);
            }
        }

        public void SpawnBlocksForLevel(LevelData level)
        {
            // Clear existing active blocks first
            ClearActiveBlocks();

            // Spawn blocks with a cascade animation
            StartCoroutine(SpawnBlocksSequence(level.blocksToSpawn));
        }

        private IEnumerator SpawnBlocksSequence(List<BlockShape> shapes)
        {
            Vector3 trayCenter = blockTrayContainer != null ? blockTrayContainer.position : Vector3.zero;
            float spacingX = 2.5f;
            float totalWidth = (shapes.Count - 1) * spacingX;
            float startX = trayCenter.x - (totalWidth / 2f);

            for (int i = 0; i < shapes.Count; i++)
            {
                Vector3 spawnPos = new Vector3(startX + (i * spacingX), trayCenter.y, 0f);
                yield return SpawnBlockAnimated(shapes[i], spawnPos);
                yield return new WaitForSeconds(spawnDelayBetweenBlocks);
            }
        }

        private IEnumerator SpawnBlockAnimated(BlockShape shape, Vector3 position)
        {
            GameObject blockGo = GetBlockFromPool();
            blockGo.transform.position = position;
            blockGo.transform.localScale = Vector3.zero;
            blockGo.SetActive(true);

            activeSpawnedBlocks.Add(blockGo);

            // Setup custom shape properties in block (e.g. coordinates, colors)
            // blockGo.GetComponent<BlockPieceController>()?.Setup(shape);

            // Smooth Bounce / Elastic Out spawn animation sequence
            float timer = 0f;
            while (timer < spawnScaleDuration)
            {
                timer += Time.deltaTime;
                float progress = timer / spawnScaleDuration;
                
                // Elastic ease out calculation
                float scale = ElasticOut(progress);
                blockGo.transform.localScale = new Vector3(scale, scale, 1f);
                yield return null;
            }

            blockGo.transform.localScale = Vector3.one;
        }

        private GameObject GetBlockFromPool()
        {
            if (blockPool.Count > 0)
            {
                return blockPool.Dequeue();
            }
            else
            {
                return Instantiate(blockPiecePrefab, Vector3.zero, Quaternion.identity);
            }
        }

        public void DespawnBlock(GameObject block)
        {
            if (activeSpawnedBlocks.Contains(block))
            {
                activeSpawnedBlocks.Remove(block);
            }

            block.SetActive(false);
            block.transform.SetParent(null);
            blockPool.Enqueue(block);
        }

        public void ClearActiveBlocks()
        {
            for (int i = activeSpawnedBlocks.Count - 1; i >= 0; i--)
            {
                DespawnBlock(activeSpawnedBlocks[i]);
            }
            activeSpawnedBlocks.Clear();
        }

        private float ElasticOut(float t)
        {
            if (t == 0) return 0;
            if (t == 1) return 1;
            float p = 0.3f;
            return Mathf.Pow(2, -10 * t) * Mathf.Sin((t - p / 4) * (2 * Mathf.PI) / p) + 1;
        }
    }
}
