# Python script to generate transcriptions of videos using the OpenAI Whisper model

import os
import cv2
import json
import shutil
import whisper

# In the future take these in as parameters
FRAME_EXTRACTIONS_FOLDER = "frame_extractions/"
SAVE_JSON = "transcriptions.json"
MODEL_NAME = "base.en"
VIDEO_ENDING = ".mp4"
videos_folder = "../videos/"
filenames = []
model = whisper.load_model(MODEL_NAME)

files = os.listdir(videos_folder)
for filename in files:
    if filename.endswith(VIDEO_ENDING):
        filenames.append(filename)


if os.path.exists(SAVE_JSON):
    saved_data = json.load(open(SAVE_JSON))
else:
    saved_data = {}

if not os.path.exists(FRAME_EXTRACTIONS_FOLDER):
    os.mkdir(FRAME_EXTRACTIONS_FOLDER)

filenames_str = '\n'.join(filenames)
print(f"Found the following video files:\n{filenames_str}\n")

for filename in filenames:
    filepath = os.path.join(videos_folder, filename)

    # Don't reprocess files
    if filename in saved_data:
        continue

    print(f"Processing {filename}")

    # Use whisper to get a transcription of the video
    result = model.transcribe(filepath)
    text = result["text"]
    print(f"Transcription: {text}")

    # Extract frames from the video
    cam = cv2.VideoCapture(filepath)
    num_frames = 0
    zip_filename_base = filename.replace("/", "_").rstrip(".mp4")
    zip_folder = os.path.join(FRAME_EXTRACTIONS_FOLDER, zip_filename_base)
    if not os.path.exists(zip_folder):
        os.mkdir(zip_folder)
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

    zip_filename = zip_filename_base + ".zip"
    # Save data to json object
    saved_data[filename] = {}
    saved_data[filename]["transcription"] = text
    saved_data[filename]["frames_folder"] = zip_folder
    saved_data[filename]["frames_zip_filename"] = zip_filename

    # Save every iteration
    json.dump(saved_data, open(SAVE_JSON, "w+"))
