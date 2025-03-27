from flask_socketio import SocketIO, emit
import os
import base64
import numpy as np
import cv2
import threading
from PIL import Image
from ultralytics import YOLO
import time
import torch
from transformers import pipeline

from class_names import class_names  # Ensure this file contains your YOLO class names
device = "cuda" if torch.cuda.is_available() else "cpu"

print("Device:",device)
# Load YOLOv10 model
model = YOLO("yolov10n.pt").to("cuda")

# Load depth estimation model using pipeline
depth_pipe = pipeline(task="depth-estimation", model="LiheYoung/depth-anything-small-hf", device=device)
scale_factor = 0.003 
# Function to determine the position (left, straight, right) of detected objects
def determine_object_position(frame_width, bounding_box):
    x_min, _, x_max, _ = map(int, bounding_box)
    
    # Calculate the width of each segment (left, straight, right)
    segment_width = frame_width // 3
    
    # Calculate the center of the bounding box
    center_x = (x_min + x_max) // 2

    # Determine whether the object is on the left, straight (center), or right
    if center_x < segment_width:
        return "left"
    elif center_x < 2 * segment_width:
        return "straight"
    else:
        return "right"

# Function to process frames and print detected objects and their positions
# Function to process frames, print detected objects, their positions, distances, and draw bounding boxes
def handleSafestreet(frame):
    frame_height, frame_width, _ = frame.shape  # Get the frame dimensions
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    resized_frame = cv2.resize(frame_rgb, (640, 640))  # Adjust size based on your model's input requirements

    # Generate depth map for the current frame
    depth_output = depth_pipe(Image.fromarray(frame_rgb))
    depth_map = np.array(depth_output["depth"])

    # Detect objects using YOLO
    results = model(resized_frame)[0]

    # Get bounding boxes, class labels, and class IDs
    class_ids = results.boxes.cls.cpu().numpy().astype(int)
    class_labels = [class_names[int(cls)] for cls in results.boxes.cls.cpu().numpy()]
    bounding_boxes = results.boxes.xyxy.cpu().numpy().astype(int)

    # Count occurrences of each detected object, determine their positions, and calculate distances
    detected_objects_position = {}
    detection_sentences = []
    
    for label, bbox in zip(class_labels, bounding_boxes):
        # Determine the position of the object
        position = determine_object_position(frame_width, bbox)  # Determine the object's position

        # Calculate the average depth for the object in the bounding box
        x_min, y_min, x_max, y_max = bbox
        object_depth_region = depth_map[y_min:y_max, x_min:x_max]  # Extract depth values for the object
        avg_depth = np.mean(object_depth_region)

        # Convert the depth to real-world distance using the scale factor and then convert to feet
        real_distance_meters = avg_depth * scale_factor
        real_distance_feet = real_distance_meters * 3.28084

        detected_objects_position[label] = position  # Store the position for this object

        # Generate detection sentence with position and distance in feet
        if(real_distance_feet>1):
            detection_sentence = f"{label} detected on your {position}, approximately {real_distance_feet:.0f} feet away."
        else:
            detection_sentence = f"{label} detected on your {position}, approximately {real_distance_feet:.1f} feet away."
    
        detection_sentences.append(detection_sentence)

        # Print the details of the detected object
        print(f"Detected Object: {label}")
        print(f"Position: {position}")
        print(f"Distance: {real_distance_feet:.2f} feet\n")

        # Draw bounding box on the original frame
        cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)  # Green bounding box
        # Add label text on the bounding box
        cv2.putText(frame, f"{label}: {real_distance_feet:.2f} ft", (x_min, y_min - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Optionally, save the modified frame with bounding boxes
    cv2.imwrite("annotated_frame.jpg", frame)

    return detection_sentences


# Set CORS policy based on environment
if os.environ.get('FLASK_ENV') == 'production':
    origins = [
        'https://innervoice.onrender.com'  # Replace with your hosted frontend URL
    ]
else:
    origins = "*"

# Initialize the SocketIO instance
socketio = SocketIO(cors_allowed_origins=origins)

# Handle chat messages
@socketio.on("chat")
def handle_chat(data):
    # Capitalize the message
    capitalized_msg = data['msg'].upper()
    # Create a new data object with the capitalized message
    response_data = {
        'user': data['user'],
        'msg': capitalized_msg
    }
    print("capital", capitalized_msg)
    # Broadcast the capitalized message back to all clients
    emit("chat", response_data, broadcast=True)

# Handle video stream frames
@socketio.on("stream")
def handle_stream(data):
    print("Received a frame")  # Log when receiving a frame
    
    # Decode the base64 image
    image_data = data['image'].split(",")[1]
    image_bytes = base64.b64decode(image_data)
    
    # Convert to numpy array
    np_array = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    # Get the action type
    action = data.get('action')
    print(f"Action received: {action}")

    # Process the frame if the action is "SafeStreet"
    if action == "SafeStreet":
        detection_sentences = handleSafestreet(frame)
        
        emit("stream",{'messages': detection_sentences})

    # Process the frame with OpenCV (optional: display or save)
    cv2.imwrite("received_frame.jpg", frame)  # Save the frame to disk for verification