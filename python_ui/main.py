import os
import json
from PIL import Image
from flask import Flask, render_template, jsonify, abort, request

DATA_FOLDER = "static/data/"
TRANSCRIPTION_FILE = "transcription.txt"
AUDIO_FILE = "audio.mp3"
OUTPUT_FOLDER = "annotations/"

app = Flask(__name__)

def calculate_mapping():
    mapping = {}

    subject_foldernames = os.listdir(DATA_FOLDER)
    for subject_foldername in subject_foldernames:
        if not subject_foldername.startswith('subject_') or not subject_foldername[8:].isdecimal():
            continue
        subject = int(subject_foldername[8:])
        subject_folder = os.path.join(DATA_FOLDER, subject_foldername) + "/"

        mapping[subject] = {}

        session_foldernames = os.listdir(subject_folder)
        for session_foldername in session_foldernames:
            if not session_foldername.startswith('session_') or not session_foldername[8:].isdecimal():
                continue
            session = int(session_foldername[8:])
            session_folder = os.path.join(subject_folder, session_foldername) + "/"

            frames = []

            interaction_foldernames = os.listdir(session_folder)
            for interaction_foldername in interaction_foldernames:
                if not interaction_foldername.startswith('interaction_') or not interaction_foldername[12:].isdecimal():
                    continue
                interaction = int(interaction_foldername[12:])
                interaction_folder = os.path.join(session_folder, interaction_foldername) + "/"

                img_folder = os.path.join(interaction_folder, "rgb") + "/"
                img_files = os.listdir(img_folder)
                img_idx = 1
                ego_file = "ego_{}.jpg".format(img_idx)
                exo_file = "exo_{}.jpg".format(img_idx)
                audio_file = os.path.join(interaction_folder, AUDIO_FILE)

                transcription_file = open(os.path.join(interaction_folder, TRANSCRIPTION_FILE))
                transcription = transcription_file.read().strip()
                transcription_file.close()

                while ego_file in img_files and exo_file in img_files:
                    full_ego_file = os.path.join(img_folder, ego_file)
                    full_exo_file = os.path.join(img_folder, exo_file)
                    im = Image.open(full_ego_file)
                    ego_width, ego_height = im.size
                    im = Image.open(full_exo_file)
                    exo_width, exo_height = im.size

                    frames.append({
                        'interaction': interaction, 
                        'img_idx': img_idx,
                        'ego_filepath': full_ego_file,
                        'ego_width': ego_width,
                        'ego_height': ego_height,
                        'exo_filepath': full_exo_file,
                        'exo_width': exo_width,
                        'exo_height': exo_height,
                        'audio_filepath': audio_file,
                        'transcription': transcription,
                    })
                    img_idx += 1
                    ego_file = "ego_{}.jpg".format(img_idx)
                    exo_file = "exo_{}.jpg".format(img_idx)
        
            mapping[subject][session] = frames

    return mapping

global mapping
mapping = calculate_mapping()

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/get_mapping")
def get_mapping():
    return mapping

@app.route("/refresh_mapping")
def refresh_mapping():
    global mapping
    mapping = calculate_mapping()
    return mapping

@app.route("/total_frames/<subject>/<session>")
def total_frames(subject, session):
    if not subject.isdecimal() or int(subject) not in mapping:
        valid_subjects = str(sorted(list(mapping.keys())))
        abort(400, "Invalid subject provided! Please provide subject from the following list of valid subjects: " + valid_subjects)
    if not session.isdecimal() or int(session) not in mapping[int(subject)]:
        valid_sessions = str(sorted(list(mapping[int(subject)].keys())))
        abort(400, "Invalid session provided! Please provide session from the following list of valid sessions: " + valid_sessions)
    return jsonify(len(mapping[int(subject)][int(session)]))

@app.route("/get_frame/<subject>/<session>/<frame_num>")
def get_frame(subject, session, frame_num):
    if not subject.isdecimal() or int(subject) not in mapping:
        valid_subjects = str(sorted(list(mapping.keys())))
        abort(400, "Invalid subject provided! Please provide subject from the following list of valid subjects: " + valid_subjects)
    subject_data = mapping[int(subject)]

    if not session.isdecimal() or int(session) not in subject_data:
        valid_sessions = str(sorted(list(subject_data.keys())))
        abort(400, "Invalid session provided! Please provide session from the following list of valid sessions: " + valid_sessions)
    session_data = subject_data[int(session)]

    if not frame_num.isdecimal() or int(frame_num) < 0 or int(frame_num) >= len(session_data):
        valid_frames = str([i for i in range(len(session_data))])
        abort(400, "Invalid frame number provided or frame number out of bounds! Please provide frame number from the following list of valid frames: " + valid_sessions)
    frame_data = session_data[int(frame_num)]

    return frame_data

@app.route("/save_session/<subject>/<session>", methods=['POST'])
def save_session(subject, session):
    data = json.loads(request.data, strict=False)

    # Convert data from dictionary to array
    output = []
    for frame_num in sorted(data.keys()):
        output.append(data[frame_num])

    filename = "subject_{}_session_{}.json".format(subject, session)
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    if not os.path.exists(OUTPUT_FOLDER):
        os.mkdir(OUTPUT_FOLDER)
    json.dump(output, open(filepath, "w+"))
    return {}


if __name__ == "__main__":
    app.run(debug=True)
