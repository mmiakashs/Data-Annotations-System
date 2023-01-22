# Python script to generate transcriptions of videos using the OpenAI Whisper model

import os
import cv2
import json
import shutil
import whisper

# Parameters
MODEL_NAME = "base.en"
VIDEOS_FOLDER = "../videos/"
# VIDEOS_FOLDER = "D:/Srikar/Research/CRL/videos/"
VIDEO_ENDING = ".mp4"
OUTPUT_JSON_FILENAME = "transcriptions.json"
FRAME_EXTRACTIONS_FOLDER = "frame_extractions/"
USING_CUDA = False

filenames = []
model = whisper.load_model(MODEL_NAME)

files = os.listdir(VIDEOS_FOLDER)
for filename in files:
    if filename.endswith(VIDEO_ENDING):
        filenames.append(filename)


if os.path.exists(OUTPUT_JSON_FILENAME):
    saved_data = json.load(open(OUTPUT_JSON_FILENAME))
else:
    saved_data = {}

if not os.path.exists(FRAME_EXTRACTIONS_FOLDER):
    os.mkdir(FRAME_EXTRACTIONS_FOLDER)

filenames_str = '\n'.join(filenames)
print(f"Found the following video files:\n{filenames_str}\n")

for filename in filenames:
    filepath = os.path.join(VIDEOS_FOLDER, filename)

    # Don't reprocess files
    if filename in saved_data:
        continue

    print(f"Processing {filename}")
    print(filepath)

    # Use whisper to get a transcription of the video
    result = model.transcribe(filepath, fp16=USING_CUDA)
    text = result["text"]
    print(f"Transcription: {text}")

    # Clear any existing contents from the extracted frames directory
    zip_filename_base = filename.replace("/", "_").rstrip(".mp4")
    zip_folder = os.path.join(FRAME_EXTRACTIONS_FOLDER, zip_filename_base)
    if os.path.exists(zip_folder):
        shutil.rmtree(zip_folder)
    os.mkdir(zip_folder)
 
    # Extract frames from the video
    cam = cv2.VideoCapture(filepath)
    num_frames = 0
    while True:
        ret, frame = cam.read()
        if not ret:
            break

        frame_filepath = os.path.join(zip_folder, f"{num_frames}.jpg")
        cv2.imwrite(frame_filepath, frame)
        num_frames += 1
    
    print(f"Finished extracting {num_frames} frames, saving to zip file")

    # Save the directory to a zip file
    zip_filename = zip_folder
    shutil.make_archive(zip_filename, 'zip', zip_folder)
    print(f"Zip extracted, saved to {zip_filename}")
    print()

    # Delete the original, unzipped frames folder
    shutil.rmtree(zip_folder)

    zip_filename = zip_filename_base + ".zip"
    # Save data to json object
    saved_data[filename] = {}
    saved_data[filename]["transcription"] = text
    saved_data[filename]["frames_folder"] = zip_folder
    saved_data[filename]["frames_zip_filename"] = zip_filename

    # Save every iteration
    json.dump(saved_data, open(OUTPUT_JSON_FILENAME, "w+"))
