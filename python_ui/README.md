# Data-Annotations-System

## Overview

This tool is the newer, Python-based version of the original Data Annotation Tool. This version is meant to be used with **pictures (not videos)** and follows the directory format of the previous tool.

This project splits data annotation into two steps:
1. Running `generate_transcriptions.py` to use the the OpenAI Whisper model to generate transcriptions of input audio.
    - This step looks at all the audio in the data folder, finds the audio *.mp3* file for every session, and saves the audio transcription to the `transcriptions.json` file.
2. Using a HTML / JavaScript UI with a Python Flask backend to manually annotate the frame data and generate an output JSON describing the annotations.

## Installation

Before running the preprocessing step, you need to first install the python library used to generate transcriptions in `generate_transcriptions.py`,  [Whisper](https://github.com/openai/whisper).

```
pip3 install -U openai-whisper # Install Whisper
```

Also ensure that you have ffmpeg installed since it is necessary for whisper to run. The download for ffmpeg can be found [here](https://ffmpeg.org/download.html).

For the UI part of the tool, you will need to install Python's [Pillow](https://pypi.org/project/Pillow/) as well as the [Flask](https://flask.palletsprojects.com/en/2.2.x/) library.
To install these libraries, simply run:
```
pip3 install Pillow # Install Pillow
pip3 install Flask # Install Flask
```

## Usage

The tool is split into two steps: **preprocessing** and **annotation.**

**UPDATE:** The preprocessing generation of the transcriptions should already be part of the data folder, and there should be a transcription file in each *interaction/* folder. Thus, the `generate_transcriptions.py` should no longer be run, as the Python script no longer uses the `transcriptions.json` file.

## Annotation

The annotation UI allows you to draw bounding boxes around the target and reference objects, as well as label various characteristics such as their name, shape, color, and location. The UI also enables you to edit the auto-generated audio transcription. The UI has been tested to work on Chrome and Firefox.

The annotation UI consists of a Python backend, located in `main.py`, and an HTML / JavaScript frontend, located in `templates/` and `static/`.

### Backend

The backend consists of endpoints that make it easier to interact with the filesystem and supply data to the UI. The backend uses Flask to host the system, and has a few parameters:
- **DATA_FOLDER:** The root directory in which every subject's subfolder is located. Note that for now, this directory has to be in the `static/` folder to allow the UI to access the images.
- **AUDIO_FILE:** The filename of the speaker's audio file that's located in each interaction.
- **TRANSCRIPTION_FILE:** The filename of the transcription text file that's located in each interaction.
- **OUTPUT_FOLDER:** Where to output the annotation JSONs after the user finishes annotating each session.

To start up the backend, simply run `python3 main.py`.

By default, the backend should run at *http://localhost:5000/*, which you can then open up on your browser to view the Frontend UI.

### Frontend

Annotation is separated by sessions. To select a session, first choose a Subject, and then choose a corresponding session in the dropdowns. Then, hit **Load data** to load in the frames for that session.

Each video has two bounding boxes: The target bounding box and the reference bounding box. If the verbal message does not contain a reference object then annotate any nearby object as the reference object. The bounding boxes can be drawn or redrawn using the **Draw Annotation** button in the object's labeling section. The target bounding box will appear as green and the reference bounding box will appear as red.

To move on to the next frame, or to go back and view / edit the annotation for a previous frame, use the **Go to Previous Frame** and **Go To Next Frame** buttons for navigation.

Additionally, the tool displays the auto-generated transcription for each frame and allows you to make any manual corrections. You can also optionally specify a spatial relationship between the target and reference object.

Once you have drawn both bounding boxes and updated the annotation information, click the **Generate** button to save the bounding box and annotation information to an output JSON file. A text should appear underneat whether or not the save was successful, and if it was, the corresponding JSON file should show up in the **OUTPUT_FOLDER** directory that you specified in the backend. If there was already an existing annotation file, it will be replaced by the new annotation file.
