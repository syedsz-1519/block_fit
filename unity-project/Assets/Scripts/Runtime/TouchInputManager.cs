using System;
using System.Collections.Generic;
using UnityEngine;

namespace BlockFitPuzzle.Runtime
{
    public class TouchInputManager : MonoBehaviour
    {
        public static TouchInputManager Instance { get; private set; }

        [Header("Gestures Settings")]
        [SerializeField] private float doubleTapThreshold = 0.3f;
        [SerializeField] private float longPressThreshold = 0.6f;
        [SerializeField] private float dragStartDistanceThreshold = 10f; // in pixels
        [SerializeField] private float inputBufferDuration = 0.05f; // 50ms input buffer

        // Events
        public event Action<Vector2> OnTap;
        public event Action<Vector2> OnDoubleTap;
        public event Action<Vector2, Vector2> OnDragStart; // position, delta
        public event Action<Vector2, Vector2> OnDrag;
        public event Action<Vector2> OnDragEnd;
        public event Action<Vector2> OnLongPress;
        public event Action<float> OnPinch; // delta scale

        private Vector2 touchStartPos;
        private float touchStartTime;
        private bool isDragging;
        private bool isLongPressedTriggered;
        private float lastTapTime;
        private Vector2 lastTapPos;

        // Buffered input queue to ensure frame-precise actions aren't lost
        private struct BufferedInputEvent
        {
            public string eventType;
            public Vector2 position;
            public Vector2 delta;
            public float floatValue;
            public float timestamp;
        }
        private Queue<BufferedInputEvent> inputQueue = new Queue<BufferedInputEvent>();

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
            ProcessRawInput();
            ProcessBufferedEvents();
        }

        private void ProcessRawInput()
        {
            // Mobile Touch detection
            if (Input.touchCount > 0)
            {
                if (Input.touchCount >= 2)
                {
                    HandlePinchGesture();
                    return;
                }

                Touch touch = Input.GetTouch(0);
                Vector2 currentPos = touch.position;

                switch (touch.phase)
                {
                    case TouchPhase.Began:
                        InitiateInputTrack(currentPos);
                        break;

                    case TouchPhase.Moved:
                    case TouchPhase.Stationary:
                        UpdateInputTrack(currentPos, touch.deltaPosition);
                        break;

                    case TouchPhase.Ended:
                    case TouchPhase.Canceled:
                        EndInputTrack(currentPos);
                        break;
                }
            }
            // Mouse fallbacks for Editor & Web builds
            else
            {
                Vector2 mousePos = Input.mousePosition;

                if (Input.GetMouseButtonDown(0))
                {
                    InitiateInputTrack(mousePos);
                }
                else if (Input.GetMouseButton(0))
                {
                    Vector2 delta = mousePos - lastTapPos; // estimate delta
                    UpdateInputTrack(mousePos, delta);
                    lastTapPos = mousePos;
                }
                else if (Input.GetMouseButtonUp(0))
                {
                    EndInputTrack(mousePos);
                }
            }
        }

        private void InitiateInputTrack(Vector2 position)
        {
            touchStartPos = position;
            touchStartTime = Time.time;
            isDragging = false;
            isLongPressedTriggered = false;
            lastTapPos = position;
        }

        private void UpdateInputTrack(Vector2 currentPos, Vector2 delta)
        {
            float duration = Time.time - touchStartTime;

            // Check for drag start
            if (!isDragging && Vector2.Distance(touchStartPos, currentPos) > dragStartDistanceThreshold)
            {
                isDragging = true;
                BufferEvent("DragStart", currentPos, delta);
            }

            if (isDragging)
            {
                BufferEvent("Drag", currentPos, delta);
            }
            else if (!isLongPressedTriggered && duration >= longPressThreshold)
            {
                isLongPressedTriggered = true;
                BufferEvent("LongPress", currentPos, Vector2.zero);
            }
        }

        private void EndInputTrack(Vector2 endPos)
        {
            if (isDragging)
            {
                BufferEvent("DragEnd", endPos, Vector2.zero);
                isDragging = false;
            }
            else if (!isLongPressedTriggered)
            {
                float duration = Time.time - touchStartTime;
                if (duration < longPressThreshold)
                {
                    float timeSinceLastTap = Time.time - lastTapTime;
                    if (timeSinceLastTap < doubleTapThreshold && Vector2.Distance(lastTapPos, endPos) < 50f)
                    {
                        BufferEvent("DoubleTap", endPos, Vector2.zero);
                        lastTapTime = 0f; // reset
                    }
                    else
                    {
                        BufferEvent("Tap", endPos, Vector2.zero);
                        lastTapTime = Time.time;
                        lastTapPos = endPos;
                    }
                }
            }
        }

        private void HandlePinchGesture()
        {
            Touch touchZero = Input.GetTouch(0);
            Touch touchOne = Input.GetTouch(1);

            Vector2 touchZeroPrevPos = touchZero.position - touchZero.deltaPosition;
            Vector2 touchOnePrevPos = touchOne.position - touchOne.deltaPosition;

            float prevTouchDeltaMag = (touchZeroPrevPos - touchOnePrevPos).magnitude;
            float touchDeltaMag = (touchZero.position - touchOne.position).magnitude;

            float deltaMagnitudeDiff = touchDeltaMag - prevTouchDeltaMag;
            BufferEvent("Pinch", Vector2.zero, Vector2.zero, deltaMagnitudeDiff);
        }

        private void BufferEvent(string type, Vector2 pos, Vector2 delta, float floatVal = 0f)
        {
            BufferedInputEvent evt = new BufferedInputEvent
            {
                eventType = type,
                position = pos,
                delta = delta,
                floatValue = floatVal,
                timestamp = Time.time
            };
            inputQueue.Enqueue(evt);
        }

        private void ProcessBufferedEvents()
        {
            while (inputQueue.Count > 0)
            {
                BufferedInputEvent evt = inputQueue.Peek();
                
                // Keep inside buffer for up to 'inputBufferDuration' for frame alignment/smoothing if necessary
                if (Time.time - evt.timestamp < inputBufferDuration)
                {
                    // Execute immediately for responsiveness
                    DispatchEvent(evt);
                    inputQueue.Dequeue();
                }
                else
                {
                    // Stale event, pop it
                    inputQueue.Dequeue();
                }
            }
        }

        private void DispatchEvent(BufferedInputEvent evt)
        {
            switch (evt.eventType)
            {
                case "Tap":
                    OnTap?.Invoke(evt.position);
                    break;
                case "DoubleTap":
                    OnDoubleTap?.Invoke(evt.position);
                    break;
                case "DragStart":
                    OnDragStart?.Invoke(evt.position, evt.delta);
                    break;
                case "Drag":
                    OnDrag?.Invoke(evt.position, evt.delta);
                    break;
                case "DragEnd":
                    OnDragEnd?.Invoke(evt.position);
                    break;
                case "LongPress":
                    OnLongPress?.Invoke(evt.position);
                    break;
                case "Pinch":
                    OnPinch?.Invoke(evt.floatValue);
                    break;
            }
        }
    }
}
