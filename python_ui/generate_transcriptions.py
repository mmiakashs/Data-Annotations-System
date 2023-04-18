# Python script to generate transcriptions of videos using the OpenAI Whisper model

import os
import cv2
import json
import shutil
import whisper

# Parameters
MODEL_NAME = "base.en"
DATA_FOLDER = "static/data/"
AUDIO_FILENAME = "audio.mp3"
OUTPUT_JSON_FILENAME = "../transcriptions.json"
USING_CUDA = False

transcription_mapping = {}
if os.path.exists(OUTPUT_JSON_FILENAME):
    transcription_mapping = json.load(open(OUTPUT_JSON_FILENAME))

model = whisper.load_model(MODEL_NAME)

subject_foldernames = os.listdir(DATA_FOLDER)
for subject_foldername in subject_foldernames:
    if not subject_foldername.startswith('subject_') or not subject_foldername[8:].isdecimal():
        continue
    subject = int(subject_foldername[8:])
    subject_folder = os.path.join(DATA_FOLDER, subject_foldername) + "/"

    session_foldernames = os.listdir(subject_folder)
    for session_foldername in session_foldernames:
        if not session_foldername.startswith('session_') or not session_foldername[8:].isdecimal():
            continue
        session = int(session_foldername[8:])
        session_folder = os.path.join(subject_folder, session_foldername) + "/"

        interaction_foldernames = os.listdir(session_folder)
        for interaction_foldername in interaction_foldernames:
            if not interaction_foldername.startswith('interaction_') or not interaction_foldername[12:].isdecimal():
                continue
            interaction = int(interaction_foldername[12:])
            interaction_folder = os.path.join(session_folder, interaction_foldername) + "/"

            audio_filepath = os.path.join(interaction_folder, AUDIO_FILENAME)
            if not os.path.exists(audio_filepath):
                continue

            if subject not in transcription_mapping:
                transcription_mapping[subject] = {}
            if session not in transcription_mapping[subject]:
                transcription_mapping[subject][session] = {}

            print("Generating transcription for subject {}, session {}, interaction {}".format(subject, session, interaction))
            result = model.transcribe(audio_filepath, fp16=USING_CUDA)
            text = result["text"]
            print("Text:", text)
            transcription_mapping[subject][session][interaction] = text
            json.dump(transcription_mapping, open(OUTPUT_JSON_FILENAME, "w+"))
